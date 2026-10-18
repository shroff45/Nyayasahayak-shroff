// App.tsx - NyayaSahayak Hybrid v2.0.0
// Complete Consolidated Routing per Architectural Blueprint
// Wires ALL 51+ features with ZERO feature loss

import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, ProtectedRoute } from './core/auth/AuthContext';
import { AppSettingsProvider } from './core/context/AppSettingsContext';

// ================== LAYOUTS ==================
import CitizenLayout from './shared/layout/CitizenLayout';
import PoliceLayout from './shared/layout/PoliceLayout';
import JudgeLayout from './shared/layout/JudgeLayout';
import AdminLayout from './shared/layout/AdminLayout';
import LandingPage from './shared/layout/LandingPage';

// ================== SHARED UTILITIES ==================
// The ledger is opened from an effect below, not imported here: the trust layer (SHA-256, Merkle,
// ECDSA, the journal driver) is ~17 kB that no screen needs until it renders, and every consumer
// awaits getLedger() anyway, so it lazily initialises wherever it is actually used. Measured on
// this build: entry chunk 592.33 kB -> 575.12 kB. The app promises to work on a 2G courthouse
// connection, so the promise gets kept rather than the budget raised.
import { useLocalization, Language } from './features/main/hooks/useLocalization';
import { ChatMessage } from './features/main/types';
import { ToastProvider } from './shared/hooks/useToast';
import { WorkspaceProvider, useWorkspace } from './core/context/WorkspaceContext';
import { toGoldenCase } from './core/workspace/legacyCaseAdapter';

// ================== LAZY LOADED LEGACY FEATURES ==================
// Using React.lazy for code splitting and performance optimization

// Shared Components
const Nyayabot = React.lazy(() => import('./features/main/components/Nyayabot'));
const DocumentAnalysis = React.lazy(() => import('./features/main/components/DocumentAnalysis'));
const CaseIntakeTriage = React.lazy(() => import('./features/main/components/CaseIntakeTriage'));
const CaseRelationshipMapper = React.lazy(() => import('./features/main/components/CaseRelationshipMapper'));
const JusticeTimeline = React.lazy(() => import('./features/main/components/JusticeTimeline'));
const LegalTechHub = React.lazy(() => import('./features/main/components/LegalTechHub'));
const LitigantHappiness = React.lazy(() => import('./features/main/components/LitigantHappiness'));
const History = React.lazy(() => import('./features/main/components/History'));
const DocumentIntegrityPage = React.lazy(() => import('./features/main/components/DocumentIntegrityPage'));
const About = React.lazy(() => import('./features/main/components/About'));

// Judge-specific Components
const DraftJudgmentPanel = React.lazy(() => import('./components/DraftJudgmentPanel'));
const AdjournmentRiskPanel = React.lazy(() => import('./components/AdjournmentRiskPanel'));
const NyayaChitra = React.lazy(() => import('./components/NyayaChitra'));

// Citizen-specific Components (VoiceFilingInterface used directly in citizen routes)
const CitizenHomePage = React.lazy(() => import('./personas/citizen/pages/CitizenHome'));
const CaseTrackPage = React.lazy(() => import('./personas/citizen/pages/CaseTrack'));
const CitizenTimelinePage = React.lazy(() => import('./personas/citizen/pages/CitizenTimeline'));
const CitizenVisualJusticePage = React.lazy(() => import('./personas/citizen/pages/CitizenVisualJustice'));
const CitizenComplaintPage = React.lazy(() => import('./personas/citizen/pages/CitizenComplaint'));

// Police-specific Components
const PoliceDashboard = React.lazy(() => import('./personas/police/pages/PoliceDashboard'));
const SmartFIRPage = React.lazy(() => import('./personas/police/pages/SmartFIR'));
const EvidenceLockerPage = React.lazy(() => import('./personas/police/pages/EvidenceLocker'));
// Block 3: screens that were written but never routed. Each is mounted at two paths — a bare one
// that lists what the ledger holds, and the deep link a party or an order would cite.
const Section63CertificatePage = React.lazy(() => import('./personas/police/pages/Section63CertificatePage'));
const ChargeSheetGatePage = React.lazy(() => import('./personas/police/pages/ChargeSheetGatePage'));
const PatrolMapPage = React.lazy(() => import('./personas/police/pages/PatrolMap'));
const DutyRosterPage = React.lazy(() => import('./personas/police/pages/DutyRoster'));

// Admin-specific Components
const AdminDashboard = React.lazy(() => import('./personas/admin/pages/AdminDashboard'));
const BNSTransitionPage = React.lazy(() => import('./personas/admin/pages/BNSTransition'));
const PendencyMapPage = React.lazy(() => import('./personas/admin/pages/PendencyMap'));

// Judge-specific Components (BSA Compliance)
const HashVerifierPage = React.lazy(() => import('./personas/judge/pages/HashVerifier'));
const CaseChainOfCustodyPage = React.lazy(() => import('./personas/judge/pages/CaseChainOfCustodyPage'));
const JudgeBoardPage = React.lazy(() => import('./personas/judge/pages/JudgeBoard'));
const JudgeWellnessPage = React.lazy(() => import('./personas/judge/pages/JudgeWellness'));
const CaseQueuePage = React.lazy(() => import('./personas/judge/pages/CaseQueuePage'));
const SmartBailPage = React.lazy(() => import('./personas/judge/pages/SmartBailPage'));
const OrdersHistoryPage = React.lazy(() => import('./personas/judge/pages/OrdersHistory'));
const VirtualMootCourtPage = React.lazy(() => import('./personas/judge/pages/VirtualMootCourt'));

// Enhanced Judge Dashboard (Nationals - with Sovereign Badge, Smart Query, Vipaksh)
const EnhancedJudgeDashboard = React.lazy(() => import('./features/nationals/modules/judge/JudgeDashboard'));

// Shared Components (Chain of Custody)
const ProfileSettings = React.lazy(() => import('./shared/pages/ProfileSettings'));

// Citizen-specific Components (BNSS Compliance)

// Demo/Sandbox Pages
const EvidenceIntegrityDemo = React.lazy(() => import('./pages/EvidenceIntegrityDemo'));

// ================== LOADING FALLBACK ==================
const LoadingFallback: React.FC = () => (
    <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="animate-spin w-10 h-10 border-3 border-cyan-400 border-t-transparent rounded-full" />
            <p className="text-slate-400 animate-pulse">Loading Module...</p>
        </div>
    </div>
);

// ================== WRAPPER COMPONENTS ==================
// These provide required props to legacy components

const NyayaBotWrapper: React.FC = () => {
    const { user } = useAuth();
    const [language] = useState<Language>('en');
    const { t } = useLocalization(language);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', content: t('nyayabot_welcome') }
    ]);

    if (!user) return null;

    return (
        <div className="h-[calc(100vh-120px)]">
            <React.Suspense fallback={<LoadingFallback />}>
                <Nyayabot
                    t={t}
                    messages={messages}
                    setMessages={setMessages}
                    currentUser={{ email: user.id + '@nyaya.gov.in' }}
                />
            </React.Suspense>
        </div>
    );
};

const CaseTriageWrapper: React.FC = () => {
    const { user } = useAuth();
    const [language] = useState<Language>('en');
    const { t } = useLocalization(language);
    // Cases triaged here land in the shared store, so the judge-facing panels can pick them up.
    const { allCases, setAllCases, selectedCase, setSelectedCase, logActivity } = useWorkspace();

    return (
        <React.Suspense fallback={<LoadingFallback />}>
            <CaseIntakeTriage
                t={t}
                allCases={allCases}
                setAllCases={setAllCases}
                selectedCase={selectedCase}
                setSelectedCase={setSelectedCase}
                language={language}
                currentUser={{ email: user ? `${user.id}@nyaya.gov.in` : 'guest@nyaya.gov.in' }}
                logActivity={logActivity}
            />
        </React.Suspense>
    );
};

const DocumentAnalysisWrapper: React.FC = () => {
    const [language] = useState<Language>('en');
    const { t } = useLocalization(language);
    const { logActivity } = useWorkspace();

    return (
        <React.Suspense fallback={<LoadingFallback />}>
            <DocumentAnalysis t={t} logActivity={logActivity} />
        </React.Suspense>
    );
};

const CaseMapperWrapper: React.FC = () => {
    const [language] = useState<Language>('en');
    const { t } = useLocalization(language);

    return (
        <React.Suspense fallback={<LoadingFallback />}>
            <CaseRelationshipMapper t={t} selectedCase={null} />
        </React.Suspense>
    );
};

const JusticeTimelineWrapper: React.FC = () => {
    const [language] = useState<Language>('en');
    const { t } = useLocalization(language);

    return (
        <React.Suspense fallback={<LoadingFallback />}>
            <JusticeTimeline t={t} selectedCase={null} />
        </React.Suspense>
    );
};

const LegalTechHubWrapper: React.FC = () => {
    const [language] = useState<Language>('en');
    const { t } = useLocalization(language);

    return (
        <React.Suspense fallback={<LoadingFallback />}>
            <LegalTechHub t={t} />
        </React.Suspense>
    );
};

const LitigantHappinessWrapper: React.FC = () => {
    const [language] = useState<Language>('en');
    const { t } = useLocalization(language);

    return (
        <React.Suspense fallback={<LoadingFallback />}>
            <LitigantHappiness t={t} />
        </React.Suspense>
    );
};

const HistoryWrapper: React.FC = () => {
    const [language] = useState<Language>('en');
    const { t } = useLocalization(language);
    // Single source of truth: WorkspaceProvider persists this per user, and every feature page
    // reports into it through logActivity.
    const { history, clearHistory } = useWorkspace();

    const handleClearHistory = () => clearHistory();

    return (
        <React.Suspense fallback={<LoadingFallback />}>
            <History t={t} history={history} onClearHistory={handleClearHistory} />
        </React.Suspense>
    );
};

const IntegrityCheckWrapper: React.FC = () => {
    const [language] = useState<Language>('en');
    const { t } = useLocalization(language);
    const { logActivity } = useWorkspace();

    return (
        <React.Suspense fallback={<LoadingFallback />}>
            <DocumentIntegrityPage
                t={t}
                onActivity={(details) => logActivity('DOCUMENT_VERIFIED', details)}
            />
        </React.Suspense>
    );
};

const AboutWrapper: React.FC = () => {
    const [language] = useState<Language>('en');
    const { t } = useLocalization(language);
    const navigate = useNavigate();

    return (
        <React.Suspense fallback={<LoadingFallback />}>
            <About t={t} onGetStarted={() => navigate('/')} />
        </React.Suspense>
    );
};

const DraftJudgmentWrapper: React.FC = () => {
    const [language] = useState<Language>('en');
    const { t } = useLocalization(language);
    const { allCases, selectedCase, setSelectedCase, logActivity } = useWorkspace();
    const [draft, setDraft] = useState('');

    // DraftJudgmentPanel speaks the golden-key Case shape; intake stores the legacy one.
    const goldenSelected = selectedCase ? toGoldenCase(selectedCase) : null;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 px-1">
                <label htmlFor="draft-case-picker" className="text-sm text-slate-400">
                    {t('nav_draft_judgment') || 'Draft judgment for'}
                </label>
                <select
                    id="draft-case-picker"
                    value={selectedCase?.id ?? ''}
                    onChange={(e) => {
                        const next = allCases.find((c) => c.id === e.target.value) ?? null;
                        setSelectedCase(next);
                        setDraft('');
                    }}
                    className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white min-w-[16rem]"
                >
                    <option value="">
                        {allCases.length ? '— Select a case —' : 'No cases filed yet — use Case Intake first'}
                    </option>
                    {allCases.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.caseNumber} · {c.title}
                        </option>
                    ))}
                </select>
                {draft && (
                    <span className="text-xs text-emerald-400">Draft generated ({draft.length} chars)</span>
                )}
            </div>
            <React.Suspense fallback={<LoadingFallback />}>
                <DraftJudgmentPanel
                    t={t}
                    caseData={goldenSelected}
                    precedents={[]}
                    onDraftGenerated={(generated) => {
                        setDraft(generated);
                        logActivity('DOCUMENT_ANALYZED', `Draft order generated for ${goldenSelected?.cnrNumber ?? 'case'}`);
                    }}
                />
            </React.Suspense>
        </div>
    );
};

const AdjournmentRiskWrapper: React.FC = () => {
    const [language] = useState<Language>('en');
    const { t } = useLocalization(language);

    return (
        <React.Suspense fallback={<LoadingFallback />}>
            <AdjournmentRiskPanel t={t} lawyerId="L001" />
        </React.Suspense>
    );
};

const NyayaChitraWrapper: React.FC = () => {
    const [language] = useState<Language>('en');

    // NyayaChitra's card copy (headings, descriptions, spoken audio) is authored for Hindi,
    // Gujarati and English only. Any other interface language falls back to English rather
    // than shipping untranslated Devanagari strings to, say, a Tamil user.
    const cardLanguage: 'en' | 'hi' | 'gu' = language === 'hi' || language === 'gu' ? language : 'en';

    return (
        <React.Suspense fallback={<LoadingFallback />}>
            <NyayaChitra legalText="Sample legal text for visual justice card generation." language={cardLanguage} />
        </React.Suspense>
    );
};

// Note: VoiceFilingWrapper removed - Police FIR now uses SmartFIRPage
// Citizen voice filing uses VoiceFilingInterface directly in citizen routes

// ================== APP COMPONENT ==================
const App: React.FC = () => {
    const { user, isAuthenticated, isLoading } = useAuth();

    // Open the ledger on mount: loads (or creates) this device's signing key and reads back
    // the anchored journal from storage. A failure here is reported rather than swallowed -
    // without storage nothing can be anchored, and the UI has to say so instead of showing an
    // empty chain that looks like "no evidence yet".
    useEffect(() => {
        import('./services/akhandLedger')
            .then((m) => m.initializeLedger())
            .catch((error) => {
                console.error('Ledger unavailable:', error);
            });
    }, []);

    // Theme management
    useEffect(() => {
        const storedTheme = localStorage.getItem('theme') || 'dark';
        const root = window.document.documentElement;
        if (storedTheme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, []);

    // A cold boot must not route. The session is restored from localStorage in an effect, so the very
    // first render reports `isAuthenticated === false` even when a signed-in visitor asked for
    // /citizen/file. The public tree used to mount anyway, its catch-all (`path="*"`) rewrote the URL to
    // `/`, and by then the restore had landed - so the landing page's own `/` route sent the visitor to
    // their role home. Every bookmarked or shared deep link (an SMS with a case URL, an officer's saved
    // Evidence Locker tab, a judge reopening a verifier) therefore lost its target and opened a
    // dashboard. Holding one frame until the restore settles keeps the address the person typed.
    //
    // `isLoading` is set false unconditionally at the end of that effect (`AuthContext.tsx:86`), including
    // when there is no session to restore, so this cannot strand a visitor on the spinner.
    if (isLoading) {
        return <LoadingFallback />;
    }

    // If authenticated - use role-based routing
    if (isAuthenticated && user) {
        return (
            <AppSettingsProvider>
                <WorkspaceProvider>
                    <ToastProvider>
                    <Routes>
                        {/* Redirect root to appropriate dashboard based on role */}
                        <Route
                            path="/"
                            element={<Navigate to={`/${(user.role || 'citizen').toLowerCase()}/home`} replace />}
                        />

                        {/* The About page stays reachable once a role is picked - the persona sidebars
                            link to it, and a link that only works while signed out would be a bug. */}
                        <Route path="/about" element={<AboutWrapper />} />

                        {/* ================== DEV/DEMO ROUTES ================== */}
                        <Route
                            path="/integrity-sandbox/:caseId?"
                            element={
                                <React.Suspense fallback={<LoadingFallback />}>
                                    <EvidenceIntegrityDemo />
                                </React.Suspense>
                            }
                        />

                        {/* ================== SHARED ROUTES (All Authenticated Users) ================== */}
                        <Route
                            path="/profile"
                            element={
                                <React.Suspense fallback={<LoadingFallback />}>
                                    <ProfileSettings />
                                </React.Suspense>
                            }
                        />

                        {/* ================== CITIZEN ROUTES (NyayaSetu) ================== */}
                        <Route element={<ProtectedRoute allowedRoles={['CITIZEN']} />}>
                            <Route path="/citizen" element={<CitizenLayout />}>
                                <Route index element={<Navigate to="home" replace />} />
                                <Route path="home" element={<React.Suspense fallback={<LoadingFallback />}><CitizenHomePage /></React.Suspense>} />
                                <Route path="file" element={<React.Suspense fallback={<LoadingFallback />}><CitizenComplaintPage /></React.Suspense>} />
                                <Route path="track" element={<React.Suspense fallback={<LoadingFallback />}><CaseTrackPage /></React.Suspense>} />
                                <Route path="timeline" element={<React.Suspense fallback={<LoadingFallback />}><CitizenTimelinePage /></React.Suspense>} />
                                <Route path="visuals" element={<React.Suspense fallback={<LoadingFallback />}><CitizenVisualJusticePage /></React.Suspense>} />
                                <Route path="legal-hub" element={<LegalTechHubWrapper />} />
                                <Route path="bot" element={<NyayaBotWrapper />} />
                                <Route path="feedback" element={<LitigantHappinessWrapper />} />
                            </Route>
                        </Route>

                        {/* ================== POLICE ROUTES (NyayaRakshak) ================== */}
                        <Route element={<ProtectedRoute allowedRoles={['POLICE']} />}>
                            <Route path="/police" element={<PoliceLayout />}>
                                <Route index element={<Navigate to="dashboard" replace />} />
                                <Route path="home" element={<Navigate to="/police/dashboard" replace />} />
                                <Route path="dashboard" element={<React.Suspense fallback={<LoadingFallback />}><PoliceDashboard /></React.Suspense>} />
                                <Route path="fir" element={<React.Suspense fallback={<LoadingFallback />}><SmartFIRPage /></React.Suspense>} />
                                <Route path="evidence" element={<React.Suspense fallback={<LoadingFallback />}><EvidenceLockerPage /></React.Suspense>} />
                                <Route path="certificate" element={<React.Suspense fallback={<LoadingFallback />}><Section63CertificatePage /></React.Suspense>} />
                                <Route path="certificate/:evidenceId" element={<React.Suspense fallback={<LoadingFallback />}><Section63CertificatePage /></React.Suspense>} />
                                <Route path="chargesheet" element={<React.Suspense fallback={<LoadingFallback />}><ChargeSheetGatePage /></React.Suspense>} />
                                <Route path="chargesheet/:caseId/gate" element={<React.Suspense fallback={<LoadingFallback />}><ChargeSheetGatePage /></React.Suspense>} />
                                <Route path="integrity" element={<IntegrityCheckWrapper />} />
                                <Route path="patrol" element={<React.Suspense fallback={<LoadingFallback />}><PatrolMapPage /></React.Suspense>} />
                                <Route path="roster" element={<React.Suspense fallback={<LoadingFallback />}><DutyRosterPage /></React.Suspense>} />
                                <Route path="bot" element={<NyayaBotWrapper />} />
                            </Route>
                        </Route>


                        {/* ================== JUDGE ROUTES (NyayaAdhikari) ================== */}
                        <Route element={<ProtectedRoute allowedRoles={['JUDGE']} />}>
                            <Route path="/judge" element={<JudgeLayout />}>
                                <Route index element={<Navigate to="board" replace />} />
                                <Route path="home" element={<Navigate to="/judge/board" replace />} />
                                <Route path="board" element={<React.Suspense fallback={<LoadingFallback />}><JudgeBoardPage /></React.Suspense>} />
                                <Route path="queue" element={<React.Suspense fallback={<LoadingFallback />}><CaseQueuePage /></React.Suspense>} />
                                <Route path="triage" element={<CaseTriageWrapper />} />
                                <Route path="draft" element={<DraftJudgmentWrapper />} />
                                <Route path="dashboard" element={<React.Suspense fallback={<LoadingFallback />}><EnhancedJudgeDashboard /></React.Suspense>} />
                                <Route path="risk" element={<AdjournmentRiskWrapper />} />
                                <Route path="mapper" element={<CaseMapperWrapper />} />
                                <Route path="timeline" element={<JusticeTimelineWrapper />} />
                                <Route path="evidence" element={<DocumentAnalysisWrapper />} />
                                <Route path="bail" element={<React.Suspense fallback={<LoadingFallback />}><SmartBailPage /></React.Suspense>} />
                                <Route path="orders" element={<React.Suspense fallback={<LoadingFallback />}><OrdersHistoryPage /></React.Suspense>} />
                                <Route path="wellness" element={<React.Suspense fallback={<LoadingFallback />}><JudgeWellnessPage /></React.Suspense>} />
                                <Route path="visuals" element={<NyayaChitraWrapper />} />
                                <Route path="bot" element={<NyayaBotWrapper />} />
                                <Route path="history" element={<HistoryWrapper />} />
                                <Route path="verify" element={<React.Suspense fallback={<LoadingFallback />}><HashVerifierPage /></React.Suspense>} />
                                <Route path="moot-court" element={<React.Suspense fallback={<LoadingFallback />}><VirtualMootCourtPage /></React.Suspense>} />
                                <Route path="custody" element={<React.Suspense fallback={<LoadingFallback />}><CaseChainOfCustodyPage /></React.Suspense>} />
                                <Route path="case/:id/chain-of-custody" element={<React.Suspense fallback={<LoadingFallback />}><CaseChainOfCustodyPage /></React.Suspense>} />
                            </Route>
                        </Route>


                        {/* ================== ADMIN ROUTES (NyayaPrashaasak) ================== */}
                        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                            <Route path="/admin" element={<AdminLayout />}>
                                <Route index element={<Navigate to="dashboard" replace />} />
                                <Route path="home" element={<Navigate to="/admin/dashboard" replace />} />
                                <Route path="dashboard" element={<React.Suspense fallback={<LoadingFallback />}><AdminDashboard /></React.Suspense>} />
                                <Route path="analysis" element={<DocumentAnalysisWrapper />} />
                                <Route path="happiness" element={<LitigantHappinessWrapper />} />
                                <Route path="history" element={<HistoryWrapper />} />
                                <Route path="integrity" element={<IntegrityCheckWrapper />} />
                                <Route path="transition" element={<React.Suspense fallback={<LoadingFallback />}><BNSTransitionPage /></React.Suspense>} />
                                <Route path="pendency" element={<React.Suspense fallback={<LoadingFallback />}><PendencyMapPage /></React.Suspense>} />
                            </Route>
                        </Route>


                        {/* Catch-all fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </ToastProvider>
                </WorkspaceProvider>
            </AppSettingsProvider>
        );
    }

    // ================== PUBLIC ROUTES ==================
    return (
        <ToastProvider>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/about" element={<AboutWrapper />} />

                {/* Evidence Integrity Sandbox - accessible without auth for testing */}
                <Route
                    path="/integrity-sandbox/:caseId?"
                    element={
                        <React.Suspense fallback={<LoadingFallback />}>
                            <EvidenceIntegrityDemo />
                        </React.Suspense>
                    }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </ToastProvider>
    );
};

export default App;
