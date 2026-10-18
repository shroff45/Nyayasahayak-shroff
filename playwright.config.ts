import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright, for one test: `tests/e2e/full-chain.spec.ts`.
 *
 * Why this file exists. `tools/ledger_repro.cjs` reads the source and mounts components in JSDOM, so
 * it can prove that a string is present and that a screen renders - it cannot prove that pressing the
 * submit button on the citizen intake produces a row the officer's Evidence Locker offers in its
 * <select>. That gap is exactly where D20 hid for as long as it did: every grep in the repo could have
 * found `addBlock(` and none of them could find that nothing ever called it. This config buys the one
 * gate that closes it - a real browser, a real click, a real read-back.
 *
 * Two decisions worth knowing before you change this file:
 *
 * 1. It drives `vite preview` on the production build, not `vite dev`. The dev server is quicker to
 *    boot, but it serves transformed modules with HMR attached, and the thing under test is a trust
 *    path a citizen will walk on a built bundle. Building also means the same `tsc && vite build` the
 *    CI gate already ran, so a green journey and a green build describe the same bytes.
 * 2. `workers: 1` is not a preference. The three acts share one browser context because the journal
 *    lives in `localStorage`, and act 2 only has something to link an exhibit to because act 1 wrote
 *    it. Two workers means two empty journals, and the second act starts failing for a reason that
 *    has nothing to do with the product.
 */
const PORT = Number(process.env.E2E_PORT ?? 4173);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false,
    workers: 1,
    retries: process.env.CI ? 1 : 0,
    forbidOnly: Boolean(process.env.CI),
    reporter: process.env.CI ? [['list'], ['github']] : [['list']],
    use: {
        baseURL: BASE_URL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        // The screens under test are desktop consoles for a police station and a courtroom.
        viewport: { width: 1440, height: 1000 },
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: {
        command: `npm run build && npx vite preview --port ${PORT} --host 127.0.0.1 --strictPort`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        // A cold `tsc && vite build` of this tree takes about 40 s locally; 3 min is the margin.
        timeout: 180_000,
        stdout: 'pipe',
        stderr: 'pipe',
    },
});
