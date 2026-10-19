/**
 * tests/auth_signature.test.ts - the session signature, pinned across an implementation swap.
 *
 * D13 replaced `crypto-js` with WebCrypto in `src/core/auth/AuthContext.tsx`. A swap of a hash
 * function is only safe if it is silent: every signed session sitting in somebody's localStorage was
 * produced by the old code, and if the new code computed one hex character differently every stored
 * session would start failing its own check and the user would be logged out by a refactor.
 *
 * So the expected value below is not generated here. It is the literal output of
 * `CryptoJS.HmacSHA256(dataString, INTEGRITY_SECRET).toString()` from crypto-js 4.2.0, captured while
 * the dependency was still installed, over this exact payload. What is recomputed at runtime is the
 * WebCrypto path, from the same construction the module uses (canonical `JSON.stringify` of the
 * profile, key imported as raw UTF-8, hex lowercase). Two implementations agreeing on a fixed vector
 * is the migration test; the second test below says it is not two copies sharing one shortcut, by
 * bringing in a third implementation (node's OpenSSL-backed HMAC) and keys that straddle the block
 * size, which is where such a shortcut would show up.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

const INTEGRITY_SECRET = 'nyaya-v2-integrity-key-2025';

/** Field order is part of the payload: it is the order `signUserData` stringifies, and the order the
 *  profile is built in `AuthContext.tsx`. Reordering these keys must fail this test. */
const SESSION_PAYLOAD = JSON.stringify({
    name: 'Hon. Justice Patel',
    id: 'DHC-J-1234',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=JUDGE',
    role: 'JUDGE',
    courtId: 'Delhi High Court',
});

const FROM_CRYPTO_JS = 'f89dd3f9aca9ebfacc6a9cf04df0a6cc3dafc59ca3ecd12acddc2542edafe7d1';

const hmacHex = async (message: string, secret: string): Promise<string> => {
    const subtle = globalThis.crypto?.subtle;
    assert.ok(subtle, 'node needs webcrypto for this test to mean anything');
    const key = await subtle!.importKey(
        'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const signature = await subtle!.sign('HMAC', key, new TextEncoder().encode(message));
    return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, '0')).join('');
};

test('the WebCrypto path reproduces the signature crypto-js left in stored sessions', async () => {
    assert.equal(
        await hmacHex(SESSION_PAYLOAD, INTEGRITY_SECRET), FROM_CRYPTO_JS,
        'a signed session must survive the removal of the library that signed it'
    );
});

test('the block-size boundary agrees with a third implementation, not just with the one it replaced', async () => {
    // The first test compares the new code against the old code, which is the migration guarantee but
    // not proof of correctness - two libraries can share a shortcut. So the keys straddle SHA-256's
    // 64-byte block size, where an implementation that pads an over-long key instead of hashing it
    // down agrees on short secrets and diverges on long ones, and the witness is node's
    // OpenSSL-backed `createHmac`: a third implementation, nobody's wrapper around anybody else's.
    const { createHmac } = await import('node:crypto');
    const openssl = (message: string, key: string) =>
        createHmac('sha256', Buffer.from(key, 'utf8')).update(message, 'utf8').digest('hex');
    for (const key of [INTEGRITY_SECRET, 'k'.repeat(63), 'k'.repeat(64), 'k'.repeat(65), 'k'.repeat(200)]) {
        assert.equal(
            await hmacHex(SESSION_PAYLOAD, key), openssl(SESSION_PAYLOAD, key),
            `crypto.subtle and OpenSSL disagree for a ${key.length}-byte key`
        );
    }

    // And the long-key case anchored to a literal: this one came from crypto-js 4.2.0 before it was
    // uninstalled, so the three-way agreement above is pinned to a value that cannot drift.
    assert.equal(
        await hmacHex(SESSION_PAYLOAD, 'k'.repeat(200)),
        '1a2f369098cfd3a05eb769ee807898b1505079f9e0452a262f4d75d91d53dbe1'
    );

    // A tampered profile has to stop matching, or the whole exercise is decoration: the digest is over
    // the exact bytes `signUserData` produces, so one changed field is a different signature.
    const tampered = SESSION_PAYLOAD.replace('DHC-J-1234', 'DHC-J-9999');
    assert.notEqual(await hmacHex(tampered, INTEGRITY_SECRET), FROM_CRYPTO_JS);

});
