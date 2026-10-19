// src/core/auth/AuthContext.tsx
// NyayaSahayak Hybrid v2.0.0 - Centralized Authentication Context
// Extended version with ADMIN role support, React Router v6 integration, and HMAC security

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

export type UserRole = 'CITIZEN' | 'POLICE' | 'JUDGE' | 'ADMIN' | null;

export interface UserProfile {
    name: string;
    id: string; // Aadhar Token or Badge ID
    avatar: string;
    role: UserRole;
    location?: string;
    station?: string;     // For Police persona
    courtId?: string;     // For Judge persona
    department?: string;  // For Admin persona
}

// HMAC Secret Key - In production, this should be server-side validated
// This prevents casual tampering but is NOT a complete security solution
const INTEGRITY_SECRET = 'nyaya-v2-integrity-key-2025';

/**
 * Hex HMAC-SHA256 over the session payload, computed by the platform rather than by `crypto-js`.
 *
 * Why this file was the last holdout: the officer's exhibit hasher had already moved to WebCrypto,
 * which left two SHA-256 implementations in one app that had to agree about every digest a human
 * would ever compare. `core/trust/sha256.ts` states the rule - a pure-JS implementation with its own
 * 64-bit length bookkeeping is not something to hang an evidentiary claim on - and a session
 * signature is a claim, even a modest one.
 *
 * What this does NOT change: strength. The constant above is in the bundle, so anyone who can read
 * the bundle can sign a session for any profile. "Casual tampering, not a security solution" was
 * true of the old line and is true of this one; replacing the secret with something a client cannot
 * forge is D12's decision and is deliberately not taken here.
 *
 * Byte-for-byte compatibility was the requirement, not a nicety - a signed session already in
 * someone's localStorage must keep verifying, or a cleanup would log people out. HMAC's definition
 * fixes the algorithm, and the two implementations were cross-checked against this secret at key
 * lengths 27, 63, 64, 65 and 200: 64 and 65 straddle SHA-256's block size, where an implementation
 * that skipped the spec's "hash the key when it is longer than the block" step would diverge. They
 * agreed at every length, and `tests/auth_signature.test.ts` pins a golden signature produced by
 * crypto-js 4.2.0 so the agreement survives the deletion of the package that produced it.
 *
 * One behaviour differs on purpose: `crypto.subtle` refuses a zero-length key with `DataError`,
 * where crypto-js computed an HMAC with it. An empty `INTEGRITY_SECRET` now fails loudly at signing
 * and fails closed at verification, which is the correct direction for a check to break in.
 */
const hmacHex = async (message: string): Promise<string> => {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) {
        // Checked at call time, never at module load: a load-time throw in a module `App` imports is
        // D3, and it used to blank every screen that reached it.
        throw new Error('WebCrypto (crypto.subtle) is unavailable; a non-secure origin cannot sign a session.');
    }
    const key = await subtle.importKey(
        'raw', new TextEncoder().encode(INTEGRITY_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const signature = await subtle.sign('HMAC', key, new TextEncoder().encode(message));
    return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

// Sign user data with HMAC
const signUserData = async (user: UserProfile): Promise<string> => {
    const signature = await hmacHex(JSON.stringify(user));
    return JSON.stringify({ data: user, sig: signature });
};

/**
 * Write the session. Awaiting the signature is the point: the sync version could report a session as
 * saved from a write nobody had asked the platform to accept yet, which is the same category of
 * promise the ledger's `persisted` flag used to make (D6).
 *
 * Failures are logged rather than thrown to the click handler because there is no error UI on this
 * path: the in-memory session still works for this page and is gone on reload, and the alternative -
 * an unhandled rejection inside `setTimeout` - is silence with worse odds of being noticed.
 */
const persistSession = async (profile: UserProfile): Promise<void> => {
    try {
        localStorage.setItem('nyaya_pilot_user', await signUserData(profile));
    } catch (err) {
        console.error(
            '[Auth] Session could not be signed - this login will not survive a reload:',
            err instanceof Error ? err.message : err
        );
    }
};

// Verify and extract user data
const verifyUserData = async (stored: string): Promise<UserProfile | null> => {
    let parsed: { data?: UserProfile; sig?: string };
    try {
        parsed = JSON.parse(stored);
    } catch {
        return null;
    }
    if (!parsed || !parsed.data || !parsed.sig) {
        // Legacy unsigned data - invalidate session
        console.warn('[Auth] Unsigned session detected - clearing for security');
        return null;
    }
    let expectedSig: string;
    try {
        expectedSig = await hmacHex(JSON.stringify(parsed.data));
    } catch (err) {
        // "The check could not run" and "the signature does not match" are different findings, and
        // collapsing them into one message is how a browser without WebCrypto ends up accusing the
        // user of tampering with their own session. D18 forced the same distinction on the verifier
        // screen for the same reason.
        console.error('[Auth] Session integrity check could not be performed:', err instanceof Error ? err.message : err);
        return null;
    }
    if (parsed.sig !== expectedSig) {
        // The old wording was "possible tampering detected". What this can actually establish is a
        // mismatch between a digest and the bytes next to it; anything harder than that is a
        // conclusion about a person, from a key the person could have read out of the bundle.
        console.error('[Auth] Session signature does not match the stored profile - session discarded');
        return null;
    }
    return parsed.data as UserProfile;
};

interface AuthContextType {
    user: UserProfile | null;
    isAuthenticated: boolean;
    login: (role: UserRole) => void;
    loginWithGoogle: (userData: { name: string; email?: string; avatar?: string }, role?: UserRole) => void;
    logout: () => void;
    isLoading: boolean;
    completeOnboarding: (details: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Computed property for authentication status
    // User is authenticated when they have a role assigned (not dependent on name being set)
    const isAuthenticated = user !== null && user.role !== null;

    // Secure Persistence with HMAC Verification
    //
    // `finally`, not a straight line: `isLoading` is what D25 holds the first paint on, so a throw
    // anywhere in this restore - storage that refuses to be read, a payload that will not parse -
    // must still release the flag, or the app is a spinner forever. Verification itself can no longer
    // throw at the call site: it resolves `null` and logs which half failed.
    useEffect(() => {
        const restore = async () => {
            try {
                const storedUser = localStorage.getItem('nyaya_pilot_user');
                if (storedUser) {
                    const verifiedUser = await verifyUserData(storedUser);
                    if (verifiedUser) {
                        setUser(verifiedUser);
                    } else {
                        // Signature mismatch or legacy format - clear storage
                        localStorage.removeItem('nyaya_pilot_user');
                    }
                }
            } finally {
                setIsLoading(false);
            }
        };
        void restore();
    }, []);

    const login = (role: UserRole) => {
        setIsLoading(true);
        // Simulate API delay for realism (Jan-Parichay/MeriPehchaan Redirect)
        setTimeout(() => {
            const tempUser: UserProfile = {
                name: 'Hon. User', // Set default name to pass isAuthenticated check
                id: 'USER001',
                avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${role}`,
                role: role
            };
            setUser(tempUser);
            setIsLoading(false);
        }, 800);
    };

    // Direct Google login - creates complete user profile in one atomic operation
    const loginWithGoogle = async (userData: { name: string; email?: string; avatar?: string }, role: UserRole = 'CITIZEN') => {
        setIsLoading(true);

        const finalProfile: UserProfile = {
            name: userData.name,
            id: `${role}-${Date.now()}`,
            avatar: userData.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData.name)}`,
            role: role
        };

        // Set user directly with full profile
        setUser(finalProfile);
        // Persist immediately - awaited, so `isLoading` is not cleared until the signed session has
        // actually been handed to storage. The context type declares `=> void`, so callers that fire
        // this and navigate away are unchanged.
        await persistSession(finalProfile);
        setIsLoading(false);
    };

    const completeOnboarding = async (details: Partial<UserProfile>) => {
        if (!user) return;

        const finalProfile: UserProfile = {
            ...user,
            ...details,
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${details.name || user.role}`
        };

        setUser(finalProfile);
        // Store with HMAC signature so a hand-edited profile stops matching its own digest
        await persistSession(finalProfile);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('nyaya_pilot_user');
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, loginWithGoogle, logout, isLoading, completeOnboarding }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

// Helper function to check role permissions
export const hasRole = (user: UserProfile | null, roles: UserRole[]): boolean => {
    if (!user || !user.role) return false;
    // Case-insensitive check for robustness
    const upperUserRole = user.role.toUpperCase();
    return roles.some(r => r?.toUpperCase() === upperUserRole);
};

// Role-based route guard component using Outlet pattern for React Router v6
export const ProtectedRoute: React.FC<{
    allowedRoles: UserRole[];
}> = ({ allowedRoles }) => {
    const { user, isLoading, isAuthenticated } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        // Redirect to login, saving the attempted location
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    if (!hasRole(user, allowedRoles)) {
        // Redirect unauthorized users to their default dashboard
        // CRITICAL: Check if we are already on the target path to avoid infinite loop
        const targetPath = `/${user.role?.toLowerCase()}/home`;
        if (location.pathname === targetPath || location.pathname.startsWith(targetPath)) {
            // If already there/matching but unauthorized for THIS route, maybe redirect to landing?
            // But for now, just fallback to root to break loop
            return <Navigate to="/" replace />;
        }
        return <Navigate to={targetPath} replace />;
    }

    // User is authorized - render child routes via Outlet
    return <Outlet />;
};
