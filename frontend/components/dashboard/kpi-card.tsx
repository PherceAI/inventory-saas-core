'use client';

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface KPICardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    color: string;
    bgColor: string;
    trend?: {
        value: string;
        isPositive: boolean;
    };
    isLoading?: boolean;
}

export function KPICard({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
    bgColor,
    trend,
    isLoading
}: KPICardProps) {
    if (isLoading) {
        return (
            <Card className="border-none shadow-sm">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-32" />
                        </div>
                        <Skeleton className="h-10 w-10 rounded-xl" />
                    </div>
                    <div className="mt-4">
                        <Skeleton className="h-4 w-20" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">{title}</p>
                        <h3 className="mt-2 text-3xl font-bold text-slate-900">{value}</h3>
                    </div>
                    <div className={`rounded-xl p-2.5 ${bgColor} ${color}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                </div>
                {(trend || subtitle) && (
                    <div className="mt-4 flex items-center gap-2">
                        {trend && (
                            <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${trend.isPositive
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-rose-100 text-rose-700'
                                }`}>
                                {trend.isPositive
                                    ? <TrendingUp className="h-3 w-3" />
                                    : <TrendingDown className="h-3 w-3" />
                                }
                                {trend.value}
                            </div>
                        )}
                        {subtitle && (
                            <span className="text-xs text-slate-400">{subtitle}</span>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
