/**
 * merkle.ts — a real binary Merkle tree over the ledger's leaves, with offline-verifiable
 * inclusion proofs.
 *
 * This replaces the previous `merkleRoot`, which was `SHA256(JSON.stringify(payload))` — a
 * hash of one payload, not a tree, and therefore incapable of producing an inclusion proof.
 * That mattered: "verify exhibit X against the ledger" cannot be answered without a proof path,
 * so the verifier had to be online and trusted. Here, anyone holding the root and a proof can
 * check a single exhibit with no network access (see `verifyInclusionProof`).
 *
 * Two choices worth reviewing, both deliberate:
 *
 * 1. Domain separation (RFC 6962 style). Leaves are hashed as H(0x00 || leaf) and internal
 *    nodes as H(0x01 || left || right). Without the tag byte, a one-leaf tree and the parent of
 *    that same leaf collide, and a 2-leaf tree collides with a 3-leaf tree whose third leaf is
 *    the root of the first — i.e. an attacker could transplant a subtree and the digest would
 *    still match. This is the classic second-preimage attack on naive Merkle trees.
 *
 * 2. Odd levels promote, they do not duplicate. Duplicating the last node (Bitcoin's rule)
 *    makes a 2-node level and a 3-node level produce the same parent, so a verifier cannot
 *    tell how many exhibits were anchored. Carrying the odd node upward keeps leaf count
 *    binding: proofs carry `leafCount` and verification recomputes with it.
 */
import { sha256, toHex, fromHex } from './sha256.ts';

const LEAF_PREFIX = 0x00;
const NODE_PREFIX = 0x01;

/** Root of a tree with no leaves. Cannot collide with any real root, and is what `verify` compares against before the first anchor. */
export const EMPTY_ROOT = '0'.repeat(64);

export interface MerkleProofStep {
    hash: string;
    /** Where the sibling sits relative to the running hash at this level. */
    side: 'left' | 'right';
}

export interface MerkleInclusionProof {
    /** 0-based index of the leaf inside the anchored batch. */
    leafIndex: number;
    /** How many leaves the batch had — required, see choice (2) above. */
    leafCount: number;
    siblings: MerkleProofStep[];
    root: string;
}

const hashLeaf = async (leafHex: string): Promise<string> => {
    const payload = fromHex(leafHex);
    const framed = new Uint8Array(1 + payload.length);
    framed[0] = LEAF_PREFIX;
    framed.set(payload, 1);
    return toHex(await sha256(framed));
};

const hashNode = async (leftHex: string, rightHex: string): Promise<string> => {
    const left = fromHex(leftHex);
    const right = fromHex(rightHex);
    const framed = new Uint8Array(1 + left.length + right.length);
    framed[0] = NODE_PREFIX;
    framed.set(left, 1);
    framed.set(right, 1 + left.length);
    return toHex(await sha256(framed));
};

const nextLevel = async (level: string[]): Promise<string[]> => {
    const out: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
        if (i + 1 === level.length) out.push(level[i]);       // promote the odd node
        else out.push(await hashNode(level[i], level[i + 1]));
    }
    return out;
};

export interface MerkleTree {
    root: string;
    leaves: string[];
    /** levels[0] is the hashed leaves, the last element is `[root]`. */
    levels: string[][];
}

/**
 * @param leaves hex-encoded SHA-256 digests of the anchored payloads (not the payloads
 *               themselves — the tree commits to digests, so a leaf stays fixed width).
 */
export const buildMerkleTree = async (leaves: string[]): Promise<MerkleTree> => {
    if (leaves.length === 0) return { root: EMPTY_ROOT, leaves: [], levels: [] };
    let level = await Promise.all(leaves.map(hashLeaf));
    const levels: string[][] = [level];
    while (level.length > 1) {
        level = await nextLevel(level);
        levels.push(level);
    }
    return { root: level[0], leaves, levels };
};

export const merkleRoot = async (leaves: string[]): Promise<string> =>
    (await buildMerkleTree(leaves)).root;

export const createInclusionProof = async (
    leaves: string[],
    leafIndex: number
): Promise<MerkleInclusionProof> => {
    if (leafIndex < 0 || leafIndex >= leaves.length) {
        throw new Error(`Leaf index ${leafIndex} is outside a batch of ${leaves.length}`);
    }
    const tree = await buildMerkleTree(leaves);
    const siblings: MerkleProofStep[] = [];
    let index = leafIndex;
    // Walk up every level except the root, collecting the sibling at each step.
    for (let level = 0; level < tree.levels.length - 1; level++) {
        const nodes = tree.levels[level];
        const isRightNode = index % 2 === 1;
        const pairIndex = isRightNode ? index - 1 : index + 1;
        if (pairIndex < nodes.length) {
            siblings.push({ hash: nodes[pairIndex], side: isRightNode ? 'left' : 'right' });
        }
        // No pair means the node was promoted: no sibling at this level.
        index = Math.floor(index / 2);
    }
    return { leafIndex, leafCount: leaves.length, siblings, root: tree.root };
};

/**
 * The proof path a given (leafCount, leafIndex) *must* have: one step per level, present only
 * where the node has a pair at that level. Recomputing it here rather than trusting the
 * prover's step list is what stops a proof from describing a differently-sized tree that
 * happens to fold to the same root.
 */
const expectedPath = (leafCount: number, leafIndex: number): MerkleProofStep[] => {
    const steps: MerkleProofStep[] = [];
    let count = leafCount;
    let index = leafIndex;
    while (count > 1) {
        const isRightNode = index % 2 === 1;
        const pairIndex = isRightNode ? index - 1 : index + 1;
        if (pairIndex < count) {
            steps.push({ hash: '', side: isRightNode ? 'left' : 'right' });
        }
        count = Math.ceil(count / 2);
        index = Math.floor(index / 2);
    }
    return steps;
};

/**
 * Recompute the root from one leaf and its proof. Pure and local: this is the function an
 * offline verifier (defence counsel, a court kiosk, a second device) needs, and it is why
 * the Merkle structure exists at all.
 */
export const verifyInclusionProof = async (
    leafHex: string,
    proof: MerkleInclusionProof,
    expectedRoot?: string,
    options: {
        /**
         * The authoritative leaf count - taken from the *signed* anchor, never from the proof.
         * Without this, a prover can describe a 3-leaf batch as a 4-leaf one: the folded path is
         * the same, the root still matches, and the verifier silently accepts a statement about a
         * batch that was never anchored. The anchor's own `leafCount` is inside the signature, so
         * comparing against it is what makes the count unforgeable.
         */
        expectedLeafCount?: number;
    } = {}
): Promise<{ isValid: boolean; computedRoot: string; reason?: string }> => {
    const root = expectedRoot ?? proof.root;
    if (proof.leafCount <= 0) return { isValid: false, computedRoot: EMPTY_ROOT, reason: 'Empty batch' };
    if (options.expectedLeafCount !== undefined && options.expectedLeafCount !== proof.leafCount) {
        return {
            isValid: false,
            computedRoot: EMPTY_ROOT,
            reason: `Proof claims a batch of ${proof.leafCount} but the signed anchor covers ` +
                `${options.expectedLeafCount} - this record is not proven to belong to that anchor.`,
        };
    }
    if (expectedRoot && proof.root !== expectedRoot) {
        return {
            isValid: false,
            computedRoot: EMPTY_ROOT,
            reason: 'Proof names a different root than the anchor being verified against.',
        };
    }
    if (proof.leafIndex < 0 || proof.leafIndex >= proof.leafCount) {
        return { isValid: false, computedRoot: EMPTY_ROOT, reason: `Leaf index ${proof.leafIndex} outside batch of ${proof.leafCount}` };
    }
    const required = expectedPath(proof.leafCount, proof.leafIndex);
    if (proof.siblings.length !== required.length) {
        return {
            isValid: false,
            computedRoot: EMPTY_ROOT,
            reason: `Proof has ${proof.siblings.length} steps; a batch of ${proof.leafCount} at index ` +
                `${proof.leafIndex} requires exactly ${required.length}`,
        };
    }
    for (let i = 0; i < required.length; i++) {
        if (proof.siblings[i].side !== required[i].side) {
            return { isValid: false, computedRoot: EMPTY_ROOT, reason: `Step ${i} should take a sibling on the ${required[i].side}` };
        }
    }

    let running = await hashLeaf(leafHex);
    for (const step of proof.siblings) {
        running = step.side === 'left'
            ? await hashNode(step.hash, running)
            : await hashNode(running, step.hash);
    }
    return running === root
        ? { isValid: true, computedRoot: running }
        : { isValid: false, computedRoot: running, reason: 'Recomputed root does not match the anchored root' };
};
