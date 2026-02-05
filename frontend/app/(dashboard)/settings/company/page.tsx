"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Save, Building2, Globe, FileText, Loader2, MapPin, Phone, Mail, DollarSign, Clock, Palette } from "lucide-react"
import api from "@/services/api.service"
import authService from "@/services/auth.service"
import { cn } from "@/lib/utils"

// Schema Validation
const formSchema = z.object({
    legalName: z.string().min(2, "El nombre legal es requerido"),
    taxId: z.string().min(10, "El RUC/Identificación debe tener al menos 10 dígitos").max(13, "Máximo 13 dígitos"),
    address: z.string().min(5, "Dirección requerida"),
    phone: z.string().optional(),
    email: z.string().email("Correo inválido").optional().or(z.literal('')),
    currency: z.string().min(1),
    timezone: z.string().min(1),
    brandColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Color inválido").optional().or(z.literal('')),
})

type FormValues = z.infer<typeof formSchema>

export default function CompanyProfilePage() {
    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(true)
    const [tenantId, setTenantId] = useState<string | null>(null)

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            legalName: "",
            taxId: "",
            address: "",
            phone: "",
            email: "",
            brandColor: "",
            currency: "USD",
            timezone: "America/Guayaquil"
        }
    })

    useEffect(() => {
        const loadSettings = async () => {
            const currentTenantId = authService.getCurrentTenantId()
            if (!currentTenantId) return
            setTenantId(currentTenantId)

            try {
                // Since we don't have a direct GET settings endpoint documented, 
                // we'll fetch user profile to get tenant basic info or 
                // try to fetch from a hypotetical endpoint if I added one.
                // Wait, I didn't add GET /tenants/:id/settings. 
                // But getMyTenants returns basic info.
                // Actually, let's implement the GET in backend later if needed.
                // For now, I'll attempt to Read from local storage or assume empty? 
                // No, that's bad UX.
                // I should have added GET /tenants/:id/settings or GET /tenants/:id.
                // Let's Assume the user context might have it? No.

                // Temporary fix: I will try to hit the PATCH endpoint with empty data? No.
                // I will assume for V1 we start empty or I need to add that GET endpoint.

                // Let's check if I can add the GET endpoint quickly in the next turn or now.
                // I'll assume for moment I can mock or it's empty.
                // Actually, I'll fetch user tenants list and try to find settings there?
                // `getUserTenants` in service selects `settings`? No, it selects `id, name slug, businessType`.

                // CRITICAL MISSING PIECE: GET Settings.
                // I will add GET /tenants/:id endpoint to backend in next step.
                // For now, I build the frontend to consume it expecting it to exist.

                const res = await api.get(`/tenants/${currentTenantId}`)
                const settings = res.data.settings || {}

                form.reset({
                    legalName: settings.profile?.legalName || res.data.name || "",
                    taxId: settings.profile?.taxId || "",
                    address: settings.profile?.address || "",
                    phone: settings.profile?.phone || "",
                    email: settings.profile?.email || "",
                    brandColor: settings.profile?.brandColor || "",
                    currency: settings.localization?.currency || "USD",
                    timezone: settings.localization?.timezone || "America/Guayaquil"
                })
            } catch (error) {
                console.error("Error loading settings", error)
            } finally {
                setInitialLoading(false)
            }
        }

        loadSettings()
    }, [])

    const onSubmit = async (data: FormValues) => {
        if (!tenantId) return
        setLoading(true)
        try {
            const payload = {
                profile: {
                    legalName: data.legalName,
                    taxId: data.taxId,
                    address: data.address,
                    phone: data.phone,
                    email: data.email,
                    brandColor: data.brandColor
                },
                localization: {
                    currency: data.currency,
                    timezone: data.timezone
                }
            }

            await api.patch(`/tenants/${tenantId}/settings`, payload)
            // Success notification toast would go here
            alert("Perfil actualizado correctamente")
        } catch (error) {
            console.error(error)
            alert("Error al actualizar")
        } finally {
            setLoading(false)
        }
    }

    if (initialLoading) {
        return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Perfil de Empresa</h1>
                <p className="text-slate-500 mt-1">
                    Administra la información legal y visual que aparecerá en tus documentos y reportes.
                </p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                {/* Identity Section */}
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                            <Building2 size={20} />
                        </div>
                        <h2 className="font-semibold text-slate-900">Identidad Corporativa</h2>
                    </div>
                    <div className="p-6 grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Razón Social / Nombre Legal</label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                <input
                                    {...form.register("legalName")}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Ej. Hotel Zeus S.A.C."
                                />
                            </div>
                            {form.formState.errors.legalName && <p className="text-xs text-rose-500">{form.formState.errors.legalName.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">RUC / Identificación Fiscal</label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                <input
                                    {...form.register("taxId")}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Ej. 1790000000001"
                                />
                            </div>
                            {form.formState.errors.taxId && <p className="text-xs text-rose-500">{form.formState.errors.taxId.message}</p>}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-700">Dirección Matriz</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                <input
                                    {...form.register("address")}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Ej. Av. Amazonas N45-12 y Pereira"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Teléfono</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                <input
                                    {...form.register("phone")}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Ej. +593 99 999 9999"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Email de Facturación</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                <input
                                    {...form.register("email")}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    placeholder="admin@hotelzeus.com"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Localization Section */}
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center gap-3">
                        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                            <Globe size={20} />
                        </div>
                        <h2 className="font-semibold text-slate-900">Configuración Regional (Ecuador)</h2>
                    </div>
                    <div className="p-6 grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Moneda Principal</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                <select
                                    {...form.register("currency")}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-white appearance-none"
                                >
                                    <option value="USD">Dólar Estadounidense (USD)</option>
                                    <option value="EUR">Euro (EUR)</option>
                                    <option value="COP">Peso Colombiano (COP)</option>
                                    <option value="PEN">Sol Peruano (PEN)</option>
                                </select>
                            </div>
                            <p className="text-[10px] text-slate-400">Moneda usada para reportes y costos base.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Zona Horaria</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                <select
                                    {...form.register("timezone")}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-white appearance-none"
                                >
                                    <option value="America/Guayaquil">Ecuador (Guayaquil) - GMT-5</option>
                                    <option value="America/Bogota">Colombia (Bogotá) - GMT-5</option>
                                    <option value="America/Lima">Perú (Lima) - GMT-5</option>
                                    <option value="America/New_York">USA (Eastern) - GMT-5</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Branding Section */}
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center gap-3">
                        <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                            <Palette size={20} />
                        </div>
                        <h2 className="font-semibold text-slate-900">Personalización Visual</h2>
                    </div>
                    <div className="p-6 grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Color de Marca (Hex)</label>
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-2.5 text-slate-400">#</span>
                                    <input
                                        {...form.register("brandColor")}
                                        className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all uppercase"
                                        placeholder="000000"
                                    />
                                </div>
                                <div
                                    className="w-10 h-10 rounded-lg border border-slate-200 shadow-sm"
                                    style={{ backgroundColor: form.watch('brandColor') || '#ffffff' }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20",
                            loading && "opacity-70 cursor-not-allowed"
                        )}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        Guardar Cambios
                    </button>
                </div>
            </form>
        </div>
    )
}
