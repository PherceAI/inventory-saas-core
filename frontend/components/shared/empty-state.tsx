'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, ArrowRight } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    ctaLabel?: string;
    ctaHref?: string;
    ctaAction?: () => void;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    ctaLabel,
    ctaHref,
    ctaAction
}: EmptyStateProps) {
    return (
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
            <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="rounded-full bg-slate-100 p-4 mb-4">
                    <Icon className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 max-w-md mb-6">{description}</p>
                {ctaLabel && (ctaHref || ctaAction) && (
                    ctaHref ? (
                        <Button asChild className="gap-2">
                            <Link href={ctaHref}>
                                {ctaLabel}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    ) : (
                        <Button onClick={ctaAction} className="gap-2">
                            {ctaLabel}
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    )
                )}
            </CardContent>
        </Card>
    );
}
