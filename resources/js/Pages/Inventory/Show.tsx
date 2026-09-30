import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import StatusBadge from '@/Components/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { InventoryItem, InventoryStatus, PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';

type Props = PageProps<{
    item: InventoryItem;
    canViewCosts?: boolean;
}>;

export default function InventoryShow({ item, canViewCosts = false }: Props) {
    const product = item.product;
    const label = product
        ? [product.brand, product.model, product.storage, product.color]
              .filter(Boolean)
              .join(' · ')
        : `Producto #${item.product_id}`;

    return (
        <AuthenticatedLayout title="Detalle de producto">
            <Head title={`IMEI ${item.imei}`} />

            <PageHeader
                title="Producto"
                subtitle={item.imei}
                actions={
                    <Link
                        href="/inventory"
                        className="rounded-md border border-[#E3E5E0] bg-white px-3 py-2 text-sm font-medium hover:bg-[#F5F6F3]"
                    >
                        Volver a productos
                    </Link>
                }
            />

            <div className="unitra-card max-w-3xl p-5">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                    <StatusBadge status={item.status as InventoryStatus} />
                    <span className="font-mono text-sm text-[#6B7069]">{item.imei}</span>
                </div>

                <dl className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <dt className="text-xs uppercase tracking-wide text-[#6B7069]">
                            Producto
                        </dt>
                        <dd className="mt-1 font-medium text-[#252925]">{label}</dd>
                    </div>
                    <div>
                        <dt className="text-xs uppercase tracking-wide text-[#6B7069]">
                            Condición
                        </dt>
                        <dd className="mt-1">{item.condition ?? '—'}</dd>
                    </div>
                    <div>
                        <dt className="text-xs uppercase tracking-wide text-[#6B7069]">
                            Precio mínimo
                        </dt>
                        <dd className="mt-1">
                            <Money amount={item.min_price} />
                        </dd>
                    </div>
                    {canViewCosts && (
                        <div>
                            <dt className="text-xs uppercase tracking-wide text-[#6B7069]">
                                Costo
                            </dt>
                            <dd className="mt-1">
                                <Money amount={item.cost} />
                            </dd>
                        </div>
                    )}
                    <div className="sm:col-span-2">
                        <dt className="text-xs uppercase tracking-wide text-[#6B7069]">
                            Notas
                        </dt>
                        <dd className="mt-1 text-sm text-[#252925]">
                            {item.notes ?? '—'}
                        </dd>
                    </div>
                </dl>
            </div>
        </AuthenticatedLayout>
    );
}
