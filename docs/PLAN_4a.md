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

## 2. The four shapes

| file | shape | importers | live | naming `Case` | live namers |
|---|---|---|---|---|---|
| `src/types.ts` | **golden** — 19 fields, several required | 11 | 5 | 7 | 3 |
| `src/core/types.ts` | strict subset, missing 6 golden fields (4 required: `adjournmentsCount`, `incidentDate`, `isZeroFir`, `applicableLaw`; 2 optional: `judgeId?`, `zeroFirTransferStatus?`) | 7 | **0** | 3 | 0 |
| `src/features/main/types.ts` | legacy intake — `caseNumber`, `petitioner`, `invokedActs`, `title`, `complexityScore`, `pii` | 15 | 12 | 9 | **8** ← the migration bulk |
| `src/features/nationals/core/types.ts` | union-shaped, nearly all optional, both spellings of everything | 21 | 4 | 9 | 1 |

The set that decides your commit boundaries is the union of the four **unreachable** namer lists:
**16 files**. Get it with

```
for m in src/types.ts src/core/types.ts src/features/main/types.ts src/features/nationals/core/types.ts; do
  node tools/resolve-importers.mjs --model $m --symbol Case \
    | awk '/unreachable - each/{f=1;next} f&&/^    /{print $1}'
done | sort -u
```

That is not a number to argue with and it is not a number to keep: it was 17 when §8 of
`PROJECT_KNOWLEDGE_BASE.md` first recorded it, and it fell to 16 when PR #4 deleted
`src/features/nationals/components/DocumentAnalysis.tsx`. A directory-based listing misses 2 of the 16
(`src/features/nationals/constants/mockData.ts`, 7 `Case` literal constructions, and
`src/features/nationals/modules/citizen/VoiceFilingInterface.tsx`, 3) because they sit in directories
whose *other* files are live.

## 3. The rules for this block

1. **The golden shape is consumed differently, never edited.** `src/types.ts`'s `Case` keeps its
   fields. That constraint is what keeps two dead golden namers (`components/CaseDetailsPanel.tsx`,
   `components/CaseQueue.tsx`) green while everything around them moves.
2. **A type edit and the death of its dead namers are one commit.** Never two. `tsc` is the whole
   reason, and CI runs `tsc`.
3. **`legacyCaseAdapter.ts` is 4(a)'s file, not anyone else's.** Today it has 4 importers, 2 live
   (`App.tsx`, and `personas/police/pages/ChargeSheetGatePage.tsx` whose `toGoldenCase` at `:93`
   converts *workspace state*, not a journal record) and 2 orphans. `applicableLawFor` is exported
   only from it (`:22`) and imported only by unreachable files — so if the purge deletes those, the
   export becomes dead in the same commit and must go with them, not in a follow-up.
4. **The nationals subtree dies in the purge (4(purge)), not here.** 4(a) does not migrate
   `src/features/nationals/core/types.ts`; it stops pretending that file is one of the shapes that has
   to be reconciled. Its 4 live importers are what the purge deletes. This is a scope decision, not an
   oversight: reconciling a near-copy of `features/main` and then deleting it is work the reader cannot
   see and the diff cannot justify.
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
7. **The twin trap.** Four files are named `DraftJudgmentPanel.tsx` (`src/components/`,
   `src/features/nationals/components/`, `src/features/main/components/`,
   `src/personas/judge/components/`); only `src/components/` is routed, and it is the terminal consumer
   of `toGoldenCase(selectedCase)`. Name the path in every edit and in the PR body. Same name, four
   fates: one live, one dead-with-its-island, two dead.

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
- **4(a)-iii — retire `src/core/types.ts`'s `Case`** (0 live importers, 3 dead namers): delete the
  three dead files that name it, then the type. This is the only step that is pure subtraction, so it
  goes first if you need a warm-up, and first in review order if you need a win.
- **4(a)-iv — make `legacyCaseAdapter` the single boundary** and delete the per-page coercions that
  grew around it (`complainant ?? petitioner`, `cnrNumber ?? caseNumber`, `sectionsInvoked ??
  invokedActs`) so the fallbacks live in one file with one test. Note the trap in that list:
  `readCase`'s `filingDate` fallback is not the same as the adapter's, and the two must not be merged
  by a refactor that looks like tidying.
- **4(a)-v — leave `src/features/nationals/core/types.ts` alone** and record in the KB that 4(a)
  closed on three shapes with the fourth scheduled for deletion. Do not let the diff grow to cover it.

## 5. What "done" means

`--model` reports 0 live namers for `src/features/main/types.ts` and `src/core/types.ts`; the four
files above are three shapes; `listCases` consumers and `EvidenceLocker` read the same object type;
`node tools/ledger_repro.cjs` still ends at the count its header claims, with any claim rewritten to
match what became true (a claim that had to be *weakened* to pass is a regression, and says so in its
own text); and the census line for unreachable files goes **down**, never up. If 4(a) ends with more
dead code than it started with, the migration left shims behind — find them before the PR does.
