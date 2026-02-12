'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import authService, {
    User,
    TenantWithRole,
    RegisterData,
} from '@/services/auth.service';

interface AuthContextType {
    user: User | null;
    tenants: TenantWithRole[];
    currentTenant: TenantWithRole | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<TenantWithRole[]>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    selectTenant: (tenant: TenantWithRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [tenants, setTenants] = useState<TenantWithRole[]>([]);
    const [currentTenant, setCurrentTenant] = useState<TenantWithRole | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Initialize auth state on mount
    useEffect(() => {
        const initAuth = async () => {
            if (!authService.isAuthenticated()) {
                setIsLoading(false);
                return;
            }

            try {
                const profile = await authService.getProfile();
                setUser(profile);
                setTenants(profile.tenants);

                // Restore current tenant from localStorage
                const storedTenantId = authService.getCurrentTenantId();
                if (storedTenantId) {
                    const tenant = profile.tenants.find((t) => t.id === storedTenantId);
                    if (tenant) {
                        setCurrentTenant(tenant);
                    }
                }
            } catch (error: any) {
                // If 401, it just means the session expired, so we don't need to log an error
                if (error?.response?.status !== 401) {
                    console.error('Failed to restore auth session:', error);
                }
                authService.logout();
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = useCallback(async (email: string, password: string): Promise<TenantWithRole[]> => {
        const response = await authService.login(email, password);
        setUser(response.user);
        setTenants(response.tenants);

        // Auto-select tenant if only one
        if (response.tenants.length === 1) {
            setCurrentTenant(response.tenants[0]);
        }

        return response.tenants;
    }, []);

    const register = useCallback(async (data: RegisterData): Promise<void> => {
        const response = await authService.register(data);
        setUser(response.user);
        setTenants([response.tenant]);
        setCurrentTenant(response.tenant);
        router.push('/dashboard');
    }, [router]);

    const logout = useCallback(() => {
        authService.logout();
        setUser(null);
        setTenants([]);
        setCurrentTenant(null);
        router.push('/login');
    }, [router]);

    const selectTenant = useCallback((tenant: TenantWithRole) => {
        authService.selectTenant(tenant);
        setCurrentTenant(tenant);
        router.push('/dashboard');
    }, [router]);

    const value: AuthContextType = {
        user,
        tenants,
        currentTenant,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        selectTenant,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
