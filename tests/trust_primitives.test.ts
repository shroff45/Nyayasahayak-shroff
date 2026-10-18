/**
 * tests/trust_primitives.test.ts — SHA-256, Merkle tree, canonical encoding, key custody.
 *
 * Run with `npm test`. These files import `src/core/trust/*.ts` directly, with extensions, so
 * Node's type-stripping runs the shipped source - there is no compiled copy to drift from the
 * thing the browser executes. If a future edit introduces an `enum` or a constructor parameter
 * property, `npm test` fails immediately: that is the enforcement, not a convention.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { sha256Hex, toHex, fromHex, sha256, SHA256_BYTES } from '../src/core/trust/sha256.ts';
import {
    buildMerkleTree,
    createInclusionProof,
    merkleRoot,
    verifyInclusionProof,
    EMPTY_ROOT,
} from '../src/core/trust/merkle.ts';
import {
    canonicalBytes,
    generateSigningIdentity,
    signPayload,
    verifySignature,
    fingerprintFromPublicKey,
    importPublicKey,
    verifyAnchorSignature,
    KEY_ALG,
} from '../src/core/trust/keys.ts';

const leaf = (text: string) => sha256Hex(text);

test('sha256 matches the published FIPS 180-4 test vectors', async () => {
    // The standard vectors, not values copied out of this implementation.
    assert.equal(await sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    assert.equal(await sha256Hex(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    // 1,000,000 x 'a' - the long-message vector, catches any chunking bug in the digest path.
    assert.equal(await sha256Hex('a'.repeat(1_000_000)), 'cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0');
    assert.equal((await sha256('abc')).length, SHA256_BYTES);
});

test('hex helpers round-trip and reject what a certificate would never contain', async () => {
    const bytes = new Uint8Array([0, 15, 171, 255]);
    assert.equal(toHex(bytes), '000fabff');
    assert.deepEqual(Array.from(fromHex('  00 0F AB FF ')), Array.from(bytes));
    // A digest wrapped across two lines in a PDF is the case that must keep working:
    assert.deepEqual(Array.from(fromHex('000f\n  abff')), Array.from(bytes));
    assert.equal(fromHex(await sha256Hex('abc')).length, SHA256_BYTES);
    // Odd length and non-hex characters are the two ways a paste goes wrong; both must be loud.
    assert.throws(() => fromHex('deadbee'), /Not a SHA-256 hex digest/);
    assert.throws(() => fromHex('zzzzzzzz'), /Not a SHA-256 hex digest/);
});

test('Merkle root is deterministic and order-sensitive', async () => {
    const a = await leaf('exhibit-A'), b = await leaf('exhibit-B'), c = await leaf('exhibit-C');
    assert.equal(await merkleRoot([a, b, c]), await merkleRoot([a, b, c]));
    assert.notEqual(await merkleRoot([a, b, c]), await merkleRoot([b, a, c]), 'reordering exhibits must change the root');
});

test('an empty ledger has a defined root that cannot collide with a real one', async () => {
    assert.equal(await merkleRoot([]), EMPTY_ROOT);
    assert.notEqual(await merkleRoot([await leaf('')]), EMPTY_ROOT);
});

test('leaves are domain-separated so a subtree cannot be transplanted', async () => {
    // Without the 0x00/0x01 framing these two different structures share a digest, which is the
    // textbook second-preimage attack on naive Merkle trees.
    const single = await leaf('payload');
    const rootOne = await merkleRoot([single]);
    assert.notEqual(rootOne, single, 'a one-leaf root must not equal the leaf hash');

    const rootTwo = await merkleRoot([single, single]);
    assert.notEqual(rootTwo, rootOne, 'a 2-leaf tree must not look like a 1-leaf tree');

    // And the "duplicate the last node" trick: 3 leaves where the third repeats the second's
    // parent must not produce the 2-leaf root.
    const nested = await merkleRoot([single, single]);
    assert.notEqual(await merkleRoot([single, single, nested]), nested);
});

test('every leaf in batches of 1..9 produces a proof that verifies offline', async () => {
    for (let size = 1; size <= 9; size++) {
        const leaves = await Promise.all(Array.from({ length: size }, (_, i) => leaf(`exhibit-${i}`)));
        const root = await merkleRoot(leaves);
        for (let i = 0; i < size; i++) {
            const proof = await createInclusionProof(leaves, i);
            const result = await verifyInclusionProof(leaves[i], proof, root);
            assert.ok(result.isValid, `size ${size}, index ${i}: ${result.reason}`);
            assert.equal(proof.leafCount, size);
        }
    }
});

test('a proof stops verifying when the leaf it attests to changes', async () => {
    const leaves = await Promise.all([leaf('a'), leaf('b'), leaf('c'), leaf('d'), leaf('e')]);
    const root = await merkleRoot(leaves);
    const proof = await createInclusionProof(leaves, 2);
    assert.ok((await verifyInclusionProof(leaves[2], proof, root)).isValid);
    const forged = await verifyInclusionProof(await leaf('tampered exhibit'), proof, root);
    assert.equal(forged.isValid, false);
    assert.match(forged.reason ?? '', /does not match/);
});

test('proofs cannot be malleated by lying about the batch size', async () => {
    const leaves = await Promise.all([leaf('a'), leaf('b'), leaf('c')]);
    const root = await merkleRoot(leaves);
    const proof = await createInclusionProof(leaves, 0);

    // Lying about the batch size only matters if the verifier has no authority for the count,
    // so both cases are asserted: unbound it is accepted, bound to the signed anchor it is not.
    const unbound = await verifyInclusionProof(leaves[0], { ...proof, leafCount: 4 }, root);
    assert.equal(unbound.isValid, true, 'documented: the count alone is not what secures the fold');
    const bound = await verifyInclusionProof(leaves[0], { ...proof, leafCount: 4 }, root, { expectedLeafCount: 3 });
    assert.equal(bound.isValid, false, 'a forged batch size must fail against the signed anchor');
    assert.match(bound.reason ?? '', /signed anchor covers 3/);

    const otherRoot = await merkleRoot([await leaf('x'), await leaf('y')]);
    const foreignRoot = await verifyInclusionProof(leaves[0], proof, otherRoot);
    assert.equal(foreignRoot.isValid, false);

    const droppedStep = await verifyInclusionProof(leaves[0], { ...proof, siblings: proof.siblings.slice(0, -1) }, root);
    assert.equal(droppedStep.isValid, false);
    assert.match(droppedStep.reason ?? '', /requires exactly/);

    const wrongIndex = await verifyInclusionProof(leaves[0], { ...proof, leafIndex: 1 }, root);
    assert.equal(wrongIndex.isValid, false);
});

test('tree levels are exposed so a verifier can audit the construction, not just the result', async () => {
    const leaves = await Promise.all([leaf('a'), leaf('b'), leaf('c'), leaf('d')]);
    const tree = await buildMerkleTree(leaves);
    assert.equal(tree.levels.length, 3, '4 leaves -> 4, 2, 1');
    assert.equal(tree.levels[0].length, 4);
    assert.equal(tree.levels[1].length, 2);
    assert.equal(tree.levels[2].length, 1);
    assert.equal(tree.root, tree.levels[2][0]);
});

test('canonical encoding is key-order independent, so signing and verifying agree', () => {
    const one = canonicalBytes({ b: 2, a: { d: 4, c: 3 } });
    const two = canonicalBytes({ a: { c: 3, d: 4 }, b: 2 });
    assert.deepEqual(Array.from(one), Array.from(two));
    // Arrays stay ordered - a Merkle batch or a section list is not a set.
    assert.notDeepEqual(
        Array.from(canonicalBytes({ s: [1, 2] })),
        Array.from(canonicalBytes({ s: [2, 1] }))
    );
});

test('an anchor signature verifies only against the key that made it', async () => {
    const signer = await generateSigningIdentity('Sessions Court 4');
    const other = await generateSigningIdentity('Some other terminal');
    const payload = { exhibit: 'EX-1', root: 'aa'.repeat(32) };
    const signature = await signPayload(signer.privateKey, payload);

    assert.ok(await verifySignature(signer.publicKey, signature, payload));
    assert.equal(await verifySignature(other.publicKey, signature, payload), false);
    assert.equal(await verifySignature(signer.publicKey, signature, { ...payload, exhibit: 'EX-2' }), false);
});

test('a malformed signature is a failed check, not a crash - the verify path faces pasted input', async () => {
    const signer = await generateSigningIdentity('Sessions Court 4');
    assert.equal(await verifySignature(signer.publicKey, 'not-hex', { a: 1 }), false);
    assert.equal(await verifySignature(signer.publicKey, 'ab'.repeat(64), { a: 1 }), false);
});

test('fingerprint is derived from the public key, not supplied by the caller', async () => {
    const signer = await generateSigningIdentity('Label says one thing');
    const fromPublic = await fingerprintFromPublicKey(signer.publicKey);
    assert.match(fromPublic, /^NYAYA-A1:[0-9A-F]{8}$/);
    const renamed = { ...signer };
    assert.equal(await fingerprintFromPublicKey(renamed.publicKey), fromPublic);
});

test('trust decision separates "signature is valid" from "signer is trusted"', async () => {
    const signer = await generateSigningIdentity('Malkhana terminal 7');
    const payload = { anchorIndex: 1, merkleRoot: 'aa'.repeat(32) };
    const signature = await signPayload(signer.privateKey, payload);
    const record = {
        fingerprint: signer.fingerprint,
        label: 'Malkhana terminal 7',
        publicKeyJwk: signer.publicKeyJwk,
        addedAt: '2026-01-01T00:00:00.000Z',
    };

    const trusted = await verifyAnchorSignature(payload, signature, signer.fingerprint, [record]);
    assert.deepEqual({ ok: trusted.ok, valid: trusted.signatureValid, pinned: trusted.signerTrusted },
        { ok: true, valid: true, pinned: true });

    const unpinned = await verifyAnchorSignature(payload, signature, signer.fingerprint, []);
    assert.equal(unpinned.ok, false);
    assert.match(unpinned.reason, /No pinned authority/);

    const revoked = await verifyAnchorSignature(payload, signature, signer.fingerprint,
        [{ ...record, revokedAt: '2026-06-01T00:00:00.000Z' }]);
    assert.equal(revoked.signatureValid, true, 'a revoked key still proves who signed at the time');
    assert.equal(revoked.ok, false, 'but the record is not trusted for reliance');
    assert.match(revoked.reason, /revoked/);
});

test('anchor algorithm label is the real curve, and nothing claims post-quantum', () => {
    assert.equal(KEY_ALG, 'ECDSA-P256-SHA256');
    assert.doesNotMatch(KEY_ALG, /kyber|quantum|zkp|zero[- ]knowledge/i);
});
