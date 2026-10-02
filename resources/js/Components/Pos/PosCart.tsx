import DataTable from '@/Components/DataTable';
import Money from '@/Components/Money';
import NumberInput from '@/Components/NumberInput';
import { ColumnDef } from '@tanstack/react-table';
import { Info, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import PosItemDetailModal from './PosItemDetailModal';
import {
    PosCartItem,
    PosDeviceDetails,
    cartPriceShortcut,
    cartToDeviceDetails,
    isBelowMinPrice,
} from './types';

type Props = {
    cart: PosCartItem[];
    onPriceChange: (inventoryItemId: number, value: string) => void;
    onRemove: (inventoryItemId: number) => void;
    canViewCosts: boolean;
};

export default function PosCart({
    cart,
    onPriceChange,
    onRemove,
    canViewCosts,
}: Props) {
    const [detail, setDetail] = useState<PosDeviceDetails | null>(null);

    const columns = useMemo<ColumnDef<PosCartItem>[]>(
        () => [
            {
                id: 'product',
                header: 'Unidad',
                accessorFn: (row) => `${row.product_label} ${row.imei}`,
                cell: ({ row }) => {
                    const item = row.original;
                    const belowMin = isBelowMinPrice(item);
                    const price = Number.parseFloat(item.sale_price) || 0;
                    const margin =
                        canViewCosts && item.cost != null
                            ? price - item.cost
                            : null;

                    return (
                        <div className="min-w-0">
                            <p className="font-medium text-[#252925]">
                                {item.product_label}
                            </p>
                            <p className="font-mono text-xs text-[#6B7069]">
                                {item.imei}
                            </p>
                            {item.condition_grade && (
                                <p className="mt-0.5 text-xs text-[#6B7069]">
                                    {item.condition_grade}
                                </p>
                            )}
                            <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[#6B7069]">
                                {item.regular_sale_price != null && (
                                    <span>
                                        Regular{' '}
                                        <Money amount={item.regular_sale_price} />
                                    </span>
                                )}
                                {item.min_sale_price != null && (
                                    <span>
                                        Mín. <Money amount={item.min_sale_price} />
                                    </span>
                                )}
                            </div>
                            {canViewCosts && item.cost != null && (
                                <p className="mt-0.5 text-[11px] text-[#6B7069]">
                                    Costo <Money amount={item.cost} />
                                    {margin != null && (
                                        <>
                                            {' '}
                                            · Margen <Money amount={margin} />
                                        </>
                                    )}
                                </p>
                            )}
                            {belowMin && (
                                <p className="mt-1 text-xs font-medium text-[#DC4444]">
                                    Precio bajo el mínimo
                                </p>
                            )}
                        </div>
                    );
                },
            },
            {
                id: 'price',
                header: 'Precio',
                cell: ({ row }) => {
                    const item = row.original;
                    const belowMin = isBelowMinPrice(item);
                    const shortcut = cartPriceShortcut(item);

                    return (
                        <div className="w-36 space-y-1.5">
                            <NumberInput
                                className={`block w-full ${
                                    belowMin
                                        ? 'border-[#DC4444] focus:border-[#DC4444] focus:ring-[#DC4444]'
                                        : ''
                                }`}
                                value={item.sale_price}
                                onValueChange={(value) =>
                                    onPriceChange(item.inventory_item_id, value)
                                }
                                aria-label={`Precio ${item.imei}`}
                            />
                            {shortcut === 'min' && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        onPriceChange(
                                            item.inventory_item_id,
                                            String(item.min_sale_price),
                                        )
                                    }
                                    className="min-h-9 w-full rounded-md border border-[#E3E5E0] bg-white px-2 text-xs font-medium text-[#252925] hover:bg-[#F5F6F3] active:scale-[0.97]"
                                >
                                    Usar mínimo
                                </button>
                            )}
                            {shortcut === 'regular' && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        onPriceChange(
                                            item.inventory_item_id,
                                            String(item.regular_sale_price),
                                        )
                                    }
                                    className="min-h-9 w-full rounded-md border border-[#E3E5E0] bg-white px-2 text-xs font-medium text-[#252925] hover:bg-[#F5F6F3] active:scale-[0.97]"
                                >
                                    Usar regular
                                </button>
                            )}
                        </div>
                    );
                },
            },
            {
                id: 'actions',
                header: '',
                meta: { cellClassName: 'text-right' },
                cell: ({ row }) => (
                    <div className="flex items-center justify-end gap-1.5">
                        <button
                            type="button"
                            onClick={() =>
                                setDetail(cartToDeviceDetails(row.original))
                            }
                            className="rounded-md border border-[#E3E5E0] p-2 text-[#252925] hover:bg-[#F5F6F3]"
                            aria-label="Ver detalle"
                            title="Ver detalle"
                        >
                            <Info className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => onRemove(row.original.inventory_item_id)}
                            className="rounded-md border border-[#E3E5E0] p-2 text-[#DC4444] hover:bg-[#DC4444]/5"
                            aria-label="Quitar"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ),
            },
        ],
        [canViewCosts, onPriceChange, onRemove],
    );

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
                <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
                    Venta
                </h2>
                <span className="text-xs text-[#6B7069]">
                    {cart.length} ítem(s)
                </span>
            </div>

            <DataTable
                columns={columns}
                data={cart}
                empty="Busca o escanea un IMEI para agregar a la venta."
                searchPlaceholder="Buscar en la venta…"
                showSearch={cart.length > 3}
                showPagination={false}
                getRowId={(row) => String(row.inventory_item_id)}
            />

            <PosItemDetailModal
                show={detail !== null}
                device={detail}
                canViewCosts={canViewCosts}
                onClose={() => setDetail(null)}
            />
        </div>
    );
}
