# NyayaSahayak — Project Knowledge Base

**Generated:** 2026-10-19 IST, on branch `arena/25ee737b-nyayasahayak-shroff`, base commit `63f0ba64`.
**Method:** every number below comes from a command run against this checkout or `43a31845` (PR #2 head), as noted. Nothing is inferred from README text, and no claim is made about behaviour that was not executed. Where a fact came from the PR #2 tree rather than this base, it is tagged **[PR2]**.

This document exists so you can point at a line and say "do that." Section 13 is the defect register; section 14 is the decision list, with my recommendation on each.

---

## 0. Where things stand (updated 2026-10-19, after the §14 go-ahead)

| §14 | action | state |
|---|---|---|
| 1 | Merge PR #2 (Block 3) | **DONE** — merged at 18:52:02Z, `main` = `3362b322`; this branch synced by merge (`96b30199`), because the two clones have unrelated roots and cannot fast-forward |
| 2 | Hygiene commit | **DONE in git terms** — `.env`, `dist/`, `node_modules/` untracked (22,993 paths), `.env.example` added, `eslint@^8.57` added as a devDependency so the declared `npm run lint` gate can run. Tracked files: 23,290 → **297** |
| 2a | Rotate the API key at Google | **NOT NEEDED** — measured after the fact: the committed 24-char value starts `YO` and fails Google's `^AIza[0-9A-Za-z_-]{35}$` shape, i.e. an unfilled placeholder, and only one content version of `.env` has ever existed. Nothing was exposed. If you did paste a real key at some point outside this repo's history, rotate it in AI Studio anyway |
| 3 | `git filter-repo` + force-push `main` | **RECOMMEND NOT DOING IT** (see D1: the value was a placeholder). Left here in case you want it anyway: `pip install git-filter-repo` → `git filter-repo --path .env --invert-paths --force` → `git push --force-with-lease origin main`. Note GitHub keeps the old objects reachable via PR refs and its own GC, and every other clone of yours must be re-pointed — cost without benefit for a non-secret |
| 4 | Sequence after D0 | **updated after PR #3 merged**: 4(e) done → **PR #4 (in flight)** D18 integrity check → Q9/D19 About → census tool + `docs/PLAN_4a.md` → **PR #5** D20 intake-to-ledger + Playwright (its own PR, so a flaky browser install cannot block the trust fix) → 4(a) Case unification → IndexedDB default → purge → locales → crypto-js |
| 5–13 | recorded, scheduled | Q7 delete `src/features/nationals/` (open, 4(purge)); **Q8 CLOSED** - `QuantumHashProof` deleted in `d2d26bb2`, and the fingerprint screen became a real check on route `/integrity` in PR #4 commit 1; **Q9 CLOSED** - `About` is routed at `/about` (public *and* authenticated branches) and linked from all three live persona sidebars, which required D19's copy fixes first; Q10 7 locales + lazy rest (open); **Q11 SCHEDULED for PR #5** - Playwright, one chained journey, after D20 makes the chain real; Q12 provisional skeleton, publishing paused; **Q13 CLOSED** - `docs/PLAN_4a.md` is in the repository, so 4(a) opens from `HEAD` and not from a path on one person's machine |

**Full gate, run locally for the first time on the synced tree** (previously impossible — the tracked Windows `node_modules` broke every tool that spawns esbuild): `tsc --noEmit` → **0 errors**; `npm test` → **49 node tests pass** + **14 statute tests pass**; `node tools/ledger_repro.cjs` → **18 claims hold, 0 do not**; `npm run build` → 98 assets, largest **577.74 kB** of the 600 kB per-asset budget (22.26 kB spare). `npm run lint` → **red**, see §12.

---

### 4(e) execution log (this branch)

| commit | what | gate |
|---|---|---|
| `e3642d9d` | **D3, D4, D17** — lazy Gemini client + `isGeminiConfigured()`; a placeholder key counts as no key; no retry storm; the fabricated fingerprint fallback deleted; all three compiler suppressions removed (each was hiding a real bug, the chat one meant NYAYABOT's topic guardrail had never been applied); harness group G | tsc 0 · 49+14 tests · harness **24/24** · build 577.74 kB |
| `174d9484` | **D5, D10** — every live string re-labelled to what the code does (landing page, citizen tracker, complaint receipt, judge verifier, en+hi translation values); `initializeLedger` / `getLedgerEntries` / `LedgerEntry` / `INTEGRITY_WATCHDOG`; harness group H — a liveness-aware anti-drift gate that parses aliases from `vite.config.ts`, treats `React.lazy` as a real edge, strips comments so a disclaimer cannot pass as a claim, and skips identifier-shaped strings so translation keys do not trip it | tsc 0 · 49+14 · **25/25** · build 577.91 kB |
| `d2d26bb2` | **D9** — the demo verification route deleted: both `QuantumHashProof` copies, the lazy import, `QuantumHashWrapper`, `<Route path="hash">`. No nav linked to it; the judge's `HashVerifier` already does the real check, so a theatre of one was removed, not a capability | tsc 0 · 49+14 · **25/25** · build 97 assets (one chunk fewer), 577.64 kB |

**D18 — found while doing D9, deliberately left for the next commit; CLOSED by `02d9a6c`.** The paragraph below is the finding as it was written, kept verbatim because it is the record of how the defect was spotted and what was promised about the fix. The surviving "quantum
fingerprint" screen and `DocumentAnalysis` still ask the *language model* to invent a digest:
`geminiService.ts:229` prompts "generate a unique quantum cryptographic hash", with a schema that
makes `quantumHash` required, and the UI prints the answer in a monospace block as if it were a
document fingerprint. That is the same category of defect as the fabricated fallback deleted in
`e3642d9d`, only larger — it attests to bytes nobody hashed. Planned 4(e) commit 4: compute a real
`sha256Hex` / `sha256OfFile` from `core/trust`, compare it against the digests already in the journal
via `shared/utils/ledgerRecords`, rename the screen "Document Integrity Check" on route `/integrity`,
delete `generateQuantumFingerprint` + `QuantumFingerprintResult` and the dead nationals twins that
reference them, and move harness group G in the same commit so the suite never references a symbol
that no longer exists.

### 4(f) execution log (PR #4, on `arena/09a197cb-nyayasahayak-shroff`)

| commit | what | gate |
|---|---|---|
| _this commit_ | **the census, made reproducible** — `tools/resolve-importers.mjs` (dep-free ESM: aliases parsed out of `vite.config.ts` *and* `tsconfig.json` with `--check` failing if they drift, comments stripped so prose cannot pass as code, `React.lazy(() => import(…))` counted as the real edge it is, BFS from `src/main.tsx`; modes census / `--orphans [--min]` / `--model <path> [--symbol Case]` / `--json` / `--check`), plus `docs/PLAN_4a.md` so block 4(a) opens from `HEAD` instead of from a machine-specific path (Q13). Every stale count in this file is corrected to what the tool measures, including the two this document had wrong in public: §3's grep-era reachability (119/112 → 131/98) and §8's namer set (17 → 16). | tsc 0 (no `src/` file touched) · 49+14 · 25/25 · build 0 · census 229 files, 131 reachable, 98 unreachable / 19,611 lines, 0 unresolved |
| `02d9a6c` | **D18** - the language model no longer invents digests. `generateQuantumFingerprint` + `QuantumFingerprintResult` + `anomalyDetector` deleted; real `sha256Hex`/`sha256OfFile` over the user's own bytes; journal lookup with case-insensitive digest matching (the locker stores upper-case, `sha256Hex` returns lower); three verdicts, `FOUND (anchored at index n)` / `FOUND (not yet anchored)` / `NOT IN JOURNAL`, with `anchored` read from `getProof() !== null` and never from a record field; route `quantum` → `integrity` in both branches; the duplicate panel inside `DocumentAnalysis` cut (339 → 153 lines); both dead nationals twins and `QuantumFingerprinting.tsx` removed; 22 orphaned locale keys dropped × 23 tables (552 lines); harness F mounts the new screen, G forbids the invented API | tsc 0 · 49+14 · **25/25** · build 0, largest asset 543.13 kB |
| `95789de` | **Q9 + D19** - `About` published at `/about` and linked from the citizen, police and judge sidebars, with its marketing copy replaced by claims the repository can answer. The CTA button now goes somewhere (it was calling an optional prop nobody passed, and the hero's `Sign In` had no handler at all); `AboutStats`' four simulated counters became four checkable numbers; AboutTech's `Court-Grade Security` / `End-to-End encryption` / `WCAG 2.1 AA` / `e-Courts Aligned` chips and LandingPage's `End-to-End Encrypted` badge are gone; `Automated Summons Generation` left the judge list because no file in `src` except that list mentions a summons; H's vocabulary learned `end[- ]to[- ]end encryption` and `court[- ]?grade`, F's retired list learned the eight retired phrases, and both were proved to bite by planting and reverting. The `5 crore cases pending` figure stays, now attributed to the National Judicial Data Grid instead of implied to be this project's own. | tsc 0 · 49+14 · **25/25** · build 0, largest asset 543.69 kB · 99 assets |

## 1. What this project actually is

A single-page React 18 + TypeScript + Vite application for India's BNS/BNSS/BSA transition. There is **no backend, no server, no database** in this repository — `git ls-files | grep -E "server|api/|express|prisma|supabase|firebase"` returns nothing. State lives in the browser (localStorage) and is protected by real SHA-256 hashing, an RFC-6962-style Merkle tree, and an ECDSA P-256 device signature over the daily anchor root.

The honest one-line description: *a client-side evidence-and-case journal whose entries are hash-chained, Merkle-batched, and locally anchored, with statutory certificate text (BSA s.63(4)) rendered deterministically so a printed digest can be re-derived later.*

What it is **not** (established in the audit, and enforced by `docs/TRUST_MODEL.md`): not a blockchain, not post-quantum, not zero-knowledge, not non-repudiable, not connected to e-Courts/CCTNS/e-Sakshya, and not a substitute for a forensic lab.

## 2. Git state — read this before planning anything

| ref | SHA | contains |
|---|---|---|
| `origin/main` | `63f0ba64` | "Merge pull request #1" — **Blocks 1 and 2** |
| PR #1 | `ee3f7a73` | MERGED 2026-10-18T16:42:59Z (Blocks 1–2) |
| **PR #2** | head `43a31845` | **Block 3 — state: `OPEN`, `mergeable: MERGEABLE`, CI `pass` 1m6s** |
| this session branch | `63a25ee737b` → base `63f0ba64` | Blocks 1–2 only |

Two consequences you should know before answering section 14:

1. **Block 3 is not in `main`.** My earlier session notes said "PR #2 merged"; GitHub says otherwise (`gh pr view 2 --json state,mergedAt` → `OPEN`, `mergedAt: null`). So this working tree **lacks**: `src/core/trust/custody.ts`, `src/shared/utils/ledgerRecords.ts`, `src/core/services/section63Certificate.ts`, `src/personas/police/pages/Section63CertificatePage.tsx`, `tests/trust_custody.test.ts`, `tests/section63_certificate.test.ts`, and harness groups E/F. Verified with `[ -e … ]` on each path.
2. **This branch's history is unrelated to PR #2's history.** `git merge-base HEAD 43a31845` is empty and `git merge --ff-only 43a31845` fails with "refusing to merge unrelated histories" — the two clones have different root commits (`63f0ba64` vs `4fce994a`). So Block 3 cannot be fast-forwarded in here; it has to reach this branch by merging PR #2 on GitHub, or by a content-level sync.

On this base, `npm test` = **32 tests, 32 pass**, `tsc --noEmit` = **0 errors** (both run this turn).

## 3. Repo-hygiene incidents (these outrank every feature request)

### D1 — a `.env` with `VITE_API_KEY` is committed to `main` — **RESOLVED, and it was not a real secret**

**Update after the hygiene commit, measured rather than assumed.** The committed value is 24 characters, begins `YO`, and does **not** match Google's AI-Studio key format (`^AIza[0-9A-Za-z_-]{35}$`, 39 chars). It is an unfilled placeholder — `YOUR_API_KEY…`-shaped — so nothing needed rotating and no credential was ever exposed. History holds exactly one content version of the file (`63f0ba64`), so there is no older real key lurking in a prior blob. Two lessons kept deliberately: (1) "presence + non-empty length" is not evidence of exposure, and I escalated on weaker grounds than I would demand from a PR; (2) the *mechanism* was still broken — a `.gitignore` that ignores `.env` while `.env` is tracked protects nobody, and had someone pasted a real key tomorrow it would have shipped silently. That is why the commit stands.

Consequence for §14 Q3: **do not rewrite history for this.** A force-push on public `main` costs every clone a re-point and buys nothing against a placeholder. Re-open the question the day a real key is ever committed (check: `git log --all --format=%h -- .env`, then inspect sizes/formats before deciding).

Original finding, preserved for the record:

```
git ls-files .env            → .env                      (TRACKED)
git check-ignore .env        → (not ignored)              while .env.local IS ignored
git log --oneline -- .env    → 63f0ba64 (the PR #1 merge)
VITE_API_KEY present, value length: 24 chars              (value deliberately not printed)
```

Consequences, sharpened by one more check this turn — `gh repo view --json isPrivate` → **`private=false`, i.e. `shroff45/Nyayasahayak-shroff` is a PUBLIC repository.** So the key is readable by anyone on the internet right now, in `main` and in PR #1's merge commit, and deleting the file does not remove it from history. Treat rotation as happening *today*, not at the next convenient block. Required actions, in order: (1) revoke/rotate the key at the provider — this is the only step that actually stops the exposure; (2) `git rm --cached .env`; (3) add `.env` to `.gitignore`; (4) commit a `.env.example` with `VITE_API_KEY=`; (5) if the repo is public, rewrite history (`git filter-repo`) and force-push, which needs your explicit go-ahead because it rewrites shared refs.

### D2 — a clean clone cannot build, test, or run the harness on Linux or macOS

`node_modules` is committed (22,989 tracked files, 418 MB on disk, `.git` = 82 MB) and it was installed on **Windows**:

```
node_modules/@esbuild/          → win32-x64            (no linux-x64)
node_modules/@rollup/           → rollup-win32-x64-gnu, rollup-win32-x64-msvc
```

Measured failure on this Linux sandbox, from a clean checkout:

```
node tools/statute_tests.mjs   → esbuild: "You installed esbuild for another platform… needs @esbuild/linux-x64"
node tools/ledger_repro.cjs    → same, exit 2
node node_modules/vite/bin/vite.js build → exit 1
git status --porcelain         → 0 (tree untouched; also chmod +x on .bin shims does not help)
```

CI passes only because `.github/workflows/ci.yml` runs `npm ci` first. **Fixed by the hygiene commit in §0**: `.gitignore` already listed `node_modules/`, `dist`, `dist/` and `.env` (lines 42, 71, 84, 117, 129) — the entries were simply inert because the paths were already tracked, which is why untracking, not gitignoring, was the actual repair. Two footnotes for the next person debugging a clone: (a) a fresh `npm ci` is mandatory, and (b) if `node_modules` ever came from git rather than npm, the `.bin/*` shims and `@esbuild/<platform>/bin/esbuild` lose their exec bit → `spawnSync … EACCES`, fixed by `chmod +x node_modules/.bin/*` or a clean `npm ci`.

### D3 — 34.7% of `src/` is unreachable (37.7% when this line was written)

Re-measured with `node tools/resolve-importers.mjs`, which is now the only acceptable way to state a
number in this section: **131 of 229** files reachable from `src/main.tsx` through resolved static
**and** `React.lazy` dynamic imports; **98** are not, **19,611** lines of 56,464. It was 119/112 and
37.7% when this line was written, and the difference is this programme's own doing: D9's demo route
deletion, D18's three deleted quantum copies, and Q9 publishing the About page — which alone moved 8
files / 1,426 lines out of the island in one commit, because publishing a page is a reachability
change.

Largest remaining islands by lines: `src/features/nationals` (50 files / 12,263 — 63% of all
unreachable lines, and one `git rm -r` if Q7 says delete), `src/features/main` (13 / 2,468),
`src/personas/citizen` (5 / 1,028), `src/personas/judge` (4 / 755), `src/components` (5 / 752),
`src/shared/components` (6 / 613). The full list with per-file sizes and "no importers at all"
markers: `node tools/resolve-importers.mjs --orphans`.

Two things this section used to get wrong and should not be trusted to repeat: it stated its counts
from grep (see §8's method note), and it treated an unreachable file as an inert one — but `tsc`
typechecks all of `src/`, so the dead 98 gate every merge on this branch.

## 4. Runtime architecture

```
index.html → src/main.tsx
   ├─ AuthProvider            src/core/auth/AuthContext.tsx     (crypto-js HMAC session, localStorage)
   ├─ BrowserRouter           src/App.tsx                       (43 <Route> paths)
   └─ AppSettingsContext, WorkspaceContext (src/core/context/)  (allCases, selectedCase, activity log)
```

Aliases, verified verbatim from `vite.config.ts` (and mirrored in `tsconfig.json` as globs only):

```
@core     →  ./src/core
@personas →  ./src/personas
@shared   →  ./src/shared
@types    →  ./src/types      ← half-implemented: tsconfig has only "@types/*": ["src/types/*"]
                                so `from '@types'` resolves in Vite and fails tsc. 0 files use it.
```

There is no `@/` or `@features` alias. `tsconfig.json` has `include: ["src"]` — which means **`tests/` and `tools/` are never typechecked**, and **unreachable files in `src/` are typechecked** (this asymmetry drives the whole Block 4(a) commit-ordering problem, §8).

Route map (from `grep -o 'path="…"' src/App.tsx`): top level `/` `/citizen` `/police` `/judge` `/admin` `/profile`; children include `home file track timeline visuals legal-hub bot feedback` (citizen), `fir evidence analysis mapper quantum hash verify` etc. Persona subtrees are wrapped in `<ProtectedRoute allowedRoles=…>`. Sign-in is real-but-minimal: `src/shared/layout/LandingPage.tsx` calls `login(role)` from `useAuth()` — there is no `/login` route; `ProtectedRoute` redirects unauthenticated users to `/`, and role-mismatched users to `/<role>/home`.

## 5. The trust layer — what genuinely works

`src/core/trust/` (this base): `sha256.ts`, `merkle.ts`, `store.ts`, `keys.ts`, `ledger.ts`, `bail.ts`, `index.ts`. **[PR2] adds `custody.ts`.**

| module | what it does | verified by |
|---|---|---|
| `sha256.ts` | `sha256Hex` (async, WebCrypto), `sha256OfFile(blob, onProgress?)` streaming 4 MB slices, >64 MB refused | `tests/trust_primitives.test.ts` |
| `merkle.ts` | RFC-6962 framing (0x00 leaf / 0x01 node), odd node promoted, `EMPTY_ROOT` | same |
| `store.ts` | keys `nyaya:ledger:v1:records` / `:meta` / `:anchors`; `defaultDriver()` = localStorage if writable else memory with `persisted:false`; `indexedDbDriver` **exists but nothing selects it** | `tests/trust_ledger.test.ts` |
| `keys.ts` | ECDSA P-256 JWK in `nyaya:identity:v1`, pinned authorities in `nyaya:authorities:v1`, `canonicalBytes` (sorted keys, undefined dropped) | primitives tests |
| `ledger.ts` | `append({kind,data})` stores **flat** `jsonSafe({kind,…data})`; `verifyRecord` → `{ok,digestMatches,anchored,anchorIndex,signerFingerprint,recordIndex,reason}`; `verifyChain`, `anchor`, `exportCertificate`, `verifyCertificate`, `status`, `reset`. Unpinned signer ⇒ UNKNOWN, never MISMATCH | ledger tests + `tools/ledger_repro.cjs` |
| `custody.ts` **[PR2]** | `appendCustodyEvent`, `buildCustodyChain`, badge precedence MISMATCH > GAP_DETECTED > UNKNOWN > PENDING > VERIFIED, ids `LEDGER-<recordIndex>`, `GAP_TOLERANCE_HOURS=24` | `trust_custody.test.ts` (7) **[PR2]** |

`src/services/akhandLedger.ts` is the async façade (18 exports on this base): `getLedger`, `initializeBlockchain`, `addBlock`, `appendEvidenceRecord`, `verifyCase`, `verifyChainIntegrity`, `getBlockchain`, `getLedgerStatus`, `pinAuthority`, `getPinnedAuthorities`, `isSelfSignedOnly`, `exportCertificate`, `verifyCertificate`, `createBailContract`, `verifyCourtAppearance`, `releaseBailAmount`, `getBailContractStatus`, `listBailContracts`.

Guarantees that hold: a payload edit is caught; a whole-ledger laundering fails at "proof names a different root than the anchor being verified against"; an exhibit digest survives a module re-import; `exportCertificate()` verifies offline and rejects a one-field edit; `node:crypto` re-computed over `canonicalBytes` equals the stored `leafDigest`.

Guarantees that do **not** hold, and must never be claimed: durability beyond this browser profile (D9), any external witness (the anchor is self-signed by the same device), non-repudiation, quantum resistance, zero-knowledge, admissibility in court.

## 6. Everything that is mock, decorative, or LLM-shaped

| surface | reality | file:line |
|---|---|---|
| "NYAYABOT", "RAG Active", "GraphRAG" | `vidhikRAG.ts` is a `// MOCK DATABASE (50 Precedents)` array. Note `src/services/vidhikRAG.ts` has exactly one importer — `src/components/JudgeDashboard.tsx`, which is itself an orphan — so that copy is already dead. | `src/features/main/components/Nyayabot.tsx:516` (live) |
| Gemini calls | `const API_KEY = import.meta.env.VITE_API_KEY; if (!API_KEY) throw new Error("API_KEY environment variable is not set.")` — **at module scope**, reached from 5 live screens (`CaseIntakeTriage`, `DocumentAnalysis`, `LegalTechHub`, `Nyayabot`, `QuantumFingerprinting`). No key ⇒ that route white-screens. | `src/features/main/services/geminiService.ts:6-9` |
| "quantum fingerprint" | An LLM generates a `quantumHash` string. On API failure it returns `quantumHash: 'Error generating hash: Fallback response due to API failure.'` — an error sentence inside a hash field, rendered in a mono `<pre>` as if it were a fingerprint. | `geminiService.ts:259`, `QuantumFingerprinting.tsx:155` |
| Auth / sessions | `const INTEGRITY_SECRET = 'nyaya-v2-integrity-key-2025'` — a constant in source; the HMAC proves only that the JSON was not hand-edited by a casual user, since the secret ships with the app. No password hashing, no server. | `src/core/auth/AuthContext.tsx:24,29,42` |
| "Submit to Blockchain" | writes to localStorage. | `localization.ts:255`, `citizenTranslations.ts:90,129` |
| Bail contracts, adjournment risk, happiness/NPS | computed client-side from fixtures or the ledger; no statutory source of truth. `core/trust/bail.ts` does sign ledger-backed contracts. | — |
| `QuantumHashProof` screen | fed a hardcoded `caseId="DEMO-CASE-001"` on a live route. | `src/App.tsx:318` |
| Post-quantum / Kyber / ZKP / smart contract / "India's first" | no implementation anywhere; label-only. Block 2 removed most instances from the entry surfaces; the residue is in §7. | — |
| `npm run lint` | declared; **no eslint config in the repo** → cannot run. Do not put it in a gate. | `package.json` |

## 7. Label-integrity residue still live on this base

Re-measured at the time with a liveness-filtered string census (dead-file hits excluded, since they cannot be seen by a user). **Superseded:** every hit below was swept by `174d9484` (D5), and the ones on this list's tail - `App.tsx`'s `path="quantum"` route and `akhandLedger`'s `initializeBlockchain` / `getBlockchain` / `BlockchainBlock` names - went in PR #4 (`02d9a6c`) and `174d9484`. The census is kept because the *method* is the finding, not the list:

> A previous pass called `HashVerifier` and both translation files "already honest" on the strength of a narrow `quantum|zkp` grep. It took a BFS over the real import graph to find the strings. Grep finds candidates; resolution settles them.

```
src/shared/layout/LandingPage.tsx:88          "Live Blockchain Network"
src/shared/layout/LandingPage.tsx:95          "India's first AI-powered judicial interface … quantum-secure"
src/personas/citizen/pages/CaseTrack.tsx:499  "🔗 Blockchain Secured: All evidence … verify integrity anytime through the judicial portal"
src/personas/judge/pages/HashVerifier.tsx:128 "BSA Section 63(2) Compliance Check • Zero-Knowledge Proof"   (+ :3 file comment)
src/features/main/constants/localization.ts:255,274,277 (+539,544 hi)  "Submit to Blockchain", "altered after submission to the blockchain", "might not exist in blockchain"
src/features/citizen/constants/citizenTranslations.ts:90,129,213,248   "Submit to Blockchain" / "ब्लॉकचेन पर जमा करें"
src/App.tsx:336                               .then((m) => m.initializeBlockchain())
src/App.tsx:409,453                           <Route path="quantum" …>
src/services/akhandLedger.ts:127,247          initializeBlockchain() / getBlockchain() / BlockchainBlock
src/features/nationals/core/types.ts:101      'BLOCKCHAIN_WATCHDOG' agent id
+ 21 further hits inside unreachable files
```

The About page and the landing page's `End-to-End Encrypted` badge were **not** on this census, because About was unreachable and a liveness filter is blind to exactly that case: a page that is unreachable cannot be seen by a user, and so cannot be listed as misleading to one. That is why Q9 (publish it) and D19 (make its strings true) are one commit and not two, and why `tools/ledger_repro.cjs` group F now renders the published page rather than reading its source.

## 8. The four `Case` models — and the only safe way to change them

Measured by `node tools/resolve-importers.mjs --model <file> --symbol Case`, i.e. resolved rather than
grepped, and re-measurable by anyone in one command per row:

| file | shape | importers | **live** importers | naming `Case` | live namers |
|---|---|---|---|---|---|
| `src/types.ts` | golden, 19 fields, several required | 11 | **5** | 7 | **3** (`DraftJudgmentPanel`, the adapter, `akhandLedger`) |
| `src/core/types.ts` | strict subset, missing **6** golden fields (4 required: `adjournmentsCount` `incidentDate` `isZeroFir` `applicableLaw`; 2 optional: `judgeId?` `zeroFirTransferStatus?`) | 7 | **0** | 3 | 0 |
| `src/features/main/types.ts` | legacy intake (`caseNumber` `petitioner` `invokedActs` `title` `complexityScore` `pii`) | 15 | 12 | 9 | **8** ← the real migration bulk |
| `src/features/nationals/core/types.ts` | union-shaped, nearly all optional, both spellings | 21 | **4** | 9 | **1** (`nationals/modules/judge/JudgeDashboard.tsx`, reached from `App.tsx:83`) |

Method, now a program instead of a paragraph: resolve every `from` specifier through the alias table
read out of `vite.config.ts` **and** `tsconfig.json` (and fail if those two disagree), resolve relative
specifiers against the importing file's own directory, count `React.lazy(() => import(…))` as a real
edge, strip comments and JSX text before searching for a name, then BFS from `src/main.tsx`. grep
alone reported 3 legacy importers where there are 15, and merged two different `core/types.ts` files
into one fake 29-file block. **Resolution is authoritative; grep is a candidate-finder** — and now
there is no excuse for using grep, because the resolver is in the repository.

The rule that governs commit ordering: **`tsc` typechecks dead files** (`include: ["src"]`). So any
unreachable file that names a type you edit must be deleted or fixed **in the same commit**, or the
gate goes red on code nobody runs. The full set — unreachable files naming `Case` from any of the four
models — is **16 files**, the union of the four `--model … --symbol Case` dead lists with no file
counted twice. It was recorded here as 17 for a while, and 17 was right when it was written:
`src/features/nationals/components/DocumentAnalysis.tsx` was a namer until D18 deleted it. A
directory-based list misses 2 of the 16 (`src/features/nationals/constants/mockData.ts` with 7 `Case`
literal constructions, and `src/features/nationals/modules/citizen/VoiceFilingInterface.tsx` with 3),
because the files beside them in those directories are live.

One measurement note kept on purpose, because it is why the tool strips JSX text before it searches:
an earlier draft of the census counted a file as a namer if the *word* appeared in it at all, which
swept in `CaseSummaryCard.tsx` — a component rendering the heading "Case Summary" — and reported 18.
Quoted strings and the prose between two tags name a heading, not a type. A tool that replaces a
careless grep has to be at least as careful about what counts as a use.

Related invariants: golden `src/types.ts` `Case` must not be *edited* by 4(a), only consumed differently — that is the sole reason two dead golden namers (`components/CaseDetailsPanel.tsx`, `CaseQueue.tsx`) stay green. And the twin trap: four files named `DraftJudgmentPanel.tsx` exist, only `src/components/DraftJudgmentPanel.tsx` is routed (`App.tsx:44` → `:280`), and the live one is the terminal consumer of `toGoldenCase(selectedCase)` at `App.tsx:248`.

Adapter `src/core/workspace/legacyCaseAdapter.ts` (this base) has 4 importers: 2 live (`App.tsx:27`, `personas/police/pages/ChargeSheetGatePage.tsx:28` — its `toGoldenCase` at `:93` converts workspace state, not a journal record) and 2 orphans. `applicableLawFor` is exported **only** from `legacyCaseAdapter.ts:22`.

Read path: `src/shared/utils/ledgerRecords.ts` **[PR2]** is the single journal reader; `readCase` derives `incidentDate` as `data.incidentDate ?? data.filingDate` and **deliberately stops there** (`:187`) — no `today()` fallback, because that date decides whether the BNSS s.176(3) videography mandate fires. There is no `today()` helper anywhere in `src/` (verified).

## 9. Persistence and data model

localStorage keys in use: `nyaya:ledger:v1(:records|:meta|:anchors)`, `nyaya:identity:v1`, `nyaya:authorities:v1`, `nyaya:users`, `nyaya:probe`.

- `LedgerRecord = {index, timestamp, leafDigest, previousDigest, data}`; `data` is **flat** (`{kind, …fields}`), not nested.
- Journal array indices ≠ record indices once anchors interleave — select by `data.kind`.
- `addBlock(caseData: Case | LedgerSubject)` where `LedgerSubject = {id: string} & Record<string, unknown>` — it accepts **all four** shapes, so the type system will not stop you, and rows already on disk keep their old spelling. A type unification does not migrate stored data.
- `defaultDriver()` chooses localStorage and silently falls back to memory with `persisted:false`. **D9: a kiosk under storage pressure loses the journal.**
- Quotas: 5 MB per origin in most browsers; the journal stores digests and metadata, never file bytes — no file is stored anywhere (there is no backend). The UI says so; that is the trust model, not a defect. PDF export was explicitly rejected as a "missing feature": the statute prescribes the certificate's particulars, not a container, and a text file that hashes to the anchored digest is more verifiable than a PDF this repo cannot produce.

## 10. i18n

`localization.ts` is 4,985 lines: 23 locale tables (`en hi ta te kn ml mr gu or pa sa ur as ks sd ne mai sat kok doi mni brx ne`) wired into one `translations` map at `:4958`, all inside the **entry chunk** (577.74 kB [PR2] vs the 600 kB per-asset gate — 22.26 kB of headroom). Meanwhile `src/types.ts:2` declares `export type Language = 'en' | 'hi' | 'gu' | 'ta' | 'te'` — **5**. So 18 tables are compiled, shipped and unreachable by the type. Both `localization.ts` and `citizenTranslations.ts` (a second, citizen-only copy) are the two biggest levers on bundle size, and `verifying_blockchain_hash` shows the copy is drifting between them (one already re-labelled to "Checking the ledger record…", the other not).

## 11. Statutory anchors actually encoded — and the ones the repo gets wrong

Correct in code: `BNS_EFFECTIVE_DATE` gating in `forensicInterlock.ts`; BSA s.63(4) Part A/B particular set **[PR2]**; s.176(3) triggered by offence ≥ 7 years **and** restricted to notification-only States per the proviso (Delhi HC, *Suresh Kumar Singh*, 2025:DHC:1337).

Watch out: `isForensicVideoMandatory(sections, lawCode, incidentDate?)` **skips the guard when the date is missing, so an unknown date applies the stricter BNS list** — a "cannot decide" case currently resolves as "decide against the accused". Do not silently change it; it is documented behaviour with a test.

Repo claims to fix against the bare Act: "60 days under s.193" is wrong — s.193(3)(i) is a 90-day duty to inform, s.193(9) 90 days for further investigation, and completion tiers are 90 days (<10 yr offences) / 180 days (≥10 yr or life/death); s.173(1)(ii) e-FIR signature is **3 days**, not 24 h/72 h; s.187(3) 60/90-day detention ceilings; s.263 charge framing within 60 days of first hearing; s.232 committal 90→180. Verify against the Act text before coding to any of it — and if a string cites a section in a PR description, quote the section.

## 12. Quality gates — exact commands, and what they mean

```
git merge-base --is-ancestor <last-known-good> HEAD   # 0, or you are on the wrong base
npm run typecheck            # must be 0 errors. If the shim is not executable: node node_modules/typescript/bin/tsc --noEmit
npm test                     # 32 here (PR #2 = 49) + 14 statute tests. Never bare `node --test tests/*.test.ts` — needs --experimental-strip-types.
node tools/ledger_repro.cjs  # the claim harness; 13 groups A–D on this base, 18 A–F in PR #2. Must exit 0.
set -o pipefail && npm run build | tee /tmp/build.log
node tools/check_bundle_size.mjs /tmp/build.log   # 600 kB per asset, fails closed, ANSI-stripped
```
`npm run lint` — now runnable (`eslint@^8.57` added as a devDependency in §0) and **currently red**: 154 problems / 42 errors / 100 `any` warnings. It is deliberately *not* in CI yet; adding it there today would block every future PR on cosmetics. It becomes a gate when the dead-island purge lands. Also true and unavoidable: **`tools/` and `tests/` are outside `include:["src"]`**, so nothing typechecks the harness — keep it honest by hand.

Rules that have kept this project from lying to itself: `tools/ledger_repro.cjs` is the anti-regression harness for both the trust layer and UI/fixture claims and must stay 100% green; features are only removed with proof of zero live importers **plus** a byte-identical live counterpart; no `@ts-ignore`, no `any`, no loosening `noUnusedLocals`; commit scratch tools, never cite `/tmp`; and a green typecheck never proves a route landed — check the DOM or the stdout.

## 13. Defect register (severity = my judgment as the engineer who has to maintain this)

| # | defect | evidence | sev | suggested block |
|---|---|---|---|---|
| D1 | `.env` with `VITE_API_KEY` committed to a public repo — value proved to be an unfilled placeholder, so no exposure; the ignore-vs-track mechanism was broken regardless | §3 D1 | ~~critical~~ → closed | D0 (done) |
| D2 | clone can't build on Linux/macOS (win32 `node_modules` tracked) | §3 D2 | **critical** | D0 |
| D3 | **closed** (`e3642d9d`). Was: no key ⇒ intake/bot routes white-screen — the default state of every clone, since the committed `.env` held a placeholder. | `geminiService.ts:6-9` | **high — upgraded**, this is what a reviewer sees first | 4(e)
| D4 | **closed** (`e3642d9d`): the fabricated fallback is gone and absent analysis is `null`. The mechanism it fell back from is now D18. | `geminiService.ts:259` | high | 4(e)
| D5 | **closed** (`174d9484`): live strings re-labelled, and harness group H fails the build if such a claim returns to a reachable file. | §7 | high | 4(e)
| D6 | ledger defaults to a silently-volatile store | `store.ts` `defaultDriver()` | high | 4(new) |
| D7 | 4 competing `Case` models + adapter; journal rows already heterogeneous | §8, `LedgerSubject` | high | 4(a) |
| D8 | 98 unreachable files / 19,611 lines (was 112 / 21,784 before D9, D18 and Q9; `node tools/resolve-importers.mjs` reproduces it) | §3 D3 | medium | 4(purge) |
| D9 | **closed** (`d2d26bb2`): route, wrapper, lazy import and both component copies deleted. | `App.tsx:318` | medium | 4(e)
| D10 | **closed** (`174d9484`): `initializeLedger` / `getLedgerEntries` / `LedgerEntry`; `App.tsx`, judge `HashVerifier`, `src/types.ts` and the harness moved in the same commit. (`getLedger` and `LedgerRecord` were already taken by two different shapes — using them would have created a new ambiguity instead of ending one.) | `akhandLedger.ts:127,247` | medium | 4(e)/4(d)
| D11 | 18 of 23 locale tables unreachable, all in the entry chunk; two translation files drifting | §10 | medium | 4(c) |
| D12 | hardcoded `INTEGRITY_SECRET`; auth is a role picker | `AuthContext.tsx:24` | medium | decide, §14 Q6 |
| D13 | `crypto-js` still in auth while the trust layer is WebCrypto | `AuthContext.tsx:7` | low | 4(b) |
| D14 | missing `incidentDate` resolves to the stricter branch | `forensicInterlock.ts` | low-but-legal | 4(a)-i note |
| D15 | **half-closed** (`4aa7620e`): `eslint@^8.57` is now a devDependency so the declared gate runs — and it is red (154 problems in 56 files: 19 `no-useless-escape`, 14 `prefer-const`, 4 `no-empty`, 3 `ban-ts-comment`, 2 `exhaustive-deps`; 100 `no-explicit-any`). Not added to CI yet; the purge block removes roughly half the offenders. | fixed in §0 (`eslint@^8.57`, matching the legacy `.eslintrc.json` format); the gate now **runs and is red**: 154 problems in 56 files (42 errors: 19 `no-useless-escape`, 14 `prefer-const`, 4 `no-empty`, 3 `@typescript-eslint/ban-ts-comment`, 2 `react-hooks/exhaustive-deps`; 112 warnings: 100 `no-explicit-any`, 12 `no-unused-vars`) | medium | 4(purge) — deleting the 98 unreachable files removes roughly half the offenders; do **not** add to CI until green
| D17 | **closed** (`e3642d9d`): all three suppressions gone, and each was hiding something — see the 4(e) execution log. Enforced by harness group H-era check "No compiler suppressions anywhere in src/", proven falsifiable by planting a directive and watching it fail. | `src/features/main/services/geminiService.ts:158`, `features/main/components/LitigantHappiness.tsx:29`, `features/nationals/components/LitigantHappiness.tsx:29` (last one dies with D8) | medium | 4(e) — fix the real type instead of suppressing
| D16 | `docs/` exists but no user-facing README of what is/isn't implemented | — | low | 4(e) |
| D18 | **closed** (`02d9a6c`): the screen now hashes the bytes in front of it and looks for the digest in the journal; the vocabulary, the case-insensitivity and the `getProof()`-only notion of "anchored" are asserted by harness group G. The AI document-analysis path in the same file is untouched - that one is a legitimate use of the model. | `geminiService.ts:229` (was) | **high** | 4(e) → PR #4 |
| D19 | **closed** (this PR): mechanism claims on the pages a user can actually reach - `About` (unreachable, and therefore invisible to every earlier liveness-filtered census) and the landing page's badge. Fixed by re-labelling, and guarded by F's render of `/about` + H's enlarged vocabulary. The copy's old escape hatch ("Statistics shown are illustrative") is *not* a fix and was deleted rather than kept: a disclaimer next to a fabricated number is the number. | `about/AboutStats.tsx:39-67`, `about/AboutTech.tsx:52`, `about/AboutCTA.tsx:96`, `LandingPage.tsx:98` (all pre-fix) | high | PR #4 |
| D20 | **the only live intake writes nothing to the ledger.** `CitizenComplaint.handleSubmit` sleeps two seconds, mints a random CNR and shows a success panel; the sole `kind:'CASE'` writer is `akhandLedger.addBlock`, which no reachable citizen screen calls. Three live readers do call `listCases` (police `EvidenceLocker.tsx:151`, `ChargeSheetGatePage.tsx:88,122`, judge `CaseChainOfCustodyPage.tsx:66,197,205`), so a citizen's complaint and an officer's evidence list can never meet. Spec locked: one `addBlock` call with `id` from `crypto.randomUUID?.()` and a documented non-crypto fallback, `incidentDate` never omitted (`readCase` falls back to `filingDate`, which flips `forensicInterlock.ts:37`'s BNS commencement guard for a pre-2024-07-01 incident - the same category as D18 but with legal effect), `applicableLaw` deliberately absent, and `appendEvidenceRecord` explicitly not used for cases. The receipt prints `recordIndex` / `leafDigest` / `persisted` and says plainly that nothing reached a police station. | `src/personas/citizen/pages/CitizenComplaint.tsx:140-148` | **high** | PR #5 commit 1 |
| D21 | **open, needs your decision.** `chatWithNyayabot`'s system instruction scopes NYAYABOT to "Social Sciences, History, Geography, and Political studies or civics" and tells it to decline anything else - so the assistant on the citizen, police and judge sidebars refuses legal questions. It is not a new bug: the instruction had been sitting outside `config` under a `@ts-ignore` that claimed the SDK types were stale, and removing that suppression in `e3642d9d` is what made it take effect. The About page now says so plainly rather than hiding it. Either widen the instruction (and say what it may not do - invent citations) or move the bot out of the personas and label it a study aid. | `geminiService.ts:187` | medium | decide |

## 14. What I need from you (every answer changes what I write first)

1. **Merge PR #2 (Block 3) now?** CI is green and GitHub says MERGEABLE; your standing rule is that you press merge. If it merges first, I re-sync this branch and Block 4 builds on the real thing. If you'd rather I merge it, say "merge PR 2". *(Recommend: merge now — 4(a) is much easier with `ledgerRecords.ts` present.)*
2. **Do you authorise the hygiene commit** — `git rm --cached .env dist`, `.gitignore` += `.env`, `node_modules/`, `dist/`, plus a `.env.example`? It touches 22,992 tracked paths and is the single biggest diff you will ever approve here. *(Recommend: yes, as its own commit, before any other work. And rotate the key yourself first — that's the part only you can do.)*
3. **Do we rewrite git history** to remove the leaked key (force-push `main`)? The repo is public (`gh repo view --json isPrivate` → `false`), so if that 24-char value is a live key the answer is yes regardless of preference — otherwise it stays fetchable forever at `63f0ba64:./.env`. Confirm before I touch shared refs.
4. **Order of the rest** — my recommendation: D0 hygiene → 4(e) truthfulness + no-key resilience → 4(a) Case unification (Rev 7 doc is ready) → 4(new) IndexedDB default → 4(purge) dead islands → 4(c) locale lazy-load → 4(b) crypto-js. Do you want that, or do you want the demo to look finished before it is correct?
5. **Is this a demo or a product?** If a demo: strip auth pretences, keep localStorage, delete the nationals island. If a product: we need a server decision (Express/Fastify + Postgres + object storage, and a real anchoring target) and the KB grows a whole backend section — say which.
6. **Auth policy** — (a) keep the honest role picker and rename it "switch perspective", removing any security implication; (b) real client-side password hashing + a server; (c) delete auth and make the four personas public. *(Recommend (a) for a demo, (b) only with a server.)*
7. **Nationals subtree** — 4 live files out of 106. Keep-and-unify, or delete the whole `src/features/nationals/` and its route at `App.tsx:83`? *(Recommend: delete; it is a near-copy of `features/main` and it is what makes the type-unification 3× the size.)*
8. **`QuantumFingerprinting` / `QuantumHashProof`** — rename to what they do ("Document integrity" / "Ledger verify"), or delete? One of them renders a hardcoded demo case. *(Recommend: rename `QuantumHashProof`'s content into the judge `HashVerifier` journey and delete the demo route.)*
9. **About page** — the honest tech disclosure (`about/`, 8 files / 1,426 lines) is unreachable while `tab_about` still labels a tab. Wire it into a route or delete it? *(Recommend: wire it — it is the cheapest credibility win available.)*
10. **Languages** — cut to `en`+`hi` (+ the 3 typed regional ones), or widen `Language` to all 23? Cutting saves ~4,000 lines from the entry chunk. *(Recommend: `en`,`hi`,`ta`,`te`,`gu`,`bn`,`mr` — whichever you can actually demo — and lazy-load the rest.)*
11. **Browser smoke tests?** Adding Playwright for three journeys (citizen files → police hashes → judge verifies) is the only thing that would have caught §7's dead-file sweeps earlier. Cost: +devDeps, +CI minutes, and it fights `node_modules`-in-git until D2 is fixed. *(Recommend: yes, after D0.)*
12. **IP/legal track** — the dossier says your publication record matters: the Indian grace period does **not** cover hackathon or social posts (only s.29/30/31/32, with s.31 requiring a Central-Govt-notified exhibition). Have you published anything? Do you want a provisional drafted around invention A (TEE-sealed statutory certificate + Merkle-batched anchor + offline proofs)? *(Recommend: yes, and stop publishing until it's filed.)*
13. **Document ownership** — the Block 4(a) handoff doc lives on your machine (`C:/Users/sasib/…/block4a-handoff.md`) and has needed 7 revisions of my read-only checking. Want me to move it into the repo (`docs/PLAN_4a.md`) so the next session reads it from `HEAD` instead of from you? *(Recommend: yes.)*
