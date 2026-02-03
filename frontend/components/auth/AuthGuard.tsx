'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
    children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
    const { isAuthenticated, isLoading, currentTenant, tenants } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        if (!isAuthenticated) {
            router.replace('/login');
            return;
        }

        // If user is authenticated but hasn't selected a tenant (and has multiple)
        if (tenants.length > 1 && !currentTenant) {
            // The login page handles this, but just in case
            router.replace('/login');
            return;
        }
    }, [isAuthenticated, isLoading, currentTenant, tenants, router]);

    // Show loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-primary" size={40} />
                    <p className="text-slate-500">Cargando...</p>
                </div>
            </div>
        );
    }

    // Don't render children if not authenticated
    if (!isAuthenticated) {
        return null;
    }

    // Don't render children if tenant not selected (for multi-tenant users)
    if (tenants.length > 1 && !currentTenant) {
        return null;
    }

    return <>{children}</>;
}
