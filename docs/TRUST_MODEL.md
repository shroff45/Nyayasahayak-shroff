# Trust model — what this app's ledger does and does not establish

Written for the people who have to defend a record: the officer who uploads an exhibit, the
registry officer who reads a digest back, and whoever is asked in court what "verified" meant.

It exists because the code used to describe itself as post-quantum (CRYSTALS-Kyber), zero-knowledge,
a blockchain, and court-admissible, and none of those words was true. The words are now checked by
`node tools/ledger_repro.cjs`, which fails the build if a claim returns to the shipped code.

Everything below describes `src/core/trust/` (the mechanisms) and `src/services/akhandLedger.ts`
(the façade every screen imports). There is exactly one ledger.

---

## 1. The mechanisms

| Layer | What it is | What it buys |
|---|---|---|
| `sha256.ts` | SHA-256 via the browser's WebCrypto (`crypto.subtle`). File digests are read in real 4 MB slices. | A 32-byte fingerprint of the bytes. Any single changed bit changes the digest. |
| `merkle.ts` | An append-only Merkle tree, RFC-6962 style: leaves are `H(0x00‖d)`, nodes `H(0x01‖l‖r)`, an odd node is promoted rather than duplicated. | Many records committed by one 32-byte root, plus an inclusion proof of `log₂(n)` hashes that anyone can check. |
| `keys.ts` | ECDSA over P-256 with SHA-256 (`ECDSA-P256-SHA256`). The private key is a `CryptoKey`; the public key is pinned by fingerprint (`NYAYA-A1:xxxxxxxx`). | A signature over the anchor's canonical bytes. Whoever holds the key cannot deny having produced it *to the extent that the key stayed private*. |
| `store.ts` | A journal in `localStorage`, or IndexedDB when available, or memory. Each record: `index`, `timestamp`, `leafDigest`, `previousDigest`, `data`. Head digest = fold of `previousHead | leafDigest`. | Survives a refresh, and a rewrite of history has to be consistent all the way to the head. Not append-only in the OS sense — the browser's storage belongs to the machine. |
| `ledger.ts` | Ties the four together: append → anchor (Merkle root + signature, written back as a journal record) → verify. | `verifyRecord(i)` answers "is this record unchanged, is it inside a signed batch, and is that batch signed by a key I trust". |
| `custody.ts` | Reads the same journal as a chain of custody: one record per node, and each node's badge is the `verifyRecord` answer for *that* record. Appends a transfer and anchors it in the same call. | A timeline that cannot claim more than its records prove — and that shows `PENDING` for a write no anchor covers yet, `UNKNOWN` for a signature from an unpinned key, `MISMATCH` for an edited one. |
| `bail.ts` | Bail escrow as ledger events (create / appearance / refund / forfeit), state rebuilt from the log on each read. | A refund decision that survives a refresh and is auditable, rather than a `Map` that evaporated. |

### Verification, precisely

`verifyRecord(i)` is true only if **all** of these hold:

1. the record's stored `leafDigest` equals SHA-256 over its canonical `{index, timestamp, previousDigest, data}`;
2. its `previousDigest` matches its predecessor (linkage);
3. an inclusion proof from its leaf to an anchor's Merkle root verifies, **with the leaf count taken from the signed anchor** — otherwise a forged batch size can be made to fold to the right root;
4. the anchor's root equals the root recomputed from the live records;
5. the anchor signature verifies; **and**
6. the signer's fingerprint is on the pinned-authority list.

Step 6 is the one that is easy to forget and the one that matters most: a well-formed signature from
a key nobody vouches for is a self-assessment, and `verifyRecord` says so rather than printing green.

## 2. What the system therefore establishes

- **Integrity.** An exhibit's bytes and the ledger record about them are internally consistent, and an edit anywhere in the chain is detectable.
- **Detectability against a writer, not just a reader.** This is the property the previous implementation lacked. An adversary who can edit `localStorage` can recompute every leaf digest, relink every `previousDigest` and re-fold the head — and is still caught, because the anchor's Merkle root lives inside a signature made by a key the store does not contain. `tools/ledger_repro.cjs` section A performs exactly that attack and requires it to fail.
- **Portability.** `exportCertificate(i)` emits `{record, proof, anchor, signature}`. A third party with the pinned public key can verify it offline, with no access to this browser, no network and no copy of the app state.

## 3. What it does **not** establish — say these out loud

1. **Not non-repudiation.** The device key is self-generated and self-pinned on first run: the same
   machine wrote and vouched for the record. There is no CA, no certificate chain, no revocation
   list, no hardware attestation. What a second, independently-held key adds is real — that is what
   `pinAuthority()` is for — and until it is used, `getLedgerStatus().selfSignedOnly` is `true` and
   the UI should say so.
2. **Not an external timestamp.** "This digest existed at time T" is only as good as the device clock.
   The tail of records since the last anchor is protected by the head fold alone; it is not visible
   to anyone else. `exportCertificate()` publishing a root to another channel is the cheap
   mitigation; a real RFC-3161 timestamp authority or an OriginStamp-style public anchor is the
   proper fix.
3. **Not a blockchain.** One journal, one writer, no peers, no consensus, no mining. `BlockchainBlock.nonce`
   is retained for the UI table and is always `0` because there is no proof of work.
4. **Not post-quantum.** SHA-256 gives ~128-bit preimage resistance against a quantum adversary
   (Grover halves it) and P-256 ECDSA does not survive a large-scale Shor attack at all. The
   mitigation is ML-DSA-65 signatures (or SPHINCS+) with an epoch key rolling over every anchor,
   each epoch counter-signed by the previous one so history stays verifiable after migration.
   That is candidate invention **E** in `NOVELTY_AND_PATENTABILITY_ASSESSMENT.md` §8 — a roadmap,
   not this code. Anyone writing "post-quantum" here without it is lying.
5. **Not a zero-knowledge proof.** Verification reveals the payload; it is a digest comparison plus a
   signed inclusion proof. A ZK proof would need a commitment, a challenge/response or a SNARK, and
   soundness/completeness arguments. None exist and none are needed; the label was decorative.
6. **Not custody of the physical object.** A hash of bytes says nothing about where the phone, knife
   or DVD came from, who held it, or whether it was in the room. That is what a BSA s.63(4) Part A
   certificate must state — device used, person operating it, the period of control. That wizard is
   wired: `/police/certificate` renders `Section63CertificateGenerator` fed from the ledger row, and the
   Part A it collects is appended as a `kind: 'CUSTOM'` record naming the exhibit's record index, then
   offered as a text download. What it cannot do is *prove* any of it — every field in Part A is what an
   officer typed, so the certificate documents an account of custody instead of corroborating one. The
   digest written beside it is the part that resists editing.
7. **Not admissibility.** `isAuthentic: true` in this app is a statement about hashes and signatures.
   Admissibility is a judicial decision under BSA s.59/61/63 and the court's own rules about
   electronic records, and no client-side tool can pre-decide it. Nothing here says "court-admissible"
   any more, and nothing should.
8. **Not a security boundary for the app itself.** Anyone with XSS can append *valid-looking* new
   records with the device key (they can call `addBlock`), and anyone with the profile directory can
   delete the whole journal. The signatures make *edits* detectable; they do not make the journal
   available or un-deletable. Deletion is the residual risk, which is why the anchor's `headDigest`
   lets a reader say "this journal is shorter than the anchor claims".

## 4. Storage tiers, honestly ranked

`CustodyStrength` is reported in every anchor and surfaced in the UI, because the value of a
signature depends on how the key is held:

| Tier | Key lives | Meaning |
|---|---|---|
| `non-extractable-in-indexeddb` | IndexedDB, `extractable: false` | Strongest available in a browser: script cannot read the key material, only use it. Still exportable-by-rooting the device. |
| `exportable-in-web-storage` | JWK in `localStorage` | What a fresh install gets. Any script on the page can copy the key and sign arbitrary anchors — which is precisely why a *pinned* list, and later a second device's key, is what carries weight. |
| `session-only` | memory | Nothing persists; anchors are void after a refresh. Reported, never silently used. |

`lockPrivateKey()` upgrades the first tier when IndexedDB is present. A quota failure throws — the
write is *not* silently downgraded to memory, because "persisted" is a claim the UI makes.

### What `persisted` means, and how it is earned

`Ledger.status().persisted` is not "the browser has localStorage". It is the result of asking the
store a question, once, before the ledger is built:

```ts
storage.setItem(probeKey, token);          // 1. write
const readBack = storage.getItem(probeKey); // 2. read
return readBack === token && storage.getItem(probeKey) === null; // 3. and clean up after yourself
```

Three consequences worth stating, because each one is a defect this replaced:

- **A store that accepts writes and discards them is rejected.** Safari in private mode completes
  every `setItem` without throwing and loses all of it at unload; a kiosk profile with storage
  disabled by policy refuses the write outright. Both now end up on `memoryDriver` with
  `persisted: false`, and the citizen's receipt says *"Session only — will not survive page
  reload"* instead of *"Saved to this device"*. The old probe checked only that nothing threw.
- **IndexedDB is preferred, but only if it proves itself, and never at the cost of history.** It
  gets its own `persistence-probe` object store: a sentinel parked in `records` would be swept up
  by `readAll` (a bare `getAll()`) and would break the rule that `record.index` must equal
  `meta.recordCount + 1` — proving durability would have cost a record. If `open()` is refused, or
  the probe store does not exist because the database was created before it did, the probe resolves
  `false` and the ledger moves on to the next store. And if localStorage already holds this device's
  journal, localStorage keeps it: silently starting a new chain on an empty store, one the user's
  exhibits have never been written to, is worse than a smaller quota.
- **The flag describes the store in use, not the environment around it.** A caller that passes
  `driver:` to `createLedger` gets that driver's probe. Before this, `createLedger({ driver:
  memoryDriver() })` in a desktop browser reported `persisted: true` — a truthful-looking field
  measured against the wrong subject, which is how the tests and the app could disagree without any
  type error appearing.

What a probe does **not** buy: a promise that the bytes survive a browser crash, an OS-level disk
failure, or a user who clears site data five minutes later; and no protection against a page that
can be scripted (item 8 above — same origin, same ability to `clear()`). It answers exactly one
question, "did the write land", because that is the only question the receipt on the citizen's
screen claims to answer. The E2E journey asserts `persisted`; it does not assert survival across a
reload, and that asymmetry is deliberate — a probe measured in the same session cannot be the proof
of a different session.

## 5. Threat model summary

| Adversary | Outcome |
|---|---|
| Reads the store only | Cannot change a digest without breaking `verifyRecord`. |
| Edits one record in place | Caught: digest mismatch (`editedRecords`). |
| Edits a record and re-hashes the whole chain, including the head fold | Caught: the anchor's signed Merkle root no longer matches. |
| Truncates the journal after the last anchor | Caught: `headDigestMatches` false, and `verifyRecord` reports "never anchored or the journal was truncated". |
| Replays a *whole* valid prefix (an earlier anchor plus the records under it) | Caught if a later anchor exists (head fold); if the newest anchor is also rolled back, the store is simply reverted — indistinguishable to this app. Needs an external timestamp or a second device's key to close. |
| Has the private key | Can forge new anchors legitimately. Mitigation: non-extractable keys, a second authority, key rotation. Not closed by this code. |
| Clears site data | Journal gone. Not recoverable; mitigation is exporting certificates/anchors to a second channel, which `exportCertificate()` makes easy, and no screen prompts for yet. |

## 6. Who reads it (the screens, and what each is allowed to claim)

The journal above is what the surfaces below show. None of them owns a copy of the data, which is
the point: a judge and a police officer reading the same exhibit are reading the same records. What
each is *allowed* to say is not a style question - see the last item, which exists because a screen
used to answer this question with a sentence generated by a language model.

- **Police → Evidence Locker** (`/police/evidence`). Upload hashes the file with WebCrypto, appends
  an `EVIDENCE` record and anchors it; the list is the journal, not session state. The custody strip
  in each card is the shared timeline, fed by `buildCustodyChain`, plus a form that writes a real
  transfer record. Uploading no longer defaults an exhibit to "unlinked": the case is chosen, or the
  officer says explicitly that this was a pre-FIR seizure.
- **Police → Section 63 certificate** (`/police/certificate/:evidenceId`). The wizard's Part A carries
  the digest *the ledger holds* for that exhibit; re-hashing the file is offered as a comparison
  against it, and a mismatch is reported instead of overwriting the record. Issuing writes two
  records: the certified particulars, then the digest of the printed text itself, so a PDF-less
  `.txt` download can be re-hashed by anyone holding the file.
- **Police → charge-sheet gate** (`/police/chargesheet/:caseId/gate`). BNSS s.176(3) compliance is
  computed from the case record and the exhibit marked as the scene video, verified in the ledger;
  the expert's attendance is a signed record, not a checkbox. An override can be requested and is
  recorded — and stays pending, because nothing in a single-user browser app gets to approve its own
  exemption.
- **Judge → chain of custody** (`/judge/case/:id/chain-of-custody`). Timeline, per-record reasons,
  unexplained gaps, one-click export of an inclusion proof, and a box that verifies a proof pasted
  in from another machine against the keys pinned here.
- **Anyone → document integrity check** (`/integrity`, labelled "Document Integrity" in the admin
  rail). No key, no model, no network: `sha256Hex` over pasted text or `sha256OfFile` over a `File`
  stream (chunked, with progress, refusing anything over 64 MB rather than sampling it), then a
  search of the journal for a record storing that digest.

  Its answer is one of exactly three strings, and the strings are the contract:

  | verdict | when |
  |---|---|
  | `FOUND (anchored at index n)` | a record stores this digest **and** `ledger.getProof(index)` returns an inclusion proof |
  | `FOUND (not yet anchored)` | a record stores this digest, in a batch the anchor step has not reached |
  | `NOT IN JOURNAL` | the digest was computed and nothing holds it - including the empty-store case, which says so in words |

  Four rules that are easy to get wrong and are therefore asserted by `tools/ledger_repro.cjs`
  group G, not just written here:

  1. **Comparison is case-insensitive.** The Evidence Locker stores `hashResult.hash.toUpperCase()`
     (`EvidenceLocker.tsx:212`) while `sha256Hex` returns lower case, so an exact-string match would
     report a logged document as unlogged. This is the single most likely way to "break" the check.
  2. **`anchored` comes from `getProof()`, never from a field on the record.** A record that says
     `anchored: true` is a record making a claim; a proof that verifies is the ledger being asked.
  3. **A store that cannot be read is a failed check, not a verdict.** The error path renders the
     reason and never prints `NOT IN JOURNAL`, which would be an affirmative statement about the
     document based on the app's own I/O problem.
  4. **`FOUND` is not `VERIFIED SECURE`, and `NOT IN JOURNAL` is not `TAMPERED`.** The first says this
     digest was recorded here, which is compatible with the bytes being forgeries; the second says
     this digest is absent, which is compatible with the wrong file, the wrong device, and with the
     document never having been logged. A value in `integrityStatus` that could be read either way is
     why the enum is gone rather than renamed.

  The screen used to be called Quantum Fingerprinting and did something else entirely: it sent the
  document to `gemini-2.5-pro` with the instruction "generate a unique quantum cryptographic hash" and
  printed the reply in a monospace block as the fingerprint, with `integrityStatus` set by
  `isAnomalous ? 'POTENTIAL_TAMPERING' : 'VERIFIED_SECURE'`. No hash was computed. Offline - every
  clone and CI - the call returned null and the screen declared tampering about a document it had not
  read. `PROJECT_KNOWLEDGE_BASE.md` §13 D18 is the finding as it was raised.

## 7. If you want to say something about this system

Allowed, and accurate:

> Evidence digests are computed client-side with SHA-256, recorded in a tamper-evident local
> journal, batched into a Merkle tree, and the root is signed with this terminal's pinned ECDSA
> P-256 key. Any record can be exported as a certificate that a third party verifies offline.
> Editing a stored record — even after recomputing every hash in the chain — breaks verification.

Not allowed until the code says otherwise: *post-quantum, quantum-resistant, zero-knowledge,
blockchain-secured, tamper-proof, immutable, court-admissible, non-repudiable, smart contract,
end-to-end encrypted, court-grade, verified & secure, potential tampering.*

The last four were removed from live copy while writing this section (D19): "End-to-End Encrypted" was
a badge on the front door of the app, "Court-grade security" and "End-to-end encryption" were About's
tech cards and trust chips, and the D18 pair were the two values of an enum a screen rendered. The
vocabulary list is enforced in code - `tools/ledger_repro.cjs` group H fails the build if any of these
appear in a quoted string in a reachable file, with a denial allowed and an identifier-shaped string
skipped so `id: 'blockchain'` and `t('verifying_blockchain_hash')` do not trip it - because a section in
a document is a promise and a grep is not a gate.

Re-run the proof:

```bash
node tools/ledger_repro.cjs          # 31 claims, exit non-zero if any fails
npm test                             # 63 tests (trust primitives, ledger, custody, the s.63
                                     # certificate document, the persistence probe, the citizen
                                     # intake's round trip through the real façade) + 14 statutory
                                     # tests
npx playwright test                  # one chained journey in a real browser, against the build
```

Each of the three answers a different question, and only the last one asks about a click. The harness
reads the source and mounts screens in JSDOM: it can prove that `CitizenComplaint.tsx` calls `addBlock`
and that no reachable file says "court-grade", which is more than a grep, and still less than running
the app. `npm test` runs the trust layer in node against a localStorage-shaped driver, so the ledger's
own behaviour - append, anchor, verify, refuse a duplicate index - is executed rather than described.
`npx playwright test` is the only gate that opens the built bundle in Chromium and follows the chain:
the citizen types a complaint, presses `Save to Ledger`, an officer's Evidence Locker offers that case
in its `<select>`, an exhibit uploaded there becomes a ledger record, and the same bytes re-uploaded at
the judge's verifier return a match. That is the whole trust path, and it is exactly the shape of thing
D20 got wrong while every grep in the repository stayed green.

Green on `05dbf35`: `2 passed (28.6s)`, all seven CI steps. That run is the first time anything in this
repository clicked through the whole chain, and it paid for itself immediately — `goto("/citizen/file")`
had been arriving at `/citizen/home`, because `App` chose its public route tree before the session restore
finished and that tree's catch-all rewrote the address. Every bookmarked or shared deep link in the product
lost its target, and a type checker, 53 unit tests and a source-reading harness were all green while that
was true. It is D25, fixed by holding the first paint on `isLoading` and pinned by harness claim 27.

It needs a browser binary (`npx playwright install --with-deps chromium`, which CI runs) and it drives
`vite preview` on `npm run build`, so a green journey and a green build describe the same bytes. The
origin must stay a loopback one: every digest here is `crypto.subtle`, and WebCrypto exists only in a
secure context.
