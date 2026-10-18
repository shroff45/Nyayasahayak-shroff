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
   certificate must state — device used, person operating it, the period of control — and the
   generator for that is still unwired (`Section63CertificateGenerator`).
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

## 6. If you want to say something about this system

Allowed, and accurate:

> Evidence digests are computed client-side with SHA-256, recorded in a tamper-evident local
> journal, batched into a Merkle tree, and the root is signed with this terminal's pinned ECDSA
> P-256 key. Any record can be exported as a certificate that a third party verifies offline.
> Editing a stored record — even after recomputing every hash in the chain — breaks verification.

Not allowed until the code says otherwise: *post-quantum, quantum-resistant, zero-knowledge,
blockchain-secured, tamper-proof, immutable, court-admissible, non-repudiable, smart contract.*

Re-run the proof:

```bash
node tools/ledger_repro.cjs          # 12 claims, exit non-zero if any fails
npm test                             # 32 trust tests + 10 statutory tests
```
