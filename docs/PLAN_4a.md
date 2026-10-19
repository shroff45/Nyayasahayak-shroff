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
   delete, so the export's retirement belongs here and in no purge: D28 removed 15 files and did not
   touch either number - 3 importers before this commit, 3 after. What did move it was nobody's doing:
   the "4 importers, 2 orphans" this rule carried from PR #4 was already false when the purge arrived,
   and this sandbox is a `--depth=1` clone, so not one commit between here and PR #4 can be named as
   the culprit. That is the whole argument for re-measuring instead of quoting:
   `node tools/resolve-importers.mjs --model src/core/workspace/legacyCaseAdapter.ts`.
   When the orphan dies, the export goes with it in the same commit, not in a follow-up.

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

- **4(a)-i — make the adapter total, in tests first.** `toGoldenCase` gets the missing-field behaviour
  pinned by node tests: which golden fields it can fill from a legacy object, which it must refuse to
  invent, and what it does with a journal row whose `sectionsInvoked` is a string rather than an array.
  No consumer changes yet. If a field cannot be derived, the adapter says so by type, not by default.
- **4(a)-ii — move the live namers off `features/main/types.ts`** (the 8) by importing the golden type
  and calling the adapter at the boundary. This is the bulk of the block. Keep each page's own props
  typed; only the *shared* shape moves.
- **4(a)-iii — retire `src/core/types.ts`'s `Case`** (re-measured after D33: 7 importers, 0 live; 3 dead
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
own text); and the census line for unreachable files goes **down**, never up. If 4(a) ends with more
dead code than it started with, the migration left shims behind — find them before the PR does.
