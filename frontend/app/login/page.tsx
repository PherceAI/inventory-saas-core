'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import TenantSelector from '@/components/auth/TenantSelector';
import { TenantWithRole } from '@/services/auth.service';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showTenantSelector, setShowTenantSelector] = useState(false);
    const [availableTenants, setAvailableTenants] = useState<TenantWithRole[]>([]);

    const { login, selectTenant } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const tenants = await login(email, password);

            if (tenants.length === 1) {
                // Auto-redirect if only one tenant
                router.push('/dashboard');
            } else if (tenants.length > 1) {
                // Show tenant selector if multiple tenants
                setAvailableTenants(tenants);
                setShowTenantSelector(true);
            } else {
                setError('No tienes acceso a ninguna empresa. Contacta al administrador.');
            }
        } catch (err: any) {
            const message = err?.response?.data?.message || 'Credenciales inválidas';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTenantSelect = (tenant: TenantWithRole) => {
        selectTenant(tenant);
    };

    if (showTenantSelector) {
        return (
            <TenantSelector
                tenants={availableTenants}
                onSelect={handleTenantSelect}
            />
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            C
                        </div>
                        <span className="font-bold text-2xl text-slate-900">Clarigo</span>
                    </Link>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
                        Bienvenido de nuevo
                    </h1>
                    <p className="text-slate-500 text-center mb-8">
                        Ingresa tus credenciales para continuar
                    </p>

                    {/* Error Alert */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                            <AlertCircle size={20} />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                                Correo electrónico
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tu@empresa.com"
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                                Contraseña
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Iniciando sesión...
                                </>
                            ) : (
                                'Iniciar sesión'
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-6 flex items-center gap-4">
                        <div className="flex-1 h-px bg-slate-200" />
                        <span className="text-sm text-slate-400">o</span>
                        <div className="flex-1 h-px bg-slate-200" />
                    </div>

                    {/* Register Link */}
                    <p className="text-center text-slate-600">
                        ¿No tienes cuenta?{' '}
                        <Link href="/register" className="text-primary font-medium hover:underline">
                            Crear cuenta gratis
                        </Link>
                    </p>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-slate-400 mt-6">
                    © 2026 Clarigo Inc. Todos los derechos reservados.
                </p>
            </div>
        </div>
    );
}
