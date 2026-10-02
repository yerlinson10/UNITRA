import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Money from '@/Components/Money';
import NumberInput from '@/Components/NumberInput';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Product } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ChevronDown, Plus, Smartphone, Trash2, UserRound } from 'lucide-react';
import { FormEventHandler, useMemo, useState } from 'react';

type Line = {
    product_id: string;
    imei: string;
    serial: string;
    condition_grade: string;
    battery_health: string;
    cost: string;
    min_sale_price: string;
    regular_sale_price: string;
    notes: string;
};

type Props = PageProps<{
    products?: Product[];
}>;

const CONDITION_GRADES = [
    'Como nuevo',
    'Grado A',
    'Grado B',
    'Grado C',
] as const;

const emptyLine = (): Line => ({
    product_id: '',
    imei: '',
    serial: '',
    condition_grade: '',
    battery_health: '',
    cost: '',
    min_sale_price: '',
    regular_sale_price: '',
    notes: '',
});

function productLabel(p: Product) {
    return (
        p.name ??
        [p.brand, p.model, p.storage, p.color].filter(Boolean).join(' · ')
    );
}

export default function PurchasesCreate({ products = [] }: Props) {
    const [purchaseNotesOpen, setPurchaseNotesOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState<Record<number, boolean>>({});

    const { data, setData, post, processing, errors, transform } = useForm({
        seller_name: '',
        seller_id_type: 'cedula',
        seller_id_number: '',
        seller_phone: '',
        notes: '',
        items: [emptyLine()] as Line[],
    });

    const updateLine = (index: number, field: keyof Line, value: string) => {
        const next = data.items.map((line, i) =>
            i === index ? { ...line, [field]: value } : line,
        );
        setData('items', next);
    };

    const addLine = () => {
        setData('items', [...data.items, emptyLine()]);
    };

    const removeLine = (index: number) => {
        if (data.items.length === 1) return;
        setData(
            'items',
            data.items.filter((_, i) => i !== index),
        );
        setDetailsOpen((prev) => {
            const next: Record<number, boolean> = {};
            Object.entries(prev).forEach(([key, open]) => {
                const i = Number(key);
                if (i < index) next[i] = open;
                if (i > index) next[i - 1] = open;
            });
            return next;
        });
    };

    const totals = useMemo(() => {
        const unitCount = data.items.length;
        const totalCost = data.items.reduce(
            (sum, line) => sum + (Number(line.cost) || 0),
            0,
        );
        const hasMinPrices = data.items.some((line) => line.min_sale_price !== '');
        const totalMinSale = data.items.reduce(
            (sum, line) => sum + (Number(line.min_sale_price) || 0),
            0,
        );
        const hasRegularPrices = data.items.some(
            (line) => line.regular_sale_price !== '',
        );
        const totalRegularSale = data.items.reduce(
            (sum, line) => sum + (Number(line.regular_sale_price) || 0),
            0,
        );
        return {
            unitCount,
            totalCost,
            hasMinPrices,
            totalMinSale,
            hasRegularPrices,
            totalRegularSale,
        };
    }, [data.items]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        transform((form) => ({
            ...form,
            items: form.items.map((line) => ({
                product_id: Number(line.product_id),
                imei: line.imei,
                serial: line.serial || null,
                condition_grade: line.condition_grade || null,
                battery_health: line.battery_health
                    ? Number(line.battery_health)
                    : null,
                cost: Number(line.cost) || 0,
                min_sale_price: line.min_sale_price
                    ? Number(line.min_sale_price)
                    : null,
                regular_sale_price: line.regular_sale_price
                    ? Number(line.regular_sale_price)
                    : null,
                notes: line.notes || null,
            })),
        }));
        post('/purchases', {
            onFinish: () => transform((d) => d),
        });
    };

    return (
        <AuthenticatedLayout title="Nueva compra">
            <Head title="Nueva compra" />

            <PageHeader
                title="Nueva compra"
                subtitle="Compra a particular — entra al inventario por IMEI"
                actions={
                    <Link
                        href="/purchases"
                        className="rounded-md border border-[#E3E5E0] bg-white px-3 py-2 text-sm font-medium hover:bg-[#F5F6F3]"
                    >
                        Volver
                    </Link>
                }
            />

            {products.length === 0 && (
                <div className="mb-4 rounded-lg border border-[#D97706]/30 bg-[#D97706]/10 px-4 py-3 text-sm text-[#252925]">
                    No hay Marcas cargadas.{' '}
                    <Link href="/products" className="font-semibold underline-offset-2 hover:underline">
                        Crea una Marca
                    </Link>{' '}
                    antes de registrar la compra.
                </div>
            )}

            <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-5">
                    <section className="unitra-card space-y-4 p-5">
                        <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#F5F6F3]">
                                <UserRound className="h-4 w-4 text-[#111315]" />
                            </span>
                            <div>
                                <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
                                    Vendedor
                                </h2>
                                <p className="text-xs text-[#6B7069]">
                                    Persona que vende el equipo a la tienda
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <InputLabel htmlFor="seller_name" value="Nombre completo" />
                                <TextInput
                                    id="seller_name"
                                    className="mt-1 block w-full"
                                    value={data.seller_name}
                                    onChange={(e) => setData('seller_name', e.target.value)}
                                    placeholder="Nombre y apellido"
                                    required
                                    autoFocus
                                />
                                <InputError message={errors.seller_name} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel value="Tipo ID" />
                                <Select
                                    value={data.seller_id_type}
                                    onValueChange={(value) => setData('seller_id_type', value)}
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
                                <InputLabel htmlFor="seller_id_number" value="Número ID" />
                                <TextInput
                                    id="seller_id_number"
                                    className="mt-1 block w-full font-mono"
                                    value={data.seller_id_number}
                                    onChange={(e) => setData('seller_id_number', e.target.value)}
                                    placeholder={
                                        data.seller_id_type === 'cedula'
                                            ? '000-0000000-0'
                                            : 'Pasaporte'
                                    }
                                    required
                                />
                                <InputError message={errors.seller_id_number} className="mt-1" />
                            </div>
                            <div className="sm:col-span-2">
                                <InputLabel htmlFor="seller_phone" value="Teléfono" />
                                <TextInput
                                    id="seller_phone"
                                    className="mt-1 block w-full"
                                    value={data.seller_phone}
                                    onChange={(e) => setData('seller_phone', e.target.value)}
                                    placeholder="809-000-0000"
                                    required
                                />
                                <InputError message={errors.seller_phone} className="mt-1" />
                            </div>
                        </div>

                        <div className="border-t border-[#E3E5E0] pt-3">
                            <button
                                type="button"
                                onClick={() => setPurchaseNotesOpen((v) => !v)}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6B7069] hover:text-[#111315]"
                            >
                                <ChevronDown
                                    className={`h-4 w-4 transition ${purchaseNotesOpen ? 'rotate-180' : ''}`}
                                />
                                Notas de la compra
                                {data.notes ? (
                                    <span className="rounded bg-[#F5F6F3] px-1.5 py-0.5 text-xs">
                                        con texto
                                    </span>
                                ) : null}
                            </button>
                            {purchaseNotesOpen && (
                                <textarea
                                    id="notes"
                                    className="unitra-input mt-2"
                                    rows={2}
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Observaciones del contrato o de la recepción…"
                                />
                            )}
                        </div>
                    </section>

                    <section className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#F5F6F3]">
                                    <Smartphone className="h-4 w-4 text-[#111315]" />
                                </span>
                                <div>
                                    <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
                                        Equipos
                                    </h2>
                                    <p className="text-xs text-[#6B7069]">
                                        {totals.unitCount} unidad
                                        {totals.unitCount === 1 ? '' : 'es'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {data.items.map((line, index) => {
                            const selected = products.find(
                                (p) => String(p.id) === line.product_id,
                            );
                            const open = detailsOpen[index] ?? false;
                            const hasExtra =
                                Boolean(line.serial) ||
                                Boolean(line.condition_grade) ||
                                Boolean(line.battery_health) ||
                                Boolean(line.min_sale_price) ||
                                Boolean(line.regular_sale_price) ||
                                Boolean(line.notes);

                            return (
                                <div
                                    key={index}
                                    className="unitra-card overflow-hidden"
                                >
                                    <div className="flex items-center justify-between gap-3 border-b border-[#E3E5E0] bg-[#FAFBF8] px-4 py-2.5">
                                        <div className="min-w-0">
                                            <p className="font-display text-sm font-semibold uppercase tracking-wide text-[#111315]">
                                                Equipo #{index + 1}
                                            </p>
                                            <p className="truncate text-xs text-[#6B7069]">
                                                {selected
                                                    ? productLabel(selected)
                                                    : 'Sin Marca seleccionada'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeLine(index)}
                                            disabled={data.items.length === 1}
                                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#E3E5E0] bg-white text-[#DC4444] transition enabled:hover:bg-[#DC4444]/5 disabled:cursor-not-allowed disabled:opacity-40"
                                            aria-label={`Quitar equipo ${index + 1}`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-3 p-4">
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            <div className="sm:col-span-2 lg:col-span-1">
                                                <InputLabel value="Marca" />
                                                <Select
                                                    value={line.product_id || undefined}
                                                    onValueChange={(value) =>
                                                        updateLine(index, 'product_id', value)
                                                    }
                                                >
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue placeholder="Seleccionar…" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {products.map((p) => (
                                                            <SelectItem
                                                                key={p.id}
                                                                value={String(p.id)}
                                                            >
                                                                {productLabel(p)}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <InputError
                                                    message={
                                                        errors[
                                                            `items.${index}.product_id` as keyof typeof errors
                                                        ]
                                                    }
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <InputLabel value="IMEI" />
                                                <TextInput
                                                    className="mt-1 block w-full font-mono"
                                                    value={line.imei}
                                                    onChange={(e) =>
                                                        updateLine(index, 'imei', e.target.value)
                                                    }
                                                    placeholder="15 dígitos"
                                                    required
                                                />
                                                <InputError
                                                    message={
                                                        errors[
                                                            `items.${index}.imei` as keyof typeof errors
                                                        ]
                                                    }
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <InputLabel value="Costo de compra" />
                                                <NumberInput
                                                    className="unitra-input mt-1 block w-full"
                                                    value={line.cost}
                                                    onValueChange={(value) =>
                                                        updateLine(index, 'cost', value)
                                                    }
                                                    placeholder="0.00"
                                                    required
                                                />
                                                <InputError
                                                    message={
                                                        errors[
                                                            `items.${index}.cost` as keyof typeof errors
                                                        ]
                                                    }
                                                    className="mt-1"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <InputLabel value="Condición" />
                                            <div className="mt-1.5 flex flex-wrap gap-2">
                                                {CONDITION_GRADES.map((grade) => {
                                                    const active =
                                                        line.condition_grade === grade;
                                                    return (
                                                        <button
                                                            key={grade}
                                                            type="button"
                                                            onClick={() =>
                                                                updateLine(
                                                                    index,
                                                                    'condition_grade',
                                                                    active ? '' : grade,
                                                                )
                                                            }
                                                            className={`rounded-md px-3 py-1.5 text-sm font-medium transition active:scale-[0.97] ${
                                                                active
                                                                    ? 'bg-[#111315] text-white'
                                                                    : 'border border-[#E3E5E0] bg-white text-[#252925] hover:bg-[#F5F6F3]'
                                                            }`}
                                                        >
                                                            {grade}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="border-t border-[#E3E5E0] pt-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setDetailsOpen((prev) => ({
                                                        ...prev,
                                                        [index]: !open,
                                                    }))
                                                }
                                                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6B7069] hover:text-[#111315]"
                                            >
                                                <ChevronDown
                                                    className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`}
                                                />
                                                Más detalles
                                                {hasExtra && !open ? (
                                                    <span className="rounded bg-[#F5F6F3] px-1.5 py-0.5 text-xs">
                                                        con datos
                                                    </span>
                                                ) : null}
                                            </button>

                                            {open && (
                                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                                    <div>
                                                        <InputLabel value="Serial" />
                                                        <TextInput
                                                            className="mt-1 block w-full font-mono"
                                                            value={line.serial}
                                                            onChange={(e) =>
                                                                updateLine(
                                                                    index,
                                                                    'serial',
                                                                    e.target.value,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <InputLabel value="Batería %" />
                                                        <NumberInput
                                                            decimals={0}
                                                            className="unitra-input mt-1 block w-full"
                                                            value={line.battery_health}
                                                            onValueChange={(value) =>
                                                                updateLine(
                                                                    index,
                                                                    'battery_health',
                                                                    value,
                                                                )
                                                            }
                                                            placeholder="85"
                                                        />
                                                    </div>
                                                    <div>
                                                        <InputLabel value="Precio mín. venta" />
                                                        <NumberInput
                                                            className="unitra-input mt-1 block w-full"
                                                            value={line.min_sale_price}
                                                            onValueChange={(value) =>
                                                                updateLine(
                                                                    index,
                                                                    'min_sale_price',
                                                                    value,
                                                                )
                                                            }
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                    <div>
                                                        <InputLabel value="Precio regular" />
                                                        <NumberInput
                                                            className="unitra-input mt-1 block w-full"
                                                            value={line.regular_sale_price}
                                                            onValueChange={(value) =>
                                                                updateLine(
                                                                    index,
                                                                    'regular_sale_price',
                                                                    value,
                                                                )
                                                            }
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                    <div>
                                                        <InputLabel value="Notas del equipo" />
                                                        <TextInput
                                                            className="mt-1 block w-full"
                                                            value={line.notes}
                                                            onChange={(e) =>
                                                                updateLine(
                                                                    index,
                                                                    'notes',
                                                                    e.target.value,
                                                                )
                                                            }
                                                            placeholder="Rayón, caja, etc."
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        <button
                            type="button"
                            onClick={addLine}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#E3E5E0] bg-white px-4 py-3 text-sm font-medium text-[#111315] transition hover:border-[#B8E34B] hover:bg-[#FAFBF8] active:scale-[0.99]"
                        >
                            <Plus className="h-4 w-4" />
                            Agregar equipo
                        </button>
                    </section>
                </div>

                <aside className="lg:sticky lg:top-4 lg:self-start">
                    <div className="unitra-card space-y-4 p-5">
                        <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
                            Resumen
                        </h2>

                        <dl className="space-y-3 text-sm">
                            <div className="flex justify-between gap-3">
                                <dt className="text-[#6B7069]">Equipos</dt>
                                <dd className="font-medium tabular-nums">
                                    {totals.unitCount}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-[#6B7069]">Total costo</dt>
                                <dd className="font-display text-xl font-semibold text-[#111315]">
                                    <Money amount={totals.totalCost} currency="DOP" />
                                </dd>
                            </div>
                            {totals.hasRegularPrices && (
                                <div className="flex justify-between gap-3 border-t border-[#E3E5E0] pt-3">
                                    <dt className="text-[#6B7069]">Suma precio regular</dt>
                                    <dd className="font-medium tabular-nums">
                                        <Money
                                            amount={totals.totalRegularSale}
                                            currency="DOP"
                                        />
                                    </dd>
                                </div>
                            )}
                            {totals.hasMinPrices && (
                                <div className="flex justify-between gap-3 border-t border-[#E3E5E0] pt-3">
                                    <dt className="text-[#6B7069]">Suma precio mín.</dt>
                                    <dd className="font-medium tabular-nums">
                                        <Money amount={totals.totalMinSale} currency="DOP" />
                                    </dd>
                                </div>
                            )}
                        </dl>

                        <PrimaryButton
                            type="submit"
                            className="w-full justify-center py-3"
                            disabled={processing || products.length === 0}
                        >
                            {processing ? 'Guardando…' : 'Guardar compra'}
                        </PrimaryButton>

                        <p className="text-xs leading-relaxed text-[#6B7069]">
                            Se crea el contrato de recepción y las unidades entran al
                            inventario como disponibles.
                        </p>
                    </div>
                </aside>
            </form>
        </AuthenticatedLayout>
    );
}
