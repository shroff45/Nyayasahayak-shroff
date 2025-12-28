import React from 'react';
import { Map, Navigation, ShieldAlert } from 'lucide-react';

export const PatrolMap: React.FC = () => {
    return (
        <div className="h-[600px] w-full bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden group">
            <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover bg-center grayscale invert"></div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

            <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
                <div className="bg-slate-900/90 backdrop-blur border border-slate-700 p-4 rounded-xl shadow-lg">
                    <h3 className="font-bold text-slate-100 flex items-center gap-2">
                        <Map className="text-blue-500" size={18} /> Live Patrol Command
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="flex items-center gap-1 text-slate-400"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div> 12 Units Active</span>
                        <span className="flex items-center gap-1 text-slate-400"><div className="w-2 h-2 rounded-full bg-red-500"></div> 3 High Risk Zones</span>
                    </div>
                </div>
            </div>

            <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-red-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/3 right-1/3 w-40 h-40 bg-red-600/10 rounded-full blur-3xl animate-pulse delay-700"></div>

            <PatrolUnit id="PCR-1" top="30%" left="40%" status="Patrolling" />
            <PatrolUnit id="PCR-5" top="60%" left="20%" status="Responding" isResponding />
            <PatrolUnit id="Bike-2" top="45%" left="70%" status="Idle" />

            <div className="absolute top-[34%] left-[42%] flex flex-col items-center animate-bounce">
                <ShieldAlert className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" size={32} />
                <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full mt-1 font-bold">Theft Reported</span>
            </div>

            <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur border border-slate-700 p-3 rounded-xl text-xs space-y-2 z-10">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900"></div> Patrol Unit</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 border-2 border-slate-900 animate-pulse"></div> Incident</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500/30"></div> Hotspot</div>
            </div>
        </div>
    );
};

const PatrolUnit = ({ id, top, left, status, isResponding }: any) => (
    <div className="absolute flex flex-col items-center group/unit cursor-pointer transition-all duration-1000" style={{ top, left }}>
        <div className={`relative p-1.5 rounded-full border-2 ${isResponding ? 'bg-red-600 border-red-400 animate-ping' : 'bg-blue-600 border-blue-400'}`}>
            <Navigation size={12} className="text-white transform rotate-45" />
        </div>
        <div className="absolute bottom-full mb-2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded border border-slate-600 whitespace-nowrap opacity-0 group-hover/unit:opacity-100 transition-opacity">
            <span className="font-bold">{id}</span> • {status}
        </div>
    </div>
);
