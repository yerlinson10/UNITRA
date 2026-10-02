import InputLabel from '@/Components/InputLabel';
import Money from '@/Components/Money';
import TextInput from '@/Components/TextInput';
import { Info, Loader2, Search } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import PosItemDetailModal from './PosItemDetailModal';
import {
    PosDeviceDetails,
    PosLookupItem,
    lookupToDeviceDetails,
    productLabel,
} from './types';

type Props = {
    query: string;
    onQueryChange: (value: string) => void;
    onSubmit: FormEventHandler;
    onFocus?: () => void;
    lookingUp: boolean;
    error: string | null;
    results: PosLookupItem[];
    onAdd: (item: PosLookupItem) => void;
    canViewCosts: boolean;
};

export default function PosSearchBar({
    query,
    onQueryChange,
    onSubmit,
    onFocus,
    lookingUp,
    error,
    results,
    onAdd,
    canViewCosts,
}: Props) {
    const [detail, setDetail] = useState<PosDeviceDetails | null>(null);

    return (
        <form onSubmit={onSubmit} className="unitra-card p-4">
            <InputLabel htmlFor="pos-search" value="Buscar unidad" />
            <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7069]" />
                <TextInput
                    id="pos-search"
                    className="block w-full pl-9 pr-10 font-mono text-sm"
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    onFocus={onFocus}
                    placeholder="Toca para ver stock o escribe IMEI / modelo…"
                    autoComplete="off"
                />
                {lookingUp && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#111315]" />
                )}
            </div>

            {lookingUp && (
                <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-[#6B7069]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Buscando…
                </p>
            )}

            {!lookingUp && error && (
                <p className="mt-2 text-sm text-[#DC4444]">{error}</p>
            )}

            {results.length > 0 && (
                <div
                    className={`mt-3 max-h-72 divide-y divide-[#E3E5E0] overflow-y-auto rounded-md border border-[#E3E5E0] transition-opacity ${
                        lookingUp ? 'opacity-50' : 'opacity-100'
                    }`}
                >
                    {results.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-stretch gap-1 px-1 py-1"
                        >
                            <button
                                type="button"
                                onClick={() => onAdd(item)}
                                disabled={lookingUp}
                                className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm hover:bg-[#F5F6F3] active:scale-[0.99] disabled:pointer-events-none"
                            >
                                <span className="min-w-0">
                                    <span className="block font-medium text-[#252925]">
                                        {productLabel(item.product)}
                                    </span>
                                    <span className="mt-0.5 flex flex-wrap gap-x-2 font-mono text-xs text-[#6B7069]">
                                        <span>{item.imei}</span>
                                        {item.condition_grade && (
                                            <span>{item.condition_grade}</span>
                                        )}
                                    </span>
                                </span>
                                <span className="shrink-0 text-right">
                                    {item.min_sale_price != null && (
                                        <span className="block text-xs font-medium text-[#111315]">
                                            <Money
                                                amount={Number(item.min_sale_price)}
                                            />
                                        </span>
                                    )}
                                    {canViewCosts && item.cost != null && (
                                        <span className="block text-[11px] text-[#6B7069]">
                                            Costo{' '}
                                            <Money amount={Number(item.cost)} />
                                        </span>
                                    )}
                                    <span className="mt-0.5 block text-xs font-semibold text-[#111315]">
                                        Agregar
                                    </span>
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setDetail(lookupToDeviceDetails(item))
                                }
                                className="shrink-0 self-center rounded-md border border-[#E3E5E0] p-2 text-[#252925] hover:bg-[#F5F6F3]"
                                aria-label={`Ver detalle ${item.imei}`}
                                title="Ver detalle"
                            >
                                <Info className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {!lookingUp && !error && query.trim() !== '' && results.length === 0 && (
                <p className="mt-2 text-sm text-[#6B7069]">Sin resultados.</p>
            )}

            <PosItemDetailModal
                show={detail !== null}
                device={detail}
                canViewCosts={canViewCosts}
                onClose={() => setDetail(null)}
            />
        </form>
    );
}
