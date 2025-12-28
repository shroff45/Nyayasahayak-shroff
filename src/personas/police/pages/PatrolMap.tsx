// src/personas/police/pages/PatrolMap.tsx
// NyayaSahayak Hybrid v2.0.0 - Police Patrol Map
// Zero-Dormant Three-State Implementation + Leaflet.js CDN

import React, { useEffect, useRef, useState } from 'react';
import {
    MapPin, Radio, Users, AlertTriangle,
    Activity, Clock, Shield, Navigation,
    Phone, FileText, RefreshCw, Loader2
} from 'lucide-react';
import { useToast } from '../../../shared/hooks/useToast';
import { mockDelay } from '../../../shared/utils/mockApi';

// Declare Leaflet types for TypeScript
declare global {
    interface Window {
        L: any;
    }
}

// Mock patrol unit data
const PATROL_UNITS = [
    { id: 'PCR-101', name: 'PCR Van Alpha', lat: 28.5355, lng: 77.3910, status: 'ACTIVE', beat: 'Sector 62', lastUpdate: '2 min ago' },
    { id: 'PCR-102', name: 'PCR Van Beta', lat: 28.5485, lng: 77.3400, status: 'RESPONDING', beat: 'Sector 15', lastUpdate: '1 min ago' },
    { id: 'PCR-103', name: 'Bike Patrol 1', lat: 28.5655, lng: 77.3210, status: 'ACTIVE', beat: 'Sector 18', lastUpdate: '5 min ago' },
    { id: 'PCR-104', name: 'Foot Patrol 2', lat: 28.5055, lng: 77.3710, status: 'STANDBY', beat: 'Sector 63', lastUpdate: '8 min ago' },
];

// Mock crime hotspots
const CRIME_HOTSPOTS = [
    { id: 'HS-1', lat: 28.5255, lng: 77.3610, severity: 'HIGH', type: 'Theft Cluster', incidents: 12 },
    { id: 'HS-2', lat: 28.5555, lng: 77.3310, severity: 'MEDIUM', type: 'Assault Reports', incidents: 5 },
    { id: 'HS-3', lat: 28.5155, lng: 77.3810, severity: 'LOW', type: 'Traffic Violations', incidents: 8 },
];

// Mock active incidents
const ACTIVE_INCIDENTS = [
    { id: 'INC-001', type: 'Robbery', location: 'Sector 62 Market', time: '15 min ago', status: 'RESPONDING', priority: 'HIGH' },
    { id: 'INC-002', type: 'Accident', location: 'NH-24 Junction', time: '32 min ago', status: 'ON_SCENE', priority: 'MEDIUM' },
    { id: 'INC-003', type: 'Disturbance', location: 'City Mall', time: '45 min ago', status: 'RESOLVED', priority: 'LOW' },
];

const PatrolMap: React.FC = () => {
    const { showToast, updateToast } = useToast();
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUnit, setSelectedUnit] = useState<typeof PATROL_UNITS[0] | null>(null);
    const [showHotspots, setShowHotspots] = useState(true);
    const [showUnits, setShowUnits] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Three-State Button States
    const [isDispatching, setIsDispatching] = useState(false);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [dispatchedUnitId, setDispatchedUnitId] = useState<string | null>(null);

    // Load Leaflet from CDN
    useEffect(() => {
        // Check if Leaflet is already loaded
        if (window.L) {
            initializeMap();
            return;
        }

        // Load Leaflet CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        // Load Leaflet JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => {
            initializeMap();
        };
        document.body.appendChild(script);

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
            }
        };
    }, []);

    const initializeMap = () => {
        if (!mapContainerRef.current || !window.L) return;

        const L = window.L;

        // Create map centered on Noida, UP
        const map = L.map(mapContainerRef.current, {
            zoomControl: false
        }).setView([28.5355, 77.3510], 13);

        // Add zoom control to top-right
        L.control.zoom({ position: 'topright' }).addTo(map);

        // Add OpenStreetMap tiles (dark theme)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(map);

        // Add patrol unit markers
        PATROL_UNITS.forEach(unit => {
            const color = unit.status === 'ACTIVE' ? '#10B981' :
                unit.status === 'RESPONDING' ? '#F59E0B' : '#6B7280';

            const icon = L.divIcon({
                className: 'custom-marker',
                html: `
                    <div style="
                        width: 30px; 
                        height: 30px; 
                        background: ${color}; 
                        border: 3px solid white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                    ">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                            <path d="M12 2L4 6.5V12c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6.5L12 2z"/>
                        </svg>
                    </div>
                `,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

            const marker = L.marker([unit.lat, unit.lng], { icon }).addTo(map);

            marker.bindPopup(`
                <div style="min-width: 180px;">
                    <strong style="color: ${color};">${unit.name}</strong><br/>
                    <small>ID: ${unit.id}</small><br/>
                    <small>Beat: ${unit.beat}</small><br/>
                    <small>Status: <span style="color: ${color};">${unit.status}</span></small><br/>
                    <small>Updated: ${unit.lastUpdate}</small>
                </div>
            `);
        });

        // Add crime hotspot circles
        CRIME_HOTSPOTS.forEach(hotspot => {
            const color = hotspot.severity === 'HIGH' ? '#EF4444' :
                hotspot.severity === 'MEDIUM' ? '#F59E0B' : '#3B82F6';

            L.circle([hotspot.lat, hotspot.lng], {
                color: color,
                fillColor: color,
                fillOpacity: 0.2,
                radius: 500,
                weight: 2
            }).addTo(map).bindPopup(`
                <div>
                    <strong style="color: ${color};">Crime Hotspot</strong><br/>
                    <small>${hotspot.type}</small><br/>
                    <small>${hotspot.incidents} incidents this week</small>
                </div>
            `);
        });

        mapRef.current = map;
        setIsLoading(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'text-emerald-400 bg-emerald-500/20';
            case 'RESPONDING': return 'text-amber-400 bg-amber-500/20';
            case 'ON_SCENE': return 'text-blue-400 bg-blue-500/20';
            case 'STANDBY': return 'text-slate-400 bg-slate-500/20';
            case 'RESOLVED': return 'text-green-400 bg-green-500/20';
            default: return 'text-slate-400 bg-slate-500/20';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'HIGH': return 'text-red-400 bg-red-500/20 border-red-500/50';
            case 'MEDIUM': return 'text-amber-400 bg-amber-500/20 border-amber-500/50';
            case 'LOW': return 'text-blue-400 bg-blue-500/20 border-blue-500/50';
            default: return 'text-slate-400 bg-slate-500/20 border-slate-500/50';
        }
    };

    // Three-State: Refresh Map Locations
    const handleRefresh = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        const toastId = showToast('Updating patrol unit positions...', 'loading');
        try {
            await mockDelay(1000);
            updateToast(toastId, '✅ Live locations updated', 'success');
        } catch {
            updateToast(toastId, '❌ Refresh failed', 'error');
        } finally {
            setIsRefreshing(false);
        }
    };

    // Three-State: Dispatch Unit
    const handleDispatch = async () => {
        if (!selectedUnit || isDispatching) {
            showToast('⚠️ Please select a patrol unit first', 'error');
            return;
        }

        setIsDispatching(true);
        const toastId = showToast(`Broadcasting to ${selectedUnit.name}...`, 'loading');

        try {
            await mockDelay(2000); // Simulate radio handshake
            setDispatchedUnitId(selectedUnit.id);
            updateToast(toastId, `✅ ${selectedUnit.name} Confirmed: En Route`, 'success');
        } catch {
            updateToast(toastId, '❌ Radio connection failed', 'error');
        } finally {
            setIsDispatching(false);
        }
    };

    // Three-State: Generate Report
    const handleGenerateReport = async () => {
        if (isGeneratingReport) return;
        setIsGeneratingReport(true);
        const toastId = showToast('Compiling incident report...', 'loading');

        try {
            await mockDelay(1200);
            updateToast(toastId, '✅ Report saved to station log', 'success');
        } catch {
            updateToast(toastId, '❌ Report generation failed', 'error');
        } finally {
            setIsGeneratingReport(false);
        }
    };

    return (
        <div className="h-full flex flex-col lg:flex-row gap-4 p-4">
            {/* Left Panel - Map */}
            <div className="flex-1 flex flex-col min-h-[400px] lg:min-h-0">
                {/* Map Header */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-t-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Navigation className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="font-bold text-white">Live Patrol Map</h2>
                            <p className="text-xs text-slate-400">Real-time unit tracking • Noida District</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowUnits(!showUnits)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showUnits ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                                }`}
                        >
                            <Users className="w-3 h-3" /> Units
                        </button>
                        <button
                            onClick={() => setShowHotspots(!showHotspots)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showHotspots ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-400'
                                }`}
                        >
                            <AlertTriangle className="w-3 h-3" /> Hotspots
                        </button>
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 text-slate-300 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Map Container */}
                <div className="flex-1 relative bg-slate-900 border-x border-b border-slate-700 rounded-b-xl overflow-hidden">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
                            <div className="flex flex-col items-center gap-3">
                                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                                <p className="text-slate-400 text-sm">Loading map...</p>
                            </div>
                        </div>
                    )}
                    <div
                        ref={mapContainerRef}
                        className="absolute inset-0"
                        style={{ background: '#1a1a2e' }}
                    />

                    {/* Map Legend */}
                    <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-700 rounded-lg p-3 z-[1000]">
                        <h4 className="text-xs font-bold text-slate-400 mb-2">LEGEND</h4>
                        <div className="space-y-1.5 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                <span className="text-slate-300">Active Unit</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-amber-500" />
                                <span className="text-slate-300">Responding</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-slate-500" />
                                <span className="text-slate-300">Standby</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700">
                                <div className="w-3 h-3 rounded-full border-2 border-red-500 bg-red-500/20" />
                                <span className="text-slate-300">Crime Hotspot</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Stats & Incidents */}
            <div className="w-full lg:w-80 flex flex-col gap-4">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-emerald-400 mb-2">
                            <Shield className="w-4 h-4" />
                            <span className="text-xs font-bold">ACTIVE UNITS</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{PATROL_UNITS.filter(u => u.status === 'ACTIVE').length}</p>
                        <p className="text-xs text-slate-500">of {PATROL_UNITS.length} total</p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-amber-400 mb-2">
                            <Radio className="w-4 h-4" />
                            <span className="text-xs font-bold">RESPONDING</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{PATROL_UNITS.filter(u => u.status === 'RESPONDING').length}</p>
                        <p className="text-xs text-slate-500">en route</p>
                    </div>
                </div>

                {/* Patrol Units List */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex-1 overflow-hidden flex flex-col">
                    <h3 className="font-bold text-white flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-blue-400" />
                        Patrol Units
                    </h3>
                    <div className="space-y-2 overflow-y-auto flex-1">
                        {PATROL_UNITS.map(unit => (
                            <div
                                key={unit.id}
                                onClick={() => setSelectedUnit(unit)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedUnit?.id === unit.id
                                    ? 'bg-blue-500/20 border-blue-500/50'
                                    : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-white text-sm">{unit.name}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getStatusColor(unit.status)}`}>
                                        {unit.status}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-slate-500">
                                    <span>{unit.beat}</span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {unit.lastUpdate}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Active Incidents */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                    <h3 className="font-bold text-white flex items-center gap-2 mb-3">
                        <Activity className="w-4 h-4 text-red-400" />
                        Active Incidents
                    </h3>
                    <div className="space-y-2">
                        {ACTIVE_INCIDENTS.map(incident => (
                            <div
                                key={incident.id}
                                className={`p-3 rounded-lg border ${getPriorityColor(incident.priority)}`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-white text-sm">{incident.type}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getStatusColor(incident.status)}`}>
                                        {incident.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> {incident.location}
                                    </span>
                                    <span>{incident.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={handleDispatch}
                        disabled={isDispatching}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl font-medium text-sm transition-colors ${isDispatching ? 'bg-blue-500/50 cursor-wait' : 'bg-blue-600 hover:bg-blue-500'} text-white`}
                    >
                        {isDispatching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                        {isDispatching ? 'Connecting...' : dispatchedUnitId === selectedUnit?.id ? 'Dispatched ✓' : 'Dispatch'}
                    </button>
                    <button
                        onClick={handleGenerateReport}
                        disabled={isGeneratingReport}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl font-medium text-sm transition-colors ${isGeneratingReport ? 'bg-slate-600 cursor-wait' : 'bg-slate-700 hover:bg-slate-600'} text-white`}
                    >
                        {isGeneratingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                        {isGeneratingReport ? 'Generating...' : 'Report'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PatrolMap;
