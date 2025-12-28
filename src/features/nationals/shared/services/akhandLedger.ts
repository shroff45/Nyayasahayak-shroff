import {
    Case,
    BlockchainBlock,
    SmartBailContract,
    VerificationResult,
    BailContractStatus
} from '../../core/types';
import crypto from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Akhand Ledger - Quantum-Resistant Blockchain Service
 * Implements NIST Post-Quantum Cryptography simulation and Smart Bail Contracts.
 */
class AkhandLedger {
    private chain: BlockchainBlock[];
    private bailContracts: Map<string, SmartBailContract>;

    constructor() {
        this.chain = [];
        this.bailContracts = new Map();
        this.initializeBlockchain();
    }

    /**
     * Initialize the blockchain with a genesis block.
     */
    private initializeBlockchain(): void {
        const genesisBlock = this.createGenesisBlock();
        this.chain.push(genesisBlock);
    }

    /**
     * Create the first block in the chain.
     */
    private createGenesisBlock(): BlockchainBlock {
        const block: BlockchainBlock = {
            index: 0,
            timestamp: new Date().toISOString(),
            data: { message: "Genesis Block - Nyaya Sahayak" },
            previousHash: "0",
            hash: "",
            merkleRoot: "",
            nonce: 0
        };
        block.hash = this.calculateHash(block);
        return block;
    }

    /**
     * Calculate SHA-256 hash with PQC simulation (CRYSTALS-Kyber).
     * @param block The block to hash
     */
    private calculateHash(block: BlockchainBlock): string {
        const blockData = `${block.index}${block.timestamp}${JSON.stringify(block.data)}${block.previousHash}${block.nonce}`;
        const standardHash = crypto.SHA256(blockData).toString();

        // Simulate NIST CRYSTALS-Kyber Post-Quantum Cryptography
        // Prefix output with "PQC-v1:KYBER-1024-SALT-" to simulate quantum resistance as requested.
        const kyberSalt = "KYBER-1024-ENCAPSULATED-SALT";
        const pqcHash = crypto.SHA256(standardHash + kyberSalt).toString();

        return `PQC-v1:KYBER-1024-SALT-${pqcHash}`;
    }

    /**
     * Add a new block to the blockchain with case data.
     * @param caseData The case data to store
     */
    public addBlock(caseData: Case): { success: boolean; blockHash: string; transactionId: string } {
        const lastBlock = this.chain[this.chain.length - 1];
        const newBlock: BlockchainBlock = {
            index: lastBlock.index + 1,
            timestamp: new Date().toISOString(),
            data: caseData,
            previousHash: lastBlock.hash,
            hash: "",
            merkleRoot: "", // Optional implementation
            nonce: 0
        };

        newBlock.hash = this.calculateHash(newBlock);
        this.chain.push(newBlock);

        return {
            success: true,
            blockHash: newBlock.hash,
            transactionId: uuidv4()
        };
    }

    /**
     * Get the entire blockchain.
     */
    public getBlockchain(): BlockchainBlock[] {
        return this.chain;
    }

    /**
     * Verify the integrity of a specific case record.
     * @param caseId The ID of the case to verify
     */
    public verifyCase(caseId: string): VerificationResult {
        const block = this.chain.find(b => b.data && b.data.id === caseId);

        if (!block) {
            return {
                isAuthentic: false,
                originalHash: "",
                currentHash: "",
                tampered: true,
                timestamp: new Date().toISOString()
            };
        }

        const currentHash = this.calculateHash(block);
        const isAuthentic = currentHash === block.hash;

        return {
            isAuthentic,
            originalHash: block.hash,
            currentHash,
            tampered: !isAuthentic,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Verify the integrity of the entire chain.
     */
    public verifyChainIntegrity(): { isValid: boolean; totalBlocks: number; corruptedBlocks: number[] } {
        let isValid = true;
        const corruptedBlocks: number[] = [];

        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.hash !== this.calculateHash(currentBlock)) {
                isValid = false;
                corruptedBlocks.push(currentBlock.index);
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                isValid = false;
                if (!corruptedBlocks.includes(currentBlock.index)) {
                    corruptedBlocks.push(currentBlock.index);
                }
            }
        }

        return {
            isValid,
            totalBlocks: this.chain.length,
            corruptedBlocks
        };
    }

    /**
     * Simulate tampering for demo purposes.
     * @param blockIndex The index of the block to tamper with
     */
    public simulateTampering(blockIndex: number): void {
        if (blockIndex >= 0 && blockIndex < this.chain.length) {
            this.chain[blockIndex].data = { ...this.chain[blockIndex].data, tampered: true };
        }
    }

    // --- SMART BAIL CONTRACT METHODS ---

    /**
     * Create a new Smart Bail Contract.
     */
    public createBailContract(
        caseId: string,
        amount: number,
        accusedId: string,
        courtDates: string[]
    ): { success: boolean; transactionId: string } {
        const transactionId = uuidv4();

        const contract: SmartBailContract = {
            transactionId,
            caseId,
            accusedId,
            amount,
            currency: 'INR',
            status: 'LOCKED',
            creationDate: new Date().toISOString(),
            releaseConditions: {
                courtDates,
                jurisdiction: 'Supreme Court of India' // Default
            },
            biometricHash: '', // Initial empty hash
            verifiedAppearances: [],
            complianceScore: 0,
            refundEligible: false
        };

        this.bailContracts.set(transactionId, contract);

        // Record contract creation on blockchain
        this.addBlock({ ...contract, type: 'SMART_BAIL_CONTRACT' } as any);

        return { success: true, transactionId };
    }

    /**
     * Verify court appearance via biometric hash (simulated).
     */
    public verifyCourtAppearance(
        transactionId: string,
        date: string,
        biometricHash: string
    ): { success: boolean; appearancesRemaining: number; status: BailContractStatus } {
        const contract = this.bailContracts.get(transactionId);

        if (!contract || !biometricHash) {
            return { success: false, appearancesRemaining: 0, status: 'LOCKED' }; // Default fallback
        }

        if (contract.releaseConditions.courtDates.includes(date) && !contract.verifiedAppearances?.includes(date)) {
            if (!contract.verifiedAppearances) contract.verifiedAppearances = [];
            contract.verifiedAppearances.push(date);
            contract.complianceScore = (contract.verifiedAppearances.length / contract.releaseConditions.courtDates.length) * 100;

            if (contract.verifiedAppearances.length === contract.releaseConditions.courtDates.length) {
                contract.status = 'ACTIVE';
                contract.refundEligible = true;
            }

            this.bailContracts.set(transactionId, contract);

            return {
                success: true,
                appearancesRemaining: contract.releaseConditions.courtDates.length - contract.verifiedAppearances.length,
                status: contract.status
            };
        }

        return {
            success: false,
            appearancesRemaining: contract.releaseConditions.courtDates.length - (contract.verifiedAppearances?.length || 0),
            status: contract.status
        };
    }

    /**
     * Release bail amount if eligible.
     */
    public releaseBailAmount(transactionId: string): { success: boolean; message: string; refundAmount: number } {
        const contract = this.bailContracts.get(transactionId);

        if (contract && contract.refundEligible) {
            contract.status = 'REFUNDED';
            this.bailContracts.set(transactionId, contract);
            return {
                success: true,
                message: "Bail amount released successfully via Smart Contract.",
                refundAmount: contract.amount
            };
        }

        return {
            success: false,
            message: "Refund not eligible. Compliance conditions not met.",
            refundAmount: 0
        };
    }

    /**
     * Get the status of a bail contract.
     */
    public getBailContractStatus(transactionId: string): SmartBailContract | null {
        return this.bailContracts.get(transactionId) || null;
    }
}

// Export singleton instance
export const akhandLedger = new AkhandLedger();

// Export individual functions for easier usage if needed, or use the singleton
export const {
    addBlock,
    verifyCase,
    createBailContract,
    verifyCourtAppearance,
    releaseBailAmount,
    getBailContractStatus,
    simulateTampering,
    getBlockchain
} = akhandLedger;

// Bind methods to instance to avoid 'this' issues when destructured
akhandLedger.addBlock = akhandLedger.addBlock.bind(akhandLedger);
akhandLedger.verifyCase = akhandLedger.verifyCase.bind(akhandLedger);
akhandLedger.createBailContract = akhandLedger.createBailContract.bind(akhandLedger);
akhandLedger.verifyCourtAppearance = akhandLedger.verifyCourtAppearance.bind(akhandLedger);
akhandLedger.releaseBailAmount = akhandLedger.releaseBailAmount.bind(akhandLedger);
akhandLedger.getBailContractStatus = akhandLedger.getBailContractStatus.bind(akhandLedger);
akhandLedger.simulateTampering = akhandLedger.simulateTampering.bind(akhandLedger);
akhandLedger.getBlockchain = akhandLedger.getBlockchain.bind(akhandLedger);
