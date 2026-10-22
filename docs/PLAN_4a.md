# Plan 4(a) — one `Case` shape, without breaking the gate that checks the dead files

**Status: the plan, not the work.** This file is written on `arena/09a197cb-nyayasahayak-shroff` so the
session that executes 4(a) reads it from `HEAD` instead of from a chat window. It changes no code. If
you are the model doing 4(a): the numbers below were measured, not estimated, and every one of them
is reproducible with the two commands in §1 — re-run them before you touch a type, because if PR #5
(or the purge, or a locale split) has landed since this was written, the counts have moved.

Why a plan document exists for this block and no other: 4(a) is the only block in the programme where
the *compiler* is the adversary. `tsc --noEmit` typechecks all of `src/`, including the ~98 unreachable
files, so a change to a shared type is a change to code nobody runs — and a red gate on dead code
still blocks the merge. Every other block can be done by editing the live path. This one has to be
done by deleting or converting the dead path in the same breath.

---

## 1. The measurement, and the only tool you can trust for it

```
node tools/resolve-importers.mjs                          # census: reachability from src/main.tsx
node tools/resolve-importers.mjs --model src/core/types.ts --symbol Case
```

The tool resolves `@core` / `@personas` / `@shared` / `@types` through the aliases it reads out of
`vite.config.ts` **and** `tsconfig.json` (and fails `--check` if those two ever disagree), resolves
relative specifiers against the importing file's own directory, treats `React.lazy(() => import(…))`
as the real edge it is, strips comments before searching, and defines *live* as reachable from
`src/main.tsx` by BFS.

Do not use `grep -rl` for any of this. Four audits of this repository used grep for it and four got
different wrong answers: the aliases hide 11 live files from a relative-path pattern; two different
files are named `core/types.ts`; `'../types'` means four different modules depending on where the line
sits; and the lazy-import form hides every admin route. `src/features/main/types.ts` is imported by 15
files, 12 of them live — a grep for `from '../types'` finds a third of that and none of the aliases.

Baseline at the time of writing, on `arena/09a197cb-nyayasahayak-shroff` after D18 and Q9 landed:

| | |
|---|---|
| files under `src/` | 229 (56,464 lines) |
| reachable from `src/main.tsx` | 131 |
| unreachable | 98 (19,611 lines, 34.7 % of `src/`) |
| unresolved first-party specifiers | 0 |
| largest unreachable island | `src/features/nationals/` — 50 files, 12,263 lines |

After the nationals purge (PR #7), recomputed the same way with `node tools/resolve-importers.mjs`:

| | |
|---|---|
| files under `src/` | 171 (42,816 lines) |
| reachable from `src/main.tsx` | 124 |
| unreachable | 47 (6,674 lines, **15.6 %** of `src/`, down from 34.7 %) |
| unresolved first-party specifiers | 0 |
| largest unreachable island | `src/features/main/` - 13 files, 2,468 lines, inside a directory that is 32 files *live* |

And after D28 (PR #9), same command:

| | |
|---|---|
| files under `src/` | 158 (40,348 lines) |
| reachable from `src/main.tsx` | 124 (unchanged - a purge that changes nothing live) |
| unreachable | 34 (4,206 lines, **10.4 %** of `src/`) |
| unresolved first-party specifiers | 0 |
| `src/features/main/` | 32 files tracked, **all 32 live**: the directory left the census |
| after D29 | 151 files (39196 lines) / 123 reachable / 28 unreachable (3159 lines, 8.1 % of `src/`) — and `reachable` fell to 123, because D29 deleted a *live* screen rather than a dead file |
| after D33 | 150 files (38,629 lines) / 121 reachable / 29 unreachable (3,541 lines, 9.2 %) — `reachable` fell by 2: the sandbox was routed, and its only consumer of `CognizanceReview.tsx` was itself |
| at 4(a)'s base (`91f34ee`, PR #10 merged) | 150 files (38,648 lines) / 121 reachable / 29 unreachable (3,541 lines, 9.2 %) — the +19 lines since D33 are three hedge paragraphs in live JSX, so no file count moved. Re-run both §1 commands before the first edit; §6 was measured on exactly this commit. |
| after 4(a)-iii | 141 files (37,946 lines) / 121 reachable / 20 unreachable (2,848 lines, 7.5 %) — the 9-file `src/core/types.ts` closure plus golden `AdjournmentRisk` (8 lines of `src/types.ts`). 693 resolver-lines removed (684 by `wc -l`: the resolver counts +1 per file, so the two totals differ by exactly the file count). `reachable` unmoved at 121, which is the signature §6.3 predicted for a purge that touches nothing live. |
| after 4(a)-i | 141 files (38,022 lines) / 121 reachable / 20 unreachable (2,848 lines, 7.5 %) — +76 lines in `src/` and no file count moved: -i changed three files' bodies (`legacyCaseAdapter.ts` +49/-6, `ChargeSheetGatePage.tsx`, `App.tsx`) and two gate files (`statute_tests.mjs` 14→18 tests, `ledger_repro.cjs` claim 32). Entry chunk 624,410 B → 625,108 B (+698 B of refusal copy), 34.89 kB under the D35 ratchet. |
| after 4(a)-ii-b + D39 | 141 files (37,731 lines) / 121 reachable / 20 unreachable — −291 lines. `src/features/main/types.ts`: module importers 12 → 11, `Case` namers 8 → 7 (mockData no longer names the legacy model at all). Total JS 2,497,924 → 2,497,361 B (−563 B) across 92 chunks: the fixture block had been tree-shaken out of the bundle long ago, so this commit's win is in the source model, not the payload. |
| after 4(a)-ii-a (achievable half) | 141 files (37,774 lines) / 121 reachable / 20 unreachable — `CaseRelationshipMapper` is golden and `geminiService` receives golden data through a refusal-handling boundary. Module importers 11 → 10; the resolver's cross-module *file* census says `Case` namers 7 → **6**, not the predicted 5: `geminiService` names golden `Case` but still imports three non-case types from the legacy module, so the module remains live. |
| after 4(a)-iv(a) | 141 files (37,857 lines) / 121 reachable / 20 unreachable — a `GateCaseRow` union makes every undated charge-sheet case an explicit disabled row; `LedgerEntry.data` is `unknown`, so a journal payload must be narrowed before a screen reads it. No persistence key changed in this commit. |

All three blocks stay: the first is the baseline this plan was written against, and quietly restating
history as the current number is how a plan stops being falsifiable. One caution while reading them:
the file counts and the reachability split are the load-bearing numbers. The total line count is not -
it moved by 3 lines while the prose above was being written, because comments inside `src/` are
counted too. Quote it from a fresh run, or quote a file count instead; that is also why no gate in
this repository hardcodes it.


## 2. The three shapes

| file | shape | importers | live | naming `Case` | live namers |
|---|---|---|---|---|---|
| `src/types.ts` | **golden** — 19 fields, several required | 9 | 4 | 6 | 3 |
| `src/core/types.ts` | strict subset, missing 6 golden fields (4 required: `adjournmentsCount`, `incidentDate`, `isZeroFir`, `applicableLaw`; 2 optional: `judgeId?`, `zeroFirTransferStatus?`) | 7 | **0** | 3 | 0 |
| `src/features/main/types.ts` | legacy intake — `caseNumber`, `petitioner`, `invokedActs`, `title`, `complexityScore`, `pii` | 12 | **12** | 8 | **8** ← all live, 0 dead namers |

Re-measured after D28 (PR #9), which deleted two more importers of the legacy model and its one
dead namer: `src/features/main/types.ts` is now imported by 12 files and **every one of them is
live**, so that model's migration no longer has a dead file holding its `tsc` hostage. The other two
rows are untouched by D28 - `src/core/types.ts` included, again, because its importers were never in
either deleted directory. Take the numbers from `--model` anyway; this sentence is already older than
the command that produced it.

The set that decides your commit boundaries is the union of the three **unreachable** namer lists:
**6 files**. It was 16 when this plan was written: the nationals purge took 8 of them, and D28
(PR #9) took `src/features/main/MainApp.tsx`, which was the only dead namer the legacy model had.
Get it with

```
for m in src/types.ts src/core/types.ts src/features/main/types.ts; do
  node tools/resolve-importers.mjs --model $m --symbol Case \
    | awk '/unreachable - each/{f=1;next} f&&/^    /{print $1}'
done | sort -u
```

That is not a number to argue with and it is not a number to keep. Its history is the argument for
re-running it instead of remembering it: 17 when §8 of `PROJECT_KNOWLEDGE_BASE.md` first recorded
the set, 16 after PR #4 deleted `src/features/nationals/components/DocumentAnalysis.tsx`, and 7
after the purge deleted the subtree. A directory-based listing missed 2 of the 16
(`src/features/nationals/constants/mockData.ts`, 7 `Case` literal constructions, and
`src/features/nationals/modules/citizen/VoiceFilingInterface.tsx`, 3) because they sat inside
directories whose *other* files were live - which is exactly why the census is taken with
`--model` and not with `grep -r`.

The 6 that survive are the entire scope of this block. Re-measured after D29: the set did not shrink, but
`src/components/JudgeDashboard.tsx` lost the fabricated panel it was rendering (197 -> 195 lines) and the
golden model lost a live importer, which is why its row above now reads 9 importers / 4 live:

```
src/components/CaseDetailsPanel.tsx
src/components/CaseQueue.tsx
src/components/JudgeDashboard.tsx
src/modules/judge/JudgeDashboard.tsx
src/modules/judge/features/CaseTriage.tsx
src/personas/judge/components/DraftJudgmentPanel.tsx
```

## 3. The rules for this block

1. **The golden shape is consumed differently, never edited.** `src/types.ts`'s `Case` keeps its
   fields. That constraint is what keeps two dead golden namers (`components/CaseDetailsPanel.tsx`,
   `components/CaseQueue.tsx`) green while everything around them moves. D29 left one more thing here on
   purpose: golden `AdjournmentRisk` is now exported to nobody, because the screen that read it was
   fabricated and was deleted rather than retyped. An unused *type* export is not a `Case` field, so it is
   fair to delete in this block - but the commit message has to say the reason is a defect, not a tidy-up.
2. **A type edit and the death of its dead namers are one commit.** Never two. `tsc` is the whole
   reason, and CI runs `tsc`.
3. **`legacyCaseAdapter.ts` is 4(a)'s file, not anyone else's.** It has **3** importers: 2 live
   (`App.tsx`, and `personas/police/pages/ChargeSheetGatePage.tsx` whose `toGoldenCase` at `:93`
   converts *workspace state*, not a journal record) and 1 orphan (`src/components/JudgeDashboard.tsx`,
   which is one of the 6 above, so it survives into this block). `applicableLawFor` is exported only
   from it (`:22`) and its only non-internal consumer is that same orphan - which is 4(a)'s file to
   delete, so the *call site* retires here and in no purge: D28 removed 15 files and did not
   touch either number - 3 importers before this commit, 3 after. What did move it was nobody's doing:
   the "4 importers, 2 orphans" this rule carried from PR #4 was already false when the purge arrived,
   and this sandbox is a `--depth=1` clone, so not one commit between here and PR #4 can be named as
   the culprit. That is the whole argument for re-measuring instead of quoting:
   `node tools/resolve-importers.mjs --model src/core/workspace/legacyCaseAdapter.ts`.

   **The one thing this rule used to get wrong, corrected on measurement:** it ended "when the orphan
   dies, the export goes with it in the same commit", and that is not available. Dropping `export` from
   `:22` while leaving everything else alone was tried on the base commit: `tsc` fails with 2 errors
   (TS2459 at `components/JudgeDashboard.tsx:9` — so if the export does go, the caller is deleted
   *first*, inside the same commit, never one commit earlier), and the statute suite fails 3 of its 14
   tests with `applicableLawFor is not a function`, `npm test` exit 1 — because
   `tools/statute_tests.mjs:41` destructures `{ applicableLawFor, toGoldenCase }` out of the bundled
   adapter to test the commencement boundary directly. That is D32 living inside this plan: `tools/` is a
   consumer the file graph cannot show, so "its only non-internal consumer is the orphan" is true of
   `src/` and false of the repository. **Keep the export.** It is the surface the statute test needs, and a
   function that is exported, called internally, and pinned by name by a suite is not a stray export — it
   is the module's contract with the one test that checks Art. 20(1). If a future pass wants it internal,
   the suite changes in the same commit and says which of its three tests moved into `toGoldenCase`.
4. **Discharged as written: the nationals subtree died in the purge (4(purge)), not here** (PR #7).
   4(a) never migrated `src/features/nationals/core/types.ts` and never reconciled it; the file went
   with its directory, which is what this rule asked for. One number in the original wording was
   wrong, and the correction is the lesson rather than the detail: the subtree held **6** live
   files, not 4, and all six hung off a single edge - `App.tsx`'s
   `React.lazy(() => import('./features/nationals/modules/judge/JudgeDashboard'))`. A grep for
   importers outside the directory returns 1, because the other five were reached transitively; only
   the resolved graph shows that deleting that one line is the whole job. Scope decision, not
   oversight: reconciling a near-copy of `features/main` and then deleting it is work the reader
   cannot see and the diff cannot justify.
5. **Journal rows are heterogeneous and `readCase` is the only reader.** `src/shared/utils/ledgerRecords.ts`
   derives `incidentDate` as `data.incidentDate ?? data.filingDate` and deliberately stops there — no
   `today()` fallback — because that date decides whether the BNSS s.176(3) videography mandate and
   `forensicInterlock.ts`'s BNS commencement guard fire. If 4(a) makes `incidentDate` required on the
   golden type, that fallback becomes a lie about the record and has to be deleted in the same commit,
   with the harness claim that pins it rewritten to say what is now true.
6. **D20 lands before you, and changes what `listCases` returns.** Until PR #5, no reachable screen
   writes `kind:'CASE'`, so every consumer of `listCases` has only ever seen an empty journal. After
   it, a citizen's filing appears there with the fields `addBlock` writes — which means 4(a) must not
   be written against "the journal has no cases in it". Check with
   `node tools/ledger_repro.cjs` (group F renders the pages on an empty store on purpose; that fixture
   is not a licence to assume emptiness in the app).
7. **The twin trap, including how this document mis-stated it.** Two files are named
   `DraftJudgmentPanel.tsx`: `src/components/` (routed, and the terminal consumer of
   `toGoldenCase(selectedCase)`) and `src/personas/judge/components/` (unreachable, one of the 7
   above). Across all of git history the name has **three** paths, not the four this rule claimed:
   `src/components/`, `src/personas/judge/components/`, and `src/features/nationals/components/`
   (deleted by 4(purge)). `src/features/main/components/DraftJudgmentPanel.tsx` never existed - the
   4 was a `VoiceFilingInterface.tsx`-shaped fact (three copies, all now gone: two deleted by name,
   one with its directory) copied onto a second filename without listing that filename. The wrong
   number stays visible here on purpose, because the fix is not the correction but the procedure:
   before editing a duplicated basename, `git ls-files | grep <name>` for the tree and
   `git log --all --name-only --format= | sort -u | grep <name>` for the history you are about to
   narrate. A count is a fact about one snapshot; prose about counts starts rotting in the commit
   that makes it true.

## 4. Sequence

Each step is a commit, each commit keeps all four gates green (tsc 0 · `npm test` ·
`node tools/ledger_repro.cjs` · `npm run build`), and the ancestry check runs before each commit.

- **4(a)-i — make the adapter total, in tests first.** *(§6.1 revises what total means: 15 of 15 required fields are already written, so the work is not filling gaps — it is stopping the invention of a date and reading a field the adapter ignores.)* `toGoldenCase` gets the missing-field behaviour
  pinned by node tests: which golden fields it can fill from a legacy object, which it must refuse to
  invent, and what it does with a journal row whose `sectionsInvoked` is a string rather than an array.
  No consumer changes yet. If a field cannot be derived, the adapter says so by type, not by default.
- **4(a)-ii — move the live namers off `features/main/types.ts`** (the 8) *(§6.2 measured: 4 can move today, 3 with renames, and 1 cannot — the intake screen reads five legacy fields the golden shape has no home for.)* by importing the golden type
  and calling the adapter at the boundary. This is the bulk of the block. Keep each page's own props
  typed; only the *shared* shape moves.
- **4(a)-iii — retire `src/core/types.ts`'s `Case`** *(§6.3: run this step first — it is the only one needing no decision.)* (re-measured after D33: 7 importers, 0 live; 3 dead
  namers, 0 live). The plan used to say "delete the three dead files that name it, then the type", which
  is **4 files and is wrong**: `--model` lists four more dead files importing the module without naming
  `Case` (`shared/components/DecisionStream.tsx`, `shared/components/VisualEvidencePanel.tsx`,
  `shared/services/documentAnalysis.ts`, `shared/services/observabilityService.ts`) - `tsc` typechecks
  them, so they cannot be left holding a deleted import. And the fixpoint is 9, not 8: deleting those 8
  strands nothing, but leaves **one importer outside the set**, `src/core/layout/DashboardLayout.tsx:5`,
  which renders `<DecisionStream />` at `:110` - and is itself unreachable with 0 importers, so it goes in
  the same commit. Measured with the closure rule used for D28: **9 files, 693 lines (the resolver's rule,
  not `wc -l`), 0 live members, 0 importers from outside, 0 files newly orphaned**, and it empties
  `src/core/layout/`, `src/modules/judge/` and `src/shared/services/`. That is still pure subtraction, so
  it remains a fair warm-up - but it is nine files, and "three" was the number to fix before running it.
  Naming trap for whoever executes this: **two** files are called `DraftJudgmentPanel.tsx`, and they are
  not twins - `personas/judge/components/` (159 lines, dead, imports `core/types`) belongs to this step,
  while `src/components/` (201 lines, live, imports the golden `Case`) belongs to 4(a)-ii. `grep -ln
  DraftJudgmentPanel` finds both; the import line tells them apart.
- **4(a)-iv — make `legacyCaseAdapter` the single boundary** and delete the per-page coercions that
  grew around it (`complainant ?? petitioner`, `cnrNumber ?? caseNumber`, `sectionsInvoked ??
  invokedActs`) so the fallbacks live in one file with one test. Note the trap in that list:
  `readCase`'s `filingDate` fallback is not the same as the adapter's, and the two must not be merged
  by a refactor that looks like tidying.
- **4(a)-v — satisfied by PR #7.** The fourth shape was deleted rather than migrated, and the KB
  records it. Nothing in this block should grow to cover a file that no longer exists; if a review
  note asks why `src/features/nationals/core/types.ts` is missing from the diff, the answer is that
  4(purge) arrived first, exactly as this plan scheduled.

## 5. What "done" means

`--model` reports 0 live namers for `src/features/main/types.ts` and `src/core/types.ts`; the four
files above are the whole census; `listCases` consumers and `EvidenceLocker` read the same object type;
`node tools/ledger_repro.cjs` still ends at the count its header claims, with any claim rewritten to
match what became true (a claim that had to be *weakened* to pass is a regression, and says so in its
own text); and the census line for unreachable files goes **down**, never up. As of D34 the first half of that sentence is no longer
a convention: claim 31 compares the harness's own `check(` call sites against the number printed on the About page and the numbers in
`README.md` and this file's sibling document, so a claim deleted mid-flight fails a gate instead of improving one. If 4(a) ends with more
dead code than it started with, the migration left shims behind — find them before the PR does.

---

## 6. Revision 8 — the walk-through, measured on `91f34ee`

Written after PR #10 merged, on the exact commit 4(a) starts from, by running the two §1 commands plus a
`--model` call per question and one reproduction against the *bundled* adapter. Nothing in this section is
carried over from the earlier revisions of this file; where it disagrees with §2-§5, §6 is the measurement
and §2-§5 are the history.

### 6.0 Two things to know before quoting a number from here

- A fresh clone has no `node_modules`, and `tsc` missing is *reported as* a type error. `npm ci` first. This
  bit the first block of PR #10; the fix is to look at the exit before believing the diagnosis.
- `npm test` is `node --test tests/*.test.ts && node tools/statute_tests.mjs`. The line most readers stop at
  (`# pass 63 / # fail 0`) is the TAP summary of the **first** command; the statute suite prints its own
  `=== SUMMARY: 14 passed, 0 failed ===` below it. During this walk-through the TAP summary said 63/0 while
  the suite said **3 failed** — and `npm test` still exited 1, so the gate is honest, but the *first* summary
  you see is not the verdict. Read the exit code, not the top line.

### 6.1 Question 1 — 4(a)-i, adapter totality: it is already total, and that is the problem

`src/core/workspace/legacyCaseAdapter.ts`, 65 lines, `toGoldenCase` at `:45`, 3 importers (2 live).

| golden field (19) | written from | class |
|---|---|---|
| `id` `caseType` `summary` `filingDate` `respondent` | same-named legacy field | derived |
| `cnrNumber` `complainant` `sectionsInvoked` `caseNotes` `urgency` | `caseNumber` `petitioner` `invokedActs ?? []` `notes ?? ''` `urgencyFor(priority)` | rename, two with a default |
| `applicableLaw` | `applicableLawFor(incidentDate)` | derived |
| `incidentDate` | `legacy.filingDate`, else today | **fabricated date** |
| `status` | `'FILED'` | **literal** |
| `adjournmentsCount` | `0` | **literal** (see D30) |
| `isZeroFir` | `false` | **literal** |
| `nextHearingDate` `lawyerId` `judgeId` `zeroFirTransferStatus` | not written | 4 optional, left undefined |

All **15 required** fields are written and the 4 optional ones are legitimately absent, so "make the adapter
total" is not the work — the work is that three fields are *invented* and one is invented **dangerously**.

**The fallback to today inverts the fail-safe the suite pins.** `applicableLawFor` fails to `IPC` for
`undefined` and for an unparseable date (three statute tests in section A assert exactly that, and Art. 20(1)
is why). But `toGoldenCase` never lets `undefined` reach it: a record with no filing date gets *today*, which
is after commencement, so the app answers **BNS**. Reproduced against the bundled adapter on this commit:

```
applicableLawFor(undefined)                  -> IPC        (the fail-safe, working)
toGoldenCase({…no filingDate…}).incidentDate -> 2026-10-19  (today)
                                   .applicableLaw -> BNS    (unknown date ⇒ newer, harsher code)
toGoldenCase({…filingDate 2024-05-01…}).applicableLaw -> IPC  (correct)
incident 2024-06-28 filed 2024-07-05               -> BNS    (wrong: conduct predates 01-07-2024)
```

The substitution `incidentDate := filingDate` is *known* debt — `tools/statute_tests.mjs:97-100` says so in a
comment and defers it to Block 3 (the intake form should capture the incident date). The `|| today` half is
not mentioned anywhere, is not tested, and moves in the opposite direction to every other guard in this file:
where a date is missing, silence should mean "the older, more lenient code", and it currently means the
reverse. That is the one change in 4(a) with a *legal* consequence, and it belongs in -i, before any consumer
moves onto the shape.

**`lastHearingDate` is required in the legacy shape and never read**, while `status` is invented as `'FILED'`:

```
toGoldenCase({… lastHearingDate: 2025-01-10 …}).status -> FILED
```

A case with a recorded hearing is reported as never having had one. `status: legacy.lastHearingDate ? 'HEARING'
: 'FILED'` fixes it with **no model change** — golden already declares `'HEARING'` — and turns one of the three
inventions into a derivation.

**Five legacy fields have no golden home at all:** `title`, `lastHearingDate`, `complexityScore`, `pii`,
`userId`. (Not `caseNumber`/`petitioner`/`invokedActs`/`notes`/`priority` — those are mapped under new names;
the distinction matters because §6.2 turns on it.) Dropping `pii` and `userId` on the way into a judge-facing
shape is a design decision, not a detail: the golden shape has no field that says "this record belongs to the
citizen who filed it", and `JudgeBoard`'s Blind Mode hides PII that the golden path never carries.

**The decision -i needs, and the recommendation.** How should `toGoldenCase` behave when a field cannot be
derived?

| | option | consequence |
|---|---|---|
| **A** | **refuse**: return a result object — `{ ok: true, case }` or `{ ok: false, missing, reason }` — and the two call sites (`App.tsx:257`, `ChargeSheetGatePage.tsx:93`) show "cannot be presented as a case: no incident date recorded" | golden `Case` untouched, so rule 1 holds; the failure is visible where it happens; costs two call sites and a new UI state |
| B | widen golden: make `incidentDate` nullable | every live reader inherits a null-check; rule 1 forbids editing the shape in this block; pushes the burden from the writer to every reader |
| C | keep the today-fallback, document it | the fail-safe stays inverted and the next person reads the comment as permission |

Recommend **A**, limited to what cannot be derived (`incidentDate` when there is no filing date), with
`status` moved from invention to derivation and `adjournmentsCount: 0` / `isZeroFir: false` *kept as literals
but pinned by a test that says they are defaults, not measurements* (they are the D30 story: the store has no
adjournment kind, so 0 is "nothing recorded", and the moment a judge screen calls it a count, the label lies).

Tests -i writes first, in `tools/statute_tests.mjs` section B (where the adapter's contract already lives):
`a record with no filing date does not get the newer code`, `a missing date refuses instead of defaulting`,
`a case with a last hearing is not reported as never having sat`, `the two literals are defaults and say so`.
Each one FAILs before the change and PASSs after; that is the whole of -i.

### 6.2 Question 2 — the six dead namers, and why 4(a)-ii is really two steps

The 6 live+dead namers of golden `Case` (`--model src/types.ts --symbol Case`): 3 live —
`components/DraftJudgmentPanel.tsx`, `core/workspace/legacyCaseAdapter.ts`, `services/akhandLedger.ts` —
and 3 dead — `components/{CaseDetailsPanel,CaseQueue,JudgeDashboard}.tsx`.

The dead three close to **5 files / 649 lines** (`src/services/vidhikRAG.ts` 182 and
`src/components/GraphVisualizationPanel.tsx` 83 have no importer outside that set), 0 importers from outside,
0 live members — pure subtraction, and it is what the plan's -ii calls "the dead half". `vidhikRAG` is the
RAG service, `GraphVisualizationPanel` the graph view: neither is *needed* by 4(a), both are currently kept
alive only by files 4(a) deletes, so they go with them rather than becoming a new island (D33's
`CognizanceReview` is the counter-example: a stranded file worth keeping is *kept and registered*; a stranded
service nobody can mount is deleted with its last caller — the difference is stated in the commit).

For the live half, the measured question is not who *imports* `features/main/types.ts` but who reads a field
that golden does not have:

| live namer of the legacy `Case` | legacy-only fields it touches | can move to golden? |
|---|---|---|
| `core/context/WorkspaceContext.tsx` | none (only `id`) | **yes** |
| `features/main/components/CaseRelationshipMapper.tsx` | none | **yes** (renames only) |
| `features/main/services/geminiService.ts` | none | **yes** (renames only) |
| `core/workspace/legacyCaseAdapter.ts` | `title` (doc only) | it is the bridge — it *must* name both |
| `features/main/components/JusticeTimeline.tsx` | `title` ×4, `lastHearingDate` ×3 | no — needs 2 golden-absent fields |
| `features/main/services/piiService.ts` | `title` ×3, `pii` ×2 | no — PII has no golden home |
| `features/main/constants/mockData.ts` | `title` ×16, `lastHearingDate` ×16, `complexityScore` ×16, `pii` ×9 | no — it *produces* legacy instances |
| `features/main/components/CaseIntakeTriage.tsx` | all five (`title` ×18, `complexityScore` ×5, `lastHearingDate` ×4, `pii` ×2, `userId` ×1) | no — it is the intake form |

So 4(a)-ii splits, and the split is the finding: **-ii-a** moves the four files whose needs golden satisfies,
which is ordinary migration work; **-ii-b** is blocked behind the field decision in §6.1/§6.5 — either the
golden shape absorbs `title`/`complexityScore`/`pii`/`userId` (rule 1 forbids in this block, so it is a
*ruling*, not a step) or the intake screens keep the legacy type permanently and the adapter stays the only
place the two meet. **Do not "complete" -ii by inventing values for `complexityScore` in a golden-typed mock**:
that is D29's failure mode wearing a type system.

That changes what §5 means by done. Its current test — `--model` reports 0 live namers for
`features/main/types.ts` — is unreachable without the field decision, and forcing it would mean fabricating
fields to satisfy a compiler. The honest version: after 4(a), `core/types.ts` has **0 namers anywhere** (it is
gone), golden `Case` has **0 dead namers** (the 5-file set is deleted), and every *judge-facing* consumer reads
golden. `features/main/types.ts` may keep 4 live namers, and §5 must say so out loud rather than leaving a
done-criterion that can only be met by lying.

### 6.3 Question 3 — 4(a)-iii, confirmed, and it goes first

Re-run on this commit with the D28 closure rule: seeds = `src/core/types.ts` + its 7 importers; fixpoint adds
`src/core/layout/DashboardLayout.tsx` (its own importers: 0 — the layout that renders `<DecisionStream />` at
`:110` is itself unreachable, which is how the plan's "three dead files" grew to nine).

```
9 files, 693 lines, live members 0, importers from outside the set: none, newly orphaned: 0
```

Predicted census: **141 / 121 / 20** — `reachable` unmoved at 121, the correct signature of a purge that
touches nothing live (contrast D29 and D33, where `reachable` *had* to fall). Directories left with no files
of their own: `src/core/layout/`, `src/modules/judge/`, `src/modules/judge/features/`, `src/shared/services/`.
`src/core/` keeps its subdirectories; only `src/core/types.ts` sat directly in it, which is worth saying
because a `find`-based check would report `src/core` as emptied and be wrong.

Three things ride with it, all measured:
- **golden `AdjournmentRisk` is deleted in the same commit.** After -iii the only definition is
  `src/types.ts:38`, named by nobody; `App.tsx:303` mentions the *panel's* name inside the comment explaining
  the deletion, and that comment stays. The reason is a defect, not a tidy-up, exactly as rule 1 requires:
  the type is the schema of the invented assessment D29 removed, and four of its fields
  (`riskLevel`, `historicalRate`, `casesHandled`, `predictedDelayMonths`) are *literally* claim 30's
  `SCORE_KEY` list. Leaving it in the live model hands the next contributor a fabrication schema with a name
  that sounds like a feature.
- **`applicableLawFor`'s export stays** — §3 rule 3, corrected on measurement above.
- **not in 4(a)**: `src/personas/police/pages/StationDashboard.tsx` and `src/types/pilot.ts` (98 lines, its one
  importer) carry a *third* `UserRole` and are a closed 2-file island. Pure subtraction, but on the purge
  track; listed here so a `grep UserRole` during this block does not mistake it for stragglers of -iii.

### 6.4 Question 4 — how the golden `Case` is consumed, and what changes when the dead shapes go

`--model src/types.ts` today: 9 importers, 4 live. The four, and what they actually read:

| live importer | reads | after 4(a) |
|---|---|---|
| `components/DraftJudgmentPanel.tsx` | `cnrNumber` `complainant` `respondent` `summary` `filingDate` `sectionsInvoked` | unchanged; it is *the* judge panel the shape exists for |
| `core/workspace/legacyCaseAdapter.ts` | mints it | the only writer in the app, by design |
| `services/akhandLedger.ts` | `status` (1 mention) + `data: any` on `LedgerEntry` | `LedgerEntry.data` is `any` at `src/types.ts:55` — the one hole that lets a journal row be *called* a Case without being one; worth closing in -iv, because it is why `toGoldenCase(entry)` at `ChargeSheetGatePage:93` typechecks against data the store never validated |
| `personas/judge/pages/HashVerifier.tsx` | **nothing of `Case`** — it imports `LedgerEntry` from `src/types.ts` and mentions `Case` 0 times (`grep -cE '\bCase\b'` = 0) | nothing to migrate, and nothing to delete: the `LedgerEntry` import is load-bearing for its own feature |

That correction is worth keeping in this plan, because it is §3's own warning committed against §6:
`--model src/types.ts` reports **9 module-importers, 4 live**, while the census §2's table carries —
`--model src/types.ts --symbol Case` — is **6 namers, 3 live, 3 unreachable**, and the second is the number
to plan against. The gap is not noise: `HashVerifier.tsx` imports `LedgerEntry` from the same module and names
`Case` 0 times, `GraphVisualizationPanel.tsx` is a dead importer that names it 0 times, and
`vidhikRAG.ts`'s single occurrence is the comment `// Case Node` at `:80` — which is precisely why the resolver
strips strings and JSX text before testing a symbol, and why a bare `grep` still over-reports it by one file.
Planning -ii from the module count would have scheduled migration work in files that have none. By `grep -c`
over `Case\b` the three live namers hold 10 mentions (2 + 4 + 4) and the three unreachable ones 12 (3 + 2 + 7)
— a reminder that both numbers are candidates, and the resolver's 3-and-3 is the authority.

Where the two worlds meet is one screen, and -iv should be written around it: `ChargeSheetGatePage:87` builds
`const cases = useMemo<LedgerCase[]>(…)` from `listCases(records)` **union** workspace cases through
`toGoldenCase`, i.e. journal-first with intake filling the gaps. The per-page coercions -iv consolidates
(`complainant ?? petitioner`, `cnrNumber ?? caseNumber`, `sectionsInvoked ?? invokedActs`) are the same
renames the adapter already performs, which is the argument for moving them into it. Two cautions the
measurement adds: `readCase`'s `filingDate` fallback differs from the adapter's and must not be merged (§4-iv
already says so), and `complainant ← petitioner` is **semantic, not lexical** — a petitioner in a revision is not
the complainant, and a judge reading "Complainant" gets whoever filed the petition. -iv can put the mapping in
one file with one test; it cannot make the mapping true. If the UI label should read *Petitioner or
complainant*, that is a copy change for this commit, since it is the same class as claim 30's hedges.

### 6.5 Question 5 — where the derivation lives, and the truthfulness decisions left open

Post-unification, `applicableLawFor` stays exactly where it is: `legacyCaseAdapter.ts:22`, exported, with
`BNS_EFFECTIVE_DATE` imported from `core/services/forensicInterlock.ts:15` — **one commencement constant for
both the judge panels and the s.176(3) interlock**, which is worth defending deliberately: the day someone
"tidies" the constant into a local copy is the day the two can disagree about which criminal code applies,
and §A of the statute suite pins the number itself (`2024-07-01`) so the copy could not stay invisible for
long.

Open truthfulness items 4(a) must not quietly absorb, each with its own home:
1. `incidentDate := filingDate` (the proxy) → **Block 3** (collect it at intake). -i makes the *missing* case
   refuse; it cannot make a late filing look like a late incident. The plan should say "-i makes the unknown
   unknown" and no more, or the next reader will think Art. 20(1) is solved.
2. `adjournmentsCount: 0` → **D30's feature PR** (an `ADJOURNMENT` ledger kind + writer + its own claim). -i
   pins it as a default in a test so that a future UI cannot present it as a count.
3. `pii` / `userId` dropped at the boundary → belongs with the -ii-b field decision, not with a type move.
4. Day-count ceilings on live screens: the correct rule for s.187(3) is 60/90 **depending on the rank of the
   officer in charge**, and s.193's tiers are 90/180 — so any 4(a) work that renders a ceiling *from real
   data* must take the tier from the record, not from a constant. `JudgeBoard`'s fixture `maxDays: 60` is
   sample data and claim 30's hedge already says so; touching that copy is not 4(a)'s job.

### 6.6 Execution order, with the proof each commit owes

| # | commit | contents | predicted census after | proof that must be in the message |
|---|---|---|---|---|
| 1 | **4(a)-iii — DONE (`2a6d6e2`)** | delete the 9-file closure + golden `AdjournmentRisk` | 141 / 121 / 20 | `--check` before and after; BFS replay with the set removed (0 live lost, 0 orphaned); `--model src/core/types.ts` = 0 importers; `npm test` 14/14 statute tests **unchanged**, proving the export survived |
| 2 | **4(a)-i — DONE (`§6.7`)** | 4 new statute tests, then refusal-for-unknown + `status` derivation | 141 / 121 / 20 (lines move) | FAIL-before / PASS-after per test, pasted; both call sites compile with the union return |
| 3 | **4(a)-ii-a — VOID, see §6.8** | ~~`WorkspaceContext`, `CaseRelationshipMapper`, `geminiService` onto golden via the adapter~~ | — | measured on the merged base: none of the three is an independent move || 4 | **4(a)-iv** | coercions into the adapter, one test; `LedgerEntry.data` typed; label question answered | unchanged | `readCase`'s different fallback documented in the diff; the `LedgerCase` union still the only join point |
| — | **needs your ruling** | -ii-b (the five orphan fields) and the §5 done-criterion rewrite | — | not a commit until decided |

Two rules from §3 apply to all four: a type edit and the death of its dead namers are one commit (rule 2), and
re-measure rather than quote — including this section, which was true when it was written and will be checked
again at every step.

### 6.7 4(a)-i, executed — what landed, and one gate that had to be rebuilt before it was trusted

`toGoldenCase` now returns `{ ok: true; case: Case } | { ok: false; missing: 'incidentDate'; reason: string }`.
No `|| today` survives anywhere in `src/`; the status literal became
`legacy.lastHearingDate ? 'HEARING' : 'FILED'`; `adjournmentsCount: 0` and `isZeroFir: false` stayed literals and
are now pinned by a test that passes them an input claiming `adjournmentsCount: 7` and asserts the answer is still
0, i.e. that the field is a default and never a measurement. `applicableLawFor`'s export was left alone, per the
correction in §3 rule 3. The `statute_tests.mjs` concession comment about the filing-date proxy was **extended, not
deleted** — -i made the *missing* date refuse, the substitution itself is Block 3's, and the comment is the only
place that debt is recorded.

Proofs, both directions, in the commit that shipped them:
- **FAIL before** (tests written first, against the unchanged adapter): `=== SUMMARY: 14 passed, 4 failed ===` —
  refusal, result-shape, `HEARING`, and the pin (whose before-failure is only the missing `.case`, disclosed in the
  test's own comment rather than smoothed over).
- **PASS after**: `18 passed, 0 failed`, `tsc` 0 across the whole project, `npm test` exit 0 with `# pass 63` above
  it, harness `32/32`, `--check` ok, build 0, entry chunk +698 B inside the D35 byte budget.
- **The blast radius was the type system's, not my grep's**: `tsc` reported exactly four errors at exactly two call
  sites, which is the evidence that no third consumer exists.

**Claim 32 needed two attempts, and the first one is the lesson.** Written as "the file that calls `toGoldenCase`
tests `.ok` somewhere", it *passed* against a deliberately broken caller — `App.tsx` still mentions `.ok` in an
unrelated JSX branch, so a file-wide regex was satisfied while the real consumer cast the result straight to a
`Case`. The rule is now per **binding**: every variable assigned from `toGoldenCase` must be guarded within the
statement that follows it, no field may be read off an untested result, and `as any` / `as unknown as` /
`@ts-ignore` in a caller count as the refusal being discarded. Two plants redden it (`as any` escape, and simply
dropping the guard); the restored tree is green. The floor — fewer than two live caller files is a *failure*, not
a pass — is the same defence against a rule that outlives its subjects that claim 31 added for the count.

**One deviation from the ruling, disclosed.** The instruction was to *disable rather than hide* the undatable
cases in `ChargeSheetGatePage`. A greyed row needs a field on the page's `LedgerCase` view type, which is a
view-model change belonging to -iv; what shipped is the auditable half of the ruling — the excluded cases are
**counted aloud by name** under the list ("N cases listed below cannot be gated: no incident or filing date is
recorded… (ids)"), so the s.176(3) denominator never shrinks silently, and the memo returns `{ cases, gateExclusions }`
from one computation so the pair cannot drift apart. -iv should upgrade this to per-row disabled rendering.

Also fixed while here: the pin test read the adapter with a cwd-relative path, which passes under `npm test` and
fails when the file is run from anywhere else — now resolved against `repoRoot`, verified by running the suite from
`/tmp` (18/18).

### 6.8 §6.2 was wrong about -ii, and the reason is worth more than the fix

After -iii and -i merged, the three files -ii-a was going to move were re-checked for what actually
binds them to the legacy shape. **None of the three is an independent move**, for three different
reasons, all of which say something §6.2 did not:

| file | §6.2 said | measured |
|---|---|---|
| `core/context/WorkspaceContext.tsx` | "reads only `id`, can move" | it does not *read* the case, it **owns** it: `allCases: Case[]`, `selectedCase: Case \| null`, `setSelectedCase`, and `readJson<Case[]>` from localStorage. Moving it moves the store, which forces the four blocked files with it |
| `services/geminiService.ts` | "renamed fields only, can move" | its `Case` arrives as a parameter from `CaseIntakeTriage.tsx:264` — a blocked file. Retyping the service just relocates the error to its caller |
| `components/CaseRelationshipMapper.tsx` | "renamed fields only, can move" | its only mount passes a **literal `null`** (`App.tsx:169`), so the migration would retype code that never runs. Same for `JusticeTimeline` (`:181`) |

And the fourth entry in the "cannot move" column was wrong too, in the opposite direction: `mockData.ts`
does not *produce* the store's legacy instances (`getMockCases` has 0 consumers; D39) — it is 261 lines of
unreachable fixture cases inside a live file, and it was that count (`complexityScore` ×16) that made the
shape look load-bearing.

So the honest shape of 4(a)'s second half is not "-ii-a now, -ii-b later". It is **one decision with two
possible orders**: either the store moves to golden and the intake form keeps a draft type (which deletes the
four orphan fields by construction, resolving D36/D37 as a side-effect), or 4(a) stops at -i and -iii and the
unification becomes a design PR that also fixes D38's `null` wiring. What cannot be done is the incremental
version this plan promised, because the type that matters is the store's, and a store has no boundary to
migrate behind. Recorded here rather than quietly re-scoped, because §3's rule — *re-measure rather than
quote* — applies to this document's own predictions, and this is the second time measurement has corrected it.

### 6.9 4(a)-ii-b + D39, executed — and what the bundle number proved about my own framing

Your ruling was "delete `complexityScore` from the shape and every reader; `title`/`pii` stay legacy, never
golden; `userId` parked as D37". That shipped as one commit: the field left `features/main/types.ts`, and in
`CaseIntakeTriage` the `Math.random()` assignment, both `Omit<Case, …>` lists, the `X/10` badge and
`getComplexityColor` went with it — `noUnusedLocals: true` is what certifies nothing was left naming a dead
helper, not my grep. D39 rode along in the same commit (same reasoning as your "fold it into whichever commit
touches that file"): `mockData.ts` lost `getMockCases` and its 16 fixture cases, keeping only `mockNpsData`, the
one export anything imported.

Measured: `features/main/types.ts` importers **12 → 11** and `Case` namers **8 → 7**; census 141 files /
37,731 lines (−291); `tsc` 0, `npm test` 0 (63 + statute **18/18**), harness **32/32**, build 0, total JS
2,497,924 → **2,497,361 B (−563 B)** over 92 chunks. The entry chunk was byte-identical, which initially looked
like the edit had no effect: both files are `React.lazy` boundaries, so they are not in the entry chunk at all,
and your PR #7 ruling ("report total JS and chunk count, never entry-chunk shrink") is what caught me about to
quote the wrong number. The −563 B is the badge; the 261 removed fixture lines were already tree-shaken out, so
**D39 changed nothing a user downloads and everything about what the source model requires** — which is worth
saying plainly, because "we deleted 303 lines" would otherwise read as a performance win it is not.

**-ii-a's status after the attempt, restated so the plan and the tree agree:** the store is still the blocker
(§6.8), but two of its three files do have a path that doesn't need the store decision — `CaseRelationshipMapper`
can take golden `Case | null` today because its only mount passes a literal `null`, which is assignable either way,
and `geminiService` can take golden parameters if its caller in `CaseIntakeTriage:264` adapts through
`toGoldenCase` and handles the refusal (also the right behaviour: an undated case should not be sent to the model
for an outcome prediction). Both are small; both are *not* the "8 → 5" the plan promised, and the number that
actually reflects -ii-a is 7 → 5, with `WorkspaceContext` and the intake screen left for the store ruling.

**D40 is the finding this commit surfaced by accident**, and it is the more interesting half: with the badge gone,
the only remaining fabricated numbers in that file are four `<StatCard value={3|8|24|156}>` literals under a
caseload heading (`:345-348`), formatted by the real locale helper so they look measured, while `allCases` sits in
the same scope uncounted. Claim 30 cannot see them because no titled person stands beside them — which is the
*shape* of the missing rule, and it is registered rather than fixed.


### 6.10 4(a)-ii-a, executed — two files changed shape; the census corrected the promise

The achievable two-file half shipped after the store ruling, not the old three-file/8→5 plan.
`CaseRelationshipMapper` now reads the golden names (`cnrNumber`, `complainant`,
`sectionsInvoked`, `respondent`) and remains mounted with its honest `null` empty state; D38 was not
quietly wired. `geminiService` now serialises the golden record into its model prompt. This deliberately
changes the prompt contract from `caseNumber`/`petitioner`/`invokedActs` to
`cnrNumber`/`complainant`/`sectionsInvoked`, and stops sending `title` (UI chrome), `lastHearingDate`
(scheduling state), and `pii` (the map that would reverse redaction). `CaseIntakeTriage` converts at
the call site and renders the adapter's refusal; it does not send an undated case for a prediction.
The golden prompt keys are pinned in the statute suite.

The measurement was **7→6, not 7→5**. The resolver counts a *file* that imports the legacy module and
names `Case` anywhere, even if that particular `Case` comes from the golden module. `geminiService`
still imports `PredictionResult`, `DocumentAnalysisResult`, and `ChatMessage` from the legacy module,
so it still appears in the module census. That is not an excuse to publish a prettier number: it is the
reason -iv(c) must relocate those three types before the legacy module can die.

### 6.11 4(a)-iv(a), executed — the gate refuses in its own list, and journal JSON is unknown

The charge-sheet page's old `{ cases, gateExclusions }` parallel arrays became one
`GateCaseRow` union: `{ kind: 'gatable', caseData }` or
`{ kind: 'excluded', caseData, exclusion }`. The exclusion remains counted aloud, but it is also a
visible greyed `aria-disabled` row with its reason and no link to the statutory gate. A direct URL to
such a row shows the same refusal and does not manufacture a `LedgerCase` just to let the page continue.
This is the requested Q2 fold: the denominator and the disabled rendering come from one memo, so a
future edit cannot remove one while leaving the other saying it exists.

`LedgerEntry.data` is now `unknown`; `HashVerifier` narrows it to a record before looking for the
three recognised digest keys. This closes the type hole that let an arbitrary persisted payload be
passed as a case without a validation boundary. It changes no ledger record and no storage key.

The ledger migration ruling is explicit for the commits that follow: `nyaya:ledger:v1:records` is
immutable evidence — payload bytes are committed by leaf digests, links and anchors — so historical
entries stay in their original shape and `readCase` projects both old and golden keys on read. Only the
mutable `nyaya:cases:<owner>` workspace will migrate in -iv(b), with a `golden-v1` version marker;
new workspace writes will be golden. Appending synthetic replacement records would be a device-signed
assertion about past data, not a migration, and direct rewriting would correctly fail verification.
