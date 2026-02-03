'use client';

import { AppSidebar } from "@/components/layout/sidebar";
import { AuthGuard } from "@/components/auth";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard>
            <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
                <AppSidebar />
                <div className="flex flex-1 flex-col overflow-hidden relative z-10">
                    <main className="flex-1 overflow-y-auto p-6 lg:p-10">
                        <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </AuthGuard>
    );
}
