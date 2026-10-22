# NyayaSahayak

A browser-only prototype of one narrow thing: an evidence record that a citizen, an officer and a
judge can each check for themselves, on the machine in front of them. It is not a court system and it
does not talk to one.

## What this is

React 18 + TypeScript + Vite, Tailwind on top, and **no backend of any kind** — no server, no
database, no deployment target for case data. The whole application is the bundle. Open it, use it,
close the tab, and what you filed is still in that browser profile.

Three screens carry the idea, and they are the ones every change has to keep green:

- **Citizen intake** (`/citizen/file`) — a complaint is read by four local rules (no model call
  required), shown back for review, and filed as one row in the journal. The receipt prints the journal
  index and the digest computed over the bytes it just wrote, and says whether the store confirmed the
  write.
- **Evidence Locker** (`/police/evidence`) — an officer hashes a file in the browser and records that
  digest against a case in the same journal.
- **Integrity check** (`/judge/verify`) — the same file is dropped in again, re-hashed, and the answer
  is one of three findings, worded so that *not finding a record* is never an accusation.

Around them: the persona layouts, a BSA s.63(4) Part A certificate wizard whose output is written as
its own ledger record and can be downloaded as text, chain-of-custody entries, bail and timeline
panels, and the analysis screens that call Google's Gemini when a key is configured. The picker at
`/` is a **picker**: it chooses a persona and does not authenticate anyone — that gap is D12, and this
is the honest description of the current state, not a feature note.

Nothing about a case leaves the page. The exceptions a reader should know about are outbound requests
the UI itself makes: the optional Gemini calls, avatar images, map tiles, and a `<script>` tag that
fetches Leaflet from a public CDN for the two map views. Case data has nowhere to
go, because there is nowhere here.

## What this is not

A list, because this repository has previously claimed every item in it somewhere in its own interface:

- **Not a distributed ledger.** One store, in one browser profile. No peers, no consensus, no external
  timestamping, nothing that survives another machine disagreeing about what was written.
- **Not a security boundary.** The signing key is generated in the same page that signs with it. Anyone
  who can run a script here can append records that pass every check in this app — they can call
  `addBlock`; anyone holding the profile directory can delete the journal. Signatures make edits
  *detectable*, not *impossible*.
- **Not resistant to a sufficiently large quantum computer.** P-256 ECDSA and SHA-256 are what is
  implemented. `docs/TRUST_MODEL.md` §3 says what an actual migration would need and is explicit that
  the app does not contain it.
- **Not proof about the physical object.** A digest says these bytes are those bytes. Who held the
  phone, where the recording was made, whether the seal was broken — those are statements a person types
  into a form. Part A of a certificate records them; it cannot verify them.
- **Not admissibility.** "Authentic" in this app means a digest matched and a signature verified against
  a pinned key. Admissibility is a judicial decision under BSA s.59/61/63, and no client-side tool
  pre-decides it.
- **Not finished.** Both map views pull their library from a public CDN at runtime and draw nothing if
  that fetch is refused: an air-gapped kiosk gets a blank panel and no error (D27). Several persona
  screens still read
  fixtures rather than the ledger. The integrity check is absent from the judge's own navigation (D24),
  and the exhibit card that gates re-verifying an exhibit has no button and no keyboard path (D22).
  `PROJECT_KNOWLEDGE_BASE.md` §13 is the register of what is open; it is long, and it is meant to be read.

## Trust model

`docs/TRUST_MODEL.md` is the full text. The short form, stated as promises a reviewer can test:

| Step | What actually happens |
|---|---|
| Record | One canonical JSON payload per row, SHA-256 over it, every row naming the digest of the row before. |
| Anchor | A batch of rows is folded into a Merkle tree; the root is signed with the device key through WebCrypto. |
| Verify | The row is re-derived and its inclusion proof checked against the signed root, and the signer against a *pinned* list. |
| Persist | Whichever store passes a write-then-read-back probe: IndexedDB, else `localStorage`, else memory. `persisted` is that answer, never the presence of an API. |
| Fail | An unreadable store is reported as unreadable. Never as "no match", never as "tampered". |

Three verdicts are the entire vocabulary of the integrity check — `FOUND (anchored at index n)`,
`FOUND (not yet anchored)`, `NOT IN JOURNAL` — and there is no fourth, because "tampered" is a
conclusion about a person that this code is not entitled to draw. A match is also not a guarantee:
`FOUND` means the bytes agree with the row, and the row is only as trustworthy as the device that wrote
it.

## Statutory anchors

The numbers in the interface come from the Acts, read in the bare text rather than in a summary of a
summary. Where the app's model of a provision is thin, it says so instead of quietly filling the gap.

- **BSA s.63(4) and its Schedule** — the two-part certificate: Part A the statement about the device,
  the operator and the period of control; Part B the certificate of the person in charge of the computer
  resource. SHA-1, SHA-256 and MD5 are the digest functions the Schedule names. The academic objection
  is on the record and unchanged by anything here: integrity of bytes is not attribution of an act.
  The provision was upheld on 22 May 2026 in *Pune Bar Association v. Union of India*, so the format is
  not optional and neither is the objection.
- **BNSS s.176(3)** — video of the search and seizure at a scene, for offences punishable with **seven
  years or more**, made "along with the report"; applicable only where the State or UT's forensic
  infrastructure lacks the equipment or personnel; and binding only *from such date as may be notified
  by the State Government within five years*. Delhi High Court treated the requirement as directory in
  *Suresh Kumar Singh* (2025:DHC:1337). `src/core/services/forensicInterlock.ts` implements those
  conditions and reports which one it used.
- **Commencement, 1 July 2024** — conduct before that date is still governed by the IPC, so the
  incident date decides which Act an analysis speaks under, and an unusable date fails toward the older,
  more lenient code. `tools/statute_tests.mjs` runs both sides of that boundary.
- **BNSS s.173(1)(ii)** — a copy of the FIR to the complainant, free of cost, within **three days**. That
  is the countdown on the intake receipt, and it is three days, not the 24 hours or 72 hours that
  circulated in earlier drafts of this project's notes.
- **The ceilings, correctly numbered** — s.193's investigation limits are 90 days, extendable to 180 for
  offences punishable with ten years or more, life or death; not a flat 60, which is what an earlier
  version of this repository asserted on a judge's board. Adjacent numbers the screens use: s.187(3)
  60/90-day custody production limits, s.193(3)(i) a 90-day duty to inform, s.193(9) 90 days of further
  investigation, s.263 60 days from the first hearing to frame a charge, s.232 committal moved from 90
  to 180 days.

## Getting started

Node 22 or newer, npm, and a browser. The floor comes from the scripts themselves — `npm test` runs
`node --experimental-strip-types` — and not from an `engines` field, because there is none.

```bash
git clone https://github.com/shroff45/Nyayasahayak-shroff.git
cd Nyayasahayak-shroff
npm ci
npm run dev
```

Use `npm ci` rather than an install that resolves the tree afresh: `package-lock.json` is what makes
"it built on my machine" mean anything in a repository whose whole argument is that a record should be
reproducible. Dev server on `http://localhost:5173`. Persona homes are `/citizen/home`,
`/police/dashboard` and `/judge/board`; the four deep links worth knowing are `/citizen/file`,
`/police/evidence`, `/judge/verify` and `/police/certificate`.

No API key is needed to run any of it. With `VITE_API_KEY` unset, the AI screens say they have no key
and keep working — the trust path never touches one. That was D3 and it is a gate now, because an
unconfigured clone used to white-screen. The committed `.env` holds an empty key on purpose.

## Quality gates

CI is a single job (`.github/workflows/ci.yml`) running all of this on every pull request:

```bash
npm run typecheck             # tsc over the app and over the e2e project; 0 errors in both
npm test                      # 63 node tests (trust primitives, ledger, custody, the s.63
                              # certificate, the intake's round trip through the real façade, the
                              # session signature) + 19 statutory tests over the commencement dates
node tools/ledger_repro.cjs   # 33 claims this repository makes about itself; non-zero exit if a
                              # sentence in the app stops matching its code
npm run build                 # then tools/check_bundle_size.mjs: every asset under 660,000 bytes
                              # on disk (and under 600 kB in vite's printed units, which count
                              # characters - the entry chunk's Hindi UI text makes those differ by
                              # 151.65 kB; docs/PROJECT_KNOWLEDGE_BASE.md D35 says which is which)
node tools/resolve-importers.mjs --check   # reachability, and vite/tsconfig alias agreement
npx playwright test           # one chained journey in Chromium against the built bundle
```

The browser run is the only gate that clicks, and what it clicks is the whole point: file a complaint,
read the ledger receipt, upload an exhibit against that case as an officer, re-verify the same bytes as
a judge. One journey, one browser, `workers: 1`. That is a description of what is verified, not a claim
about what is safe. `npm run lint` is declared, red, and deliberately not a gate — D15 records why.

The claim harness needs no browser: it bundles modules with esbuild, mounts the routed screens in JSDOM,
and reads the source. A claim that could not fail is rewritten until it can, and the register says which
broken version was planted to prove it. Playwright additionally needs a browser binary
(`npx playwright install --with-deps chromium`), which CI runs.

## License

**No license is currently declared.**

Public is not the same as licensed. Without a LICENSE file the default is all rights reserved, so nobody
—including whoever maintains this—has permission to reproduce, modify or distribute it, and a README
cannot grant what its author never gave. The previous version of this file asserted a licence that had no
file behind it; that is not a drafting slip to smooth over, it is a grant nobody made, so it is removed
rather than reworded. Choosing one is a one-file decision that belongs to the repository owner, and the
honest placeholder for an undecided question is this paragraph.
