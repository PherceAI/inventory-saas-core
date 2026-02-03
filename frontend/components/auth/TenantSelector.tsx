'use client';

import { TenantWithRole } from '@/services/auth.service';
import { Building2, ChevronRight, Crown, Shield, User } from 'lucide-react';

interface TenantSelectorProps {
    tenants: TenantWithRole[];
    onSelect: (tenant: TenantWithRole) => void;
}

const roleIcons: Record<string, React.ReactNode> = {
    OWNER: <Crown size={16} className="text-amber-500" />,
    ADMIN: <Shield size={16} className="text-blue-500" />,
    MANAGER: <Shield size={16} className="text-green-500" />,
    SUPERVISOR: <User size={16} className="text-slate-500" />,
    OPERATOR: <User size={16} className="text-slate-400" />,
    AUDITOR: <User size={16} className="text-purple-500" />,
    VIEWER: <User size={16} className="text-slate-300" />,
};

const roleLabels: Record<string, string> = {
    OWNER: 'Propietario',
    ADMIN: 'Administrador',
    MANAGER: 'Gerente',
    SUPERVISOR: 'Supervisor',
    OPERATOR: 'Operador',
    AUDITOR: 'Auditor',
    VIEWER: 'Solo lectura',
};

export default function TenantSelector({ tenants, onSelect }: TenantSelectorProps) {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            C
                        </div>
                        <span className="font-bold text-2xl text-slate-900">Clarigo</span>
                    </div>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
                        Selecciona una empresa
                    </h1>
                    <p className="text-slate-500 text-center mb-8">
                        Tienes acceso a múltiples empresas. Elige con cuál deseas trabajar.
                    </p>

                    <div className="space-y-3">
                        {tenants.map((tenant) => (
                            <button
                                key={tenant.id}
                                onClick={() => onSelect(tenant)}
                                className="w-full p-4 border border-slate-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-4 group"
                            >
                                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                    <Building2 size={24} className="text-slate-600 group-hover:text-primary" />
                                </div>
                                <div className="flex-1 text-left">
                                    <h3 className="font-semibold text-slate-900 group-hover:text-primary">
                                        {tenant.name}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                        {roleIcons[tenant.role] || <User size={16} />}
                                        <span>{roleLabels[tenant.role] || tenant.role}</span>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-slate-400 group-hover:text-primary" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-slate-400 mt-6">
                    Puedes cambiar de empresa en cualquier momento desde el menú lateral.
                </p>
            </div>
        </div>
    );
}
