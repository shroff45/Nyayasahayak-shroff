#!/usr/bin/env node
/**
 * check_bundle_size.mjs — fail CI when a produced chunk exceeds the agreed size budget.
 *
 * Reads a `vite build` log and checks every emitted asset line, e.g.
 *   dist/assets/index-qVm1Jlav.js                   575.84 kB │ gzip: 188.47 kB
 *
 *   node tools/check_bundle_size.mjs /tmp/build.log
 *   BUNDLE_BUDGET_KB=700 node tools/check_bundle_size.mjs build.log
 *
 * Why gate on this: the app's own copy promises it works on a 2G connection in a district
 * courthouse. Chunk growth is invisible in a diff, so it is gated here instead.
 */
import { readFileSync } from 'node:fs';

const logPath = process.argv[2];
if (!logPath) {
    console.error('usage: node tools/check_bundle_size.mjs <vite-build-log>');
    process.exit(2);
}

const budgetKb = Number(process.env.BUNDLE_BUDGET_KB ?? 600);
if (!Number.isFinite(budgetKb) || budgetKb <= 0) {
    console.error(`BUNDLE_BUDGET_KB must be a positive number, got ${process.env.BUNDLE_BUDGET_KB}`);
    process.exit(2);
}

// ANSI codes must go before anything else. GitHub Actions sets FORCE_COLOR=1 for every step, so
// the same `vite build | tee build.log` that parses cleanly in a terminal arrives here colourised,
// and the escape between a size and its unit ('591.86\e[22m kB') makes every asset line
// unmatchable. That used to present as "asset over budget" in the run summary when nothing of the
// sort was measured - which is what this file is for.
const log = readFileSync(logPath, 'utf8')
    .replace(/\u001b\[[0-9;]*[A-Za-z]/g, '')
    .replace(/\r/g, '');

// vite prints both raw and gzipped sizes; only the raw transfer size is gated here because
// gzip effectiveness differs per asset type (JS compresses, fonts mostly do not).
const ASSET_LINE = /^(\S*dist\/\S+\.(?:js|css|mjs))\s+([0-9]+(?:\.[0-9]+)?)\s+kB/gm;

const assets = [...log.matchAll(ASSET_LINE)].map(([, file, size]) => ({
    file: file.replace(/^.*?(dist\/)/, '$1'),
    kb: Number(size),
}));

if (assets.length === 0) {
    console.error(`No emitted-asset lines found in ${logPath}. ` +
        'The build log looks truncated - failing rather than reporting a clean pass.');
    // A workflow annotation, because the log this tool reads is not always retrievable: a
    // truncated or unexpected build output must be diagnosable from the run, not guessed at.
    console.log('::error title=Unparseable build log::no vite asset lines found - the build output was truncated or its format changed');
    process.exit(1);
}

const over = assets.filter((a) => a.kb > budgetKb);
const total = assets.reduce((sum, a) => sum + a.kb, 0);

assets.sort((a, b) => b.kb - a.kb);
console.log(`Bundle size report (${assets.length} assets, ${total.toFixed(2)} kB total, budget ${budgetKb} kB per asset)`);
for (const a of assets.slice(0, 8)) {
    const flag = a.kb > budgetKb ? ' OVER BUDGET' : '';
    console.log(`  ${a.kb.toFixed(2).padStart(8)} kB  ${a.file}${flag}`);
}

if (over.length) {
    console.error(`\n${over.length} asset(s) exceed the ${budgetKb} kB budget:`);
    for (const a of over) {
        console.error(`  ${a.kb.toFixed(2)} kB  ${a.file}`);
        // One annotation per offender: whoever reads the run sees the measured number, so the
        // fix can be a real code-split instead of a budget raised on a guess.
        console.log(`::error title=Bundle over budget::${a.file} is ${a.kb.toFixed(2)} kB against a ${budgetKb} kB budget`);
    }
    console.error('\nEither code-split the route that pulls it in, or raise BUNDLE_BUDGET_KB in');
    console.error('the workflow with a comment saying why the app can still carry it on 2G.');
    process.exit(1);
}

const largest = assets[0];
console.log(`\n✓ all ${assets.length} assets within the ${budgetKb} kB budget`);
// Report the headroom as a notice: a gate that only speaks when it fails hides how close the
// line is, and "600 kB budget" silently becoming 599.9 kB is how this check gets disabled later.
console.log(`::notice title=Bundle budget headroom::largest asset ${largest.file} is ${largest.kb.toFixed(2)} kB of ${budgetKb} kB (${(budgetKb - largest.kb).toFixed(2)} kB spare)`);
