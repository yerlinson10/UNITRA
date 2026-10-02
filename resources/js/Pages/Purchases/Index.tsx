import DataTable from '@/Components/DataTable';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import { useServerTable } from '@/hooks/useServerTable';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Paginated, Purchase } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useMemo } from 'react';

type Props = PageProps<{
    purchases?: Paginated<Purchase>;
    filters?: { search?: string };
}>;

export default function PurchasesIndex({ purchases, filters = {} }: Props) {
    const rows = purchases?.data ?? [];
    const table = useServerTable({
        url: '/purchases',
        paginated: purchases,
        filters,
        only: ['purchases', 'filters'],
    });

    const columns = useMemo<ColumnDef<Purchase>[]>(
        () => [
            {
                accessorKey: 'id',
                header: '#',
                cell: ({ row }) => (
                    <span className="font-medium">#{row.original.id}</span>
                ),
            },
            {
                accessorKey: 'seller_name',
                header: 'Vendedor',
            },
            {
                accessorKey: 'seller_document',
                header: 'Documento',
                cell: ({ getValue }) => (getValue() as string | null) ?? '—',
            },
            {
                accessorKey: 'total_cost',
                header: 'Total',
                cell: ({ row }) => <Money amount={row.original.total_cost} />,
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
                        href={`/purchases/${row.original.id}`}
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
        <AuthenticatedLayout title="Compras">
            <Head title="Compras" />

            <PageHeader
                title="Compras"
                subtitle="Entradas de unidades al inventario"
                actions={
                    <Link href="/purchases/create">
                        <PrimaryButton type="button">
                            <Plus className="mr-1.5 h-4 w-4" />
                            Nueva compra
                        </PrimaryButton>
                    </Link>
                }
            />

            <DataTable
                columns={columns}
                data={rows}
                empty="No hay compras registradas."
                searchPlaceholder="Vendedor, documento, notas, #…"
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
