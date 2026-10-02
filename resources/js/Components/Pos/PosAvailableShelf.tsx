import Money from '@/Components/Money';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PosAvailableItem, productLabel } from './types';

type AvailableMeta = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    has_more: boolean;
};

type Props = {
    cartIds: Set<number>;
    onAdd: (item: PosAvailableItem) => void;
    canViewCosts: boolean;
};

export default function PosAvailableShelf({
    cartIds,
    onAdd,
    canViewCosts,
}: Props) {
    const [items, setItems] = useState<PosAvailableItem[]>([]);
    const [meta, setMeta] = useState<AvailableMeta | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const loadingRef = useRef(false);
    const pageRef = useRef(0);
    const hasMoreRef = useRef(true);

    const loadPage = useCallback(async (page: number, replace = false) => {
        if (loadingRef.current) {
            return;
        }

        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/pos/available?page=${page}`, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (!res.ok) {
                throw new Error('No se pudo cargar el inventario.');
            }

            const payload = (await res.json()) as {
                data: PosAvailableItem[];
                meta: AvailableMeta;
            };

            setMeta(payload.meta);
            hasMoreRef.current = payload.meta.has_more;
            pageRef.current = payload.meta.current_page;
            setItems((prev) => {
                if (replace) {
                    return payload.data;
                }

                const seen = new Set(prev.map((item) => item.id));
                const next = payload.data.filter((item) => !seen.has(item.id));

                return [...prev, ...next];
            });
        } catch {
            setError('No se pudo cargar el inventario disponible.');
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadPage(1, true);
    }, [loadPage]);

    useEffect(() => {
        const node = sentinelRef.current;
        if (!node) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (!entry?.isIntersecting) {
                    return;
                }
                if (!hasMoreRef.current || loadingRef.current) {
                    return;
                }
                void loadPage(pageRef.current + 1);
            },
            { root: node.parentElement, rootMargin: '120px', threshold: 0 },
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, [loadPage, items.length]);

    const visible = items.filter((item) => !cartIds.has(item.id));

    return (
        <div className="unitra-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#E3E5E0] px-4 py-3">
                <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
                    Disponibles
                </h2>
                <span className="text-xs text-[#6B7069]">
                    {meta ? `${meta.total} en stock` : 'Cargando…'}
                </span>
            </div>

            {error && (
                <p className="px-4 py-3 text-sm text-[#DC4444]">{error}</p>
            )}

            {!error && visible.length === 0 && !loading ? (
                <p className="px-4 py-8 text-center text-sm text-[#6B7069]">
                    No hay unidades disponibles para agregar.
                </p>
            ) : (
                <div className="grid max-h-72 gap-2 overflow-y-auto p-3 sm:grid-cols-2">
                    {visible.map((item) => {
                        const minPrice = item.min_sale_price ?? item.min_price;

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => onAdd(item)}
                                className="rounded-md border border-[#E3E5E0] bg-white px-3 py-2.5 text-left transition hover:border-[#B8E34B] hover:bg-[#FAFBF8] active:scale-[0.99]"
                            >
                                <p className="truncate text-sm font-medium text-[#252925]">
                                    {productLabel(item.product)}
                                </p>
                                <p className="mt-0.5 font-mono text-xs text-[#6B7069]">
                                    {item.imei}
                                </p>
                                <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
                                    <span className="text-[#6B7069]">
                                        {item.condition_grade ?? item.condition ?? '—'}
                                    </span>
                                    <span className="font-medium text-[#111315]">
                                        {minPrice != null ? (
                                            <Money amount={Number(minPrice)} />
                                        ) : (
                                            'Sin mín.'
                                        )}
                                    </span>
                                </div>
                                {canViewCosts && item.cost != null && (
                                    <p className="mt-0.5 text-[11px] text-[#6B7069]">
                                        Costo <Money amount={Number(item.cost)} />
                                    </p>
                                )}
                            </button>
                        );
                    })}

                    <div ref={sentinelRef} className="col-span-full h-4" />

                    {loading && (
                        <p className="col-span-full py-2 text-center text-xs text-[#6B7069]">
                            Cargando más…
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
