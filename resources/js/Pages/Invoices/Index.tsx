import DataTable from '@/Components/DataTable';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Invoice, PageProps, Paginated } from '@/types';
import { Head, Link } from '@inertiajs/react';

type Props = PageProps<{
    invoices?: Paginated<Invoice>;
}>;

const STATUS_LABEL: Record<string, string> = {
    open: 'Abierta',
    paid: 'Pagada',
    void: 'Anulada',
};

export default function InvoicesIndex({ invoices }: Props) {
    const rows = invoices?.data ?? [];

    return (
        <AuthenticatedLayout title="Ventas">
            <Head title="Ventas" />

            <PageHeader title="Ventas" subtitle="Facturas y comprobantes" />

            <DataTable isEmpty={rows.length === 0} empty="No hay ventas registradas.">
                <table className="unitra-table">
                    <thead>
                        <tr>
                            <th>Factura</th>
                            <th>Estado</th>
                            <th>Pago</th>
                            <th>Total</th>
                            <th>Fecha</th>
                            <th className="text-right">Ver</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((invoice) => (
                            <tr key={invoice.id}>
                                <td className="font-medium">
                                    {invoice.number ?? `#${invoice.id}`}
                                </td>
                                <td>
                                    <span
                                        className={`text-xs font-semibold ${
                                            invoice.status === 'void'
                                                ? 'text-[#DC4444]'
                                                : invoice.status === 'paid'
                                                  ? 'text-[#22A06B]'
                                                  : 'text-[#D97706]'
                                        }`}
                                    >
                                        {STATUS_LABEL[invoice.status] ?? invoice.status}
                                    </span>
                                </td>
                                <td className="capitalize">
                                    {invoice.payment_method ?? '—'}
                                </td>
                                <td>
                                    <Money amount={invoice.amount_due} />
                                </td>
                                <td className="text-[#6B7069]">
                                    {invoice.created_at
                                        ? new Date(invoice.created_at).toLocaleString('es-DO')
                                        : '—'}
                                </td>
                                <td className="text-right">
                                    <Link
                                        href={`/invoices/${invoice.id}`}
                                        className="text-sm font-medium underline-offset-2 hover:underline"
                                    >
                                        Detalle
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </DataTable>
        </AuthenticatedLayout>
    );
}
