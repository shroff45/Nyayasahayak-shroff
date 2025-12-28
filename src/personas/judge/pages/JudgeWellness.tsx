// src/personas/judge/pages/JudgeWellness.tsx
// NyayaSahayak Hybrid v2.0.0 - Judicial Wellness Dashboard
// Mental Health & Workload Balance for Judges

import React, { useState, useEffect } from 'react';
import {
    Heart, Coffee, Clock, Activity,
    Sun, Moon, TrendingDown, AlertTriangle,
    Play, Pause, RotateCcw, Volume2
} from 'lucide-react';

const JudgeWellness: React.FC = () => {
    const [breakTime, setBreakTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [selectedDuration, setSelectedDuration] = useState(5);

    // Play notification sound when timer ends
    const playNotificationSound = () => {
        // Create a simple chime using Web Audio API
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;

        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.stop(audioContext.currentTime + 0.5);

        // Play a second chime
        setTimeout(() => {
            const osc2 = audioContext.createOscillator();
            const gain2 = audioContext.createGain();
            osc2.connect(gain2);
            gain2.connect(audioContext.destination);
            osc2.frequency.value = 1000;
            osc2.type = 'sine';
            gain2.gain.value = 0.3;
            osc2.start();
            gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            osc2.stop(audioContext.currentTime + 0.5);
        }, 300);
    };

    // Show browser notification
    const showNotification = () => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Break Complete! 🧘', {
                body: 'Your mindful break is over. Feel refreshed and ready to continue.',
                icon: '/logo.png'
            });
        }
    };

    // Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Break timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning && breakTime > 0) {
            interval = setInterval(() => {
                setBreakTime(prev => {
                    if (prev <= 1) {
                        setIsRunning(false);
                        playNotificationSound();
                        showNotification();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, breakTime]);

    const startBreak = (minutes: number) => {
        setSelectedDuration(minutes);
        setBreakTime(minutes * 60);
        setIsRunning(true);
    };

    const toggleTimer = () => {
        if (breakTime === 0) {
            startBreak(selectedDuration);
        } else {
            setIsRunning(!isRunning);
        }
    };

    const resetTimer = () => {
        setIsRunning(false);
        setBreakTime(0);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Mock wellness data
    const wellnessStats = {
        casesHandled: 8,
        avgHearing: 42,
        breaksTaken: 2,
        stressLevel: 'MODERATE',
        focusScore: 78,
    };

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 bg-pink-500/20 rounded-xl">
                    <Heart className="w-8 h-8 text-pink-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Judicial Wellness</h1>
                    <p className="text-slate-400 text-sm">Mental health matters. Take care of yourself, Your Honor.</p>
                </div>
            </div>

            {/* Break Timer */}
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Timer Display */}
                    <div className="flex-1 text-center">
                        <p className="text-slate-400 text-sm mb-2">MINDFUL BREAK TIMER</p>
                        <div className="text-6xl font-mono font-bold text-white mb-4">
                            {formatTime(breakTime)}
                        </div>

                        {/* Duration Buttons */}
                        <div className="flex justify-center gap-2 mb-4">
                            {[5, 10, 15, 20].map(mins => (
                                <button
                                    key={mins}
                                    onClick={() => !isRunning && setSelectedDuration(mins)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedDuration === mins && !isRunning
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                    disabled={isRunning}
                                >
                                    {mins} min
                                </button>
                            ))}
                        </div>

                        {/* Control Buttons */}
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={toggleTimer}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${isRunning
                                    ? 'bg-amber-500 hover:bg-amber-400 text-white'
                                    : 'bg-purple-500 hover:bg-purple-400 text-white'
                                    }`}
                            >
                                {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                {isRunning ? 'Pause' : 'Start Break'}
                            </button>
                            <button
                                onClick={resetTimer}
                                className="flex items-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300 transition-all"
                            >
                                <RotateCcw className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="flex-1 bg-slate-900/50 rounded-xl p-4">
                        <h3 className="text-purple-400 font-bold mb-3 flex items-center gap-2">
                            <Coffee className="w-4 h-4" /> Break Suggestions
                        </h3>
                        <ul className="space-y-2 text-sm text-slate-300">
                            <li className="flex items-start gap-2">
                                <Sun className="w-4 h-4 text-amber-400 mt-0.5" />
                                Step away from the screen and look at something distant
                            </li>
                            <li className="flex items-start gap-2">
                                <Activity className="w-4 h-4 text-emerald-400 mt-0.5" />
                                Take 5 deep breaths to reset your focus
                            </li>
                            <li className="flex items-start gap-2">
                                <Volume2 className="w-4 h-4 text-blue-400 mt-0.5" />
                                Listen to calming music or nature sounds
                            </li>
                            <li className="flex items-start gap-2">
                                <Moon className="w-4 h-4 text-purple-400 mt-0.5" />
                                Close your eyes and practice mindfulness
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <Activity className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Cases Today</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{wellnessStats.casesHandled}</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Avg Hearing</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{wellnessStats.avgHearing}m</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <Coffee className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Breaks</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-400">{wellnessStats.breaksTaken}</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-amber-400 mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Stress</span>
                    </div>
                    <p className="text-lg font-bold text-amber-400">{wellnessStats.stressLevel}</p>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-purple-400 mb-2">
                        <TrendingDown className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Focus</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-400">{wellnessStats.focusScore}%</p>
                </div>
            </div>

            {/* Recommendations */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-400" />
                    Today's Wellness Recommendations
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                        <h3 className="font-medium text-emerald-400 mb-2">✓ Good Progress</h3>
                        <p className="text-sm text-slate-300">You've maintained a steady pace. Keep taking regular breaks.</p>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                        <h3 className="font-medium text-amber-400 mb-2">⚠️ Hydration Reminder</h3>
                        <p className="text-sm text-slate-300">It's been 2 hours. Consider drinking some water.</p>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                        <h3 className="font-medium text-purple-400 mb-2">🧘 Stretch Break</h3>
                        <p className="text-sm text-slate-300">A 5-minute stretch can improve focus by 25%.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JudgeWellness;
