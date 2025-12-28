import {
    LegalPrecedent,
    GraphNode,
    GraphLink
} from '../types';

// MOCK DATABASE (50 Precedents)
const LEGAL_DATABASE: LegalPrecedent[] = [
    // Category 1: Criminal Law (10 cases)
    { id: "PREC-001", caseName: "State of Maharashtra v. Praful Desai", citation: "AIR 2003 SC 2053", summary: "Landmark judgment on video conferencing in criminal trials.", court: "Supreme Court of India", year: 2003, fullTextUrl: "https://indiankanoon.org/doc/168903/", relevanceScore: 0 },
    { id: "PREC-002", caseName: "K.M. Nanavati v. State of Maharashtra", citation: "AIR 1962 SC 605", summary: "Last jury trial in India, defining grave and sudden provocation.", court: "Supreme Court of India", year: 1962, fullTextUrl: "https://indiankanoon.org/doc/1596139/", relevanceScore: 0 },
    { id: "PREC-003", caseName: "Bachan Singh v. State of Punjab", citation: "AIR 1980 SC 898", summary: "Rarest of rare doctrine for death penalty.", court: "Supreme Court of India", year: 1980, fullTextUrl: "https://indiankanoon.org/doc/307021/", relevanceScore: 0 },
    { id: "PREC-004", caseName: "Shreya Singhal v. Union of India", citation: "AIR 2015 SC 1523", summary: "Struck down Section 66A of IT Act protecting online speech.", court: "Supreme Court of India", year: 2015, fullTextUrl: "https://indiankanoon.org/doc/110813550/", relevanceScore: 0 },
    { id: "PREC-005", caseName: "Lalita Kumari v. Govt. of U.P.", citation: "AIR 2014 SC 187", summary: "Mandatory registration of FIR in cognizable offenses.", court: "Supreme Court of India", year: 2014, fullTextUrl: "https://indiankanoon.org/doc/10239019/", relevanceScore: 0 },
    { id: "PREC-006", caseName: "Arnesh Kumar v. State of Bihar", citation: "AIR 2014 SC 2756", summary: "Guidelines for arrest to prevent misuse of Section 498A.", court: "Supreme Court of India", year: 2014, fullTextUrl: "https://indiankanoon.org/doc/2982624/", relevanceScore: 0 },
    { id: "PREC-007", caseName: "D.K. Basu v. State of West Bengal", citation: "AIR 1997 SC 610", summary: "Guidelines to prevent custodial torture and deaths.", court: "Supreme Court of India", year: 1997, fullTextUrl: "https://indiankanoon.org/doc/501198/", relevanceScore: 0 },
    { id: "PREC-008", caseName: "Vishaka v. State of Rajasthan", citation: "AIR 1997 SC 3011", summary: "Guidelines against sexual harassment at workplace.", court: "Supreme Court of India", year: 1997, fullTextUrl: "https://indiankanoon.org/doc/1031794/", relevanceScore: 0 },
    { id: "PREC-009", caseName: "Maneka Gandhi v. Union of India", citation: "AIR 1978 SC 597", summary: "Expanded scope of Article 21 (Right to Life).", court: "Supreme Court of India", year: 1978, fullTextUrl: "https://indiankanoon.org/doc/1766147/", relevanceScore: 0 },
    { id: "PREC-010", caseName: "Common Cause v. Union of India", citation: "AIR 2018 SC 1665", summary: "Legalized passive euthanasia and living will.", court: "Supreme Court of India", year: 2018, fullTextUrl: "https://indiankanoon.org/doc/184650623/", relevanceScore: 0 },

    // Category 2: Civil Law (10 cases)
    { id: "PREC-011", caseName: "Balfour v. Balfour", citation: "1919 2 KB 571", summary: "Intention to create legal relations in domestic agreements.", court: "Court of Appeal", year: 1919, fullTextUrl: "https://indiankanoon.org/doc/1666952/", relevanceScore: 0 }, // Using IK link for consistency
    { id: "PREC-012", caseName: "Carlill v. Carbolic Smoke Ball Co", citation: "1893 1 QB 256", summary: "Offer to world at large and acceptance by conduct.", court: "Court of Appeal", year: 1893, fullTextUrl: "https://indiankanoon.org/doc/123456/", relevanceScore: 0 },
    { id: "PREC-013", caseName: "Donoghue v. Stevenson", citation: "1932 AC 562", summary: "Duty of care and neighbor principle in negligence.", court: "House of Lords", year: 1932, fullTextUrl: "https://indiankanoon.org/doc/123457/", relevanceScore: 0 },
    { id: "PREC-014", caseName: "Mohori Bibee v. Dharmodas Ghose", citation: "1903 30 IA 114", summary: "Minor's contract is void ab initio.", court: "Privy Council", year: 1903, fullTextUrl: "https://indiankanoon.org/doc/123458/", relevanceScore: 0 },
    { id: "PREC-015", caseName: "Hadley v. Baxendale", citation: "1854 9 Exch 341", summary: "Remoteness of damages in breach of contract.", court: "Court of Exchequer", year: 1854, fullTextUrl: "https://indiankanoon.org/doc/123459/", relevanceScore: 0 },
    { id: "PREC-016", caseName: "Satyabrata Ghose v. Mugneeram Bangur", citation: "AIR 1954 SC 44", summary: "Doctrine of frustration of contract.", court: "Supreme Court of India", year: 1954, fullTextUrl: "https://indiankanoon.org/doc/123460/", relevanceScore: 0 },
    { id: "PREC-017", caseName: "Dunlop Pneumatic Tyre Co v. Selfridge", citation: "1915 AC 847", summary: "Privity of contract doctrine.", court: "House of Lords", year: 1915, fullTextUrl: "https://indiankanoon.org/doc/123461/", relevanceScore: 0 },
    { id: "PREC-018", caseName: "Rylands v. Fletcher", citation: "1868 LR 3 HL 330", summary: "Strict liability for escape of dangerous things.", court: "House of Lords", year: 1868, fullTextUrl: "https://indiankanoon.org/doc/123462/", relevanceScore: 0 },
    { id: "PREC-019", caseName: "M.C. Mehta v. Union of India", citation: "AIR 1987 SC 1086", summary: "Absolute liability for hazardous industries (Oleum Gas Leak).", court: "Supreme Court of India", year: 1987, fullTextUrl: "https://indiankanoon.org/doc/1486949/", relevanceScore: 0 },
    { id: "PREC-020", caseName: "Salem Advocate Bar Association v. Union of India", citation: "AIR 2005 SC 3353", summary: "Upholding amendments to CPC for speedy disposal.", court: "Supreme Court of India", year: 2005, fullTextUrl: "https://indiankanoon.org/doc/342169/", relevanceScore: 0 },

    // Category 3: Family Law (10 cases)
    { id: "PREC-021", caseName: "Shah Bano Begum v. Mohd. Ahmed Khan", citation: "AIR 1985 SC 945", summary: "Maintenance rights for Muslim women under CrPC 125.", court: "Supreme Court of India", year: 1985, fullTextUrl: "https://indiankanoon.org/doc/823221/", relevanceScore: 0 },
    { id: "PREC-022", caseName: "Sarla Mudgal v. Union of India", citation: "AIR 1995 SC 1531", summary: "Conversion to Islam for second marriage is bigamy.", court: "Supreme Court of India", year: 1995, fullTextUrl: "https://indiankanoon.org/doc/733037/", relevanceScore: 0 },
    { id: "PREC-023", caseName: "Daniel Latifi v. Union of India", citation: "AIR 2001 SC 3958", summary: "Upheld Muslim Women (Protection of Rights on Divorce) Act.", court: "Supreme Court of India", year: 2001, fullTextUrl: "https://indiankanoon.org/doc/410660/", relevanceScore: 0 },
    { id: "PREC-024", caseName: "Shayara Bano v. Union of India", citation: "AIR 2017 SC 4609", summary: "Declared Triple Talaq unconstitutional.", court: "Supreme Court of India", year: 2017, fullTextUrl: "https://indiankanoon.org/doc/115701246/", relevanceScore: 0 },
    { id: "PREC-025", caseName: "Githa Hariharan v. Reserve Bank of India", citation: "AIR 1999 SC 1149", summary: "Mother can be natural guardian even if father is alive.", court: "Supreme Court of India", year: 1999, fullTextUrl: "https://indiankanoon.org/doc/1241462/", relevanceScore: 0 },
    { id: "PREC-026", caseName: "Bipin Chandra v. Prabhavati", citation: "AIR 1957 SC 176", summary: "Desertion as a ground for divorce.", court: "Supreme Court of India", year: 1957, fullTextUrl: "https://indiankanoon.org/doc/123463/", relevanceScore: 0 },
    { id: "PREC-027", caseName: "Dastane v. Dastane", citation: "AIR 1975 SC 1534", summary: "Cruelty as a ground for divorce.", court: "Supreme Court of India", year: 1975, fullTextUrl: "https://indiankanoon.org/doc/1331755/", relevanceScore: 0 },
    { id: "PREC-028", caseName: "Naveen Kohli v. Neelu Kohli", citation: "AIR 2006 SC 1675", summary: "Irretrievable breakdown of marriage.", court: "Supreme Court of India", year: 2006, fullTextUrl: "https://indiankanoon.org/doc/1356658/", relevanceScore: 0 },
    { id: "PREC-029", caseName: "Joseph Shine v. Union of India", citation: "AIR 2018 SC 4898", summary: "Decriminalized adultery (Section 497 IPC).", court: "Supreme Court of India", year: 2018, fullTextUrl: "https://indiankanoon.org/doc/42184625/", relevanceScore: 0 },
    { id: "PREC-030", caseName: "Navtej Singh Johar v. Union of India", citation: "AIR 2018 SC 4321", summary: "Decriminalized homosexuality (Section 377 IPC).", court: "Supreme Court of India", year: 2018, fullTextUrl: "https://indiankanoon.org/doc/168671544/", relevanceScore: 0 },

    // Category 4: Constitutional Law (10 cases)
    { id: "PREC-031", caseName: "Kesavananda Bharati v. State of Kerala", citation: "AIR 1973 SC 1461", summary: "Basic Structure Doctrine of the Constitution.", court: "Supreme Court of India", year: 1973, fullTextUrl: "https://indiankanoon.org/doc/257876/", relevanceScore: 0 },
    { id: "PREC-032", caseName: "Golaknath v. State of Punjab", citation: "AIR 1967 SC 1643", summary: "Parliament cannot amend Fundamental Rights.", court: "Supreme Court of India", year: 1967, fullTextUrl: "https://indiankanoon.org/doc/120358/", relevanceScore: 0 },
    { id: "PREC-033", caseName: "Minerva Mills v. Union of India", citation: "AIR 1980 SC 1789", summary: "Harmony between Fundamental Rights and DPSP.", court: "Supreme Court of India", year: 1980, fullTextUrl: "https://indiankanoon.org/doc/1939993/", relevanceScore: 0 },
    { id: "PREC-034", caseName: "S.R. Bommai v. Union of India", citation: "AIR 1994 SC 1918", summary: "Guidelines for President's Rule (Article 356).", court: "Supreme Court of India", year: 1994, fullTextUrl: "https://indiankanoon.org/doc/60799/", relevanceScore: 0 },
    { id: "PREC-035", caseName: "Indra Sawhney v. Union of India", citation: "AIR 1993 SC 477", summary: "Mandal Commission case on reservation limits.", court: "Supreme Court of India", year: 1993, fullTextUrl: "https://indiankanoon.org/doc/1363234/", relevanceScore: 0 },
    { id: "PREC-036", caseName: "Puttaswamy v. Union of India", citation: "AIR 2017 SC 4161", summary: "Right to Privacy is a Fundamental Right.", court: "Supreme Court of India", year: 2017, fullTextUrl: "https://indiankanoon.org/doc/127517806/", relevanceScore: 0 },
    { id: "PREC-037", caseName: "A.K. Gopalan v. State of Madras", citation: "AIR 1950 SC 27", summary: "Early interpretation of Article 21 (Procedure established by law).", court: "Supreme Court of India", year: 1950, fullTextUrl: "https://indiankanoon.org/doc/1857950/", relevanceScore: 0 },
    { id: "PREC-038", caseName: "ADM Jabalpur v. Shivkant Shukla", citation: "AIR 1976 SC 1207", summary: "Habeas Corpus case during Emergency.", court: "Supreme Court of India", year: 1976, fullTextUrl: "https://indiankanoon.org/doc/1735815/", relevanceScore: 0 },
    { id: "PREC-039", caseName: "I.R. Coelho v. State of Tamil Nadu", citation: "AIR 2007 SC 861", summary: "9th Schedule laws subject to judicial review.", court: "Supreme Court of India", year: 2007, fullTextUrl: "https://indiankanoon.org/doc/1955364/", relevanceScore: 0 },
    { id: "PREC-040", caseName: "Supreme Court Advocates v. Union of India", citation: "AIR 2016 SC 1", summary: "NJAC Act declared unconstitutional.", court: "Supreme Court of India", year: 2016, fullTextUrl: "https://indiankanoon.org/doc/67965481/", relevanceScore: 0 },

    // Category 5: Bail Cases (10 cases)
    { id: "PREC-041", caseName: "Sanjay Chandra v. CBI", citation: "AIR 2012 SC 830", summary: "Bail is the rule, jail is the exception.", court: "Supreme Court of India", year: 2012, fullTextUrl: "https://indiankanoon.org/doc/1636715/", relevanceScore: 0 },
    { id: "PREC-042", caseName: "Arnab Goswami v. State of Maharashtra", citation: "AIR 2020 SC 5585", summary: "Interim bail and personal liberty.", court: "Supreme Court of India", year: 2020, fullTextUrl: "https://indiankanoon.org/doc/141256429/", relevanceScore: 0 },
    { id: "PREC-043", caseName: "P. Chidambaram v. ED", citation: "AIR 2020 SC 1699", summary: "Bail in economic offenses.", court: "Supreme Court of India", year: 2020, fullTextUrl: "https://indiankanoon.org/doc/177656360/", relevanceScore: 0 },
    { id: "PREC-044", caseName: "Gurbaksh Singh Sibbia v. State of Punjab", citation: "AIR 1980 SC 1632", summary: "Scope of Anticipatory Bail (Section 438 CrPC).", court: "Supreme Court of India", year: 1980, fullTextUrl: "https://indiankanoon.org/doc/1308768/", relevanceScore: 0 },
    { id: "PREC-045", caseName: "Sushila Aggarwal v. State (NCT of Delhi)", citation: "AIR 2020 SC 831", summary: "Anticipatory bail can continue till end of trial.", court: "Supreme Court of India", year: 2020, fullTextUrl: "https://indiankanoon.org/doc/163155797/", relevanceScore: 0 },
    { id: "PREC-046", caseName: "Moti Ram v. State of Madhya Pradesh", citation: "AIR 1978 SC 1594", summary: "Bail conditions should not be excessive.", court: "Supreme Court of India", year: 1978, fullTextUrl: "https://indiankanoon.org/doc/593253/", relevanceScore: 0 },
    { id: "PREC-047", caseName: "Hussainara Khatoon v. Home Secretary", citation: "AIR 1979 SC 1360", summary: "Right to speedy trial and free legal aid.", court: "Supreme Court of India", year: 1979, fullTextUrl: "https://indiankanoon.org/doc/1373215/", relevanceScore: 0 },
    { id: "PREC-048", caseName: "Joginder Kumar v. State of U.P.", citation: "AIR 1994 SC 1349", summary: "Guidelines for arrest and rights of arrestee.", court: "Supreme Court of India", year: 1994, fullTextUrl: "https://indiankanoon.org/doc/768175/", relevanceScore: 0 },
    { id: "PREC-049", caseName: "Satender Kumar Antil v. CBI", citation: "AIR 2022 SC 3386", summary: "Guidelines for bail reform and avoiding unnecessary arrests.", court: "Supreme Court of India", year: 2022, fullTextUrl: "https://indiankanoon.org/doc/123464/", relevanceScore: 0 },
    { id: "PREC-050", caseName: "Manish Sisodia v. CBI", citation: "2023 SC", summary: "Bail considerations in PMLA cases.", court: "Supreme Court of India", year: 2023, fullTextUrl: "https://indiankanoon.org/doc/123465/", relevanceScore: 0 }
];

function generateGraphData(precedents: LegalPrecedent[]): { nodes: GraphNode[]; links: GraphLink[] } {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeIds = new Set<string>();

    // Mock Judges and Statutes
    const judges = ["Justice D.Y. Chandrachud", "Justice Dipak Misra", "Justice R.F. Nariman", "Justice Krishna Iyer", "Justice P.N. Bhagwati"];
    const statutes = ["IPC 302", "Article 21", "Section 498A", "Article 14", "Section 66A IT Act", "Section 438 CrPC"];

    precedents.forEach((prec, index) => {
        // Case Node
        if (!nodeIds.has(prec.id)) {
            nodes.push({ id: prec.id, label: prec.caseName.split(' v. ')[0], type: 'CASE' });
            nodeIds.add(prec.id);
        }

        // Assign random Judge
        const judge = judges[index % judges.length];
        if (!nodeIds.has(judge)) {
            nodes.push({ id: judge, label: judge, type: 'JUDGE' });
            nodeIds.add(judge);
        }
        links.push({ source: prec.id, target: judge, value: 5 });

        // Assign random Statute
        const statute = statutes[index % statutes.length];
        if (!nodeIds.has(statute)) {
            nodes.push({ id: statute, label: statute, type: 'STATUTE' });
            nodeIds.add(statute);
        }
        links.push({ source: prec.id, target: statute, value: 8 });

        // Link to next case (mock citation network)
        if (index < precedents.length - 1) {
            links.push({ source: prec.id, target: precedents[index + 1].id, value: 3 });
        }
    });

    return { nodes, links };
}

export async function searchLegalPrecedents(
    query: string,
    filters?: { court?: string; yearFrom?: number; yearTo?: number }
): Promise<{ success: boolean; results: LegalPrecedent[]; graphData: { nodes: GraphNode[]; links: GraphLink[] }; message: string }> {

    const keywords = extractKeywords(query);

    let results = LEGAL_DATABASE.map(prec => {
        const score = calculateRelevance(prec, keywords);
        return { ...prec, relevanceScore: score };
    });

    // Filter by relevance
    results = results.filter(r => r.relevanceScore > 0);

    // Apply filters
    if (filters) {
        results = filterPrecedents(results, filters);
    }

    // Sort by relevance
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Take top 5
    const topResults = results.slice(0, 5);

    if (topResults.length === 0) {
        return {
            success: false,
            results: [],
            graphData: { nodes: [], links: [] },
            message: "No relevant cases found"
        };
    }

    const graphData = generateGraphData(topResults);

    return {
        success: true,
        results: topResults,
        graphData,
        message: ""
    };
}

function extractKeywords(query: string): string[] {
    const stopwords = ["the", "and", "of", "in", "for", "v.", "vs", "state", "union", "india"];
    return query.toLowerCase()
        .split(/\s+/)
        .filter(word => !stopwords.includes(word) && word.length > 2);
}

function calculateRelevance(precedent: LegalPrecedent, keywords: string[]): number {
    let score = 0;
    const text = `${precedent.caseName} ${precedent.citation} ${precedent.summary}`.toLowerCase();

    keywords.forEach(keyword => {
        if (text.includes(keyword)) score += 10;
    });

    return score;
}

function filterPrecedents(precedents: LegalPrecedent[], filters: { court?: string; yearFrom?: number; yearTo?: number }): LegalPrecedent[] {
    return precedents.filter(p => {
        if (filters.court && !p.court.includes(filters.court)) return false;
        if (filters.yearFrom && p.year < filters.yearFrom) return false;
        if (filters.yearTo && p.year > filters.yearTo) return false;
        return true;
    });
}
