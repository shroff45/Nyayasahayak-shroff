
import { GoogleGenAI, Type, GenerateContentResponse, Part } from "@google/genai";
import type { Case, PredictionResult, DocumentAnalysisResult, ChatMessage } from "../../../types";
// 4(a)-ii-a: the case the model is asked about is the golden shape, not the legacy intake record. This is
// not a cosmetic swap and it is not a side effect: `predictCaseOutcomeInternal` sends
// `JSON.stringify(sanitizedCase)` as the prompt, so the model now reads `cnrNumber`/`complainant`/
// `sectionsInvoked` where it used to read `caseNumber`/`petitioner`/`invokedActs`, and it no longer
// receives three fields the golden shape does not carry:
//   * `title` - UI chrome the user typed, not case data;
//   * `lastHearingDate` - scheduling state, not a triage input;
//   * `pii` - the inverse of redaction. It mapped real names to their placeholders, so sending it to an
//     external API handed the recipient the very table that could undo the redaction. The values in the
//     record are still redacted (`piiService.redact` mutates them before this call), so the model sees
//     redacted text without the key to reverse it. Losing all three is the point.
// The key names are pinned by `tools/statute_tests.mjs` section B and claim 33 in the harness, so this
// contract cannot quietly change again while every caller still compiles.
import { withErrorRecovery } from "../lib/withErrorRecovery";

/**
 * The Gemini API key is optional. This application's guarantees - hashing the evidence, chaining the
 * journal, anchoring a batch and printing a certificate that re-verifies offline - are all computed
 * locally and must keep working with no key at all. The language-model screens are an enhancement.
 *
 * This used to be a module-scope `throw` when the key was missing, which meant a clone without a key
 * did not merely lose the AI features: the import blew up and five routed screens rendered nothing.
 * A module import must never be able to take the app down. So the client is built lazily, on first
 * use, and every consumer asks `isGeminiConfigured()` before it tries to.
 */
const PLACEHOLDER = /^(your|xxx|todo|tbd|changeme|replace|placeholder|dummy|sample|none|<)/i;

const readKey = (): string | undefined => {
    const key = (import.meta.env.VITE_API_KEY as string | undefined)?.trim();
    // A .env checked in with `YOUR_KEY_HERE` in it is as unconfigured as no file at all, and treating
    // it as real would send a doomed request on every click and blame the network for it.
    if (!key || PLACEHOLDER.test(key)) return undefined;
    return key;
};

export const isGeminiConfigured = (): boolean => readKey() !== undefined;

let client: GoogleGenAI | null = null;
const gemini = (): GoogleGenAI => {
    const key = readKey();
    if (!key) {
        throw new Error('Gemini is not configured: set VITE_API_KEY in .env to enable the language-model screens.');
    }
    if (!client) client = new GoogleGenAI({ apiKey: key });
    return client;
};

const predictCaseOutcomeInternal = async (sanitizedCase: Case, language: string): Promise<PredictionResult> => {
    const langMap: { [key: string]: string } = {
        en: 'English',
        hi: 'Hindi',
        ta: 'Tamil',
        te: 'Telugu',
        bn: 'Bengali',
        mr: 'Marathi',
        gu: 'Gujarati',
        kn: 'Kannada',
        ml: 'Malayalam',
        pa: 'Punjabi',
        or: 'Odia',
        sa: 'Sanskrit',
        ur: 'Urdu',
        as: 'Assamese',
        mai: 'Maithili',
        sat: 'Santali',
        ks: 'Kashmiri',
        kok: 'Konkani',
        sd: 'Sindhi',
        doi: 'Dogri',
        mni: 'Manipuri',
        brx: 'Bodo',
        ne: 'Nepali'
    };
    const targetLanguage = langMap[language as keyof typeof langMap] || 'English';

    const response = await gemini().models.generateContent({
        model: "gemini-2.5-pro",
        contents: `Analyze the following Indian legal case and provide a triage assessment. The entire JSON response, including all text fields like rationale and contributingFactors, must be in ${targetLanguage}. Case Data: ${JSON.stringify(sanitizedCase)}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    priority: {
                        type: Type.STRING,
                        description: 'Priority level of the case (High, Medium, or Low).',
                    },
                    rationale: {
                        type: Type.STRING,
                        description: 'A detailed explanation for the assigned priority.',
                    },
                    contributingFactors: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: 'Top 3-5 factors influencing the priority.',
                    },
                    legalCitations: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: 'Relevant legal acts or precedents.',
                    },
                },
                required: ["priority", "rationale", "contributingFactors", "legalCitations"],
            },
        },
    });

    const jsonText = response.text ? response.text.trim() : "{}";
    return JSON.parse(jsonText);
};

const analyzeDocumentsInternal = async (parts: Part[]): Promise<DocumentAnalysisResult> => {
    const response = await gemini().models.generateContent({
        model: "gemini-2.5-pro",
        contents: { parts: [...parts, { text: "Analyze the provided Indian legal documents. Summarize them, assess severity, provide a confidence score for your analysis, and recommend the appropriate court. Also, extract the key legal issues, identify all entities (people, organizations, locations, dates), and list any potential legal precedents or cited case laws." }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING, description: "A concise summary of the document's content." },
                    severity: { type: Type.STRING, enum: ['High', 'Medium', 'Low'], description: "The severity or urgency of the case based on the document." },
                    confidenceScore: { type: Type.NUMBER, description: "A score from 0.0 to 1.0 indicating the confidence in the analysis." },
                    recommendedCourt: { type: Type.STRING, description: "The appropriate court in the Indian legal system for this matter." },
                    keyLegalIssues: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "A list of the main legal questions or points of contention."
                    },
                    identifiedEntities: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                type: { type: Type.STRING, enum: ['PERSON', 'ORGANIZATION', 'LOCATION', 'DATE'] }
                            },
                            required: ["name", "type"]
                        },
                        description: "A list of named entities found in the document."
                    },
                    potentialPrecedents: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "A list of relevant case laws, statutes, or legal precedents mentioned or implied."
                    }
                },
                required: ["summary", "severity", "confidenceScore", "recommendedCourt", "keyLegalIssues", "identifiedEntities", "potentialPrecedents"],
            },
        }
    });

    return JSON.parse(response.text ? response.text.trim() : "{}");
};

const chatWithNyayabotInternal = async (message: string, ragParts?: Part[], history: ChatMessage[] = []): Promise<GenerateContentResponse> => {
    const useGoogleSearch = !ragParts || ragParts.length === 0;

    // The Gemini API requires conversation history to start with a user message.
    // We process the history to ensure it's valid.
    let processedHistory = history.slice(0, -1); // Exclude the latest user message

    const firstUserIndex = processedHistory.findIndex(m => m.role === 'user');

    // If a user message exists, slice the history to start from there. Otherwise, start fresh.
    processedHistory = firstUserIndex > -1 ? processedHistory.slice(firstUserIndex) : [];

    // Map to the format Gemini expects
    const contents: any[] = processedHistory
        .filter(msg => msg.role === 'user' || msg.role === 'model')
        .map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content || '' }]
        }));

    // Prepare the parts for the current user message
    const currentMessageParts: Part[] = [];
    let finalMessage = message;

    if (ragParts && ragParts.length > 0) {
        currentMessageParts.push(...ragParts);
        finalMessage = `Based ONLY on the context from the provided document(s), answer the following question about Social Sciences, History, Geography, or Civics. If the answer is not in the documents, say that you cannot find the answer in the provided context. Question: ${message}`;
    }
    currentMessageParts.push({ text: finalMessage });

    // Add the current user message to the contents array
    contents.push({ role: 'user', parts: currentMessageParts });

    // These two fields used to sit next to `config` rather than inside it, under a suppression comment
    // that claimed the SDK types were out of date. They were not: the SDK ignores unknown fields, so the
    // topic guardrail and the search tool were silently dropped on every call. Removing the
    // suppression is what found it.
    const response = await gemini().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
            systemInstruction: "You are NYAYABOT. You are strictly limited to discussing Social Sciences, History, Geography, and Political studies or civics. If a user asks about anything else, politely decline and explain that you only discuss these topics. Do not answer questions outside this scope. You can use Google Search to find accurate information regarding these subjects.",
            tools: useGoogleSearch ? [{ googleSearch: {} }] : [],
        },
    });
    return response;
};


/** What to tell the user when no analysis exists. One string, so the five screens cannot drift. */
export const AI_NOT_CONFIGURED =
    'AI analysis is not configured. Set VITE_API_KEY in .env and restart the dev server. Nothing was sent, and nothing was invented in its place.';

type Unavailability = 'unconfigured' | 'unreachable';

const whyNot = (reason: Unavailability): string =>
    reason === 'unconfigured'
        ? 'AI analysis is not configured on this device, so no request was made.'
        : 'AI analysis could not be reached. This is a fallback response, not a result.';

// These two objects are the shape the screens already know how to render. They carry no verdict that
// the model did not give: `severity`/`priority` are the type's required fields, so they are pinned to
// the least alarming value and the summary says plainly that nothing was analysed.
const fallbackPrediction = (reason: Unavailability): PredictionResult => ({
    priority: 'Medium',
    rationale: whyNot(reason),
    contributingFactors: [reason === 'unconfigured' ? 'VITE_API_KEY not set' : 'API communication failure'],
    legalCitations: ['N/A']
});

const fallbackDocAnalysis = (reason: Unavailability): DocumentAnalysisResult => ({
    summary: whyNot(reason),
    severity: 'Medium',
    confidenceScore: 0.0,
    recommendedCourt: 'N/A',
    keyLegalIssues: ['No analysis available.'],
    identifiedEntities: [],
    potentialPrecedents: ['N/A'],
    riskScore: 0, // Added default
    entities: [], // Added default
    sentiment: 'Neutral' // Added default
});

// There is deliberately no fingerprint fallback object here. The previous one wrote the sentence
// "Error generating hash: Fallback response due to API failure." into `quantumHash` - which a screen
// then printed in a monospace block as if it were a digest - and asserted `integrityStatus:
// 'Potential Tampering Detected'`. So an offline machine accused every document of tampering. When the
// model cannot be reached the answer is `null`: no analysis, no verdict, no invented digest.


export const geminiService = {
    // Without a key there is nothing to retry, so short-circuit instead of sleeping through three
    // backoffs and then reporting a "network error" that never happened.
    predictCaseOutcome: (sanitizedCase: Case, language: string): Promise<PredictionResult> =>
        isGeminiConfigured()
            ? withErrorRecovery(() => predictCaseOutcomeInternal(sanitizedCase, language), fallbackPrediction('unreachable'))
            : Promise.resolve(fallbackPrediction('unconfigured')),
    analyzeDocuments: (parts: Part[]): Promise<DocumentAnalysisResult> =>
        isGeminiConfigured()
            ? withErrorRecovery(() => analyzeDocumentsInternal(parts), fallbackDocAnalysis('unreachable'))
            : Promise.resolve(fallbackDocAnalysis('unconfigured')),
    chatWithNyayabot: async (message: string, ragParts?: Part[], history?: ChatMessage[]) => {
        if (!isGeminiConfigured()) throw new Error(AI_NOT_CONFIGURED);
        return chatWithNyayabotInternal(message, ragParts, history);
    },
    transcribeAudio: async (audioPart: Part) => {
        const response = await gemini().models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: [audioPart, { text: "Transcribe this audio recording." }] }
        });
        return response.text || '';
    },
    analyzeArgument: async (argument: string) => {
        const response = await gemini().models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `You are a helpful legal assistant. Analyze the following legal argument in a neutral and objective tone. Do not express personal opinions or excitement. Identify its strengths (if any), weaknesses, potential counterarguments, and provide strategic recommendations for a legal professional. Argument: "${argument}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        introduction: {
                            type: Type.STRING,
                            description: "A brief, neutral introduction to the analysis of the argument provided."
                        },
                        strengths: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "A list of potential strengths or valid points within the argument, if any."
                        },
                        weaknesses: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "A list of weaknesses, logical fallacies, or legally unsupported claims in the argument."
                        },
                        counterarguments: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "A list of potential counterarguments to refute the provided statement."
                        },
                        strategicRecommendations: {
                            type: Type.STRING,
                            description: "Actionable strategic advice for a legal professional on how to address this argument."
                        }
                    },
                    required: ["introduction", "strengths", "weaknesses", "counterarguments", "strategicRecommendations"]
                }
            }
        });
        return JSON.parse(response.text ? response.text.trim() : "{}");
    },
    getProceduralWalkthrough: async (caseType: string, ragParts?: Part[]) => {
        const promptParts: Part[] = [];
        let promptText = `Provide a step-by-step procedural walkthrough for a "${caseType}" case in the Indian legal system. Be comprehensive and clear.`;

        if (ragParts && ragParts.length > 0) {
            promptParts.push(...ragParts);
            promptText = `Based *only* on the provided legal document(s), generate a detailed, step-by-step procedural walkthrough for a "${caseType}" case. If the documents do not contain enough information, state that clearly.`;
        }
        promptParts.push({ text: promptText });

        const response = await gemini().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: promptParts }
        });
        return response.text || '';
    }
};
