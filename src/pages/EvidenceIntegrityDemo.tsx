// src/pages/EvidenceIntegrityDemo.tsx
// NyayaSahayak v2.0.0 - Evidence Integrity Sandbox
// Flight simulator control panel for testing BNSS 176(3) compliance scenarios

import React, { useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
    Shield,
    FlaskConical,
    Video,
    UserCheck,
    Hash,
    Clock,
    AlertTriangle,
    Beaker,
    User,
    Gavel,
    ArrowLeftRight
} from 'lucide-react';
import ChargeSheetGate from '../personas/police/components/ChargeSheetGate';
import ChainOfCustodyTimeline from '../shared/components/ChainOfCustodyTimeline';
import CognizanceReview from '../personas/judge/components/CognizanceReview';
import type { CustodyChain, CustodyEvent } from '../types/custody.types';
import type { ForensicVideoMetadata, ForensicVisitToken, ForensicCompliance } from '../types/forensic.types';
import { validateForensicCompliance, isForensicVideoMandatory, requestComplianceOverride, approveOverride } from '../core/services/forensicInterlock';

type ViewMode = 'police' | 'judge';

/**
 * Generate mock forensic video metadata based on simulation state
 */
const generateMockVideo = (isPresent: boolean, isTampered: boolean): ForensicVideoMetadata | null => {
    if (!isPresent) return null;

    return {
        videoId: 'VID-2025-DEMO-001',
        caseId: 'CASE-DEMO-101',
        fileName: 'crime_scene_recording.mp4',
        fileSize: 524288000, // 500MB
        duration: 1800, // 30 minutes
        mimeType: 'video/mp4',
        captureDevice: {
            make: 'Samsung',
            model: 'Galaxy S23',
            imei: '352845XXXXXX',
            osVersion: 'Android 14'
        },
        captureTimestamp: new Date(Date.now() - 86400000), // 1 day ago
        ntpSynced: true,
        geoLocation: { latitude: 12.9716, longitude: 77.5946 },
        sourceHash: 'A1B2C3D4E5F6789012345678ABCDEF0123456789ABCDEF0123456789ABCDEF01',
        serverHash: isTampered
            ? 'ZZZZZ999888777666555444333222111ZZZZZ999888777666555444333222111'
            : 'A1B2C3D4E5F6789012345678ABCDEF0123456789ABCDEF0123456789ABCDEF01',
        hashAlgorithm: 'SHA-256',
        uploadStatus: 'UPLOADED',
        integrityStatus: isTampered ? 'MISMATCH' : 'VERIFIED'
    };
};

/**
 * Generate mock expert visit token based on simulation state
 */
const generateMockExpertToken = (isVerified: boolean): ForensicVisitToken | null => {
    if (!isVerified) return null;

    return {
        tokenId: 'TOK-2025-FSL-001',
        caseId: 'CASE-DEMO-101',
        investigatingOfficerId: 'IO-SHARMA-456',
        investigatingOfficerName: 'SI Rajesh Sharma',
        forensicExpertId: 'FSL-EXPERT-789',
        forensicExpertName: 'Dr. Priya Menon',
        forensicExpertDesignation: 'Scientific Officer',
        visitTimestamp: new Date(Date.now() - 86400000),
        geoLocation: {
            latitude: 12.9716,
            longitude: 77.5946,
            accuracy: 5,
            address: 'Crime Scene, Sector 4, Bangalore'
        },
        handshakeMethod: 'QR_CODE',
        digitalSignature: 'sig_kyber_dilithium_xyz',
        isVerified: true
    };
};

/**
 * Generate mock chain of custody based on simulation state
 */
const generateMockChain = (isTampered: boolean, hasGap: boolean): CustodyChain => {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 86400000 * 2);
    const gapTime = hasGap
        ? new Date(now.getTime() - 86400000 * 0.5) // 30 hours gap
        : new Date(now.getTime() - 86400000 * 1.9); // 2 hours gap

    const events: CustodyEvent[] = [
        {
            eventId: 'evt_1',
            evidenceId: 'EV-2025-DEMO-001',
            caseId: 'CASE-DEMO-101',
            eventType: 'SEIZURE',
            description: 'Evidence seized from crime scene',
            timestamp: twoDaysAgo,
            custodian: {
                id: 'IO-SHARMA-456',
                name: 'SI Rajesh Sharma',
                role: 'INVESTIGATING_OFFICER',
                designation: 'Sub-Inspector',
                badgeNumber: 'KA-BLR-1234',
                stationCode: 'PS-BLR-001'
            },
            location: {
                name: 'Crime Scene, Sector 4',
                address: 'Building 42, Sector 4, Bangalore',
                gpsCoordinates: { latitude: 12.9716, longitude: 77.5946 }
            },
            evidenceHash: 'A1B2C3D4E5F6789012345678ABCDEF0123456789ABCDEF0123456789ABCDEF01',
            hashAlgorithm: 'SHA-256',
            ledgerBlockId: 'BLK-001-2025',
            integrityStatus: 'VERIFIED'
        },
        {
            eventId: 'evt_2',
            evidenceId: 'EV-2025-DEMO-001',
            caseId: 'CASE-DEMO-101',
            eventType: 'HANDOVER',
            description: 'Transferred to Malkhana',
            timestamp: gapTime,
            custodian: {
                id: 'MALKHANA-SINGH-123',
                name: 'HC Gurpreet Singh',
                role: 'MALKHANA_INCHARGE',
                designation: 'Head Constable',
                stationCode: 'PS-BLR-001'
            },
            location: {
                name: 'PS Koramangala Malkhana',
                address: 'Police Station, Koramangala'
            },
            previousCustodianId: 'IO-SHARMA-456',
            evidenceHash: 'A1B2C3D4E5F6789012345678ABCDEF0123456789ABCDEF0123456789ABCDEF01',
            hashAlgorithm: 'SHA-256',
            ledgerBlockId: 'BLK-002-2025',
            integrityStatus: hasGap ? 'GAP_DETECTED' : 'VERIFIED'
        },
        {
            eventId: 'evt_3',
            evidenceId: 'EV-2025-DEMO-001',
            caseId: 'CASE-DEMO-101',
            eventType: 'ANALYSIS',
            description: 'Forensic analysis initiated',
            timestamp: now,
            custodian: {
                id: 'FSL-EXPERT-789',
                name: 'Dr. Priya Menon',
                role: 'FORENSIC_EXPERT',
                designation: 'Scientific Officer',
                organization: 'Karnataka FSL'
            },
            location: {
                name: 'State Forensic Lab',
                address: 'FSL Madiwala, Bangalore'
            },
            previousCustodianId: 'MALKHANA-SINGH-123',
            evidenceHash: isTampered
                ? 'CORRUPTED_HASH_ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ'
                : 'A1B2C3D4E5F6789012345678ABCDEF0123456789ABCDEF0123456789ABCDEF01',
            hashAlgorithm: 'SHA-256',
            ledgerBlockId: 'BLK-003-2025',
            integrityStatus: isTampered ? 'MISMATCH' : 'VERIFIED'
        }
    ];

    // Calculate gaps
    const gaps: CustodyChain['gaps'] = [];
    for (let i = 0; i < events.length - 1; i++) {
        const gapHours = (new Date(events[i + 1].timestamp).getTime() - new Date(events[i].timestamp).getTime()) / (1000 * 60 * 60);
        if (gapHours > 24) {
            gaps.push({
                fromEvent: events[i].eventId,
                toEvent: events[i + 1].eventId,
                gapDuration: Math.round(gapHours),
                isAcceptable: false
            });
        }
    }

    return {
        evidenceId: 'EV-2025-DEMO-001',
        caseId: 'CASE-DEMO-101',
        cnrNumber: 'KABLR12345672025',
        evidenceDescription: 'Mobile Phone - Samsung Galaxy S23 (Victim\'s)',
        evidenceCategory: 'DIGITAL',
        events,
        currentCustodian: events[events.length - 1].custodian,
        currentLocation: events[events.length - 1].location,
        overallIntegrity: isTampered ? 'MISMATCH' : (hasGap ? 'GAP_DETECTED' : 'VERIFIED'),
        chainStartHash: 'A1B2C3D4E5F6789012345678ABCDEF0123456789ABCDEF0123456789ABCDEF01',
        chainCurrentHash: isTampered
            ? 'CORRUPTED_HASH_ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ'
            : 'A1B2C3D4E5F6789012345678ABCDEF0123456789ABCDEF0123456789ABCDEF01',
        isChainUnbroken: !isTampered && !hasGap,
        hasTimeGaps: hasGap,
        gaps,
        ledgerVerification: {
            isVerified: !isTampered,
            lastVerifiedAt: new Date(),
            blockCount: 3,
            genesisBlockId: 'BLK-001-2025'
        },
        createdAt: twoDaysAgo,
        updatedAt: now
    };
};

const EvidenceIntegrityDemo: React.FC = () => {
    const { caseId } = useParams<{ caseId?: string }>();

    // === VIEW MODE ===
    const [viewMode, setViewMode] = useState<ViewMode>('police');

    // === SIMULATION CONTROLS ===
    const [videoPresent, setVideoPresent] = useState(true);
    const [expertVerified, setExpertVerified] = useState(true);
    const [isTampered, setIsTampered] = useState(false);
    const [hasTransitGap, setHasTransitGap] = useState(false);

    // === SHARED COMPLIANCE STATE (for cross-view communication) ===
    const [sharedCompliance, setSharedCompliance] = useState<ForensicCompliance | null>(null);
    const [chargeSheetFiled, setChargeSheetFiled] = useState(false);

    // Generate mock data based on simulation state
    const mockVideo = useMemo(() => generateMockVideo(videoPresent, isTampered), [videoPresent, isTampered]);
    const mockExpertToken = useMemo(() => generateMockExpertToken(expertVerified), [expertVerified]);
    const mockChain = useMemo(() => generateMockChain(isTampered, hasTransitGap), [isTampered, hasTransitGap]);

    // Default compliance for Judge view (generated if charge sheet is filed)
    const judgeCompliance = useMemo(() => {
        if (sharedCompliance) return sharedCompliance;

        // Generate a default compliance with override for demo purposes
        const mandatoryCheck = isForensicVideoMandatory(['103', '302'], 'BNS');
        let compliance = validateForensicCompliance(
            caseId || 'CASE-DEMO-101',
            mockVideo,
            mockExpertToken,
            mandatoryCheck.isMandatory
        );

        // If not compliant, simulate an override scenario for judge view
        if (compliance.interlockStatus === 'LOCKED' && chargeSheetFiled) {
            compliance = requestComplianceOverride(
                compliance,
                'SI Rajesh Sharma',
                'EXTREME_TERRAIN',
                'Remote hill station area with no cellular network coverage. Documented in Station Diary Entry 45/2025.'
            );
            compliance = approveOverride(compliance, 'SP_Karnataka_Division');
        }

        return compliance;
    }, [sharedCompliance, caseId, mockVideo, mockExpertToken, chargeSheetFiled]);

    // Handle charge sheet submission (updates shared state for Judge view)
    const handleChargeSheetSubmit = useCallback(() => {
        setChargeSheetFiled(true);
        alert('✅ Charge Sheet Submitted Successfully! Switch to Judge View to see the cognizance review.');
    }, []);

    // Toggle component for simulation controls
    const Toggle: React.FC<{
        checked: boolean;
        onChange: (val: boolean) => void;
        label: string;
        variant?: 'default' | 'warning' | 'danger';
    }> = ({ checked, onChange, label, variant = 'default' }) => {
        const colors = {
            default: checked ? 'text-emerald-400' : 'text-slate-400',
            warning: checked ? 'text-amber-400' : 'text-slate-400',
            danger: checked ? 'text-red-400' : 'text-slate-400'
        };

        return (
            <label className="flex items-center gap-3 cursor-pointer select-none">
                <button
                    onClick={() => onChange(!checked)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${checked
                        ? variant === 'danger' ? 'bg-red-500' : variant === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                        : 'bg-slate-600'
                        }`}
                >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'left-7' : 'left-1'
                        }`} />
                </button>
                <span className={`font-medium ${colors[variant]}`}>{label}</span>
            </label>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
            {/* Header */}
            <header className="mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <Beaker className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Evidence Integrity Sandbox</h1>
                            <p className="text-slate-400">
                                BNSS 176(3) Compliance Testing • Case: {caseId || 'DEMO-CASE-101'}
                            </p>
                        </div>
                    </div>

                    {/* View Mode Switcher */}
                    <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/50 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('police')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${viewMode === 'police'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <User className="w-4 h-4" />
                            Police (IO)
                        </button>
                        <ArrowLeftRight className="w-4 h-4 text-slate-500" />
                        <button
                            onClick={() => setViewMode('judge')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${viewMode === 'judge'
                                    ? 'bg-purple-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Gavel className="w-4 h-4" />
                            Judge (Magistrate)
                        </button>
                    </div>
                </div>
            </header>

            {/* Control Panel */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <FlaskConical className="w-5 h-5 text-purple-400" />
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                        Simulation Controls
                    </h3>
                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded">
                        Dev Only
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ml-auto ${viewMode === 'police' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                        }`}>
                        {viewMode === 'police' ? '👮 Police View' : '⚖️ Judge View'}
                    </span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Compliance Controls */}
                    <div className="space-y-4">
                        <h4 className="text-xs text-slate-500 uppercase font-medium">Compliance Checks</h4>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Video className="w-4 h-4 text-slate-400" />
                                <Toggle
                                    checked={videoPresent}
                                    onChange={setVideoPresent}
                                    label="Video Present"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-slate-400" />
                                <Toggle
                                    checked={expertVerified}
                                    onChange={setExpertVerified}
                                    label="Expert Verified"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Failure Scenarios */}
                    <div className="space-y-4">
                        <h4 className="text-xs text-slate-500 uppercase font-medium">Failure Scenarios</h4>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-amber-400" />
                                <Toggle
                                    checked={hasTransitGap}
                                    onChange={setHasTransitGap}
                                    label=">24h Transit Gap"
                                    variant="warning"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Hash className="w-4 h-4 text-red-400" />
                                <Toggle
                                    checked={isTampered}
                                    onChange={setIsTampered}
                                    label="Hash Tampered"
                                    variant="danger"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Current State Summary */}
                    <div className="col-span-2 bg-slate-900/50 rounded-lg p-4">
                        <h4 className="text-xs text-slate-500 uppercase font-medium mb-3">Current State</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${videoPresent ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                <span className="text-slate-400">Video: {videoPresent ? 'Uploaded' : 'Missing'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${expertVerified ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                <span className="text-slate-400">Expert: {expertVerified ? 'Verified' : 'Missing'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${!hasTransitGap ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                <span className="text-slate-400">Transit: {hasTransitGap ? 'Gap Detected' : 'Normal'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${!isTampered ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                <span className="text-slate-400">Integrity: {isTampered ? 'Corrupted' : 'Verified'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid - Switches based on View Mode */}
            {viewMode === 'police' ? (
                /* ==================== POLICE VIEW ==================== */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* LEFT: Chain of Custody Timeline */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="w-5 h-5 text-purple-400" />
                            <h2 className="text-xl font-bold text-white">Chain of Custody Timeline</h2>
                        </div>
                        <ChainOfCustodyTimeline
                            chain={mockChain}
                            language="en"
                            onNodeClick={(event) => console.log('Node clicked:', event)}
                            onVerifyHash={(event) => console.log('Verify hash:', event)}
                        />
                    </section>

                    {/* RIGHT: Charge Sheet Gate */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                            <h2 className="text-xl font-bold text-white">Charge Sheet Gate</h2>
                        </div>

                        <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <p className="text-sm text-blue-300">
                                <strong>Context:</strong> Attempting to file Charge Sheet for BNS Section 103 (Murder) -
                                Life Imprisonment offense. Forensic videography is <strong>mandatory</strong> per BNSS 176(3).
                            </p>
                        </div>

                        <ChargeSheetGate
                            caseId={caseId || 'CASE-DEMO-101'}
                            cnrNumber="KABLR12345672025"
                            sections={['103', '302']}
                            lawCode="BNS"
                            forensicVideo={mockVideo}
                            expertVisitToken={mockExpertToken}
                            onSubmit={handleChargeSheetSubmit}
                            onUploadVideo={() => setVideoPresent(true)}
                            onRequestExpert={() => setExpertVerified(true)}
                        />
                    </section>
                </div>
            ) : (
                /* ==================== JUDGE VIEW ==================== */
                <div className="space-y-8">
                    {/* Judge Header */}
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            <Gavel className="w-6 h-6 text-purple-400" />
                            <div>
                                <h2 className="text-xl font-bold text-white">Magistrate's Cognizance Dashboard</h2>
                                <p className="text-sm text-slate-400">
                                    Review BNSS 176(3) compliance before taking cognizance
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Cognizance Review Widget */}
                    <CognizanceReview
                        caseId={caseId || 'CASE-DEMO-101'}
                        cnrNumber="KABLR12345672025"
                        accusedName="Vikram Malhotra"
                        offenseSection="BNS Section 103 (Murder)"
                        filingDate={new Date()}
                        compliance={judgeCompliance}
                        onAccept={(remarks) => {
                            console.log('Exception accepted:', remarks);
                            alert('✅ Exception noted. Cognizance taken with judicial observation recorded.');
                        }}
                        onReject={(reason) => {
                            console.log('Exception rejected:', reason);
                            alert('⚠️ Re-investigation ordered. Case returned to IO with directions.');
                        }}
                        onRequestClarification={(query) => {
                            console.log('Clarification requested:', query);
                            alert('📋 Query sent to IO. Awaiting response before cognizance.');
                        }}
                    />

                    {/* Chain of Custody (Read-only for Judge) */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="w-5 h-5 text-purple-400" />
                            <h2 className="text-xl font-bold text-white">Evidence Chain Verification</h2>
                            <span className="text-xs bg-slate-700 text-slate-400 px-2 py-1 rounded">Read-Only</span>
                        </div>
                        <ChainOfCustodyTimeline
                            chain={mockChain}
                            language="en"
                            onNodeClick={(event) => console.log('Node clicked:', event)}
                            onVerifyHash={(event) => console.log('Verify hash:', event)}
                        />
                    </section>
                </div>
            )}

            {/* Footer Note */}
            <div className="mt-8 p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg">
                <p className="text-sm text-slate-500 text-center">
                    🔬 This sandbox simulates BNSS 176(3) compliance scenarios. Use the view switcher to see both
                    Police (IO) and Judge (Magistrate) perspectives. Toggle controls above to test different states.
                </p>
            </div>
        </div>
    );
};

export default EvidenceIntegrityDemo;

