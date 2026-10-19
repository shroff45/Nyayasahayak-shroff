#!/usr/bin/env node
/**
 * resolve-importers.mjs - who imports what, and who can actually reach it.
 *
 * Why this file exists. Four separate audits of this repository got the same question wrong in the
 * same way, by asking `grep -rl "from '.*types'"` and reading the count as a fact:
 *
 *   - `@core`, `@personas`, `@shared` and `@types` are aliases, so a grep for a relative path misses
 *     every file that uses them (11 in src/, all of them live).
 *   - duplicated basenames are the norm here, and a path-suffix grep merges same-named files into
 *     one block. Today that is two `JudgeDashboard.tsx` (`src/components/`, `src/modules/judge/`)
 *     and two `DraftJudgmentPanel.tsx`; when this bullet was written it was two `core/types.ts`
 *     (`src/core/types.ts`, `src/features/nationals/core/types.ts` - the second is now deleted, and
 *     it was 21-importer-large, so the merge produced a census nobody could reproduce). The trap
 *     does not retire with the file that illustrated it, so `--model` takes a full path.
 *   - a specifier like `'../types'` resolves relative to *its own directory*, so the same text names
 *     four different modules depending on where the line sits.
 *   - `React.lazy(() => import('./x'))` is a real dependency edge and plain `from`-pattern greps
 *     skip it - which is exactly how the admin routes looked "unwired" while they were being mounted.
 *
 * So: resolve, then count. This walks the graph the way Vite and tsc do - aliases from the config
 * files, relative to the importing file, extension-completed - and separates *referencing* a module
 * from *reaching* it, because on this base those are very different numbers. Reachability is a BFS
 * from `src/main.tsx`; `tsc --noEmit` typechecks every file in `src` either way, which is why deleting a
 * type without deleting the dead files that name it turns the gate red on code nobody runs.
 *
 * The rule this tool exists to enforce: resolution is authoritative; grep is a candidate-finder.
 *
 * Modes
 *   node tools/resolve-importers.mjs
 *       the census - counts, the unresolved list (must stay empty), and the unreachable islands by
 *       subtree, since the purge block deletes islands rather than files.
 *   node tools/resolve-importers.mjs --orphans [--min N]
 *       every unreachable file with its line count, biggest first; `--min` filters (default 0).
 *   node tools/resolve-importers.mjs --model <src/path> [--symbol Name]
 *       the block-4(a) instrument: importers of that module, how many of them are live, and - if a
 *       symbol is given - which files name that identifier. This is what produced the four-models
 *       table in PROJECT_KNOWLEDGE_BASE.md section 8, and it is the command to re-run before anyone
 *       edits a shared type.
 *   node tools/resolve-importers.mjs --json
 *       the whole graph: files, edges, reachability, unresolved specifiers. For diffing two commits.
 *   node tools/resolve-importers.mjs --check
 *       gate mode: exit 1 if a first-party specifier fails to resolve, or if the vite aliases and
 *       the tsconfig `paths` have drifted apart. Cheap insurance against this tool itself rotting.
 *
 * Deliberate limits, stated rather than hidden: template literals with a `${}` inside are treated as
 * opaque strings (a dynamic path is one import of an unknown target, not five); JSON is a leaf, never
 * walked; and reachability starts at `src/main.tsx` alone, which is correct for this app because it
 * has one entry and no secondary HTML file - if a second entry is ever added, pass it here.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..');
const SRC = path.join(ROOT, 'src');
const CODE_EXT = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];
const LEAF_EXT = ['.json', '.css'];
const TRY_EXT = [...CODE_EXT, ...LEAF_EXT];

// ------------------------------------------------------------------ argument parsing
const argv = process.argv.slice(2);
const mode = (() => {
    const has = (f) => argv.includes(f);
    if (has('--json')) return 'json';
    if (has('--check')) return 'check';
    if (has('--orphans')) return 'orphans';
    if (has('--model')) return 'model';
    return 'census';
})();
const take = (flag, fallback = null) => {
    const i = argv.indexOf(flag);
    return i === -1 ? fallback : argv[i + 1];
};
const MIN = Number(take('--min', '0'));
const MODEL = take('--model');
const SYMBOL = take('--symbol');
const ENTRIES = argv.filter((a) => a.startsWith('--entry=')).map((a) => a.slice(8));

const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const SELF = rel(path.resolve(new URL(import.meta.url).pathname));   // this file must not vouch for itself

// ------------------------------------------------------------------ comment stripping
/**
 * Blank out comments so that prose cannot pass as code. A screen that documents "we used to call
 * initializeBlockchain()" must not be counted as calling it, and the same discipline applies here.
 * Strings are preserved (the census needs to see specifiers, which are strings); quotes are tracked so
 * a `//` inside a URL or a template literal is not mistaken for a comment.
 */
function stripComments(text) {
    let out = '';
    let i = 0;
    const n = text.length;
    while (i < n) {
        const c = text[i];
        const d = text[i + 1];
        if (c === '/' && d === '/') {
            while (i < n && text[i] !== '\n') i++;
            continue;
        }
        if (c === '/' && d === '*') {
            i += 2;
            while (i < n && !(text[i] === '*' && text[i + 1] === '/')) i++;
            i += 2;
            out += ' ';
            continue;
        }
        if (c === '"' || c === "'" || c === '`') {
            const quote = c;
            out += c;
            i++;
            while (i < n) {
                if (text[i] === '\\') { out += text[i] + (text[i + 1] ?? ''); i += 2; continue; }
                if (text[i] === quote) { out += text[i]; i++; break; }
                out += text[i];
                i++;
            }
            continue;
        }
        out += c;
        i++;
    }
    return out;
}

// ------------------------------------------------------------------ alias tables
/** Both files, parsed at run time, so the resolver cannot drift from the configuration it claims. */
function readAliases() {
    const aliases = new Map();
    const vite = path.join(ROOT, 'vite.config.ts');
    if (fs.existsSync(vite)) {
        const text = stripComments(fs.readFileSync(vite, 'utf8'));
        const re = /['"](@[^'"]+)['"]\s*:\s*path\.resolve\(\s*__dirname\s*,\s*['"]([^'"]+)['"]\s*\)/g;
        for (const m of text.matchAll(re)) {
            aliases.set(m[1], path.resolve(ROOT, m[2]));
        }
    }
    const tsconfigPath = path.join(ROOT, 'tsconfig.json');
    const tsAliases = new Map();
    if (fs.existsSync(tsconfigPath)) {
        // tsc's `paths` are JSON with comments and a trailing-comma tolerance; only the block we need
        // is parsed, with a regex, rather than pretending JSON.parse can read the file.
        const text = fs.readFileSync(tsconfigPath, 'utf8');
        const block = text.slice(text.indexOf('"paths"'));
        const re = /"(@[^"]+)"\s*:\s*\[\s*"([^"]+)"/g;
        for (const m of block.matchAll(re)) {
            tsAliases.set(m[1].replace(/\/\*$/, ''), path.resolve(ROOT, m[2].replace(/\/\*$/, '')));
        }
    }
    return { aliases, tsAliases };
}

// ------------------------------------------------------------------ specifier extraction
const PATTERNS = [
    // import X from 'y' / import { a } from 'y' / import type { a } from 'y'
    /(?:^|[\s;{}()])(?:import|export)\s+(?:type\s+)?[\s\S]*?\bfrom\s*['"]([^'"\n]+)['"]/g,
    // side-effect import: import './x.css'
    /(?:^|[\s;{}()])(?:import|require)\s*['"]([^'"\n]+)['"]/g,
    // dynamic import, including the React.lazy form
    /(?:^|[\s;{}(,])import\s*\(\s*(?:\/\*[\s\S]*?\*\/\s*)?['"]([^'"\n]+)['"]\s*\)/g,
    // export * from 'y' / export { a } from 'y'
    /\bexport\s+(?:\*|\{[\s\S]*?\})\s*(?:as\s+\w+\s*)?\bfrom\s*['"]([^'"\n]+)['"]/g,
];

function specifiersOf(code) {
    const found = new Set();
    for (const re of PATTERNS) {
        re.lastIndex = 0;
        for (const m of code.matchAll(re)) found.add(m[1]);
    }
    return [...found];
}

// ------------------------------------------------------------------ build the graph
function listCodeFiles(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) listCodeFiles(p, out);
        else if (CODE_EXT.some((e) => p.endsWith(e)) || p.endsWith('.d.ts')) out.push(p);
    }
    return out;
}

function resolveSpecifier(spec, fromFile, aliases) {
    if (!spec.startsWith('.') && !spec.startsWith('@')) return { external: spec };
    let base = null;
    const hit = [...aliases].sort((a, b) => b[0].length - a[0].length).find(([k]) => spec === k || spec.startsWith(k + '/'));
    if (hit) base = path.join(hit[1], spec.slice(hit[0].length + 1));
    else if (spec.startsWith('.')) base = path.resolve(path.dirname(fromFile), spec);
    else return { external: spec };

    const candidates = [];
    if (path.extname(base) && TRY_EXT.includes(path.extname(base))) candidates.push(base);
    else candidates.push(base, ...TRY_EXT.map((e) => base + e), ...TRY_EXT.map((e) => path.join(base, 'index' + e)));
    for (const c of candidates) {
        if (fs.existsSync(c) && fs.statSync(c).isFile()) return { file: c };
    }
    return { unresolved: spec };
}

function buildGraph() {
    const { aliases, tsAliases } = readAliases();
    const files = listCodeFiles(SRC).sort();
    const code = new Map();
    const edges = new Map();
    const importers = new Map(files.map((f) => [rel(f), new Set()]));
    const unresolved = [];

    for (const f of files) {
        const stripped = stripComments(fs.readFileSync(f, 'utf8'));
        code.set(rel(f), stripped);
        const deps = new Set();
        for (const spec of specifiersOf(stripped)) {
            const r = resolveSpecifier(spec, f, aliases);
            if (r.file) deps.add(rel(r.file));
            else if (r.unresolved) unresolved.push({ from: rel(f), spec });
        }
        edges.set(rel(f), [...deps]);
        for (const d of deps) importers.get(d)?.add(rel(f));
    }

    const entries = (ENTRIES.length ? ENTRIES : ['src/main.tsx']).map((e) => rel(path.resolve(ROOT, e)));
    const reachable = new Set();
    const queue = [...entries];
    while (queue.length) {
        const cur = queue.shift();
        if (!cur || reachable.has(cur) || !edges.has(cur)) continue;
        reachable.add(cur);
        queue.push(...edges.get(cur));
    }

    // Raw line counts for the size columns: a comment-stripped count would silently shrink every
    // file that opens with a JSDoc block, and a census number that cannot be reproduced with
    // `wc -l` is not a census. Stripped text is still what the regexes below search.
    const raw = new Map(files.map((f) => [rel(f), fs.readFileSync(f, 'utf8').split('\n').length]));
    const lines = (f) => raw.get(f);
    return {
        aliases, tsAliases, files: files.map(rel), code, edges, importers, unresolved,
        reachable, lines, entries,
        unreachable: files.map(rel).filter((f) => !reachable.has(f)),
    };
}

const isLive = (g, f) => g.reachable.has(f);

// ------------------------------------------------------------------ modes
function census(g) {
    const byArea = new Map();
    for (const f of g.unreachable) {
        const parts = f.split('/');
        const area = parts.slice(0, Math.min(3, parts.length - 1)).join('/');
        const cur = byArea.get(area) ?? { count: 0, lines: 0 };
        cur.count++;
        cur.lines += g.lines(f);
        byArea.set(area, cur);
    }
    const areas = [...byArea].sort((a, b) => b[1].lines - a[1].lines);
    const unreachLines = g.unreachable.reduce((n, f) => n + g.lines(f), 0);
    const totalLines = g.files.reduce((n, f) => n + g.lines(f), 0);

    console.log(`files under src/            ${g.files.length} (${totalLines.toLocaleString('en-US')} lines)`);
    console.log(`entry                       ${g.entries.join(', ')}`);
    console.log(`reachable                   ${g.reachable.size}`);
    console.log(`unreachable                 ${g.unreachable.length} (${unreachLines.toLocaleString('en-US')} lines, ` +
        `${((unreachLines / totalLines) * 100).toFixed(1)}% of src/)`);
    console.log(`unresolved first-party specs ${g.unresolved.length}`);
    console.log(`\nunreachable by subtree (lines, files)`);
    for (const [area, v] of areas) console.log(`  ${String(v.lines).padStart(7)}  ${String(v.count).padStart(4)}  ${area}`);
    if (g.unresolved.length) {
        console.log('\nUNRESOLVED - every one of these is a broken import or a resolver gap:');
        for (const u of g.unresolved) console.log(`  ${u.from} -> ${u.spec}`);
    }
    console.log('\nReading: a file with 0 live importers is unreachable *and* uncalled; a file that is');
    console.log('unreachable but names a type you are editing is the one that breaks `tsc` (the gate');
    console.log('typechecks all of src/, not just what main.tsx reaches). Use --model for that job.');
}

// The graph is seeded from `src/main.tsx` because that is the app's only entry point. It is not the only
// *consumer* of src/: `tests/` and `tools/` import it directly, and a file can be unreachable from the app
// while being the entry the whole verification surface runs through. `src/core/trust/index.ts` reported
// "no importers at all", a cleanup commit believed it, `npm test` died with ERR_MODULE_NOT_FOUND and the
// harness died inside esbuild (register row D32). So --orphans says which candidates a test or a tool
// names, and lists those last: they are not on the delete-me list, whatever the graph says. This is an
// annotation, not a verdict - `tests/` can be wrong to import something as happily as `src/` can.
const VERIFICATION_ROOTS = ['tests', 'tools'];
let verificationCache = null;
const verificationFiles = () => {
    if (verificationCache) return verificationCache;
    const out = [];
    const walk = (dir) => {
        const abs = path.join(ROOT, dir);
        if (!fs.existsSync(abs)) return;
        for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
            const pth = path.join(abs, e.name);
            if (e.isDirectory()) walk(pth);
            else if ([...CODE_EXT, '.cjs', '.mjs'].includes(path.extname(e.name))) {
                // This tool's own source quotes paths like `src/core/trust/index.ts` in the comments
                // below, and a doc comment is not a consumer: counting it made src/core/types.ts look
                // gate-protected when nothing in tests/ or tools/ imports it. Prose is out; and so is
                // this file, whatever it says.
                if (rel(pth) === SELF) continue;
                out.push({ rel: rel(pth), text: fs.readFileSync(pth, 'utf8') });
            }
        }
    };
    for (const d of VERIFICATION_ROOTS) walk(d);
    return (verificationCache = out);
};

// A test can reach the same module up-relative, through an alias, or via the barrel, so every spelling of
// the path is searched for - with and without the extension, because `node --test` wants `.ts` and esbuild
// does not care.
const pathVariants = (f, g) => {
    const bare = f.replace(/\.(tsx?|jsx?|mjs|cjs)$/, '');
    const v = new Set([f, bare, `${bare}/index.ts`, `${bare}/index.tsx`, `${bare}/index`]);
    for (const [alias, absTarget] of g.aliases) {
        const target = rel(String(absTarget));
        if (f.startsWith(`${target}/`)) {
            const a = `${alias}/${f.slice(target.length)}`;
            v.add(a);
            v.add(a.replace(/\.(tsx?|jsx?|mjs|cjs)$/, ''));
        }
    }
    return [...v].filter((x) => x.length > 6);
};

const namedByVerification = (f, g) => {
    const variants = pathVariants(f, g);
    return verificationFiles()
        .filter((v) => variants.some((x) => v.text.includes(x)))
        .map((v) => v.rel);
};

function orphans(g) {
    const rows = g.unreachable
        .map((f) => ({ f, lines: g.lines(f), importers: g.importers.get(f).size, verified: namedByVerification(f, g) }))
        .filter((r) => r.lines >= MIN)
        .sort((a, b) => (a.verified.length > 0) - (b.verified.length > 0) || b.lines - a.lines);
    const guarded = rows.filter((r) => r.verified.length).length;
    console.log(`${rows.length} unreachable file(s) with >= ${MIN} lines, sorted by size` +
        (guarded ? ` - the last ${guarded} name a file tests/ or tools/ imports, so this list is not a deletion licence` : ''));
    for (const r of rows) {
        console.log(`  ${String(r.lines).padStart(6)}  ${r.f}` +
            (r.verified.length
                ? `   <- VERIFICATION-ONLY ENTRY POINT (${r.verified.length} referencing file(s)): ${r.verified.join(', ')}`
                : (r.importers ? `   <- ${r.importers} dead importers` : '   <- no importers at all')));
    }
    if (guarded) {
        console.log('\nA verification-only file is reachable from the *gate*, not from the app: deleting it takes\n' +
            '`npm test` or tools/ledger_repro.cjs down with it. Confirm with  grep -rn <basename> tests/ tools/  -\n' +
            'which is the step that turned this annotation into a rule (D32).');
    }
}

function model(g) {
    if (!MODEL) throw new Error('--model needs a path, e.g. --model src/core/types.ts');
    const target = rel(path.resolve(ROOT, MODEL));
    if (!g.edges.has(target)) throw new Error(`${target} is not under src/ (or does not exist)`);
    const importers = [...g.importers.get(target)].sort();
    const liveImporters = importers.filter((f) => isLive(g, f));
    console.log(`module   ${target}`);
    console.log(`importers ${importers.length}  (live ${liveImporters.length})`);
    for (const f of importers) console.log(`  ${isLive(g, f) ? 'live' : 'dead'}  ${f}`);

    if (!SYMBOL) {
        console.log('\n(no --symbol: naming counts not measured; pass --symbol Case for the 4(a) census)');
        return;
    }
    const re = new RegExp(`\\b${SYMBOL}\\b`);
    const namersAll = [];
    // Only the importers, not the module itself: the file that *declares* the symbol is the thing
    // being edited, and counting it as a namer inflates every column of this table by one.
    const fromGraph = new Set(importers);
    for (const f of g.files) {
        if (!fromGraph.has(f)) continue;
        const code = stripJsxText(stripStrings(g.code.get(f)));
        if (re.test(code)) namersAll.push(f);
    }
    const namersLive = namersAll.filter((f) => isLive(g, f));
    const dead = namersAll.filter((f) => !isLive(g, f));
    console.log(`\nnamers of \`${SYMBOL}\` among that set: ${namersAll.length} (live ${namersLive.length}, unreachable ${dead.length})`);
    console.log('  live:');
    for (const f of namersLive) console.log(`    ${f}`);
    console.log('  unreachable - each of these must be deleted or fixed in the SAME commit as the type,');
    console.log('  because tsc typechecks them and a red gate on dead code still blocks a merge:');
    for (const f of dead) console.log(`    ${f}`);
}

/**
 * For the naming census only: quoted text is not a use of a type, and neither is the prose that sits
 * between two tags. Without the second half of that, `CaseSummaryCard.tsx` - which prints "Case
 * Summary" and never names the type - counts as a namer, and every file that renders a heading
 * containing the word joins the list. An earlier draft of this tool did exactly that, and the number
 * it reported (18, where the true set is smaller) is why these two lines exist.
 */
function stripStrings(code) {
    return code.replace(/'[^'\n]*'|"[^"\n]*"|`[^`]*`/g, "''");
}

function stripJsxText(code) {
    return code.replace(/>[^<>{}]+?</g, '><>');
}

function check(g) {
    const problems = [];
    if (g.unresolved.length) {
        problems.push(`${g.unresolved.length} first-party specifier(s) did not resolve:`);
        for (const u of g.unresolved.slice(0, 10)) problems.push(`  ${u.from} -> ${u.spec}`);
    }
    for (const [k, v] of g.aliases) {
        const tv = g.tsAliases.get(k);
        if (tv && path.resolve(tv) !== path.resolve(v)) {
            problems.push(`alias drift: ${k} is ${rel(v)} in vite.config.ts but ${rel(tv)} in tsconfig.json`);
        }
    }
    for (const e of g.entries) if (!g.edges.has(e)) problems.push(`entry ${e} is not a file under src/`);
    if (problems.length) {
        console.error('CHECK FAILED\n' + problems.join('\n'));
        process.exit(1);
    }
    console.log(`check ok - ${g.files.length} files, ${g.reachable.size} reachable, ` +
        `${g.unresolved.length} unresolved, vite and tsconfig aliases agree`);
}

const g = buildGraph();
if (mode === 'census') census(g);
else if (mode === 'orphans') orphans(g);
else if (mode === 'model') model(g);
else if (mode === 'json') {
    console.log(JSON.stringify({
        files: g.files.map((f) => ({
            path: f, lines: g.lines(f), reachable: isLive(g, f),
            imports: g.edges.get(f), importers: [...g.importers.get(f)],
        })),
        unresolved: g.unresolved,
        entries: g.entries,
    }, null, 1));
} else if (mode === 'check') check(g);

