// src/personas/police/pages/StationDashboard.tsx
// NyayaSahayak Hybrid v2.0.0 - Police Station Dashboard (NyayaRakshak)
// Features: Zero FIR Transfer Timer, Active FIR Stats

import React, { useState, useEffect } from 'react';
import {
    Clock,
    AlertTriangle,
    CheckCircle2,
    FileText,
    Users,
    MapPin,
    Send,
    Timer
} from 'lucide-react';
import type { PilotCase } from '../../../types/pilot';

// Mock Zero FIR data
const mockZeroFirs: PilotCase[] = [
    {
        id: 'ZFIR-001',
        cnrNumber: '0/2024/DL/001',
        incidentDate: '2024-12-10',
        filingDate: '2024-12-13T10:30:00',
        isZeroFir: true,
        zeroFirTransferStatus: 'PENDING',
        adjournmentsCount: 0,
        offenceType: 'SNATCHING',
        applicableSection: 'BNS 304',
        actName: 'Bharatiya Nyaya Sanhita, 2023',
        complainant: 'Ramesh Kumar',
        summary: 'Chain snatching near Sector 15 market by two bike-borne assailants',
        urgency: 'HIGH'
    },
    {
        id: 'ZFIR-002',
        cnrNumber: '0/2024/DL/002',
        incidentDate: '2024-12-12',
        filingDate: '2024-12-14T08:00:00',
        isZeroFir: true,
        zeroFirTransferStatus: 'PENDING',
        adjournmentsCount: 0,
        offenceType: 'THEFT',
        applicableSection: 'BNS 303(2)',
        actName: 'Bharatiya Nyaya Sanhita, 2023',
        complainant: 'Sunita Sharma',
        summary: 'Mobile phone theft at bus stop',
        urgency: 'MEDIUM'
    }
];

// Countdown timer hook
const useCountdown = (deadline: string) => {
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const deadlineTime = new Date(deadline).getTime() + (24 * 60 * 60 * 1000); // +24 hours
            const now = Date.now();
            const diff = deadlineTime - now;

            if (diff <= 0) {
                setIsExpired(true);
                setTimeLeft('EXPIRED');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(interval);
    }, [deadline]);

    return { timeLeft, isExpired };
};

// Zero FIR Transfer Card Component
const ZeroFirCard: React.FC<{ fir: PilotCase; onTransfer: (id: string) => void }> = ({ fir, onTransfer }) => {
    const { timeLeft, isExpired } = useCountdown(fir.filingDate);

    return (
        <div className={`bg-slate-800/50 border rounded-xl p-4 ${isExpired ? 'border-red-500/50' : 'border-amber-500/30'
            }`}>
            <div className="flex items-start justify-between mb-3">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded font-mono">
                            Zero FIR
                        </span>
                        <span className="text-sm text-slate-400">{fir.cnrNumber}</span>
                    </div>
                    <h3 className="text-white font-medium mt-1">{fir.complainant}</h3>
                </div>

                {/* Countdown Timer */}
                <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isExpired
                        ? 'bg-red-500/20 border border-red-500/30'
                        : 'bg-amber-500/20 border border-amber-500/30'
                        }`}
                    role="alert"
                    aria-label={`Transfer deadline: ${timeLeft}`}
                >
                    <Timer className={`w-4 h-4 ${isExpired ? 'text-red-400' : 'text-amber-400'}`} />
                    <span className={`font-mono font-bold ${isExpired ? 'text-red-400' : 'text-amber-400'}`}>
                        {timeLeft}
                    </span>
                </div>
            </div>

            <p className="text-sm text-slate-400 mb-3">{fir.summary}</p>

            <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs px-2 py-1 rounded ${fir.urgency === 'HIGH'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-blue-500/20 text-blue-400'
                    }`}>
                    {fir.urgency}
                </span>
                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                    {fir.applicableSection}
                </span>
            </div>

            <button
                onClick={() => onTransfer(fir.id)}
                disabled={isExpired}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-all ${isExpired
                    ? 'bg-red-500/20 text-red-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
            >
                <Send className="w-4 h-4" />
                {isExpired ? 'Transfer Overdue - Escalate' : 'Initiate Transfer'}
            </button>
        </div>
    );
};

const StationDashboard: React.FC = () => {
    const [zeroFirs, setZeroFirs] = useState<PilotCase[]>(mockZeroFirs);
    const [transferred, setTransferred] = useState<string[]>([]);

    // Quick stats
    const stats = [
        { label: 'Active FIRs', value: '24', icon: FileText, color: 'text-blue-400' },
        { label: 'Zero FIRs Pending', value: zeroFirs.length.toString(), icon: Clock, color: 'text-amber-400' },
        { label: 'Officers On Duty', value: '12', icon: Users, color: 'text-green-400' },
        { label: 'High Alert Areas', value: '3', icon: MapPin, color: 'text-red-400' },
    ];

    const handleTransfer = (id: string) => {
        // Save transfer timestamp to localStorage
        const transferData = {
            id,
            transferredAt: new Date().toISOString()
        };
        localStorage.setItem(`zfir_transfer_${id}`, JSON.stringify(transferData));

        // Update UI
        setTransferred([...transferred, id]);
        setZeroFirs(zeroFirs.filter(fir => fir.id !== id));

        // Show toast (simplified)
        alert(`✅ Zero FIR ${id} transferred to jurisdictional station`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Station Dashboard</h1>
                    <p className="text-slate-400">Sector 14 Police Station, Delhi</p>
                </div>
                <div className="flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 px-4 py-2 rounded-xl">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-blue-400 text-sm font-medium">CCTNS Connected</span>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <div
                        key={idx}
                        className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4"
                    >
                        <stat.icon className={`w-6 h-6 ${stat.color} mb-2`} />
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                        <p className="text-sm text-slate-400">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Zero FIR Transfers Section */}
            <div className="bg-slate-800/30 border border-amber-500/30 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <h2 className="text-lg font-bold text-white">Pending Zero FIR Transfers</h2>
                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">
                        BNSS Sec 173
                    </span>
                </div>
                <p className="text-sm text-slate-400 mb-4">
                    Zero FIRs must be transferred to jurisdictional station within 24 hours of filing.
                </p>

                {zeroFirs.length === 0 ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-green-400">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>All Zero FIRs have been transferred</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {zeroFirs.map((fir) => (
                            <ZeroFirCard
                                key={fir.id}
                                fir={fir}
                                onTransfer={handleTransfer}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Recently Transferred */}
            {transferred.length > 0 && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <span className="text-green-400 font-medium">
                            {transferred.length} Zero FIR(s) transferred successfully
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StationDashboard;
