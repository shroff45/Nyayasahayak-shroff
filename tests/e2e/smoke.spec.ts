import { test, expect } from '@playwright/test';

/**
 * The smoke test the infra commit carries so that commit is green on its own.
 *
 * It exists for one reason: `playwright.config.ts` ships a `webServer` that runs `npm run build && vite
 * preview`, and nothing else in the tree proves that the command boots, that `baseURL` reaches it, or
 * that the Chromium the CI job installs can render this app at all. Without a test in the same commit,
 * the first run of that plumbing would be the journey spec - and a failure there would not say whether
 * the product broke or the harness never started.
 *
 * So this file asks the smallest question that still exercises the whole pipe.
 */
test('the built bundle boots and the landing page renders', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: /Justice at the/ })).toBeVisible();
    // The four role cards are the only way into the app; if they are missing, the journey's first click
    // has nothing to hit, so this is the seam worth pinning here rather than a screenshot of a hero.
    for (const card of ['Citizen Access', 'Police Force', 'Judiciary', 'Administration']) {
        await expect(page.getByRole('button', { name: card }).first()).toBeVisible();
    }
});
