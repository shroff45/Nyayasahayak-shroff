// src/personas/admin/pages/PendencyMap.tsx
// NyayaSahayak Hybrid v2.0.0 - Case Pendency Heatmap
// Geospatial visualization of case backlogs

import React, { useEffect, useRef, useState } from 'react';
import {
    Map, BarChart3, TrendingDown, AlertTriangle,
    RefreshCw, Filter, Download
} from 'lucide-react';

// Declare Leaflet for TypeScript
declare global {
    interface Window {
        L: any;
    }
}

// Mock pendency data by state
const STATE_PENDENCY = [
    { name: 'Uttar Pradesh', lat: 26.8, lng: 80.9, pending: 1856432, severity: 'CRITICAL' },
    { name: 'Maharashtra', lat: 19.7, lng: 75.7, pending: 1245678, severity: 'HIGH' },
    { name: 'Bihar', lat: 25.6, lng: 85.1, pending: 987654, severity: 'HIGH' },
    { name: 'West Bengal', lat: 22.9, lng: 87.9, pending: 756432, severity: 'MEDIUM' },
    { name: 'Tamil Nadu', lat: 11.1, lng: 78.6, pending: 654321, severity: 'MEDIUM' },
    { name: 'Karnataka', lat: 15.3, lng: 75.7, pending: 543210, severity: 'MEDIUM' },
    { name: 'Gujarat', lat: 22.3, lng: 71.2, pending: 432109, severity: 'LOW' },
    { name: 'Rajasthan', lat: 27.0, lng: 74.2, pending: 387654, severity: 'LOW' },
];

const PendencyMap: React.FC = () => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedState, setSelectedState] = useState<typeof STATE_PENDENCY[0] | null>(null);

    // Load Leaflet from CDN
    useEffect(() => {
        if (window.L) {
            initializeMap();
            return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => initializeMap();
        document.body.appendChild(script);

        return () => {
            if (mapRef.current) mapRef.current.remove();
        };
    }, []);

    const initializeMap = () => {
        if (!mapContainerRef.current || !window.L) return;

        const L = window.L;

        const map = L.map(mapContainerRef.current, { zoomControl: false })
            .setView([22.5, 82.5], 5);

        L.control.zoom({ position: 'topright' }).addTo(map);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OSM &copy; CARTO',
            maxZoom: 19
        }).addTo(map);

        // Add pendency circles
        STATE_PENDENCY.forEach(state => {
            const color = state.severity === 'CRITICAL' ? '#EF4444' :
                state.severity === 'HIGH' ? '#F59E0B' :
                    state.severity === 'MEDIUM' ? '#3B82F6' : '#10B981';

            const radius = Math.sqrt(state.pending) * 15;

            L.circle([state.lat, state.lng], {
                color: color,
                fillColor: color,
                fillOpacity: 0.4,
                radius: radius,
                weight: 2
            }).addTo(map).bindPopup(`
                <div style="min-width: 150px;">
                    <strong>${state.name}</strong><br/>
                    <span style="color: ${color}; font-weight: bold;">
                        ${state.pending.toLocaleString()} pending
                    </span><br/>
                    <small>Severity: ${state.severity}</small>
                </div>
            `);
        });

        mapRef.current = map;
        setIsLoading(false);
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return 'text-red-400 bg-red-500/20';
            case 'HIGH': return 'text-amber-400 bg-amber-500/20';
            case 'MEDIUM': return 'text-blue-400 bg-blue-500/20';
            case 'LOW': return 'text-emerald-400 bg-emerald-500/20';
            default: return 'text-slate-400 bg-slate-500/20';
        }
    };

    const totalPending = STATE_PENDENCY.reduce((sum, s) => sum + s.pending, 0);

    return (
        <div className="h-full flex flex-col lg:flex-row gap-4 p-4">
            {/* Map Panel */}
            <div className="flex-1 flex flex-col min-h-[400px]">
                <div className="bg-slate-800/50 border border-slate-700 rounded-t-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                            <Map className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <h2 className="font-bold text-white">Case Pendency Heatmap</h2>
                            <p className="text-xs text-slate-400">National Case Backlog Visualization</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                            <Filter className="w-4 h-4 text-slate-300" />
                        </button>
                        <button className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                            <Download className="w-4 h-4 text-slate-300" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 relative bg-slate-900 border-x border-b border-slate-700 rounded-b-xl overflow-hidden">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                        </div>
                    )}
                    <div ref={mapContainerRef} className="absolute inset-0" />

                    {/* Legend */}
                    <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-700 rounded-lg p-3 z-[1000]">
                        <h4 className="text-xs font-bold text-slate-400 mb-2">SEVERITY</h4>
                        <div className="space-y-1.5 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <span className="text-slate-300">Critical (&gt;1M)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-amber-500" />
                                <span className="text-slate-300">High (500K-1M)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                <span className="text-slate-300">Medium (200K-500K)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                <span className="text-slate-300">Low (&lt;200K)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Panel */}
            <div className="w-full lg:w-80 flex flex-col gap-4">
                {/* Summary */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="text-sm font-bold">NATIONAL PENDENCY</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{totalPending.toLocaleString()}</p>
                    <p className="text-xs text-red-400/70">Cases pending across India</p>
                </div>

                {/* State Ranking */}
                <div className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl p-4 overflow-hidden flex flex-col">
                    <h3 className="font-bold text-white flex items-center gap-2 mb-3">
                        <BarChart3 className="w-4 h-4 text-amber-400" />
                        State Ranking
                    </h3>
                    <div className="space-y-2 overflow-y-auto flex-1">
                        {STATE_PENDENCY.sort((a, b) => b.pending - a.pending).map((state, idx) => (
                            <div
                                key={state.name}
                                onClick={() => setSelectedState(state)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedState?.name === state.name
                                        ? 'bg-amber-500/20 border-amber-500/50'
                                        : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-white text-sm flex items-center gap-2">
                                        <span className="text-slate-500">#{idx + 1}</span>
                                        {state.name}
                                    </span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getSeverityColor(state.severity)}`}>
                                        {state.severity}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-slate-500">
                                    <span>{state.pending.toLocaleString()} pending</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
                        <p className="text-xs text-slate-500 mb-1">Critical States</p>
                        <p className="text-xl font-bold text-red-400">
                            {STATE_PENDENCY.filter(s => s.severity === 'CRITICAL').length}
                        </p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
                        <p className="text-xs text-slate-500 mb-1">Avg. Pendency</p>
                        <p className="text-xl font-bold text-white">
                            {Math.round(totalPending / STATE_PENDENCY.length).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PendencyMap;
