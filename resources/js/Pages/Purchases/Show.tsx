import DataTable from '@/Components/DataTable';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Purchase, PurchaseLine } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

type Props = PageProps<{
    purchase: Purchase & { items?: PurchaseLine[] };
}>;

export default function PurchasesShow({ purchase }: Props) {
    const lines: PurchaseLine[] =
        purchase.lines ??
        (purchase.items as PurchaseLine[] | undefined) ??
        [];

    const columns = useMemo<ColumnDef<PurchaseLine>[]>(
        () => [
            {
                id: 'brand',
                header: 'Marca',
                accessorFn: (row) =>
                    row.product
                        ? [row.product.brand, row.product.model]
                              .filter(Boolean)
                              .join(' · ')
                        : `Producto #${row.product_id}`,
                cell: ({ row }) =>
                    row.original.product
                        ? [row.original.product.brand, row.original.product.model]
                              .filter(Boolean)
                              .join(' · ')
                        : `Producto #${row.original.product_id}`,
            },
            {
                accessorKey: 'imei',
                header: 'IMEI',
                cell: ({ getValue }) => (
                    <span className="font-mono text-xs">
                        {getValue() as string}
                    </span>
                ),
            },
            {
                accessorKey: 'cost',
                header: 'Costo',
                cell: ({ row }) => <Money amount={row.original.cost} />,
            },
        ],
        [],
    );

    return (
        <AuthenticatedLayout title={`Compra #${purchase.id}`}>
            <Head title={`Compra #${purchase.id}`} />

            <PageHeader
                title={`Compra #${purchase.id}`}
                subtitle={
                    purchase.created_at
                        ? new Date(purchase.created_at).toLocaleString('es-DO')
                        : undefined
                }
                actions={
                    <Link
                        href="/purchases"
                        className="rounded-md border border-[#E3E5E0] bg-white px-3 py-2 text-sm font-medium hover:bg-[#F5F6F3]"
                    >
                        Volver
                    </Link>
                }
            />

            <div className="mb-5 grid gap-4 sm:grid-cols-3">
                <div className="unitra-card p-4">
                    <p className="text-xs uppercase tracking-wide text-[#6B7069]">
                        Vendedor
                    </p>
                    <p className="mt-1 font-medium">{purchase.seller_name}</p>
                </div>
                <div className="unitra-card p-4">
                    <p className="text-xs uppercase tracking-wide text-[#6B7069]">
                        Documento
                    </p>
                    <p className="mt-1">{purchase.seller_document ?? '—'}</p>
                </div>
                <div className="unitra-card p-4">
                    <p className="text-xs uppercase tracking-wide text-[#6B7069]">
                        Total
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold">
                        <Money amount={purchase.total_cost} />
                    </p>
                </div>
            </div>

            {purchase.notes && (
                <p className="mb-4 text-sm text-[#6B7069]">
                    Notas: {purchase.notes}
                </p>
            )}

            <DataTable
                columns={columns}
                data={lines}
                empty="Sin líneas."
                searchPlaceholder="Marca o IMEI…"
                initialPageSize={25}
                showPagination={lines.length > 25}
            />
        </AuthenticatedLayout>
    );
}
