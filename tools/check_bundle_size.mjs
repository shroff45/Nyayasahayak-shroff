#!/usr/bin/env node
/**
 * check_bundle_size.mjs — fail CI when a produced chunk exceeds the agreed size budget.
 *
 * Reads the *built files* and checks their sizes, cross-read against the `vite build` log, e.g.
 *   dist/assets/index-qVm1Jlav.js                   575.84 kB │ gzip: 188.47 kB
 *
 *   node tools/check_bundle_size.mjs /tmp/build.log
 *   node tools/check_bundle_size.mjs --dir dist
 *   BUNDLE_BUDGET_BYTES=700000 node tools/check_bundle_size.mjs --dir dist
 *
 * Why gate on this: the app's own copy promises it works on a 2G connection in a district
 * courthouse. Chunk growth is invisible in a diff, so it is gated here instead.
 *
 * Why the file and not the log is the budget: D35. Vite prints a chunk's size as the *length of its
 * source string in UTF-16 code units*, not the number of bytes it writes, and rollup reports the same.
 * For an ASCII bundle the two are identical, which is why this went unnoticed while every asset but one
 * was pure ASCII. The entry chunk is not: it inlines this app's Hindi UI text, and today it carries
 * 80,460 non-ASCII characters - each one written as three UTF-8 bytes and counted as one by vite. The
 * file is 625,027 bytes; vite's log, and every bundle figure this project has published, says 473.38 kB
 * for the same bytes. The budget therefore belongs on the file that ships. Vite's own 500 kB chunk
 * warning is char-based for the same reason, which is why no warning ever printed about a chunk that has
 * been over half a megabyte on disk for the whole life of this check.
 *
 * So both numbers are reported and one is enforced:
 *   - BUNDLE_BUDGET_BYTES gates the file on disk. Its default is a ratchet set at the first byte-level
 *     measurement (entry chunk 625,027 B) rather than at the old 600, so adopting the honest unit does
 *     not itself turn CI red; the register row records that the entry chunk already exceeds 600 kB in
 *     bytes and what the two real options are.
 *   - BUNDLE_BUDGET_KB still gates vite's printed figure, so the numbers published before D35 remain
 *     comparable, and a regression that only shows up in characters (an ASCII-heavy chunk) is caught too.
 *   - With no dist/ to read (a log from somewhere else), only the character figure exists and the tool
 *     says so instead of pretending the check is complete.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const positionals = [];
const flags = new Map();
for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
        const name = argv[i].slice(2);
        if (argv[i + 1] && !argv[i + 1].startsWith('--')) { flags.set(name, argv[i + 1]); i++; }
        else flags.set(name, 'true');
    } else {
        positionals.push(argv[i]);
    }
}
const flag = (name, fallback = null) => (flags.has(name) ? flags.get(name) : fallback);
// A log is optional in --dir mode and a directory is optional in log mode, but one of the two must exist:
// this tool's whole job is to refuse to report a clean pass it did not measure.
const logPath = positionals[0] ?? null;
const distDir = flag('dir', process.env.DIST_DIR ?? 'dist');

const budgetKb = Number(process.env.BUNDLE_BUDGET_KB ?? 600);
const budgetBytes = Number(process.env.BUNDLE_BUDGET_BYTES ?? 660_000);
if (!Number.isFinite(budgetKb) || budgetKb <= 0) {
    console.error(`BUNDLE_BUDGET_KB must be a positive number, got ${process.env.BUNDLE_BUDGET_KB}`);
    process.exit(2);
}
if (!Number.isFinite(budgetBytes) || budgetBytes <= 0) {
    console.error(`BUNDLE_BUDGET_BYTES must be a positive number, got ${process.env.BUNDLE_BUDGET_BYTES}`);
    process.exit(2);
}

// ANSI codes must go before anything else. GitHub Actions sets FORCE_COLOR=1 for every step, so
// the same `vite build | tee build.log` that parses cleanly in a terminal arrives here colourised,
// and the escape between a size and its unit ('591.86\e[22m kB') makes every asset line
// unmatchable. That used to present as "asset over budget" in the run summary when nothing of the
// sort was measured - which is what this file is for.
if (!logPath && !existsSync(distDir)) {
    console.error(`nothing to read: no build log given and no ${distDir}/ to measure`);
    console.error('usage: node tools/check_bundle_size.mjs <vite-build-log> [--dir dist]');
    process.exit(2);
}
const log = (logPath ? readFileSync(logPath, 'utf8') : '')
    .replace(/\u001b\[[0-9;]*[A-Za-z]/g, '')
    .replace(/\r/g, '');

// vite prints both raw and gzipped sizes; only the raw transfer size is gated here because
// gzip effectiveness differs per asset type (JS compresses, fonts mostly do not).
const ASSET_LINE = /^(\S*dist\/\S+\.(?:js|css|mjs))\s+([0-9]+(?:\.[0-9]+)?)\s+kB/gm;

const assets = [...log.matchAll(ASSET_LINE)].map(([, file, size]) => ({
    file: file.replace(/^.*?(dist\/)/, '$1'),
    kb: Number(size),
}));

// ------------------------------------------------------------- the authoritative measurement: the files
const onDisk = (() => {
    if (!existsSync(distDir)) return null;
    const out = [];
    const walk = (dir) => {
        for (const e of readdirSync(dir, { withFileTypes: true })) {
            const p = path.join(dir, e.name);
            if (e.isDirectory()) walk(p);
            else if (/\.(js|mjs|css)$/.test(e.name)) {
                out.push({ file: p.split(path.sep).join('/').replace(/^.*?(dist\/)/, '$1'), bytes: statSync(p).size });
            }
        }
    };
    walk(distDir);
    return out.sort((a, b) => b.bytes - a.bytes);
})();

if (assets.length === 0 && !onDisk) {
    console.error(`No emitted-asset lines found in ${logPath ?? '(no log)'} and no ${distDir}/ to measure. ` +
        'The build log looks truncated - failing rather than reporting a clean pass.');
    // A workflow annotation, because the log this tool reads is not always retrievable: a
    // truncated or unexpected build output must be diagnosable from the run, not guessed at.
    console.log('::error title=Unparseable build log::no vite asset lines found - the build output was truncated or its format changed');
    process.exit(1);
}

const byName = new Map(assets.map((a) => [a.file, a.kb]));
const onDiskNames = new Set(onDisk ? onDisk.map((d) => d.file) : []);
// vite's log lists every emitted file, including the ones this budget does not speak to (images and
// fonts go to a different limit); compare the two totals only over files both sides measured.
const comparable = assets.filter((a) => onDiskNames.has(a.file));
const notOnDisk = assets.filter((a) => !onDiskNames.has(a.file));
const rows = (onDisk
    ? onDisk.map((d) => ({ ...d, kb: byName.get(d.file) ?? null, synthetic: false }))
    // No dist/ to stat: vite's printed figure is all there is, so the byte column is *derived* from it
    // and says so. Presenting a conversion as a measurement is the exact habit this commit exists to end.
    : assets.map((a) => ({ file: a.file, bytes: Math.round(a.kb * 1000), kb: a.kb, synthetic: true })))
    .sort((a, b) => b.bytes - a.bytes);

const overBytes = rows.filter((r) => r.bytes > budgetBytes);
// A budget nobody asked to enforce must not look like a budget that passed.
if (!assets.length && process.env.BUNDLE_BUDGET_KB) {
    console.log(`note: BUNDLE_BUDGET_KB=${process.env.BUNDLE_BUDGET_KB} is not enforced here - that budget applies to`);
    console.log(`      vite's printed figures and no build log was given (--dir ${distDir} mode). Pass the log, or`);
    console.log(`      use BUNDLE_BUDGET_BYTES, which is the one that measures the shipped file.`);
}
const overChars = assets.filter((a) => a.kb > budgetKb);
const totalBytes = rows.reduce((n, r) => n + r.bytes, 0);

console.log(`Bundle size report (${rows.length} gated assets, ${(totalBytes / 1000).toFixed(2)} kB ${onDisk ? 'on disk' : "from vite's log, not from disk"}`
    + `, budget ${budgetBytes} B/asset`
    + (comparable.length ? `; the same ${comparable.length} files are ${(comparable.reduce((n, a) => n + a.kb, 0)).toFixed(2)} kB in vite's log, budget ${budgetKb} kB/asset)` : `)`));
if (onDisk && notOnDisk.length) {
    console.log(`  (${notOnDisk.length} more file(s) in the log than on disk - images and fonts, listed by vite`);
    console.log(`   but outside this budget: ${notOnDisk.slice(0, 3).map((a) => a.file.split('/').pop()).join(', ')}${notOnDisk.length > 3 ? ', …' : ''})`);
}
for (const r of rows.slice(0, 8)) {
    const flagStr = r.bytes > budgetBytes ? ' OVER BUDGET' : '';
    const vite = r.synthetic ? 'figure taken from vite, not measured on disk'
        : r.kb === null ? 'no build log given, so nothing to compare'
        : `vite said ${r.kb.toFixed(2)} kB`;
    console.log(`  ${(r.bytes / 1000).toFixed(2).padStart(9)} kB ${onDisk ? 'on disk' : 'reported'}  ${r.file}  (${vite})${flagStr}`);
}

// The gap itself is the finding, so it is named when it is worth naming.
const gaps = rows.filter((r) => r.kb != null && !r.synthetic && r.bytes / 1000 - r.kb > 5);
if (gaps.length) {
    const worst = gaps.sort((a, b) => (b.bytes / 1000 - b.kb) - (a.bytes / 1000 - a.kb))[0];
    console.log(`\n${gaps.length} asset(s) are larger on disk than vite reported, because vite counts a chunk's`);
    console.log('UTF-16 code units and the file is written as UTF-8: multibyte characters cost more bytes than');
    console.log('they cost characters. Largest gap: '
        + `${worst.file} - ${(worst.bytes / 1000).toFixed(2)} kB on disk vs ${worst.kb.toFixed(2)} kB reported `
        + `(+${(worst.bytes / 1000 - worst.kb).toFixed(2)} kB).`);
    console.log('That difference is this app speaking Hindi in its own UI strings; it is not padding, and it is');
    console.log('the payload a courthouse browser actually downloads.');
}
if (!onDisk) {
    console.log(`\n::warning title=Budget checked in vite's units only::no ${distDir}/ to stat - the numbers above are`
        + ` character counts, which understate every asset carrying multibyte text (D35)`);
}

if (overBytes.length || overChars.length) {
    if (overBytes.length) {
        console.error(`\n${overBytes.length} asset(s) exceed the ${budgetBytes} B on-disk budget:`);
        for (const a of overBytes) {
            console.error(`  ${a.bytes} B  ${a.file}` + (a.kb != null ? `  (vite reported ${a.kb.toFixed(2)} kB)` : ''));
            // One annotation per offender: whoever reads the run sees the measured number, so the
            // fix can be a real code-split instead of a budget raised on a guess.
            console.log(`::error title=Bundle over budget::${a.file} is ${a.bytes} bytes on disk against a ${budgetBytes} B budget`);
        }
    }
    if (overChars.length) {
        console.error(`\n${overChars.length} asset(s) exceed the ${budgetKb} kB budget in vite's own units:`);
        for (const a of overChars) {
            console.error(`  ${a.kb.toFixed(2)} kB  ${a.file}`);
            console.log(`::error title=Bundle over budget (vite units)::${a.file} is ${a.kb.toFixed(2)} kB against a ${budgetKb} kB budget`);
        }
    }
    console.error('\nEither code-split the route that pulls it in, or raise BUNDLE_BUDGET_BYTES in');
    console.error('the workflow with a comment saying why the app can still carry it on 2G.');
    process.exit(1);
}

const largest = rows[0];
console.log(`\n✓ all ${rows.length} assets within the ${budgetBytes} B budget`
    + (onDisk ? ' on disk' : " in vite's figures")
    + (assets.length ? ` and the ${budgetKb} kB vite-unit budget` : ` (vite-unit budget not run: no log)`));
// Report the headroom as a notice: a gate that only speaks when it fails hides how close the
// line is, and "660000 B budget" silently becoming 659,999 B is how this check gets disabled later.
console.log(`::notice title=Bundle budget headroom::largest asset ${largest.file} is ${largest.bytes} B`
    + (largest.synthetic
        ? ` (${(largest.bytes / 1000).toFixed(2)} kB, taken from vite's log because no ${distDir}/ was readable)`
        : ` (${(largest.bytes / 1000).toFixed(2)} kB on disk)`)
    + ` against the ${budgetBytes} B budget (${((budgetBytes - largest.bytes) / 1000).toFixed(2)} kB spare)`
    + (!largest.synthetic && largest.kb != null ? `; vite's log prints ${largest.kb.toFixed(2)} kB for the same file, ${(largest.bytes / 1000 - largest.kb).toFixed(2)} kB less than ships` : ''));
