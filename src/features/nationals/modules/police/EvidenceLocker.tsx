import React, { useState } from 'react';
import { Package, Lock, Fingerprint, Clock, CheckCircle, Search, FileText } from 'lucide-react';
import { VisualEvidencePanel } from '../../shared/components/VisualEvidencePanel';

interface EvidenceItem {
    id: string;
    caseId: string;
    type: string;
    description: string;
    timestamp: string;
    hash: string;
    custodian: string;
    status: 'SECURE' | 'TRANSIT' | 'TAMPERED';
}

export const EvidenceLocker: React.FC = () => {
    const [items] = useState<EvidenceItem[]>([
        {
            id: 'EVID-2024-001',
            caseId: 'FIR-2024-998',
            type: 'Weapon (Knife)',
            description: 'Found at crime scene, sector 4 market area.',
            timestamp: '2024-11-28 14:30:00',
            hash: 'PQC-v1:KYBER:8f7d6a91...',
            custodian: 'Insp. Vikram Singh',
            status: 'SECURE'
        },
        {
            id: 'EVID-2024-002',
            caseId: 'FIR-2024-998',
            type: 'Digital (Hard Disk)',
            description: 'CCTV Footage from Shop No. 12',
            timestamp: '2024-11-28 16:45:00',
            hash: 'PQC-v1:KYBER:3a2b1c99...',
            custodian: 'Cyber Cell',
            status: 'TRANSIT'
        },
        {
            id: 'EVID-2024-005',
            caseId: 'FIR-2024-102',
            type: 'Forensic Sample',
            description: 'Blood sample from location A',
            timestamp: '2024-11-29 09:15:00',
            hash: 'PQC-v1:KYBER:778899aa...',
            custodian: 'Dr. R. Gupta',
            status: 'SECURE'
        }
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                        <Lock className="text-blue-500" /> Digital Evidence Room
                    </h2>
                    <p className="text-slate-400">Blockchain-verified Chain of Custody (Immutable Ledger)</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search Case ID or Hash..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-blue-900/20 whitespace-nowrap">
                        <Package size={18} /> Log Evidence
                    </button>
                </div>
            </div>

            {/* NEW: VISUAL EVIDENCE PANEL (SAM 3 Integration) */}
            <VisualEvidencePanel />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(item => (
                    <div key={item.id} className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl backdrop-blur-sm hover:border-blue-500/50 transition-all group relative overflow-hidden">

                        {/* Status Indicator */}
                        <div className={`absolute top-0 right-0 p-2 rounded-bl-xl text-[10px] font-bold tracking-wider flex items-center gap-1
                ${item.status === 'SECURE' ? 'bg-green-500/10 text-green-400' :
                                item.status === 'TRANSIT' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                            {item.status === 'SECURE' && <CheckCircle size={10} />}
                            {item.status === 'TRANSIT' && <Clock size={10} />}
                            {item.status}
                        </div>

                        <div className="flex justify-between items-start mb-3 mt-1">
                            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg text-blue-400">
                                {item.type.includes('Digital') ? <FileText size={24} /> : <Fingerprint size={24} />}
                            </div>
                        </div>

                        <h3 className="font-bold text-slate-200 text-lg mb-1">{item.type}</h3>
                        <p className="text-slate-400 text-sm mb-4 h-10 line-clamp-2 leading-snug">{item.description}</p>

                        <div className="space-y-2 text-xs font-mono text-slate-500 border-t border-slate-700/50 pt-3">
                            <div className="flex justify-between">
                                <span>Case ID:</span>
                                <span className="text-slate-300 bg-slate-700/50 px-1 rounded">{item.caseId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Custodian:</span>
                                <span className="text-slate-300">{item.custodian}</span>
                            </div>
                            <div className="mt-2 p-2 bg-black/40 rounded border border-slate-700 break-all relative group/hash cursor-pointer hover:bg-black/60 transition-colors">
                                <span className="text-blue-500 font-bold">HASH: </span>
                                <span className="opacity-70">{item.hash}</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-700/50 flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-white font-medium">Transfer</button>
                            <button className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs text-white font-medium">View Chain</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
