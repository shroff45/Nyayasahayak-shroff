/**
 * bail.ts — the smart-bail escrow state machine, recorded in the ledger.
 *
 * Naming matters here. The previous module called this a "Smart Contract" and the panel said
 * "(DeFi)". Nothing about it is a smart contract: there is no chain, no autonomous execution and
 * no counterparty outside this browser. What it genuinely is, and what this file implements, is
 * a *conditional escrow record*: appearances are logged, compliance is a ratio of attended dates
 * to required dates, and at 100 % the record becomes refund-eligible. Keeping that logic in one
 * place is useful; describing it as DeFi was not.
 *
 * State is persisted through the ledger journal (one record per event), so a refresh no longer
 * resets a contract that had already been "released" - the failure mode of the module this
 * replaces, where contracts lived in a `Map` and vanished with the tab.
 */
import type { Ledger } from './ledger.ts';

export type BailStatus = 'LOCKED' | 'ACTIVE' | 'REFUNDED' | 'FORFEITED';

export interface BailContract {
    transactionId: string;
    caseId: string;
    accusedId: string;
    amount: number;
    currency: 'INR';
    status: BailStatus;
    /** Flat list kept for the existing golden-key consumers; identical to releaseConditions.courtDates. */
    courtDates: string[];
    releaseConditions: { courtDates: string[]; jurisdiction: string };
    creationDate: string;
    biometricHash: string;
    verifiedAppearances: string[];
    complianceScore: number;
    refundEligible: boolean;
}

type BailEvent =
    | { type: 'CREATED'; contract: BailContract }
    | { type: 'APPEARANCE_VERIFIED'; transactionId: string; date: string; at: string }
    | { type: 'REFUND_RELEASED'; transactionId: string; amount: number; at: string }
    | { type: 'FORFEITED'; transactionId: string; reason: string; at: string };

const complianceFor = (contract: BailContract, attended: string[]): number => {
    const required = contract.releaseConditions.courtDates.length;
    if (required === 0) return 0;
    return (attended.length / required) * 100;
};

export interface BailLedger {
    create(input: {
        caseId: string;
        accusedId: string;
        amount: number;
        courtDates: string[];
        jurisdiction: string;
        biometricHash?: string;
    }): Promise<BailContract>;
    get(transactionId: string): Promise<BailContract | null>;
    verifyAppearance(
        transactionId: string,
        date: string,
        biometricHash: string
    ): Promise<{ success: boolean; complianceScore: number; status: BailStatus; message: string }>;
    releaseRefund(transactionId: string): Promise<{ success: boolean; refundAmount: number; message: string }>;
    forfeit(transactionId: string, reason: string): Promise<{ success: boolean; message: string }>;
    list(): Promise<BailContract[]>;
}

/**
 * Rebuilds contract state from the event log on every read rather than caching it. Slower by a
 * few microseconds, and it means there is no in-memory copy to be stale after a reload or to
 * disagree between tabs - the two ways the previous implementation lost track of a release.
 */
export const createBailLedger = (ledger: Ledger): BailLedger => {
    const events = async (): Promise<BailEvent[]> => {
        const records = await ledger.records();
        return records
            .filter((r) => (r.data as { kind?: string }).kind === 'BAIL')
            .map((r) => (r.data as { event: BailEvent }).event);
    };

    const reduce = (all: BailEvent[]): Map<string, BailContract> => {
        const byId = new Map<string, BailContract>();
        for (const event of all) {
            if (event.type === 'CREATED') {
                byId.set(event.contract.transactionId, { ...event.contract });
                continue;
            }
            const contract = byId.get(event.transactionId);
            if (!contract) continue;   // an event for an unknown contract is ignored, not fatal
            switch (event.type) {
                case 'APPEARANCE_VERIFIED': {
                    const attended = [...new Set([...contract.verifiedAppearances, event.date])];
                    contract.verifiedAppearances = attended;
                    contract.complianceScore = complianceFor(contract, attended);
                    if (contract.complianceScore >= 100) {
                        contract.status = 'ACTIVE';
                        contract.refundEligible = true;
                    }
                    break;
                }
                case 'REFUND_RELEASED':
                    contract.status = 'REFUNDED';
                    break;
                case 'FORFEITED':
                    contract.status = 'FORFEITED';
                    contract.refundEligible = false;
                    break;
            }
        }
        return byId;
    };

    return {
        async create(input) {
            const courtDates = [...new Set(input.courtDates)].sort();
            const contract: BailContract = {
                transactionId: `BAIL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                caseId: input.caseId,
                accusedId: input.accusedId,
                amount: input.amount,
                currency: 'INR',
                status: 'LOCKED',
                courtDates,
                releaseConditions: { courtDates, jurisdiction: input.jurisdiction },
                creationDate: new Date().toISOString(),
                // No biometric capture exists in this build. Storing an explicit placeholder is
                // honest; the previous code generated a random-looking string that read like a
                // real template hash.
                biometricHash: input.biometricHash ?? 'NOT-CAPTURED',
                verifiedAppearances: [],
                complianceScore: 0,
                refundEligible: false,
            };
            await ledger.append({ kind: 'BAIL', data: { event: { type: 'CREATED', contract } } });
            await ledger.anchor();
            return contract;
        },

        async get(transactionId) {
            return (await reduce(await events())).get(transactionId) ?? null;
        },

        async list() {
            return [...(await reduce(await events())).values()];
        },

        async verifyAppearance(transactionId, date, biometricHash) {
            const all = await events();
            const contract = (await reduce(all)).get(transactionId);
            if (!contract) {
                return { success: false, complianceScore: 0, status: 'LOCKED', message: 'No such bail contract in the ledger.' };
            }
            if (!contract.releaseConditions.courtDates.includes(date)) {
                return {
                    success: false,
                    complianceScore: contract.complianceScore,
                    status: contract.status,
                    message: `${date} is not a scheduled date for ${transactionId}; an appearance cannot be recorded against it.`,
                };
            }
            if (contract.verifiedAppearances.includes(date)) {
                return {
                    success: false,
                    complianceScore: contract.complianceScore,
                    status: contract.status,
                    message: `${date} was already recorded for ${transactionId}.`,
                };
            }
            await ledger.append({
                kind: 'BAIL',
                data: {
                    event: { type: 'APPEARANCE_VERIFIED', transactionId, date, at: new Date().toISOString() },
                    // The attendance evidence (a capture digest, once capture exists) is recorded
                    // even though the state machine does not read it - it is what a court would ask for.
                    biometricHash,
                },
            });
            await ledger.anchor();
            const updated = (await reduce(await events())).get(transactionId)!;
            return {
                success: true,
                complianceScore: updated.complianceScore,
                status: updated.status,
                message: updated.complianceScore >= 100
                    ? `All ${updated.releaseConditions.courtDates.length} appearances recorded; contract is ACTIVE and refund-eligible.`
                    : `Recorded ${date}. ${updated.verifiedAppearances.length}/${updated.releaseConditions.courtDates.length} appearances so far.`,
            };
        },

        async releaseRefund(transactionId) {
            const contract = (await reduce(await events())).get(transactionId);
            if (!contract) return { success: false, refundAmount: 0, message: 'No such bail contract in the ledger.' };
            if (!contract.refundEligible) {
                return {
                    success: false,
                    refundAmount: 0,
                    message: `Refund refused: compliance is ${contract.complianceScore.toFixed(0)}%, not 100%. ` +
                        'The money stays locked until every scheduled appearance is recorded.',
                };
            }
            await ledger.append({
                kind: 'BAIL',
                data: { event: { type: 'REFUND_RELEASED', transactionId, amount: contract.amount, at: new Date().toISOString() } },
            });
            await ledger.anchor();
            return { success: true, refundAmount: contract.amount, message: `Refund of ₹${contract.amount} recorded against ${transactionId}.` };
        },

        async forfeit(transactionId, reason) {
            const contract = (await reduce(await events())).get(transactionId);
            if (!contract) return { success: false, message: 'No such bail contract in the ledger.' };
            await ledger.append({
                kind: 'BAIL',
                data: { event: { type: 'FORFEITED', transactionId, reason, at: new Date().toISOString() } },
            });
            await ledger.anchor();
            return { success: true, message: `Bail forfeited for ${transactionId}: ${reason}` };
        },
    };
};
