import { EvidenceAnalysis } from '../../core/types';

export class DocumentAnalysisService {

    // SIMULATED SAM 3 ENGINE
    // Returns instant, perfect segmentation for demo purposes to avoid API latency
    async analyze(imageUrl: string, caseId: string): Promise<EvidenceAnalysis> {

        // Simulate Processing Delay for realism (1.5s)
        await new Promise(resolve => setTimeout(resolve, 1500));

        return {
            id: `ev-${Date.now()}`,
            caseId,
            type: 'PHOTO',
            sourceUrl: imageUrl,
            detections: [
                { concept: "Stolen Laptop", confidence: 0.98, bbox: { x: 30, y: 40, w: 20, h: 15 } },
                { concept: "Suspect", confidence: 0.89, bbox: { x: 55, y: 20, w: 15, h: 40 } },
                { concept: "Crowbar", confidence: 0.85, bbox: { x: 52, y: 55, w: 5, h: 10 } }
            ],
            keyFindings: [
                "Electronic device matching stolen item description identified.",
                "Subject identified carrying bag consistent with witness statement.",
                "Point of entry (window) shows signs of forced impact."
            ]
        };
    }
}

export const documentAnalysis = new DocumentAnalysisService();
