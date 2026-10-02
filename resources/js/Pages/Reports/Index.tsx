import DataTable from '@/Components/DataTable';
import InputLabel from '@/Components/InputLabel';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import DatePicker from '@/Components/ui/date-picker';
import { useServerTable } from '@/hooks/useServerTable';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { MarginReportRow, PageProps, Paginated } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';

type Props = PageProps<{
    rows?: Paginated<MarginReportRow> | MarginReportRow[];
    totals?: { sales?: number; cost?: number; margin?: number };
    filters?: { from?: string; to?: string; search?: string };
}>;

function rowsOf(
    rows?: Paginated<MarginReportRow> | MarginReportRow[],
): MarginReportRow[] {
    if (!rows) return [];
    return Array.isArray(rows) ? rows : (rows.data ?? []);
}

function paginatedOf(
    rows?: Paginated<MarginReportRow> | MarginReportRow[],
): Paginated<MarginReportRow> | undefined {
    if (!rows || Array.isArray(rows)) return undefined;
    return rows;
}

export default function ReportsIndex({
    rows,
    totals = {},
    filters = {},
}: Props) {
    const data = rowsOf(rows);
    const paginated = paginatedOf(rows);
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');

    const table = useServerTable({
        url: '/reports',
        paginated,
        filters: {
            search: filters.search,
            from: filters.from,
            to: filters.to,
        },
        only: ['rows', 'totals', 'filters'],
    });

    const applyDates = (nextFrom: string, nextTo: string) => {
        router.get(
            '/reports',
            {
                from: nextFrom || undefined,
                to: nextTo || undefined,
                search: table.search || undefined,
                page: 1,
            },
            { preserveState: true, replace: true, preserveScroll: true },
        );
    };

    const columns = useMemo<ColumnDef<MarginReportRow>[]>(
        () => [
            {
                accessorKey: 'imei',
                header: 'IMEI',
                cell: ({ getValue }) => (
                    <span className="font-mono text-xs">{getValue() as string}</span>
                ),
            },
            {
                accessorKey: 'product_label',
                header: 'Producto',
                cell: ({ row }) => row.original.product_label ?? '—',
            },
            {
                accessorKey: 'cost',
                header: 'Costo',
                cell: ({ row }) => <Money amount={row.original.cost} />,
            },
            {
                accessorKey: 'sale_price',
                header: 'Venta',
                cell: ({ row }) => <Money amount={row.original.sale_price} />,
            },
            {
                accessorKey: 'margin',
                header: 'Margen',
                cell: ({ row }) => (
                    <span
                        className={
                            row.original.margin >= 0
                                ? 'font-semibold text-[#22A06B]'
                                : 'font-semibold text-[#DC4444]'
                        }
                    >
                        <Money amount={row.original.margin} />
                    </span>
                ),
            },
            {
                accessorKey: 'sold_at',
                header: 'Fecha',
                cell: ({ row }) => (
                    <span className="text-[#6B7069]">
                        {row.original.sold_at
                            ? new Date(row.original.sold_at).toLocaleDateString('es-DO')
                            : '—'}
                    </span>
                ),
            },
        ],
        [],
    );

    return (
        <AuthenticatedLayout title="Reportes">
            <Head title="Reportes" />

            <PageHeader title="Reportes" subtitle="Margen por IMEI" />

            <div className="mb-4 unitra-card inline-block p-4">
                <p className="text-xs uppercase tracking-wide text-[#6B7069]">
                    Margen total
                </p>
                <p className="font-display text-3xl font-semibold text-[#111315]">
                    <Money amount={totals.margin ?? 0} />
                </p>
            </div>

            <DataTable
                columns={columns}
                data={data}
                empty="Sin datos para el rango seleccionado."
                searchPlaceholder="IMEI o producto…"
                filterSlot={
                    <>
                        <div className="min-w-[180px]">
                            <InputLabel htmlFor="from" value="Desde" />
                            <DatePicker
                                id="from"
                                value={from}
                                onChange={(value) => {
                                    setFrom(value);
                                    applyDates(value, to);
                                }}
                                placeholder="Fecha inicio"
                            />
                        </div>
                        <div className="min-w-[180px]">
                            <InputLabel htmlFor="to" value="Hasta" />
                            <DatePicker
                                id="to"
                                value={to}
                                onChange={(value) => {
                                    setTo(value);
                                    applyDates(from, value);
                                }}
                                placeholder="Fecha fin"
                            />
                        </div>
                    </>
                }
                manualPagination={!!paginated}
                manualFiltering={!!paginated}
                pageCount={table.pageCount}
                pagination={table.pagination}
                onPaginationChange={(updater) => {
                    const next =
                        typeof updater === 'function'
                            ? updater(table.pagination)
                            : updater;
                    table.setPage(next.pageIndex + 1);
                }}
                globalFilter={table.search}
                onGlobalFilterChange={table.setSearch}
                onSearchSubmit={table.submitSearch}
                from={table.from}
                to={table.to}
                total={table.total}
                initialPageSize={25}
            />
        </AuthenticatedLayout>
    );
}
