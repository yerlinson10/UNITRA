import DataTable from '@/Components/DataTable';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { useServerTable } from '@/hooks/useServerTable';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Invoice, PageProps, Paginated } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

type Props = PageProps<{
    invoices?: Paginated<Invoice>;
    filters?: { search?: string; status?: string };
    statuses?: Array<{ value: string; label: string }>;
}>;

const STATUS_LABEL: Record<string, string> = {
    completed: 'Completada',
    void: 'Anulada',
    open: 'Abierta',
    paid: 'Pagada',
};

export default function InvoicesIndex({
    invoices,
    filters = {},
    statuses = [],
}: Props) {
    const rows = invoices?.data ?? [];
    const table = useServerTable({
        url: '/invoices',
        paginated: invoices,
        filters,
        only: ['invoices', 'filters', 'statuses'],
    });

    const columns = useMemo<ColumnDef<Invoice>[]>(
        () => [
            {
                accessorKey: 'number',
                header: 'Factura',
                cell: ({ row }) => (
                    <span className="font-medium">
                        {row.original.number ?? `#${row.original.id}`}
                    </span>
                ),
            },
            {
                accessorKey: 'status',
                header: 'Estado',
                cell: ({ row }) => {
                    const status = row.original.status;
                    return (
                        <span
                            className={`text-xs font-semibold ${
                                status === 'void'
                                    ? 'text-[#DC4444]'
                                    : status === 'completed' || status === 'paid'
                                      ? 'text-[#22A06B]'
                                      : 'text-[#D97706]'
                            }`}
                        >
                            {STATUS_LABEL[status] ?? status}
                        </span>
                    );
                },
            },
            {
                accessorKey: 'payment_method',
                header: 'Pago',
                cell: ({ getValue }) => (
                    <span className="capitalize">
                        {(getValue() as string | null) ?? '—'}
                    </span>
                ),
            },
            {
                accessorKey: 'amount_due',
                header: 'Total',
                cell: ({ row }) => <Money amount={row.original.amount_due} />,
            },
            {
                accessorKey: 'created_at',
                header: 'Fecha',
                cell: ({ row }) => (
                    <span className="text-[#6B7069]">
                        {row.original.created_at
                            ? new Date(row.original.created_at).toLocaleString('es-DO')
                            : '—'}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: 'Ver',
                meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
                cell: ({ row }) => (
                    <Link
                        href={`/invoices/${row.original.id}`}
                        className="text-sm font-medium underline-offset-2 hover:underline"
                    >
                        Detalle
                    </Link>
                ),
            },
        ],
        [],
    );

    return (
        <AuthenticatedLayout title="Ventas">
            <Head title="Ventas" />

            <PageHeader title="Ventas" subtitle="Facturas y comprobantes" />

            <DataTable
                columns={columns}
                data={rows}
                empty="No hay ventas registradas."
                searchPlaceholder="Número, cliente, teléfono…"
                filterSlot={
                    <div className="w-full sm:w-auto sm:min-w-[180px]">
                        <label className="mb-1 block text-xs font-medium text-[#6B7069]">
                            Estado
                        </label>
                        <Select
                            value={table.filters.status || 'all'}
                            onValueChange={(value) =>
                                table.setFilter('status', value === 'all' ? '' : value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {statuses.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                }
                manualPagination
                manualFiltering
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
            />
        </AuthenticatedLayout>
    );
}
