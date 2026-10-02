import DataTable from '@/Components/DataTable';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Invoice, PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { FileText } from 'lucide-react';

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
                    <p className="text-xs uppercase tracking-wide text-[#6B7069]">Subtotal</p>
                    <p className="mt-1 font-display text-2xl font-semibold">
                        <Money amount={invoice.subtotal} />
                    </p>
                </div>
                <div className="unitra-card p-4">
                    <p className="text-xs uppercase tracking-wide text-[#6B7069]">Trade-In</p>
                    <p className="mt-1 font-display text-2xl font-semibold">
                        <Money amount={invoice.trade_in_total ?? 0} />
                    </p>
                </div>
                <div className="unitra-card p-4">
                    <p className="text-xs uppercase tracking-wide text-[#6B7069]">A pagar</p>
                    <p className="mt-1 font-display text-2xl font-semibold">
                        <Money amount={invoice.amount_due} />
                    </p>
                </div>
            </div>

            <h2 className="mb-2 font-display text-lg font-semibold uppercase tracking-wide">
                Ítems
            </h2>
            <DataTable isEmpty={items.length === 0} empty="Sin ítems.">
                <table className="unitra-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>IMEI</th>
                            <th>Garantía</th>
                            <th>Precio</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, i) => (
                            <tr key={`${item.inventory_item_id}-${i}`}>
                                <td>
                                    {item.product_label ??
                                        item.product_name ??
                                        '—'}
                                </td>
                                <td className="font-mono text-xs">
                                    {item.imei ?? item.inventory_item?.imei ?? '—'}
                                </td>
                                <td className="text-xs">
                                    {item.warranty_expires_at
                                        ? new Date(
                                              `${item.warranty_expires_at}T12:00:00`,
                                          ).toLocaleDateString('es-DO')
                                        : item.inventory_item?.warranty_expires_at
                                          ? new Date(
                                                `${item.inventory_item.warranty_expires_at}T12:00:00`,
                                            ).toLocaleDateString('es-DO')
                                          : '—'}
                                </td>
                                <td>
                                    <Money
                                        amount={item.price ?? item.sale_price ?? null}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </DataTable>

            {tradeIns.length > 0 && (
                <>
                    <h2 className="mb-2 mt-6 font-display text-lg font-semibold uppercase tracking-wide">
                        Trade-Ins
                    </h2>
                    <DataTable>
                        <table className="unitra-table">
                            <thead>
                                <tr>
                                    <th>Equipo</th>
                                    <th>IMEI</th>
                                    <th>Condición</th>
                                    <th>Crédito</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tradeIns.map((ti, i) => (
                                    <tr key={ti.id ?? i}>
                                        <td>
                                            {ti.product_label ||
                                                [ti.brand, ti.model].filter(Boolean).join(' ') ||
                                                '—'}
                                        </td>
                                        <td className="font-mono text-xs">{ti.imei}</td>
                                        <td>{ti.condition}</td>
                                        <td>
                                            <Money amount={ti.credited_value} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </DataTable>
                </>
            )}
        </AuthenticatedLayout>
    );
}
