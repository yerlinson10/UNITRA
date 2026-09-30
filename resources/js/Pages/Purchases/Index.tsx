import DataTable from '@/Components/DataTable';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Paginated, Purchase } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';

type Props = PageProps<{
    purchases?: Paginated<Purchase>;
}>;

export default function PurchasesIndex({ purchases }: Props) {
    const rows = purchases?.data ?? [];

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

            <DataTable isEmpty={rows.length === 0} empty="No hay compras registradas.">
                <table className="unitra-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Vendedor</th>
                            <th>Documento</th>
                            <th>Total</th>
                            <th>Fecha</th>
                            <th className="text-right">Ver</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((purchase) => (
                            <tr key={purchase.id}>
                                <td className="font-medium">#{purchase.id}</td>
                                <td>{purchase.seller_name}</td>
                                <td>{purchase.seller_document ?? '—'}</td>
                                <td>
                                    <Money amount={purchase.total_cost} />
                                </td>
                                <td className="text-[#6B7069]">
                                    {purchase.created_at
                                        ? new Date(purchase.created_at).toLocaleString('es-DO')
                                        : '—'}
                                </td>
                                <td className="text-right">
                                    <Link
                                        href={`/purchases/${purchase.id}`}
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
