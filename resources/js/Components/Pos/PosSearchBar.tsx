import InputLabel from '@/Components/InputLabel';
import Money from '@/Components/Money';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Search } from 'lucide-react';
import { FormEventHandler } from 'react';
import { PosLookupItem, productLabel } from './types';

type Props = {
    query: string;
    onQueryChange: (value: string) => void;
    onSubmit: FormEventHandler;
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
    lookingUp,
    error,
    results,
    onAdd,
    canViewCosts,
}: Props) {
    return (
        <form onSubmit={onSubmit} className="unitra-card p-4">
            <InputLabel htmlFor="pos-search" value="Buscar unidad" />
            <div className="mt-2 flex gap-2">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7069]" />
                    <TextInput
                        id="pos-search"
                        className="block w-full pl-9 font-mono text-sm"
                        value={query}
                        onChange={(e) => onQueryChange(e.target.value)}
                        placeholder="IMEI exacto o marca / modelo…"
                        autoFocus
                        autoComplete="off"
                    />
                </div>
                <PrimaryButton type="submit" disabled={lookingUp || !query.trim()}>
                    {lookingUp ? 'Buscando…' : 'Buscar'}
                </PrimaryButton>
            </div>

            {error && <p className="mt-2 text-sm text-[#DC4444]">{error}</p>}

            {results.length > 0 && (
                <div className="mt-3 divide-y divide-[#E3E5E0] rounded-md border border-[#E3E5E0]">
                    {results.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => onAdd(item)}
                            className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-[#F5F6F3] active:scale-[0.99]"
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
                                        <Money amount={Number(item.min_sale_price)} />
                                    </span>
                                )}
                                {canViewCosts && item.cost != null && (
                                    <span className="block text-[11px] text-[#6B7069]">
                                        Costo <Money amount={Number(item.cost)} />
                                    </span>
                                )}
                                <span className="mt-0.5 block text-xs font-semibold text-[#111315]">
                                    Agregar
                                </span>
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </form>
    );
}
