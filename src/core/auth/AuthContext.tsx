// src/core/auth/AuthContext.tsx
// NyayaSahayak Hybrid v2.0.0 - Centralized Authentication Context
// Extended version with ADMIN role support, React Router v6 integration, and HMAC security

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import CryptoJS from 'crypto-js';

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

// Sign user data with HMAC
const signUserData = (user: UserProfile): string => {
    const dataString = JSON.stringify(user);
    const signature = CryptoJS.HmacSHA256(dataString, INTEGRITY_SECRET).toString();
    return JSON.stringify({ data: user, sig: signature });
};

// Verify and extract user data
const verifyUserData = (stored: string): UserProfile | null => {
    try {
        const parsed = JSON.parse(stored);
        if (!parsed.data || !parsed.sig) {
            // Legacy unsigned data - invalidate session
            console.warn('[Auth] Unsigned session detected - clearing for security');
            return null;
        }
        const expectedSig = CryptoJS.HmacSHA256(JSON.stringify(parsed.data), INTEGRITY_SECRET).toString();
        if (parsed.sig !== expectedSig) {
            console.error('[Auth] Session integrity check FAILED - possible tampering detected');
            return null;
        }
        return parsed.data as UserProfile;
    } catch {
        return null;
    }
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
    useEffect(() => {
        const storedUser = localStorage.getItem('nyaya_pilot_user');
        if (storedUser) {
            const verifiedUser = verifyUserData(storedUser);
            if (verifiedUser) {
                setUser(verifiedUser);
            } else {
                // Tampering detected or legacy format - clear storage
                localStorage.removeItem('nyaya_pilot_user');
            }
        }
        setIsLoading(false);
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
    const loginWithGoogle = (userData: { name: string; email?: string; avatar?: string }, role: UserRole = 'CITIZEN') => {
        setIsLoading(true);

        const finalProfile: UserProfile = {
            name: userData.name,
            id: `${role}-${Date.now()}`,
            avatar: userData.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData.name)}`,
            role: role
        };

        // Set user directly with full profile
        setUser(finalProfile);
        // Persist immediately
        localStorage.setItem('nyaya_pilot_user', signUserData(finalProfile));
        setIsLoading(false);
    };

    const completeOnboarding = (details: Partial<UserProfile>) => {
        if (!user) return;

        const finalProfile: UserProfile = {
            ...user,
            ...details,
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${details.name || user.role}`
        };

        setUser(finalProfile);
        // Store with HMAC signature to prevent tampering
        localStorage.setItem('nyaya_pilot_user', signUserData(finalProfile));
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
