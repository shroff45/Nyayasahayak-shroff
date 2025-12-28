import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'CITIZEN' | 'POLICE' | 'JUDGE' | null;

export interface UserProfile {
    name: string;
    id: string; // Aadhar or Badge ID
    avatar: string;
    role: UserRole;
    location?: string;
}

interface AuthContextType {
    user: UserProfile | null;
    login: (role: UserRole) => void;
    logout: () => void;
    isLoading: boolean;
    completeOnboarding: (details: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Mock Persistence for Demo Reliability
    useEffect(() => {
        const storedUser = localStorage.getItem('nyaya_demo_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = (role: UserRole) => {
        setIsLoading(true);
        // Simulate API delay for realism (Jan-Parichay Redirect)
        setTimeout(() => {
            const tempUser: UserProfile = {
                name: '',
                id: '',
                avatar: '',
                role: role
            };
            setUser(tempUser);
            setIsLoading(false);
        }, 800);
    };

    const completeOnboarding = (details: Partial<UserProfile>) => {
        if (!user) return;

        const finalProfile: UserProfile = {
            ...user,
            ...details,
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${details.name || user.role}`
        };

        setUser(finalProfile);
        localStorage.setItem('nyaya_demo_user', JSON.stringify(finalProfile));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('nyaya_demo_user');
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading, completeOnboarding }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
