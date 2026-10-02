import DataTable from '@/Components/DataTable';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Invoice, PageProps, SaleItem, TradeIn } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { FileText } from 'lucide-react';
import { useMemo } from 'react';

type Props = PageProps<{
    invoice: Invoice;
}>;

export default function InvoicesShow({ invoice, auth }: Props) {
    const isAdmin = auth.user.role === 'admin';
    const canVoid = isAdmin && invoice.status !== 'void';
    const items = invoice.items ?? [];
    const tradeIns = invoice.trade_ins ?? [];

    const voidInvoice = () => {
        if (!confirm('¿Anular esta factura? Esta acción no se puede deshacer.')) return;
        router.post(`/invoices/${invoice.id}/void`);
    };

    const itemColumns = useMemo<ColumnDef<SaleItem>[]>(
        () => [
            {
                id: 'product',
                header: 'Producto',
                accessorFn: (row) =>
                    row.product_label ?? row.product_name ?? '',
                cell: ({ row }) =>
                    row.original.product_label ??
                    row.original.product_name ??
                    '—',
            },
            {
                id: 'imei',
                header: 'IMEI',
                accessorFn: (row) => row.imei ?? row.inventory_item?.imei ?? '',
                cell: ({ row }) => (
                    <span className="font-mono text-xs">
                        {row.original.imei ??
                            row.original.inventory_item?.imei ??
                            '—'}
                    </span>
                ),
            },
            {
                id: 'warranty',
                header: 'Garantía',
                cell: ({ row }) => {
                    const item = row.original;
                    const date =
                        item.warranty_expires_at ??
                        item.inventory_item?.warranty_expires_at ??
                        null;
                    return (
                        <span className="text-xs">
                            {date
                                ? new Date(`${date}T12:00:00`).toLocaleDateString(
                                      'es-DO',
                                  )
                                : '—'}
                        </span>
                    );
                },
            },
            {
                id: 'price',
                header: 'Precio',
                cell: ({ row }) => (
                    <Money
                        amount={
                            row.original.price ?? row.original.sale_price ?? null
                        }
                    />
                ),
            },
        ],
        [],
    );

    const tradeInColumns = useMemo<ColumnDef<TradeIn>[]>(
        () => [
            {
                id: 'equipment',
                header: 'Equipo',
                accessorFn: (row) =>
                    row.product_label ||
                    [row.brand, row.model].filter(Boolean).join(' ') ||
                    '',
                cell: ({ row }) =>
                    row.original.product_label ||
                    [row.original.brand, row.original.model]
                        .filter(Boolean)
                        .join(' ') ||
                    '—',
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
                accessorKey: 'condition',
                header: 'Condición',
            },
            {
                accessorKey: 'credited_value',
                header: 'Crédito',
                cell: ({ row }) => <Money amount={row.original.credited_value} />,
            },
        ],
        [],
    );

    return (
        <AuthenticatedLayout title={`Factura ${invoice.number ?? invoice.id}`}>
            <Head title={`Factura ${invoice.number ?? invoice.id}`} />

            <PageHeader
                title={invoice.number ?? `Factura #${invoice.id}`}
                subtitle={
                    invoice.status === 'void'
                        ? 'Anulada'
                        : invoice.created_at
                          ? new Date(invoice.created_at).toLocaleString('es-DO')
                          : undefined
                }
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={route('pos.index')}
                            className="inline-flex items-center gap-1.5 rounded-md bg-[#B8E34B] px-3 py-2 text-sm font-semibold text-[#111315] hover:opacity-90"
                        >
                            Nueva venta
                        </Link>
                        {invoice.pdf_url && (
                            <a
                                href={invoice.pdf_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-md border border-[#E3E5E0] bg-white px-3 py-2 text-sm font-medium hover:bg-[#F5F6F3]"
                            >
                                <FileText className="h-4 w-4" />
                                PDF
                            </a>
                        )}
                        {canVoid && (
                            <button
                                type="button"
                                onClick={voidInvoice}
                                className="rounded-md border border-[#DC4444]/40 px-3 py-2 text-sm font-medium text-[#DC4444] hover:bg-[#DC4444]/5"
                            >
                                Anular
                            </button>
                        )}
                        <Link
                            href="/invoices"
                            className="rounded-md border border-[#E3E5E0] bg-white px-3 py-2 text-sm font-medium hover:bg-[#F5F6F3]"
                        >
                            Volver
                        </Link>
                    </div>
                }
            />

            <div className="mb-5 grid gap-4 sm:grid-cols-3">
                <div className="unitra-card p-4">
                    <p className="text-xs uppercase tracking-wide text-[#6B7069]">
                        Subtotal
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold">
                        <Money amount={invoice.subtotal} />
                    </p>
                </div>
                <div className="unitra-card p-4">
                    <p className="text-xs uppercase tracking-wide text-[#6B7069]">
                        Trade-In
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold">
                        <Money amount={invoice.trade_in_total ?? 0} />
                    </p>
                </div>
                <div className="unitra-card p-4">
                    <p className="text-xs uppercase tracking-wide text-[#6B7069]">
                        A pagar
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold">
                        <Money amount={invoice.amount_due} />
                    </p>
                </div>
            </div>

            <h2 className="mb-2 font-display text-lg font-semibold uppercase tracking-wide">
                Ítems
            </h2>
            <DataTable
                columns={itemColumns}
                data={items}
                empty="Sin ítems."
                searchPlaceholder="Producto o IMEI…"
                initialPageSize={25}
                showPagination={items.length > 25}
            />

            {tradeIns.length > 0 && (
                <>
                    <h2 className="mb-2 mt-6 font-display text-lg font-semibold uppercase tracking-wide">
                        Trade-Ins
                    </h2>
                    <DataTable
                        columns={tradeInColumns}
                        data={tradeIns}
                        searchPlaceholder="Equipo o IMEI…"
                        initialPageSize={25}
                        showPagination={tradeIns.length > 25}
                    />
                </>
            )}
        </AuthenticatedLayout>
    );
}
