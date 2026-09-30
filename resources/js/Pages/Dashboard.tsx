import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Boxes, Receipt, Wallet } from 'lucide-react';

type DashboardProps = PageProps<{
    availableUnits?: number;
    salesToday?: number;
    cashOpen?: boolean;
}>;

export default function Dashboard({
    availableUnits = 0,
    salesToday = 0,
    cashOpen = false,
}: DashboardProps) {
    const kpis = [
        {
            label: 'Unidades disponibles',
            value: availableUnits.toLocaleString('es-DO'),
            icon: Boxes,
            hint: 'En stock listo para venta',
        },
        {
            label: 'Ventas hoy',
            value: <Money amount={salesToday} className="font-display text-4xl font-semibold" />,
            icon: Receipt,
            hint: 'Total facturado del día',
        },
        {
            label: 'Caja',
            value: cashOpen ? 'ABIERTA' : 'CERRADA',
            icon: Wallet,
            hint: cashOpen ? 'Sesión activa' : 'Sin sesión abierta',
            accent: cashOpen ? 'text-[#22A06B]' : 'text-[#D97706]',
        },
    ];

    return (
        <AuthenticatedLayout title="Dashboard">
            <Head title="Dashboard" />

            <PageHeader
                title="Dashboard"
                subtitle="Resumen operativo UNITRA"
                actions={
                    <Link
                        href="/pos"
                        className="btn-unitra-primary active:scale-[0.97]"
                    >
                        Ir al POS
                    </Link>
                }
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {kpis.map((kpi) => {
                    const Icon = kpi.icon;
                    return (
                        <div key={kpi.label} className="unitra-card p-5">
                            <div className="mb-4 flex items-center justify-between">
                                <p className="text-xs font-medium uppercase tracking-wide text-[#6B7069]">
                                    {kpi.label}
                                </p>
                                <span className="rounded-md bg-[#F5F6F3] p-2 text-[#111315]">
                                    <Icon className="h-4 w-4" />
                                </span>
                            </div>
                            <div
                                className={`font-display text-4xl font-semibold tracking-wide text-[#111315] ${kpi.accent ?? ''}`}
                            >
                                {kpi.value}
                            </div>
                            <p className="mt-2 text-sm text-[#6B7069]">{kpi.hint}</p>
                            {kpi.label === 'Caja' && cashOpen && (
                                <span className="mt-3 inline-block h-1.5 w-1.5 rounded-full bg-[#B8E34B]" />
                            )}
                        </div>
                    );
                })}
            </div>
        </AuthenticatedLayout>
    );
}
