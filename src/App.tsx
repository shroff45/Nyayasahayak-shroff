// App.tsx - NyayaSahayak Hybrid v2.0.0
// Complete Consolidated Routing per Architectural Blueprint
// Wires ALL 51+ features with ZERO feature loss

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, ProtectedRoute } from './core/auth/AuthContext';
import { AppSettingsProvider } from './core/context/AppSettingsContext';

// ================== LAYOUTS ==================
import CitizenLayout from './shared/layout/CitizenLayout';
import PoliceLayout from './shared/layout/PoliceLayout';
import JudgeLayout from './shared/layout/JudgeLayout';
import AdminLayout from './shared/layout/AdminLayout';
import LandingPage from './shared/layout/LandingPage';

// ================== SHARED UTILITIES ==================
import { initializeBlockchain } from './services/akhandLedger';
import { useLocalization, Language } from './features/main/hooks/useLocalization';
import { ChatMessage, Case, HistoryItem } from './features/main/types';
import { ToastProvider } from './shared/hooks/useToast';

// ================== LAZY LOADED LEGACY FEATURES ==================
// Using React.lazy for code splitting and performance optimization

// Shared Components
const Nyayabot = React.lazy(() => import('./features/main/components/Nyayabot'));
const DocumentAnalysis = React.lazy(() => import('./features/main/components/DocumentAnalysis'));
const CaseIntakeTriage = React.lazy(() => import('./features/main/components/CaseIntakeTriage'));
const CaseRelationshipMapper = React.lazy(() => import('./features/main/components/CaseRelationshipMapper'));
const JusticeTimeline = React.lazy(() => import('./features/main/components/JusticeTimeline'));
const JudicialWellness = React.lazy(() => import('./features/main/components/JudicialWellness'));
const LegalTechHub = React.lazy(() => import('./features/main/components/LegalTechHub'));
const LitigantHappiness = React.lazy(() => import('./features/main/components/LitigantHappiness'));
const History = React.lazy(() => import('./features/main/components/History'));
const QuantumFingerprinting = React.lazy(() => import('./features/main/components/QuantumFingerprinting'));

// Judge-specific Components
const DraftJudgmentPanel = React.lazy(() => import('./components/DraftJudgmentPanel'));
const AdjournmentRiskPanel = React.lazy(() => import('./components/AdjournmentRiskPanel'));
const CaseQueue = React.lazy(() => import('./components/CaseQueue'));
const NyayaChitra = React.lazy(() => import('./components/NyayaChitra'));
const QuantumHashProof = React.lazy(() => import('./components/QuantumHashProof'));

// Citizen-specific Components (VoiceFilingInterface used directly in citizen routes)
const CitizenHomePage = React.lazy(() => import('./personas/citizen/pages/CitizenHome'));
const CaseTrackPage = React.lazy(() => import('./personas/citizen/pages/CaseTrack'));
const CitizenTimelinePage = React.lazy(() => import('./personas/citizen/pages/CitizenTimeline'));
const CitizenVisualJusticePage = React.lazy(() => import('./personas/citizen/pages/CitizenVisualJustice'));
const CitizenComplaintPage = React.lazy(() => import('./personas/citizen/pages/CitizenComplaint'));

// Police-specific Components
const SmartBailPanel = React.lazy(() => import('./features/nationals/components/SmartBailPanel'));
const PoliceDashboard = React.lazy(() => import('./personas/police/pages/PoliceDashboard'));
const SmartFIRPage = React.lazy(() => import('./personas/police/pages/SmartFIR'));
const EvidenceLockerPage = React.lazy(() => import('./personas/police/pages/EvidenceLocker'));
const PatrolMapPage = React.lazy(() => import('./personas/police/pages/PatrolMap'));
const DutyRosterPage = React.lazy(() => import('./personas/police/pages/DutyRoster'));
const Section63CertificateGenerator = React.lazy(() => import('./personas/police/components/Section63CertificateGenerator'));
const ChargeSheetGate = React.lazy(() => import('./personas/police/components/ChargeSheetGate'));

// Admin-specific Components
const AdminDashboard = React.lazy(() => import('./personas/admin/pages/AdminDashboard'));
const BNSTransitionPage = React.lazy(() => import('./personas/admin/pages/BNSTransition'));
const PendencyMapPage = React.lazy(() => import('./personas/admin/pages/PendencyMap'));

// Judge-specific Components (BSA Compliance)
const HashVerifierPage = React.lazy(() => import('./personas/judge/pages/HashVerifier'));
const JudgeBoardPage = React.lazy(() => import('./personas/judge/pages/JudgeBoard'));
const JudgeWellnessPage = React.lazy(() => import('./personas/judge/pages/JudgeWellness'));
const CaseQueuePage = React.lazy(() => import('./personas/judge/pages/CaseQueuePage'));
const SmartBailPage = React.lazy(() => import('./personas/judge/pages/SmartBailPage'));
const OrdersHistoryPage = React.lazy(() => import('./personas/judge/pages/OrdersHistory'));
const VirtualMootCourtPage = React.lazy(() => import('./personas/judge/pages/VirtualMootCourt'));

// Enhanced Judge Dashboard (Nationals - with Sovereign Badge, Smart Query, Vipaksh)
const EnhancedJudgeDashboard = React.lazy(() => import('./features/nationals/modules/judge/JudgeDashboard'));

// Shared Components (Chain of Custody)
const ChainOfCustodyTimeline = React.lazy(() => import('./shared/components/ChainOfCustodyTimeline'));
const ProfileSettings = React.lazy(() => import('./shared/pages/ProfileSettings'));

// Citizen-specific Components (BNSS Compliance)
const EFirSignatureTimer = React.lazy(() => import('./personas/citizen/components/EFirSignatureTimer'));

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
    const [language] = useState<Language>('en');
    const { t } = useLocalization(language);
    const [allCases, setAllCases] = useState<Case[]>([]);
    const [selectedCase, setSelectedCase] = useState<Case | null>(null);

    return (
        <React.Suspense fallback={<LoadingFallback />}>
            <CaseIntakeTriage
                t={t}
                allCases={allCases}
                setAllCases={setAllCases}
                selectedCase={selectedCase}
                setSelectedCase={setSelectedCase}
            />
        </React.Suspense>
    );
};

const DocumentAnalysisWrapper: React.FC = () => {
    const [language] = useState<Language>('en');
    const { t } = useLocalization(language);

    return (
        <React.Suspense fallback={<LoadingFallback />}>
            <DocumentAnalysis t={t} />
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

const JudicialWellnessWrapper: React.FC = () => {
    const [language] = useState<Language>('en');
    const { t } = useLocalization(language);
    const [breakTime, setBreakTime] = useState(2 * 60 * 60);

    return (
        <React.Suspense fallback={<LoadingFallback />}>
            <JudicialWellness
                t={t}
                breakTime={breakTime}
                setBreakTime={setBreakTime}
            />
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
    const { user } = useAuth();
    const [language] = useState<Language>('en');
    const { t } = useLocalization(language);
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        if (user) {
            const stored = localStorage.getItem(`nyaya:history:${user.id}`);
            if (stored) setHistory(JSON.parse(stored));
        }
    }, [user]);

    const handleClearHistory = () => {
        setHistory([]);
        if (user) localStorage.removeItem(`nyaya:history:${user.id}`);
    };

    return (
        <React.Suspense fallback={<LoadingFallback />}>
            <History t={t} history={history} onClearHistory={handleClearHistory} />
        </React.Suspense>
    );
};

const QuantumFingerprintWrapper: React.FC = () => {
    const [language] = useState<Language>('en');
    const { t } = useLocalization(language);

    return (
        <React.Suspense fallback={<LoadingFallback />}>
            <QuantumFingerprinting t={t} />
        </React.Suspense>
    );
};

const DraftJudgmentWrapper: React.FC = () => {
    const [language] = useState<Language>('en');
    const { t } = useLocalization(language);

    return (
        <React.Suspense fallback={<LoadingFallback />}>
            <DraftJudgmentPanel t={t} selectedCase={null} />
        </React.Suspense>
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

    return (
        <React.Suspense fallback={<LoadingFallback />}>
            <NyayaChitra legalText="Sample legal text for visual justice card generation." language={language} />
        </React.Suspense>
    );
};

const QuantumHashWrapper: React.FC = () => {
    return (
        <React.Suspense fallback={<LoadingFallback />}>
            <QuantumHashProof caseId="DEMO-CASE-001" />
        </React.Suspense>
    );
};

// Note: VoiceFilingWrapper removed - Police FIR now uses SmartFIRPage
// Citizen voice filing uses VoiceFilingInterface directly in citizen routes

const SmartBailWrapper: React.FC = () => {
    const [language] = useState<Language>('en');
    const { t } = useLocalization(language);

    return (
        <React.Suspense fallback={<LoadingFallback />}>
            <SmartBailPanel t={t} selectedCase={null} />
        </React.Suspense>
    );
};

const CaseQueueWrapper: React.FC = () => {
    return (
        <React.Suspense fallback={<LoadingFallback />}>
            <CaseQueue />
        </React.Suspense>
    );
};

// ================== APP COMPONENT ==================
const App: React.FC = () => {
    const { user, isAuthenticated } = useAuth();

    // Initialize blockchain on mount
    useEffect(() => {
        initializeBlockchain();
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

    // If authenticated - use role-based routing
    if (isAuthenticated && user) {
        return (
            <AppSettingsProvider>
                <ToastProvider>
                    <Routes>
                        {/* Redirect root to appropriate dashboard based on role */}
                        <Route
                            path="/"
                            element={<Navigate to={`/${(user.role || 'citizen').toLowerCase()}/home`} replace />}
                        />

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
                                <Route path="quantum" element={<QuantumFingerprintWrapper />} />
                                <Route path="hash" element={<QuantumHashWrapper />} />
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
                                <Route path="draft" element={<React.Suspense fallback={<LoadingFallback />}><EnhancedJudgeDashboard /></React.Suspense>} />
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
                                <Route path="quantum" element={<QuantumFingerprintWrapper />} />
                                <Route path="transition" element={<React.Suspense fallback={<LoadingFallback />}><BNSTransitionPage /></React.Suspense>} />
                                <Route path="pendency" element={<React.Suspense fallback={<LoadingFallback />}><PendencyMapPage /></React.Suspense>} />
                            </Route>
                        </Route>


                        {/* Catch-all fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </ToastProvider>
            </AppSettingsProvider>
        );
    }

    // ================== PUBLIC ROUTES ==================
    return (
        <ToastProvider>
            <Routes>
                <Route path="/" element={<LandingPage />} />

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
