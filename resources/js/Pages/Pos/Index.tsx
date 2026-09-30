import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import Modal from '@/Components/Modal';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Product } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeftRight, Plus, Search, Trash2 } from 'lucide-react';
import { FormEventHandler, useMemo, useState } from 'react';

type CartItem = {
    inventory_item_id: number;
    imei: string;
    product_label: string;
    sale_price: string;
};

type TradeInForm = {
    product_id: string;
    imei: string;
    serial: string;
    condition_grade: string;
    battery_health: string;
    credited_value: string;
    seller_name: string;
    seller_id_type: string;
    seller_id_number: string;
    seller_phone: string;
};

type LookupItem = {
    id: number;
    imei: string;
    min_sale_price?: number | null;
    cost?: number | null;
    condition_grade?: string | null;
    product?: { id?: number; name?: string | null; brand?: string; model?: string };
};

type Props = PageProps<{
    products?: Product[];
    Marcas?: Product[];
}>;

const emptyTradeIn = (): TradeInForm => ({
    product_id: '',
    imei: '',
    serial: '',
    condition_grade: '',
    battery_health: '',
    credited_value: '',
    seller_name: '',
    seller_id_type: 'cedula',
    seller_id_number: '',
    seller_phone: '',
});

export default function PosIndex({ products = [], Marcas }: Props) {
    const MarcaOptions = Marcas?.length ? Marcas : products;
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<LookupItem[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [tradeIns, setTradeIns] = useState<TradeInForm[]>([]);
    const [draft, setDraft] = useState<TradeInForm | null>(null);
    const [tradeInOpen, setTradeInOpen] = useState(false);
    const [lookupError, setLookupError] = useState<string | null>(null);
    const [lookingUp, setLookingUp] = useState(false);

    const form = useForm({
        customer_name: '',
        customer_phone: '',
        payment_method: 'cash',
        items: [] as Array<{ inventory_item_id: number; sale_price: number }>,
        trade_ins: [] as Array<Record<string, string | number>>,
    });

    const subtotal = useMemo(
        () => cart.reduce((sum, item) => sum + (Number.parseFloat(item.sale_price) || 0), 0),
        [cart],
    );
    const tradeInCredit = tradeIns.reduce(
        (sum, t) => sum + (Number.parseFloat(t.credited_value) || 0),
        0,
    );
    const amountDue = Math.max(0, subtotal - tradeInCredit);

    const addToCart = (item: LookupItem) => {
        if (cart.some((c) => c.inventory_item_id === item.id)) {
            setLookupError('Esta unidad ya está en el carrito.');
            return;
        }
        setCart((prev) => [
            ...prev,
            {
                inventory_item_id: item.id,
                imei: item.imei,
                product_label: item.product?.name ?? `Unidad ${item.imei}`,
                sale_price: String(item.min_sale_price ?? ''),
            },
        ]);
        setSearchQuery('');
        setSearchResults([]);
        setLookupError(null);
    };

    const searchUnits: FormEventHandler = async (e) => {
        e.preventDefault();
        const q = searchQuery.trim();
        if (!q) return;

        setLookingUp(true);
        setLookupError(null);
        setSearchResults([]);

        try {
            const res = await fetch(`/pos/lookup?q=${encodeURIComponent(q)}`, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            const payload = await res.json();

            if (!res.ok) {
                setLookupError(payload.message ?? 'Sin resultados disponibles.');
                return;
            }

            if (payload.exact && payload.item) {
                addToCart(payload.item as LookupItem);
                return;
            }

            const results = (payload.results ?? []) as LookupItem[];
            if (results.length === 1) {
                addToCart(results[0]);
                return;
            }

            setSearchResults(results);
        } catch {
            setLookupError('No se pudo buscar.');
        } finally {
            setLookingUp(false);
        }
    };

    const submitSale: FormEventHandler = (e) => {
        e.preventDefault();
        if (cart.length === 0) return;

        form.transform(() => ({
            customer_name: form.data.customer_name || null,
            customer_phone: form.data.customer_phone || null,
            payment_method: form.data.payment_method,
            items: cart.map((item) => ({
                inventory_item_id: item.inventory_item_id,
                sale_price: Number.parseFloat(item.sale_price) || 0,
            })),
            trade_ins: tradeIns.map((t) => ({
                product_id: Number(t.product_id),
                imei: t.imei,
                serial: t.serial || null,
                condition_grade: t.condition_grade || null,
                battery_health: t.battery_health ? Number(t.battery_health) : null,
                credited_value: Number.parseFloat(t.credited_value) || 0,
                seller_name: t.seller_name,
                seller_id_type: t.seller_id_type,
                seller_id_number: t.seller_id_number,
                seller_phone: t.seller_phone,
            })),
        }));

        form.post('/pos', {
            preserveScroll: true,
            onSuccess: () => {
                setCart([]);
                setTradeIns([]);
            },
            onFinish: () => form.transform((data) => data),
        });
    };

    return (
        <AuthenticatedLayout title="POS">
            <Head title="POS" />

            <PageHeader title="POS" subtitle="Búsqueda por IMEI, Marca o modelo · Trade-In" />

            <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
                <div className="space-y-4">
                    <form onSubmit={searchUnits} className="unitra-card p-4">
                        <InputLabel htmlFor="pos-search" value="Buscar producto" />
                        <div className="mt-2 flex gap-2">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7069]" />
                                <TextInput
                                    id="pos-search"
                                    className="block w-full pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="IMEI, marca, modelo, color…"
                                    autoFocus
                                />
                            </div>
                            <PrimaryButton type="submit" disabled={lookingUp}>
                                {lookingUp ? 'Buscando…' : 'Buscar'}
                            </PrimaryButton>
                        </div>
                        {lookupError && (
                            <p className="mt-2 text-sm text-[#DC4444]">{lookupError}</p>
                        )}
                        {searchResults.length > 0 && (
                            <div className="mt-3 divide-y divide-[#E3E5E0] rounded-md border border-[#E3E5E0]">
                                {searchResults.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => addToCart(item)}
                                        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-[#F5F6F3] active:scale-[0.99]"
                                    >
                                        <span>
                                            <span className="font-medium">
                                                {item.product?.name ?? 'Unidad'}
                                            </span>
                                            <span className="mt-0.5 block font-mono text-xs text-[#6B7069]">
                                                {item.imei}
                                            </span>
                                        </span>
                                        <span className="text-xs font-medium text-[#111315]">
                                            Agregar
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </form>

                    <div className="unitra-card overflow-hidden">
                        <div className="flex items-center justify-between border-b border-[#E3E5E0] px-4 py-3">
                            <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
                                Carrito
                            </h2>
                            <span className="text-xs text-[#6B7069]">{cart.length} ítem(s)</span>
                        </div>

                        {cart.length === 0 ? (
                            <p className="px-4 py-10 text-center text-sm text-[#6B7069]">
                                Busca por IMEI o nombre de Marca para agregar unidades.
                            </p>
                        ) : (
                            <div className="divide-y divide-[#E3E5E0]">
                                {cart.map((item) => (
                                    <div
                                        key={item.inventory_item_id}
                                        className="flex flex-wrap items-center gap-3 px-4 py-3"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-[#252925]">
                                                {item.product_label}
                                            </p>
                                            <p className="font-mono text-xs text-[#6B7069]">
                                                {item.imei}
                                            </p>
                                        </div>
                                        <div className="w-32">
                                            <TextInput
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="block w-full"
                                                value={item.sale_price}
                                                onChange={(e) =>
                                                    setCart((prev) =>
                                                        prev.map((c) =>
                                                            c.inventory_item_id ===
                                                            item.inventory_item_id
                                                                ? {
                                                                      ...c,
                                                                      sale_price: e.target.value,
                                                                  }
                                                                : c,
                                                        ),
                                                    )
                                                }
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setCart((prev) =>
                                                    prev.filter(
                                                        (c) =>
                                                            c.inventory_item_id !==
                                                            item.inventory_item_id,
                                                    ),
                                                )
                                            }
                                            className="rounded-md border border-[#E3E5E0] p-2 text-[#DC4444] hover:bg-[#DC4444]/5"
                                            aria-label="Quitar"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <form onSubmit={submitSale} className="unitra-card h-fit space-y-4 p-5">
                    <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
                        Cobro
                    </h2>

                    <div>
                        <InputLabel htmlFor="payment_method" value="Método de pago" />
                        <Select
                            value={form.data.payment_method}
                            onValueChange={(value) => form.setData('payment_method', value)}
                        >
                            <SelectTrigger id="payment_method" className="mt-1">
                                <SelectValue placeholder="Seleccionar…" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cash">Efectivo</SelectItem>
                                <SelectItem value="card">Tarjeta</SelectItem>
                                <SelectItem value="transfer">Transferencia</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="rounded-md border border-[#E3E5E0] bg-[#F5F6F3] p-3 space-y-3">
                        {tradeIns.map((t, idx) => (
                            <div key={`${t.imei}-${idx}`} className="rounded bg-white p-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="font-mono text-xs">{t.imei}</span>
                                    <button
                                        type="button"
                                        className="text-xs text-[#DC4444]"
                                        onClick={() =>
                                            setTradeIns((prev) => prev.filter((_, i) => i !== idx))
                                        }
                                    >
                                        Quitar
                                    </button>
                                </div>
                                <Money amount={Number(t.credited_value) || 0} />
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => {
                                setDraft(emptyTradeIn());
                                setTradeInOpen(true);
                            }}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-[#E3E5E0] bg-white px-3 py-3 text-sm font-medium text-[#252925] hover:border-[#B8E34B]"
                        >
                            <ArrowLeftRight className="h-4 w-4" />
                            Agregar Trade-In
                        </button>
                    </div>

                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-[#6B7069]">Subtotal</dt>
                            <dd>
                                <Money amount={subtotal} />
                            </dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-[#6B7069]">Trade-In</dt>
                            <dd>
                                − <Money amount={tradeInCredit} />
                            </dd>
                        </div>
                        <div className="flex justify-between border-t border-[#E3E5E0] pt-2">
                            <dt className="font-display text-xl font-semibold uppercase">
                                A pagar
                            </dt>
                            <dd className="font-display text-2xl font-semibold text-[#111315]">
                                <Money amount={amountDue} />
                            </dd>
                        </div>
                    </dl>

                    <InputError message={form.errors.items as unknown as string} />
                    <InputError message={form.errors.payment_method} />

                    <PrimaryButton
                        type="submit"
                        className="w-full justify-center py-3"
                        disabled={form.processing || cart.length === 0}
                    >
                        <Plus className="mr-1.5 h-4 w-4" />
                        Completar venta
                    </PrimaryButton>
                </form>
            </div>

            <Modal show={tradeInOpen} onClose={() => setTradeInOpen(false)} maxWidth="2xl">
                {draft && (
                    <div className="p-5">
                        <h3 className="font-display text-2xl font-semibold uppercase tracking-wide text-[#111315]">
                            Trade-In
                        </h3>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <InputLabel value="Marca" />
                                <Select
                                    value={draft.product_id || undefined}
                                    onValueChange={(value) =>
                                        setDraft({ ...draft, product_id: value })
                                    }
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Seleccionar…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MarcaOptions.map((p) => (
                                            <SelectItem key={p.id} value={String(p.id)}>
                                                {p.name ??
                                                    [p.brand, p.model, p.storage, p.color]
                                                        .filter(Boolean)
                                                        .join(' · ')}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <InputLabel value="IMEI" />
                                <TextInput
                                    className="mt-1 block w-full font-mono"
                                    value={draft.imei}
                                    onChange={(e) => setDraft({ ...draft, imei: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <InputLabel value="Condición" />
                                <TextInput
                                    className="mt-1 block w-full"
                                    value={draft.condition_grade}
                                    onChange={(e) =>
                                        setDraft({ ...draft, condition_grade: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <InputLabel value="Valor acreditado" />
                                <TextInput
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="mt-1 block w-full"
                                    value={draft.credited_value}
                                    onChange={(e) =>
                                        setDraft({ ...draft, credited_value: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <InputLabel value="Nombre vendedor" />
                                <TextInput
                                    className="mt-1 block w-full"
                                    value={draft.seller_name}
                                    onChange={(e) =>
                                        setDraft({ ...draft, seller_name: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <InputLabel value="Tipo ID" />
                                <Select
                                    value={draft.seller_id_type}
                                    onValueChange={(value) =>
                                        setDraft({ ...draft, seller_id_type: value })
                                    }
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Seleccionar…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cedula">Cédula</SelectItem>
                                        <SelectItem value="pasaporte">Pasaporte</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <InputLabel value="Número ID" />
                                <TextInput
                                    className="mt-1 block w-full"
                                    value={draft.seller_id_number}
                                    onChange={(e) =>
                                        setDraft({ ...draft, seller_id_number: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <InputLabel value="Teléfono" />
                                <TextInput
                                    className="mt-1 block w-full"
                                    value={draft.seller_phone}
                                    onChange={(e) =>
                                        setDraft({ ...draft, seller_phone: e.target.value })
                                    }
                                    required
                                />
                            </div>
                        </div>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setTradeInOpen(false)}
                                className="rounded-md border border-[#E3E5E0] px-3 py-2 text-sm font-medium"
                            >
                                Cancelar
                            </button>
                            <PrimaryButton
                                type="button"
                                onClick={() => {
                                    if (!draft.product_id || !draft.imei || !draft.credited_value) {
                                        return;
                                    }
                                    setTradeIns((prev) => [...prev, draft]);
                                    setTradeInOpen(false);
                                    setDraft(null);
                                }}
                            >
                                Aplicar Trade-In
                            </PrimaryButton>
                        </div>
                    </div>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}
