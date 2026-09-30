import { ReactNode } from 'react';

export default function PageHeader({
    title,
    subtitle,
    actions,
}: {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
}) {
    return (
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
                <h1 className="font-display text-3xl font-semibold uppercase tracking-wide text-[#111315]">
                    {title}
                </h1>
                {subtitle && (
                    <p className="mt-1 text-sm text-[#6B7069]">{subtitle}</p>
                )}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
    );
}
