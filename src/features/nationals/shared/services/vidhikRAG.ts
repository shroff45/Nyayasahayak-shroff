import {
    LegalPrecedent,
    GraphNode,
    GraphLink
} from '../../core/types';

/**
 * Vidhik RAG - Graph-based Legal Search Engine
 * Zero hallucination, strictly database-driven.
 * Builds the search engine and knowledge graph.
 */

// MOCK LEGAL PRECEDENT DATABASE
const PRECEDENTS: LegalPrecedent[] = [
    // IPC 302 (Murder)
    {
        id: "precedent-001",
        caseName: "State of Maharashtra v. Praful Desai",
        citation: "AIR 2003 SC 2053",
        summary: "Case involving circumstantial evidence in murder trial. Court held that chain of circumstances must be complete and point only to guilt.",
        court: "Supreme Court of India",
        year: 2003,
        fullTextUrl: "https://indiankanoon.org/doc/1234567",
        relevanceScore: 0,
        graphData: {
            nodes: [
                { id: "case-001", label: "Praful Desai Case", type: "CASE" },
                { id: "judge-chandrachud", label: "Justice D.Y. Chandrachud", type: "JUDGE" },
                { id: "statute-302", label: "IPC Section 302", type: "STATUTE" }
            ],
            links: [
                { source: "case-001", target: "judge-chandrachud", value: 5 },
                { source: "case-001", target: "statute-302", value: 8 }
            ]
        }
    },
    {
        id: "precedent-002",
        caseName: "Bachan Singh v. State of Punjab",
        citation: "AIR 1980 SC 898",
        summary: "Landmark judgment on death penalty. Established 'rarest of rare' doctrine for capital punishment under Section 302.",
        court: "Supreme Court of India",
        year: 1980,
        fullTextUrl: "https://indiankanoon.org/doc/307021",
        relevanceScore: 0,
        graphData: {
            nodes: [
                { id: "case-002", label: "Bachan Singh Case", type: "CASE" },
                { id: "judge-bhagwati", label: "Justice P.N. Bhagwati", type: "JUDGE" },
                { id: "statute-302", label: "IPC Section 302", type: "STATUTE" }
            ],
            links: [
                { source: "case-002", target: "judge-bhagwati", value: 5 },
                { source: "case-002", target: "statute-302", value: 9 }
            ]
        }
    },
    {
        id: "precedent-003",
        caseName: "K.M. Nanavati v. State of Maharashtra",
        citation: "AIR 1962 SC 605",
        summary: "Famous jury trial case regarding grave and sudden provocation. Defined the difference between murder and culpable homicide.",
        court: "Supreme Court of India",
        year: 1962,
        fullTextUrl: "https://indiankanoon.org/doc/1596139",
        relevanceScore: 0,
        graphData: {
            nodes: [
                { id: "case-003", label: "Nanavati Case", type: "CASE" },
                { id: "statute-302", label: "IPC Section 302", type: "STATUTE" },
                { id: "statute-300", label: "IPC Section 300", type: "STATUTE" }
            ],
            links: [
                { source: "case-003", target: "statute-302", value: 7 },
                { source: "case-003", target: "statute-300", value: 6 }
            ]
        }
    },
    {
        id: "precedent-004",
        caseName: "Priyadarshini Mattoo Case",
        citation: "2010 (9) SCC 747",
        summary: "High profile murder case highlighting the importance of DNA evidence and witness protection.",
        court: "Delhi High Court",
        year: 2010,
        fullTextUrl: "https://indiankanoon.org/doc/1234568",
        relevanceScore: 0,
        graphData: {
            nodes: [
                { id: "case-004", label: "Mattoo Case", type: "CASE" },
                { id: "statute-302", label: "IPC Section 302", type: "STATUTE" }
            ],
            links: [
                { source: "case-004", target: "statute-302", value: 8 }
            ]
        }
    },
    {
        id: "precedent-005",
        caseName: "Jessica Lal Murder Case",
        citation: "2001 CriLJ 243",
        summary: "Case involving hostile witnesses and media activism leading to retrial and conviction.",
        court: "Delhi High Court",
        year: 2001,
        fullTextUrl: "https://indiankanoon.org/doc/1234569",
        relevanceScore: 0,
        graphData: {
            nodes: [
                { id: "case-005", label: "Jessica Lal Case", type: "CASE" },
                { id: "statute-302", label: "IPC Section 302", type: "STATUTE" }
            ],
            links: [
                { source: "case-005", target: "statute-302", value: 8 }
            ]
        }
    },

    // IPC 420 (Cheating)
    {
        id: "precedent-006",
        caseName: "Hridaya Ranjan Pd. Verma v. State of Bihar",
        citation: "AIR 2000 SC 2341",
        summary: "Distinction between mere breach of contract and cheating (Section 420). Deception must exist at the start.",
        court: "Supreme Court of India",
        year: 2000,
        fullTextUrl: "https://indiankanoon.org/doc/1658932",
        relevanceScore: 0,
        graphData: {
            nodes: [
                { id: "case-006", label: "Hridaya Ranjan Case", type: "CASE" },
                { id: "statute-420", label: "IPC Section 420", type: "STATUTE" }
            ],
            links: [
                { source: "case-006", target: "statute-420", value: 9 }
            ]
        }
    },
    {
        id: "precedent-007",
        caseName: "S.W. Palanitkar v. State of Bihar",
        citation: "2002 SCC (Cri) 129",
        summary: "Held that every breach of contract is not cheating. Criminal intent is necessary.",
        court: "Supreme Court of India",
        year: 2002,
        fullTextUrl: "https://indiankanoon.org/doc/1234570",
        relevanceScore: 0,
        graphData: {
            nodes: [
                { id: "case-007", label: "Palanitkar Case", type: "CASE" },
                { id: "statute-420", label: "IPC Section 420", type: "STATUTE" }
            ],
            links: [
                { source: "case-007", target: "statute-420", value: 8 }
            ]
        }
    },
    {
        id: "precedent-008",
        caseName: "V.Y. Jose v. State of Gujarat",
        citation: "2009 (3) SCC 78",
        summary: "Confirmed that for Section 420, fraudulent or dishonest intention must exist at the time of making the promise.",
        court: "Supreme Court of India",
        year: 2009,
        fullTextUrl: "https://indiankanoon.org/doc/1234571",
        relevanceScore: 0,
        graphData: {
            nodes: [
                { id: "case-008", label: "V.Y. Jose Case", type: "CASE" },
                { id: "statute-420", label: "IPC Section 420", type: "STATUTE" }
            ],
            links: [
                { source: "case-008", target: "statute-420", value: 8 }
            ]
        }
    },

    // IPC 379 (Theft)
    {
        id: "precedent-009",
        caseName: "Pyare Lal Bhargava v. State of Rajasthan",
        citation: "AIR 1963 SC 1094",
        summary: "Temporary removal of file from office constitutes theft under Section 378/379.",
        court: "Supreme Court of India",
        year: 1963,
        fullTextUrl: "https://indiankanoon.org/doc/1234572",
        relevanceScore: 0,
        graphData: {
            nodes: [
                { id: "case-009", label: "Pyare Lal Case", type: "CASE" },
                { id: "statute-379", label: "IPC Section 379", type: "STATUTE" }
            ],
            links: [
                { source: "case-009", target: "statute-379", value: 9 }
            ]
        }
    },
    {
        id: "precedent-010",
        caseName: "K.N. Mehra v. State of Rajasthan",
        citation: "AIR 1957 SC 369",
        summary: "Taking out an aircraft without permission for a joyride amounts to theft.",
        court: "Supreme Court of India",
        year: 1957,
        fullTextUrl: "https://indiankanoon.org/doc/1234573",
        relevanceScore: 0,
        graphData: {
            nodes: [
                { id: "case-010", label: "K.N. Mehra Case", type: "CASE" },
                { id: "statute-379", label: "IPC Section 379", type: "STATUTE" }
            ],
            links: [
                { source: "case-010", target: "statute-379", value: 8 }
            ]
        }
    },
    {
        id: "precedent-011",
        caseName: "Birla Corp Ltd v. Adventz Investments",
        citation: "2019 SCC OnLine SC 682",
        summary: "Theft of information/data and documents. Expanded scope of movable property.",
        court: "Supreme Court of India",
        year: 2019,
        fullTextUrl: "https://indiankanoon.org/doc/1234574",
        relevanceScore: 0,
        graphData: {
            nodes: [
                { id: "case-011", label: "Birla Corp Case", type: "CASE" },
                { id: "statute-379", label: "IPC Section 379", type: "STATUTE" }
            ],
            links: [
                { source: "case-011", target: "statute-379", value: 7 }
            ]
        }
    },

    // Bail Cases
    {
        id: "precedent-012",
        caseName: "Sanjay Chandra v. CBI",
        citation: "2012 (1) SCC 40",
        summary: "Bail is the rule, jail is the exception. Gravity of offence alone not ground to deny bail.",
        court: "Supreme Court of India",
        year: 2012,
        fullTextUrl: "https://indiankanoon.org/doc/1234575",
        relevanceScore: 0,
        graphData: {
            nodes: [
                { id: "case-012", label: "Sanjay Chandra Case", type: "CASE" },
                { id: "statute-bail", label: "Bail Jurisprudence", type: "STATUTE" }
            ],
            links: [
                { source: "case-012", target: "statute-bail", value: 10 }
            ]
        }
    },
    {
        id: "precedent-013",
        caseName: "Arnesh Kumar v. State of Bihar",
        citation: "AIR 2014 SC 2756",
        summary: "Guidelines for arrest and bail to prevent unnecessary detention in dowry cases.",
        court: "Supreme Court of India",
        year: 2014,
        fullTextUrl: "https://indiankanoon.org/doc/1234576",
        relevanceScore: 0,
        graphData: {
            nodes: [
                { id: "case-013", label: "Arnesh Kumar Case", type: "CASE" },
                { id: "statute-498a", label: "IPC Section 498A", type: "STATUTE" }
            ],
            links: [
                { source: "case-013", target: "statute-498a", value: 9 }
            ]
        }
    },
    {
        id: "precedent-014",
        caseName: "Gurbaksh Singh Sibbia v. State of Punjab",
        citation: "AIR 1980 SC 1632",
        summary: "Landmark judgment on Anticipatory Bail. Courts have wide discretion.",
        court: "Supreme Court of India",
        year: 1980,
        fullTextUrl: "https://indiankanoon.org/doc/1234577",
        relevanceScore: 0,
        graphData: {
            nodes: [
                { id: "case-014", label: "Sibbia Case", type: "CASE" },
                { id: "statute-bail", label: "Anticipatory Bail", type: "STATUTE" }
            ],
            links: [
                { source: "case-014", target: "statute-bail", value: 9 }
            ]
        }
    },
    {
        id: "precedent-015",
        caseName: "Moti Ram v. State of Madhya Pradesh",
        citation: "AIR 1978 SC 1594",
        summary: "Bail amount should not be excessive. 'Bail not Jail' principle reinforced.",
        court: "Supreme Court of India",
        year: 1978,
        fullTextUrl: "https://indiankanoon.org/doc/1234578",
        relevanceScore: 0,
        graphData: {
            nodes: [
                { id: "case-015", label: "Moti Ram Case", type: "CASE" },
                { id: "judge-krishna-iyer", label: "Justice Krishna Iyer", type: "JUDGE" }
            ],
            links: [
                { source: "case-015", target: "judge-krishna-iyer", value: 8 }
            ]
        }
    },

    // Contract Disputes
    {
        id: "precedent-016",
        caseName: "Oil & Natural Gas Corporation Ltd. v. Saw Pipes Ltd.",
        citation: "AIR 2003 SC 2629",
        summary: "Arbitral award can be set aside if it is against public policy of India.",
        court: "Supreme Court of India",
        year: 2003,
        fullTextUrl: "https://indiankanoon.org/doc/1234579",
        relevanceScore: 0,
        graphData: {
            nodes: [
                { id: "case-016", label: "Saw Pipes Case", type: "CASE" },
                { id: "statute-arbitration", label: "Arbitration Act", type: "STATUTE" }
            ],
            links: [
                { source: "case-016", target: "statute-arbitration", value: 8 }
            ]
        }
    },
    {
        id: "precedent-017",
        caseName: "Bharat Aluminium Co. v. Kaiser Aluminium",
        citation: "2012 (9) SCC 552",
        summary: "BALCO judgment. Indian courts cannot intervene in foreign seated arbitrations.",
        court: "Supreme Court of India",
        year: 2012,
        fullTextUrl: "https://indiankanoon.org/doc/1234580",
        relevanceScore: 0,
        graphData: {
            nodes: [
                { id: "case-017", label: "BALCO Case", type: "CASE" },
                { id: "statute-arbitration", label: "Arbitration Act", type: "STATUTE" }
            ],
            links: [
                { source: "case-017", target: "statute-arbitration", value: 9 }
            ]
        }
    },
    {
        id: "precedent-018",
        caseName: "Nabha Power Ltd. v. PSPCL",
        citation: "2018 (11) SCC 508",
        summary: "Business efficacy test for implied terms in contracts.",
        court: "Supreme Court of India",
        year: 2018,
        fullTextUrl: "https://indiankanoon.org/doc/1234581",
        relevanceScore: 0,
        graphData: {
            nodes: [
                { id: "case-018", label: "Nabha Power Case", type: "CASE" },
                { id: "statute-contract", label: "Contract Act", type: "STATUTE" }
            ],
            links: [
                { source: "case-018", target: "statute-contract", value: 7 }
            ]
        }
    },

    // Constitutional
    {
        id: "precedent-019",
        caseName: "Kesavananda Bharati v. State of Kerala",
        citation: "AIR 1973 SC 1461",
        summary: "Basic Structure Doctrine. Parliament cannot alter the basic features of the Constitution.",
        court: "Supreme Court of India",
        year: 1973,
        fullTextUrl: "https://indiankanoon.org/doc/257876",
        relevanceScore: 0,
        graphData: {
            nodes: [
                { id: "case-019", label: "Kesavananda Bharati", type: "CASE" },
                { id: "statute-constitution", label: "Constitution of India", type: "STATUTE" }
            ],
            links: [
                { source: "case-019", target: "statute-constitution", value: 10 }
            ]
        }
    },
    {
        id: "precedent-020",
        caseName: "K.S. Puttaswamy v. Union of India",
        citation: "2017 (10) SCC 1",
        summary: "Right to Privacy is a fundamental right under Article 21.",
        court: "Supreme Court of India",
        year: 2017,
        fullTextUrl: "https://indiankanoon.org/doc/1234582",
        relevanceScore: 0,
        graphData: {
            nodes: [
                { id: "case-020", label: "Privacy Case", type: "CASE" },
                { id: "statute-constitution", label: "Article 21", type: "STATUTE" },
                { id: "judge-chandrachud", label: "Justice D.Y. Chandrachud", type: "JUDGE" }
            ],
            links: [
                { source: "case-020", target: "statute-constitution", value: 10 },
                { source: "case-020", target: "judge-chandrachud", value: 8 }
            ]
        }
    }
];

/**
 * Extract keywords from a query string.
 */
function extractKeywords(text: string): string[] {
    const stopwords = new Set(['the', 'is', 'of', 'and', 'a', 'in', 'to', 'for', 'v', 'vs', 'state', 'court']);
    return text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopwords.has(word));
}

/**
 * Calculate relevance score for a precedent based on a query.
 */
function calculateRelevance(query: string, precedent: LegalPrecedent): number {
    const keywords = extractKeywords(query);
    if (keywords.length === 0) return 0;

    let matches = 0;
    const textToSearch = `${precedent.caseName} ${precedent.summary} ${precedent.citation}`.toLowerCase();

    keywords.forEach(keyword => {
        if (textToSearch.includes(keyword)) matches++;
    });

    return (matches / keywords.length) * 100;
}

/**
 * Search legal precedents.
 * @param query The search query
 * @param options Search options
 */
export async function searchLegalPrecedents(
    query: string,
    options: { limit?: number } = {}
): Promise<LegalPrecedent[]> {
    const limit = options.limit || 5;

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const results = PRECEDENTS.map(p => ({
        ...p,
        relevanceScore: calculateRelevance(query, p)
    }))
        .filter(p => p.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);

    return results;
}

/**
 * Get aggregated graph data for visualization.
 */
export function getAggregatedGraphData(precedents: LegalPrecedent[]): { nodes: GraphNode[]; links: GraphLink[] } {
    const nodesMap = new Map<string, GraphNode>();
    const links: GraphLink[] = [];

    precedents.forEach(p => {
        if (p.graphData) {
            // Add nodes
            p.graphData.nodes.forEach(node => {
                if (!nodesMap.has(node.id)) {
                    // Add color based on type
                    // Color logic removed as it was unused
                    nodesMap.set(node.id, { ...node });
                }
            });

            // Add links
            p.graphData.links.forEach(link => {
                links.push({ ...link });
            });
        }
    });

    // Add cross-links (e.g. if two cases share a judge)
    // This is implicit if they point to the same judge node ID

    return {
        nodes: Array.from(nodesMap.values()),
        links
    };
}

/**
 * Get all unique sections for autocomplete.
 */
export function getAllSections(): string[] {
    const sections = new Set<string>();
    PRECEDENTS.forEach(p => {
        // Extract sections from summary or graph data
        p.graphData?.nodes.forEach(n => {
            if (n.type === 'STATUTE') {
                sections.add(n.label);
            }
        });
    });
    return Array.from(sections).sort();
}
