// src/shared/components/welfare/EmergencyContacts.tsx
// Emergency Contact Registry - Register family for SOS alerts
// Critical welfare feature for citizen safety

import React, { useState, useEffect } from 'react';
import {
    Users, Plus, Trash2, Phone, Shield,
    CheckCircle, AlertTriangle, Save, X
} from 'lucide-react';

interface EmergencyContact {
    id: string;
    name: string;
    phone: string;
    relation: string;
}

interface EmergencyContactsProps {
    isOpen: boolean;
    onClose: () => void;
}

const RELATIONS = ['Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Other'];

const EmergencyContacts: React.FC<EmergencyContactsProps> = ({ isOpen, onClose }) => {
    const [contacts, setContacts] = useState<EmergencyContact[]>([]);
    const [newContact, setNewContact] = useState({ name: '', phone: '', relation: 'Parent' });
    const [isAdding, setIsAdding] = useState(false);
    const [saved, setSaved] = useState(false);

    // Load from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('nyaya_emergency_contacts');
        if (stored) {
            try {
                setContacts(JSON.parse(stored));
            } catch { /* ignore */ }
        }
    }, []);

    const saveContacts = (newContacts: EmergencyContact[]) => {
        setContacts(newContacts);
        localStorage.setItem('nyaya_emergency_contacts', JSON.stringify(newContacts));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const addContact = () => {
        if (!newContact.name.trim() || !newContact.phone.trim()) return;
        if (contacts.length >= 5) return;

        const contact: EmergencyContact = {
            id: Date.now().toString(),
            name: newContact.name.trim(),
            phone: newContact.phone.replace(/\D/g, ''),
            relation: newContact.relation
        };

        saveContacts([...contacts, contact]);
        setNewContact({ name: '', phone: '', relation: 'Parent' });
        setIsAdding(false);
    };

    const removeContact = (id: string) => {
        saveContacts(contacts.filter(c => c.id !== id));
    };

    const sendTestAlert = () => {
        if (contacts.length === 0) return;
        alert(`🚨 TEST ALERT\n\nIn a real emergency, the following contacts would receive:\n\n${contacts.map(c => `• ${c.name} (${c.phone})`).join('\n')}\n\nMessage: "EMERGENCY! [Your Name] needs help. Location: [GPS Coordinates]"`);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/30 rounded-3xl border border-purple-500/20 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-purple-500/20 bg-purple-500/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30">
                                <Users className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                                    Emergency Contacts
                                </h2>
                                <p className="text-xs text-slate-400">आपातकालीन संपर्क</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="p-3 bg-purple-500/10 border-b border-purple-500/20">
                    <p className="text-xs text-purple-300 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        These contacts will be alerted with your GPS location during SOS
                    </p>
                </div>

                {/* Contacts List */}
                <div className="p-4 space-y-3 max-h-[40vh] overflow-y-auto">
                    {contacts.length === 0 ? (
                        <div className="text-center py-8">
                            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-500">No emergency contacts added</p>
                            <p className="text-xs text-slate-600 mt-1">Add up to 5 trusted contacts</p>
                        </div>
                    ) : (
                        contacts.map((contact) => (
                            <div
                                key={contact.id}
                                className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl"
                            >
                                <div className="p-2 rounded-lg bg-purple-500/20">
                                    <Phone className="w-4 h-4 text-purple-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium truncate">{contact.name}</p>
                                    <p className="text-xs text-slate-400">{contact.relation} • {contact.phone}</p>
                                </div>
                                <button
                                    onClick={() => removeContact(contact.id)}
                                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Add Contact Form */}
                {isAdding ? (
                    <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Contact Name"
                                value={newContact.name}
                                onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full p-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500"
                            />
                            <input
                                type="tel"
                                placeholder="Phone Number (10 digits)"
                                value={newContact.phone}
                                onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                                className="w-full p-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500"
                            />
                            <select
                                value={newContact.relation}
                                onChange={(e) => setNewContact(prev => ({ ...prev, relation: e.target.value }))}
                                className="w-full p-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white"
                            >
                                {RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className="flex-1 py-2 border border-slate-700 rounded-xl text-slate-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={addContact}
                                    disabled={!newContact.name || !newContact.phone}
                                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4 inline mr-1" /> Save
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 border-t border-slate-700/50">
                        {contacts.length < 5 && (
                            <button
                                onClick={() => setIsAdding(true)}
                                className="w-full py-3 border-2 border-dashed border-purple-500/30 text-purple-400 rounded-xl hover:bg-purple-500/10 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Add Contact ({contacts.length}/5)
                            </button>
                        )}
                    </div>
                )}

                {/* Test Alert Button */}
                {contacts.length > 0 && (
                    <div className="p-4 bg-slate-800/50 border-t border-slate-700/50">
                        <button
                            onClick={sendTestAlert}
                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                        >
                            <AlertTriangle className="w-4 h-4" /> Test Emergency Alert
                        </button>
                        <p className="text-xs text-center text-slate-500 mt-2">
                            No actual alert will be sent
                        </p>
                    </div>
                )}

                {/* Saved Indicator */}
                {saved && (
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-2 bg-emerald-500 text-white rounded-full text-sm font-bold flex items-center gap-2 animate-bounce">
                        <CheckCircle className="w-4 h-4" /> Saved!
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmergencyContacts;
