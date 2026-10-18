// src/core/context/WorkspaceContext.tsx
// Shared, persisted workspace for the legacy feature components mounted by the persona router.
//
// Why this exists: features/main/MainApp.tsx used to own the case list and the activity log and
// persist them to localStorage. When the router was split into personas, each page re-created
// that state locally, so `logActivity`/`allCases` props were never supplied (the pages did not
// typecheck) and the History page read a `nyaya:history:<user>` key that nothing ever wrote -
// it was structurally empty. One provider now owns it for every persona.

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { useAuth } from '../auth/AuthContext';
import type { Case, HistoryItem } from '../../features/main/types';

/** Cap on the persisted activity log so localStorage cannot grow without bound. */
const MAX_HISTORY_ITEMS = 200;

interface WorkspaceValue {
    allCases: Case[];
    setAllCases: React.Dispatch<React.SetStateAction<Case[]>>;
    selectedCase: Case | null;
    setSelectedCase: (caseData: Case | null) => void;
    history: HistoryItem[];
    logActivity: (type: HistoryItem['type'], details: string) => void;
    clearHistory: () => void;
}

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

const storageKeys = (owner: string) => ({
    cases: `nyaya:cases:${owner}`,
    history: `nyaya:history:${owner}`,
});

const readJson = <T,>(key: string, fallback: T): T => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        // Corrupt or quota-truncated storage must not blank the whole app.
        return fallback;
    }
};

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const owner = user?.id ?? 'anonymous';

    const [allCases, setAllCases] = useState<Case[]>([]);
    const [selectedCase, setSelectedCase] = useState<Case | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);

    // Rehydrate for the signed-in user; never mix two users' dockets.
    useEffect(() => {
        const keys = storageKeys(owner);
        setAllCases(readJson<Case[]>(keys.cases, []));
        setHistory(readJson<HistoryItem[]>(keys.history, []));
        setSelectedCase(null);
    }, [owner]);

    useEffect(() => {
        localStorage.setItem(storageKeys(owner).cases, JSON.stringify(allCases));
    }, [allCases, owner]);

    useEffect(() => {
        localStorage.setItem(storageKeys(owner).history, JSON.stringify(history));
    }, [history, owner]);

    const logActivity = useCallback((type: HistoryItem['type'], details: string) => {
        setHistory((prev) => [
            {
                id: `H-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                timestamp: new Date().toISOString(),
                type,
                details,
            },
            ...prev,
        ].slice(0, MAX_HISTORY_ITEMS));
    }, []);

    const clearHistory = useCallback(() => setHistory([]), []);

    const value = useMemo<WorkspaceValue>(
        () => ({
            allCases,
            setAllCases,
            selectedCase,
            setSelectedCase,
            history,
            logActivity,
            clearHistory,
        }),
        [allCases, selectedCase, history, logActivity, clearHistory]
    );

    return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export const useWorkspace = (): WorkspaceValue => {
    const ctx = useContext(WorkspaceContext);
    if (!ctx) {
        throw new Error('useWorkspace() must be called inside <WorkspaceProvider>.');
    }
    return ctx;
};

export default WorkspaceContext;
