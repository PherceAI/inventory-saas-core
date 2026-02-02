"use client";

import Link from "next/link";
import { ArrowRight, BarChart2, Check, Shield, Zap, TrendingUp, Lock, Globe } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans">

            {/* 1. NAVBAR - Professional & Sticky */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">C</div>
                        <span className="font-bold text-lg tracking-tight text-slate-900">Clarigo</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                        <Link href="#product" className="hover:text-primary transition-colors">Producto</Link>
                        <Link href="#solutions" className="hover:text-primary transition-colors">Soluciones</Link>
                        <Link href="#customers" className="hover:text-primary transition-colors">Clientes</Link>
                        <Link href="#pricing" className="hover:text-primary transition-colors">Precios</Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">
                            Iniciar sesión
                        </Link>
                        <Link
                            href="/dashboard"
                            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg transition-all shadow-sm"
                        >
                            Comenzar gratis
                        </Link>
                    </div>
                </div>
            </nav>

            {/* 2. HERO SECTION - Clean & Direct */}
            <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6 text-balance">
                        Gestión de inventario <br />
                        <span className="text-primary">inteligente y escalable.</span>
                    </h1>

                    <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed text-balance">
                        La plataforma todo en uno para optimizar tu cadena de suministro.
                        Controla stock en tiempo real, automatiza pedidos y toma decisiones basadas en datos.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                        <Link
                            href="/dashboard"
                            className="px-8 py-3.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-sm text-base"
                        >
                            Empezar prueba de 14 días
                        </Link>
                        <Link href="#" className="px-8 py-3.5 bg-white text-slate-700 font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 transition-all text-base flex items-center gap-2">
                            Ver demostración
                        </Link>
                    </div>

                    {/* DASHBOARD PREVIEW - Technical & Sharp */}
                    <div className="relative rounded-2xl border border-slate-200 shadow-2xl bg-slate-50 overflow-hidden mx-auto max-w-6xl">
                        <div className="h-11 bg-white border-b border-slate-200 flex items-center px-4 gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-slate-200" />
                                <div className="w-3 h-3 rounded-full bg-slate-200" />
                                <div className="w-3 h-3 rounded-full bg-slate-200" />
                            </div>
                            <div className="ml-4 px-3 py-1 bg-slate-100 rounded text-xs text-slate-400 font-medium flex items-center gap-2">
                                <Lock size={10} /> app.clarigo.com/dashboard
                            </div>
                        </div>
                        <img
                            src="/dashboard-preview.png"
                            alt="Dashboard de Clarigo"
                            className="w-full h-auto"
                        />
                    </div>
                </motion.div>
            </section>

            {/* 3. SOCIAL PROOF - Minimalist Logos */}
            <section className="py-12 border-y border-slate-100 bg-slate-50/50">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-8">Confían en nosotros empresas líderes de logística</p>
                    <div className="flex flex-wrap justify-center gap-12 grayscale opacity-40">
                        <span className="text-2xl font-bold text-slate-800">ACME Corp</span>
                        <span className="text-2xl font-bold text-slate-800">LogisticsPro</span>
                        <span className="text-2xl font-bold text-slate-800">GlobalTrade</span>
                        <span className="text-2xl font-bold text-slate-800">Inventa</span>
                        <span className="text-2xl font-bold text-slate-800">WareHouse+</span>
                    </div>
                </div>
            </section>

            {/* 4. FEATURES GRID - Clean Typography */}
            <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
                <div className="mb-20">
                    <span className="text-primary font-semibold text-sm uppercase tracking-wider">Características</span>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2 mb-6">Todo lo que necesitas para operar.</h2>
                    <p className="text-lg text-slate-600 max-w-2xl">
                        Nuestra plataforma está construida con tecnología de punta para asegurar velocidad, seguridad y escalabilidad global.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-12">
                    {[
                        { icon: <Zap className="text-primary" />, title: "Sincronización Real", desc: "Tus datos se actualizan instantáneamente en todos los dispositivos y almacenes." },
                        { icon: <BarChart2 className="text-primary" />, title: "Reportes Avanzados", desc: "Obtén insights detallados sobre rotación, márgenes y predicción de demanda." },
                        { icon: <Shield className="text-primary" />, title: "Seguridad Empresarial", desc: "Cumplimiento SOC2, encriptación de grado bancario y backups automáticos." },
                        { icon: <Globe className="text-primary" />, title: "Multi-Almacén", desc: "Gestiona ilimitadas ubicaciones físicas desde un solo panel de control centralizado." },
                        { icon: <TrendingUp className="text-primary" />, title: "Pronóstico de Demanda", desc: "IA que sugiere cuándo reabastecer para evitar roturas de stock o sobrecostos." },
                        { icon: <Check className="text-primary" />, title: "API Flexible", desc: "Conecta Clarigo con tu ERP, e-commerce o sistema contable en minutos." },
                    ].map((feat, i) => (
                        <div key={i} className="flex flex-col items-start">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                                {feat.icon}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{feat.title}</h3>
                            <p className="text-slate-600 leading-relaxed text-sm lg:text-base">
                                {feat.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* 5. BIG METRICS - Simple & Bold */}
            <section className="py-24 bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Escala sin fricción</h2>
                        <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                            Ya sea que gestiones 100 o 10 millones de SKUs, nuestra infraestructura está diseñada para crecer contigo sin degradación de rendimiento.
                        </p>
                        <ul className="space-y-4">
                            {['Uptime garantizado del 99.99%', 'Soporte técnico 24/7', 'Migración gratuita de datos'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-300 font-medium">
                                    <Check className="text-primary" size={20} /> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                        {[
                            { val: "500M+", lab: "Items Rastreados" },
                            { val: "0.01s", lab: "Latencia Media" },
                            { val: "150+", lab: "Países Activos" },
                            { val: "24h", lab: "Soporte" },
                        ].map((stat, i) => (
                            <div key={i} className="p-6 bg-white/5 rounded-xl border border-white/10">
                                <div className="text-4xl font-bold text-white mb-2">{stat.val}</div>
                                <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">{stat.lab}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 6. CTA FINAL - Compact */}
            <section className="py-32 px-6 text-center">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-4xl font-bold text-slate-900 mb-6">Empieza a optimizar tu inventario hoy.</h2>
                    <p className="text-xl text-slate-600 mb-10">Únete a más de 10,000 empresas modernas que confían en Clarigo.</p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/dashboard"
                            className="px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-md"
                        >
                            Crear cuenta gratuita
                        </Link>
                        <Link href="#" className="px-8 py-4 bg-white text-slate-700 font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">
                            Hablar con ventas
                        </Link>
                    </div>
                </div>
            </section>

            {/* 7. FOOTER - Serious Corp */}
            <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-5 gap-12 mb-12">
                    <div className="col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center text-white text-xs font-bold">C</div>
                            <span className="font-bold text-slate-900">Clarigo</span>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                            Sistema de gestión de inventario de clase empresarial diseñado para equipos modernos.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 mb-4">Producto</h4>
                        <ul className="space-y-3 text-sm text-slate-600">
                            <li><Link href="#" className="hover:text-primary">Características</Link></li>
                            <li><Link href="#" className="hover:text-primary">Seguridad</Link></li>
                            <li><Link href="#" className="hover:text-primary">Integraciones</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 mb-4">Compañía</h4>
                        <ul className="space-y-3 text-sm text-slate-600">
                            <li><Link href="#" className="hover:text-primary">Nosotros</Link></li>
                            <li><Link href="#" className="hover:text-primary">Clientes</Link></li>
                            <li><Link href="#" className="hover:text-primary">Carreras</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 mb-4">Legal</h4>
                        <ul className="space-y-3 text-sm text-slate-600">
                            <li><Link href="#" className="hover:text-primary">Privacidad</Link></li>
                            <li><Link href="#" className="hover:text-primary">Términos</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-slate-200 text-center md:text-left text-sm text-slate-400">
                    &copy; 2026 Clarigo Inc. Todos los derechos reservados.
                </div>
            </footer>
        </div>
    );
}
