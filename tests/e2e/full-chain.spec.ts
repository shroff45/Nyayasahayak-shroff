import { test, expect, type Page } from '@playwright/test';
import { mkdtempSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';

/**
 * The chained journey: a citizen files a complaint, an officer records an exhibit against it, and a
 * judge re-reads that same file and gets a match. Three acts, one browser context, one `localStorage`.
 *
 * What this proves that `tools/ledger_repro.cjs` cannot: the harness reads the source and mounts
 * screens in JSDOM, so it can say a string exists and a component renders. It cannot say that a click
 * on `Save to Ledger` produces a row that the officer's `<select>` offers an hour later. D20 survived
 * every grep in this repository precisely because greps cannot execute a chain - so this file is the
 * gate that executes it. If anyone ever deletes it, the intake can rot back into a form again and
 * nothing in the tree will notice.
 *
 * Three constraints that are not style:
 * - The origin must stay a loopback one. Every hash in this app is `crypto.subtle`, and WebCrypto only
 *   exists in a secure context; `http://localhost` and `http://127.0.0.1` qualify, a LAN IP does not.
 * - No `data-testid`. Selectors are roles, labels and placeholders, because that is also what a screen
 *   reader resolves - a test that only a screenshot could pass is not evidence of an accessible UI.
 * - One test, three `test.step`s. The acts share state through the journal, which is the point.
 */

const scratch = mkdtempSync(path.join(tmpdir(), 'nyaya-e2e-'));
const EXHIBIT = path.join(scratch, 'scene-photo.png');
// Any bytes will do - the app hashes what it is given and never opens the file. The `.png` name keeps
// the locker's `accept` list satisfied so the test is not exercising a path around the product.
writeFileSync(EXHIBIT, Buffer.from('Nyayasahayak e2e exhibit: a stand-in for a scene photograph.\n'));

const COMPLAINT =
    'Two men on a motorbike snatched my mobile phone outside the Central Market bus stand in ' +
    'Coimbatore on 20 November 2023 at about 9 in the evening. One of them showed a knife. They rode ' +
    'off towards the bypass and I have no idea who they are.';

/**
 * The landing page's role card opens `UnifiedSignInModal` with that role preselected, and the modal
 * asks for the fields that role's console needs. The password is only checked for being non-empty -
 * this build has no authentication server, which is a known limit of the trust model, not a bug this
 * test is pretending to fix.
 */
async function signIn(page: Page, card: RegExp, landing: RegExp, fields: Record<string, string>) {
    await page.goto('/');
    await page.getByRole('button', { name: card }).first().click();
    // Exactly one <form> exists on this page - the modal's - so scoping to it is not a hedge.
    const form = page.locator('form');
    await form.getByPlaceholder('Enter your full name').fill('E2E Runner');
    for (const [placeholder, value] of Object.entries(fields)) {
        await form.getByPlaceholder(placeholder).fill(value);
    }
    await form.getByRole('button', { name: /Sign In/ }).click();
    // The modal waits 1.2 s ("Simulate authentication delay") before it calls onSignIn and navigates,
    // so the wait is on the route the handler itself picks (`LandingPage.tsx:45-51`). A URL is a
    // fact; asserting on a greeting in a header would tie this test to CSS like `hidden md:inline`.
    await page.waitForURL(landing, { timeout: 20_000 });
}

/**
 * There is no role switcher: signing out is the only way back to the landing page, because `/`
 * redirects an authenticated visitor to their own home (`App.tsx:371`). `logout()` does exactly this
 * and then navigates, so clearing the key is the same transition without depending on where the
 * sign-out button happens to sit inside a layout's avatar menu.
 */
async function signOut(page: Page) {
    await page.evaluate(() => window.localStorage.removeItem('nyaya_pilot_user'));
}

test('a complaint reaches the docket, an exhibit reaches the journal, and the digest still matches', async ({ page }) => {
    test.setTimeout(180_000);

    await test.step('Act 1 — the citizen files, and the receipt is the journal’s own answer', async () => {
        await signIn(page, /Citizen Access/, /\/citizen\/home$/, { 'your.email@gmail.com': 'e2e@example.com' });
        await page.goto('/citizen/file');

        // CI's first run of this act timed out here, and it was the test being wrong rather than the
        // app: the intake opens in voice mode (`inputMode` defaults to 'voice'), so the text box is
        // behind a toggle. Pressing it is not scaffolding - for a citizen who can type but not speak,
        // it is the first action the screen asks for.
        await page.getByRole('button', { name: 'Type' }).click();
        await page.locator('#complaint-text').fill(COMPLAINT);
        await page.getByRole('button', { name: 'Read my text' }).click();

        // The heading is the claim under test: it used to read "Review AI-Extracted Details".
        await expect(page.getByRole('heading', { name: 'Review what the four rules found' })).toBeVisible();
        await page.locator('#complainant').fill('Kavitha Raman');
        // `respondent` and the CNR are deliberately left blank: the app must not invent a name for the
        // accused, and a CNR is a number a police station assigns, so an empty one has to stay empty.

        await page.getByRole('button', { name: 'Save to Ledger' }).click();

        await expect(page.getByRole('heading', { name: 'Complaint Filed Successfully!' })).toBeVisible();
        const receipt = page.locator('dl');
        await expect(receipt.getByText('Journal Record #')).toBeVisible();
        await expect(receipt.getByText('Integrity Digest')).toBeVisible();
        await expect(receipt.getByText('Saved to this device')).toBeVisible();
        await expect(
            receipt.getByText(/Yes — this device signed the batch it fell into|Not yet — the next anchor covers it/)
        ).toBeVisible();
        await expect(page.getByText('Recorded on this device; nothing was sent to a police station or court.'))
            .toBeVisible();
    });

    await test.step('Act 2 — the officer sees the case, and the exhibit becomes a journal record', async () => {
        await signOut(page);
        await signIn(page, /Police Force/, /\/police\/dashboard$/, {
            'DL-PS-12345': 'DL-PS-12345',
            'Saket PS, Delhi': 'Central Market PS, Coimbatore',
            '••••••••': 'e2e-not-a-real-login',
        });
        await page.goto('/police/evidence');

        // The proof of D20, in one line: the case the citizen filed is an option the officer can pick.
        const picker = page.locator('label', { hasText: 'This exhibit belongs to' }).locator('select');
        await expect(picker.locator('option', { hasText: /^CASE-/ }).first()).toBeVisible();
        await expect(page.getByText('no case in the ledger yet')).toHaveCount(0);
        await picker.selectOption({ index: 1 });

        await page.setInputFiles('input[type="file"]', EXHIBIT);

        await expect(page.getByText(/Recorded as ledger record #\d+ and anchored/))
            .toBeVisible({ timeout: 20_000 });
        // The exhibit is in the locker's own list, and it carries a re-verification affordance, which
        // only renders for a row the journal actually holds.
        await expect(page.getByText('scene-photo.png').first()).toBeVisible();
        // The re-verification affordance lives in the card's expanded detail, and the card opens on
        // click. It is a <div onClick>, not a button, which is its own accessibility defect (D22 in
        // the register) - so this clicks the text instead of a role, and says why out loud.
        await page.getByText('scene-photo.png').first().click();
        await expect(page.getByRole('button', { name: /Re-verify against the anchor/ })).toBeVisible();
    });

    await test.step('Act 3 — the judge re-reads the same bytes and the ledger agrees', async () => {
        await signOut(page);
        await signIn(page, /Judiciary/, /\/judge\/board$/, {
            'DHC-J-1234': 'DHC-J-1234',
            'Delhi High Court': 'Principal District & Sessions Court, Coimbatore',
            '••••••••': 'e2e-not-a-real-login',
        });
        await page.goto('/judge/verify');

        await page.setInputFiles('input[type="file"]', EXHIBIT);

        await expect(page.getByRole('heading', { name: /Integrity Verified/ })).toBeVisible({ timeout: 20_000 });
        await expect(page.getByText(/matches ledger record #\d+/)).toBeVisible();
        // The verdict is a statement about the digest and nothing else: the copy the app refuses to
        // say is "secure", so the test refuses to accept it too.
        await expect(page.getByText(/verified secure/i)).toHaveCount(0);
    });
});
