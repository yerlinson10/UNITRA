import DataTable from '@/Components/DataTable';
import InputLabel from '@/Components/InputLabel';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import DatePicker from '@/Components/ui/date-picker';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { MarginReportRow, PageProps } from '@/types';
import { Head, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

type Props = PageProps<{
    rows?: MarginReportRow[];
    filters?: { from?: string; to?: string };
}>;

export default function ReportsIndex({
    rows = [],
    filters = {},
}: Props) {
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(
            '/reports',
            { from: from || undefined, to: to || undefined },
            { preserveState: true, replace: true },
        );
    };

    const totalMargin = rows.reduce((sum, r) => sum + (r.margin ?? 0), 0);

    return (
        <AuthenticatedLayout title="Reportes">
            <Head title="Reportes" />

            <PageHeader
                title="Reportes"
                subtitle="Margen por IMEI"
            />

            <form
                onSubmit={submit}
                className="mb-4 flex flex-wrap items-end gap-3"
            >
                <div className="min-w-[180px]">
                    <InputLabel htmlFor="from" value="Desde" />
                    <DatePicker
                        id="from"
                        value={from}
                        onChange={setFrom}
                        placeholder="Fecha inicio"
                    />
                </div>
                <div className="min-w-[180px]">
                    <InputLabel htmlFor="to" value="Hasta" />
                    <DatePicker
                        id="to"
                        value={to}
                        onChange={setTo}
                        placeholder="Fecha fin"
                    />
                </div>
                <PrimaryButton type="submit">Filtrar</PrimaryButton>
            </form>

            <div className="mb-4 unitra-card inline-block p-4">
                <p className="text-xs uppercase tracking-wide text-[#6B7069]">
                    Margen total
                </p>
                <p className="font-display text-3xl font-semibold text-[#111315]">
                    <Money amount={totalMargin} />
                </p>
            </div>

            <DataTable isEmpty={rows.length === 0} empty="Sin datos para el rango seleccionado.">
                <table className="unitra-table">
                    <thead>
                        <tr>
                            <th>IMEI</th>
                            <th>Producto</th>
                            <th>Costo</th>
                            <th>Venta</th>
                            <th>Margen</th>
                            <th>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={`${row.imei}-${row.sold_at}`}>
                                <td className="font-mono text-xs">{row.imei}</td>
                                <td>{row.product_label ?? '—'}</td>
                                <td>
                                    <Money amount={row.cost} />
                                </td>
                                <td>
                                    <Money amount={row.sale_price} />
                                </td>
                                <td
                                    className={
                                        row.margin >= 0
                                            ? 'font-semibold text-[#22A06B]'
                                            : 'font-semibold text-[#DC4444]'
                                    }
                                >
                                    <Money amount={row.margin} />
                                </td>
                                <td className="text-[#6B7069]">
                                    {row.sold_at
                                        ? new Date(row.sold_at).toLocaleDateString('es-DO')
                                        : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </DataTable>
        </AuthenticatedLayout>
    );
}
