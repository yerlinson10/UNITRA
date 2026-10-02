import PageHeader from '@/Components/PageHeader';
import PosCart from '@/Components/Pos/PosCart';
import PosCashGate from '@/Components/Pos/PosCashGate';
import PosCheckout from '@/Components/Pos/PosCheckout';
import PosSearchBar from '@/Components/Pos/PosSearchBar';
import PosTradeInModal from '@/Components/Pos/PosTradeInModal';
import {
    PosCartItem,
    PosLookupItem,
    PosTradeInForm,
    emptyTradeIn,
    isBelowMinPrice,
    lookupToCartItem,
} from '@/Components/Pos/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Product } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import { FormEventHandler, useEffect, useMemo, useRef, useState } from 'react';

type Props = PageProps<{
    products?: Product[];
    canViewCosts?: boolean;
    cashSessionOpen?: boolean;
}>;

export default function PosIndex({
    products = [],
    canViewCosts = false,
    cashSessionOpen = false,
}: Props) {
    const { flash } = usePage<PageProps>().props;
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<PosLookupItem[]>([]);
    const [searchOpen, setSearchOpen] = useState(false);
    const [cart, setCart] = useState<PosCartItem[]>([]);
    const [tradeIns, setTradeIns] = useState<PosTradeInForm[]>([]);
    const [draft, setDraft] = useState<PosTradeInForm | null>(null);
    const [tradeInOpen, setTradeInOpen] = useState(false);
    const [lookupError, setLookupError] = useState<string | null>(null);
    const [lookingUp, setLookingUp] = useState(false);
    const [amountPaid, setAmountPaid] = useState('');
    const [localToast, setLocalToast] = useState<string | null>(null);
    const debounceRef = useRef<number | null>(null);
    const skipDebounceRef = useRef(false);
    const blurCloseRef = useRef<number | null>(null);

    const form = useForm({
        customer_name: '',
        customer_phone: '',
        payment_method: 'cash',
        amount_paid: null as number | null,
        items: [] as Array<{ inventory_item_id: number; sale_price: number }>,
        trade_ins: [] as Array<Record<string, string | number | null>>,
    });

    const cartIds = useMemo(
        () => new Set(cart.map((item) => item.inventory_item_id)),
        [cart],
    );

    const subtotal = useMemo(
        () => cart.reduce((sum, item) => sum + (Number.parseFloat(item.sale_price) || 0), 0),
        [cart],
    );
    const tradeInCredit = useMemo(
        () =>
            tradeIns.reduce(
                (sum, t) => sum + (Number.parseFloat(t.credited_value) || 0),
                0,
            ),
        [tradeIns],
    );
    const amountDue = Math.max(0, subtotal - tradeInCredit);
    const paidValue = Number.parseFloat(amountPaid) || 0;
    const change =
        form.data.payment_method === 'cash' && paidValue > amountDue
            ? paidValue - amountDue
            : 0;

    const hasInvalidPrices = cart.some((item) => isBelowMinPrice(item));
    const cashUnderpaid =
        form.data.payment_method === 'cash' &&
        amountPaid !== '' &&
        paidValue < amountDue;

    const showToast = (message: string) => {
        setLocalToast(message);
        window.setTimeout(() => setLocalToast(null), 2500);
    };

    const addCartItem = (item: PosCartItem, feedback?: string) => {
        if (cartIds.has(item.inventory_item_id)) {
            setLookupError('Esta unidad ya está en la venta.');
            return;
        }

        setCart((prev) => [...prev, item]);
        setSearchQuery('');
        setSearchResults([]);
        setSearchOpen(false);
        setLookupError(null);
        if (feedback) {
            showToast(feedback);
        }
    };

    const addFromLookup = (item: PosLookupItem) => {
        addCartItem(lookupToCartItem(item), 'Agregado');
    };

    const runLookup = async (rawQuery: string, { autoAddExact = false } = {}) => {
        const q = rawQuery.trim();

        setLookingUp(true);
        setLookupError(null);

        try {
            const url = q
                ? `/pos/lookup?q=${encodeURIComponent(q)}`
                : '/pos/lookup';
            const res = await fetch(url, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            const payload = await res.json();

            if (!res.ok) {
                setSearchResults([]);
                setLookupError(payload.message ?? 'Sin resultados disponibles.');
                return;
            }

            // Auto-add only on explicit submit (scanner Enter), never while typing.
            if (autoAddExact && payload.exact && payload.item) {
                addFromLookup(payload.item as PosLookupItem);
                return;
            }

            setSearchResults((payload.results ?? []) as PosLookupItem[]);
            setLookupError(null);
        } catch {
            setLookupError('No se pudo buscar.');
            setSearchResults([]);
        } finally {
            setLookingUp(false);
        }
    };

    useEffect(() => {
        if (!searchOpen) {
            return;
        }

        if (skipDebounceRef.current) {
            skipDebounceRef.current = false;
            return;
        }

        if (debounceRef.current) {
            window.clearTimeout(debounceRef.current);
        }

        const q = searchQuery.trim();
        debounceRef.current = window.setTimeout(() => {
            void runLookup(q);
        }, q.length === 0 ? 0 : 150);

        return () => {
            if (debounceRef.current) {
                window.clearTimeout(debounceRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, searchOpen]);

    const searchUnits: FormEventHandler = (e) => {
        e.preventDefault();
        skipDebounceRef.current = true;
        if (debounceRef.current) {
            window.clearTimeout(debounceRef.current);
        }
        void runLookup(searchQuery, { autoAddExact: true });
    };

    const openSearch = () => {
        if (blurCloseRef.current) {
            window.clearTimeout(blurCloseRef.current);
            blurCloseRef.current = null;
        }
        setSearchOpen(true);
    };

    const closeSearch = () => {
        if (blurCloseRef.current) {
            window.clearTimeout(blurCloseRef.current);
        }
        // Delay so clicking a result still registers before the panel closes.
        blurCloseRef.current = window.setTimeout(() => {
            setSearchOpen(false);
            setLookupError(null);
            blurCloseRef.current = null;
        }, 150);
    };

    const submitSale: FormEventHandler = (e) => {
        e.preventDefault();
        if (cart.length === 0 || !cashSessionOpen || hasInvalidPrices || cashUnderpaid) {
            return;
        }

        const resolvedPaid =
            form.data.payment_method === 'cash'
                ? amountPaid !== ''
                    ? paidValue
                    : amountDue
                : amountDue;

        form.transform(() => ({
            customer_name: form.data.customer_name || null,
            customer_phone: form.data.customer_phone || null,
            payment_method: form.data.payment_method,
            amount_paid: resolvedPaid,
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
                min_sale_price: t.min_sale_price
                    ? Number.parseFloat(t.min_sale_price)
                    : null,
                regular_sale_price: t.regular_sale_price
                    ? Number.parseFloat(t.regular_sale_price)
                    : null,
                notes: t.notes || null,
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
                setAmountPaid('');
            },
            onFinish: () => form.transform((data) => data),
        });
    };

    const formErrors = form.errors as Record<string, string>;

    return (
        <AuthenticatedLayout title="POS">
            <Head title="POS" />

            <PageHeader
                title="POS"
                subtitle="Escaneo IMEI · búsqueda · Trade-In"
            />

            <div className="mb-4 space-y-3">
                <PosCashGate open={cashSessionOpen} />
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
                <div className="space-y-4">
                    <PosSearchBar
                        query={searchQuery}
                        onQueryChange={setSearchQuery}
                        onSubmit={searchUnits}
                        onFocus={openSearch}
                        onBlur={closeSearch}
                        open={searchOpen}
                        lookingUp={lookingUp}
                        error={lookupError}
                        results={searchResults.filter(
                            (item) => !cartIds.has(item.id),
                        )}
                        onAdd={addFromLookup}
                        canViewCosts={canViewCosts}
                    />

                    <PosCart
                        cart={cart}
                        canViewCosts={canViewCosts}
                        onPriceChange={(id, value) =>
                            setCart((prev) =>
                                prev.map((item) =>
                                    item.inventory_item_id === id
                                        ? { ...item, sale_price: value }
                                        : item,
                                ),
                            )
                        }
                        onRemove={(id) =>
                            setCart((prev) =>
                                prev.filter((item) => item.inventory_item_id !== id),
                            )
                        }
                    />
                </div>

                <PosCheckout
                    customerName={form.data.customer_name}
                    customerPhone={form.data.customer_phone}
                    onCustomerNameChange={(value) => form.setData('customer_name', value)}
                    onCustomerPhoneChange={(value) => form.setData('customer_phone', value)}
                    paymentMethod={form.data.payment_method}
                    onPaymentMethodChange={(value) => {
                        form.setData('payment_method', value);
                        if (value !== 'cash') {
                            setAmountPaid('');
                        }
                    }}
                    amountPaid={amountPaid}
                    onAmountPaidChange={setAmountPaid}
                    tradeIns={tradeIns}
                    onRemoveTradeIn={(index) =>
                        setTradeIns((prev) => prev.filter((_, i) => i !== index))
                    }
                    onOpenTradeIn={() => {
                        setDraft(emptyTradeIn());
                        setTradeInOpen(true);
                    }}
                    subtotal={subtotal}
                    tradeInCredit={tradeInCredit}
                    amountDue={amountDue}
                    change={change}
                    processing={form.processing}
                    disabled={
                        !cashSessionOpen ||
                        cart.length === 0 ||
                        hasInvalidPrices ||
                        cashUnderpaid
                    }
                    cashSessionOpen={cashSessionOpen}
                    errors={formErrors}
                    flashError={flash?.error}
                    onSubmit={submitSale}
                />
            </div>

            <PosTradeInModal
                show={tradeInOpen}
                draft={draft}
                products={products}
                onClose={() => {
                    setTradeInOpen(false);
                    setDraft(null);
                }}
                onChange={setDraft}
                onApply={() => {
                    if (!draft) {
                        return;
                    }
                    setTradeIns((prev) => [...prev, draft]);
                    setTradeInOpen(false);
                    setDraft(null);
                }}
            />

            {localToast && (
                <div className="pointer-events-none fixed bottom-4 right-4 z-50">
                    <div className="flex items-center gap-2 rounded-lg border border-[#22A06B]/30 bg-white px-4 py-3 text-sm font-medium shadow-lg">
                        <CheckCircle2 className="h-4 w-4 text-[#22A06B]" />
                        {localToast}
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
