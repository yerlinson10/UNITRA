import DataTable from '@/Components/DataTable';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Purchase } from '@/types';
import { Head, Link } from '@inertiajs/react';

type Props = PageProps<{
    purchase: Purchase;
}>;

export default function PurchasesShow({ purchase }: Props) {
    const lines = purchase.lines ?? [];

    return (
        <AuthenticatedLayout title={`Compra #${purchase.id}`}>
            <Head title={`Compra #${purchase.id}`} />

            <PageHeader
                title={`Compra #${purchase.id}`}
                subtitle={purchase.created_at
                    ? new Date(purchase.created_at).toLocaleString('es-DO')
                    : undefined}
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
                    <p className="text-xs uppercase tracking-wide text-[#6B7069]">Vendedor</p>
                    <p className="mt-1 font-medium">{purchase.seller_name}</p>
                </div>
                <div className="unitra-card p-4">
                    <p className="text-xs uppercase tracking-wide text-[#6B7069]">Documento</p>
                    <p className="mt-1">{purchase.seller_document ?? '—'}</p>
                </div>
                <div className="unitra-card p-4">
                    <p className="text-xs uppercase tracking-wide text-[#6B7069]">Total</p>
                    <p className="mt-1 font-display text-2xl font-semibold">
                        <Money amount={purchase.total_cost} />
                    </p>
                </div>
            </div>

            {purchase.notes && (
                <p className="mb-4 text-sm text-[#6B7069]">Notas: {purchase.notes}</p>
            )}

            <DataTable isEmpty={lines.length === 0} empty="Sin líneas.">
                <table className="unitra-table">
                    <thead>
                        <tr>
                            <th>Marca</th>
                            <th>IMEI</th>
                            <th>Costo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lines.map((line, i) => (
                            <tr key={line.id ?? i}>
                                <td>
                                    {line.product
                                        ? [line.product.brand, line.product.model]
                                              .filter(Boolean)
                                              .join(' · ')
                                        : `Producto #${line.product_id}`}
                                </td>
                                <td className="font-mono text-xs">{line.imei}</td>
                                <td>
                                    <Money amount={line.cost} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </DataTable>
        </AuthenticatedLayout>
    );
}
