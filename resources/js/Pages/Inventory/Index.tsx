import DataTable from '@/Components/DataTable';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import StatusBadge from '@/Components/StatusBadge';
import TextInput from '@/Components/TextInput';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    InventoryItem,
    InventoryStatus,
    PageProps,
    Paginated,
    Product,
} from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

type Row = InventoryItem & {
    min_sale_price?: number | null;
    status_label?: string;
};

type Props = PageProps<{
    items?: Paginated<Row> | Row[];
    Marcas?: Product[];
    filters?: { status?: string; search?: string };
    statuses?: Array<{ value: string; label: string }>;
    canViewCosts?: boolean;
}>;

function rowsOf(items?: Paginated<Row> | Row[]): Row[] {
    if (!items) return [];
    return Array.isArray(items) ? items : items.data ?? [];
}

function labelOf(item: Row) {
    const p = item.product;
    if (!p) return `Unidad #${item.id}`;
    if ('name' in p && p.name) return String(p.name);
    return [p.brand, p.model, p.storage, p.color].filter(Boolean).join(' · ');
}

export default function InventoryIndex({
    items,
    Marcas = [],
    filters = {},
    statuses,
    canViewCosts = false,
}: Props) {
    const [status, setStatus] = useState(filters.status ?? '');
    const [search, setSearch] = useState(filters.search ?? '');
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<'existing' | 'new'>(
        Marcas.length > 0 ? 'existing' : 'new',
    );
    const rows = rowsOf(items);

    const { data, setData, post, processing, errors, reset, clearErrors, transform } =
        useForm({
            product_id: Marcas[0] ? String(Marcas[0].id) : '',
            brand: '',
            model: '',
            storage: '',
            color: '',
            imei: '',
            serial: '',
            condition_grade: '',
            battery_health: '',
            cost: '',
            min_sale_price: '',
            notes: '',
            origin: 'other',
        });

    const closeModal = () => {
        setOpen(false);
        clearErrors();
        reset();
        setMode(Marcas.length > 0 ? 'existing' : 'new');
    };

    const openModal = () => {
        reset();
        clearErrors();
        setMode(Marcas.length > 0 ? 'existing' : 'new');
        setOpen(true);
    };

    const applyFilter: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(
            '/inventory',
            {
                status: status || undefined,
                search: search || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        transform((form) => {
            if (mode === 'existing') {
                return {
                    product_id: Number(form.product_id),
                    imei: form.imei,
                    serial: form.serial || null,
                    condition_grade: form.condition_grade || null,
                    battery_health: form.battery_health
                        ? Number(form.battery_health)
                        : null,
                    cost: Number(form.cost) || 0,
                    min_sale_price: form.min_sale_price
                        ? Number(form.min_sale_price)
                        : null,
                    notes: form.notes || null,
                    origin: form.origin,
                };
            }

            return {
                brand: form.brand,
                model: form.model,
                storage: form.storage || null,
                color: form.color || null,
                imei: form.imei,
                serial: form.serial || null,
                condition_grade: form.condition_grade || null,
                battery_health: form.battery_health
                    ? Number(form.battery_health)
                    : null,
                cost: Number(form.cost) || 0,
                min_sale_price: form.min_sale_price
                    ? Number(form.min_sale_price)
                    : null,
                notes: form.notes || null,
                origin: form.origin,
            };
        });
        post('/inventory', {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onFinish: () => transform((d) => d),
        });
    };

    const statusOptions = statuses ?? [
        { value: 'available', label: 'Disponible' },
        { value: 'in_repair', label: 'Reparación' },
        { value: 'sold', label: 'Vendido' },
        { value: 'returned', label: 'Devuelto' },
    ];

    return (
        <AuthenticatedLayout title="Productos">
            <Head title="Productos" />

            <PageHeader
                title="Productos"
                subtitle={`${rows.length} unidades por IMEI`}
                actions={
                    <PrimaryButton type="button" onClick={openModal}>
                        <Plus className="mr-1.5 h-4 w-4" />
                        Nuevo producto
                    </PrimaryButton>
                }
            />

            <form
                onSubmit={applyFilter}
                className="mb-4 flex flex-wrap items-end gap-3"
            >
                <div className="min-w-[220px] flex-1">
                    <label className="mb-1 block text-xs font-medium text-[#6B7069]">
                        Buscar
                    </label>
                    <TextInput
                        className="block w-full"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="IMEI, marca, modelo, serial…"
                    />
                </div>
                <div className="min-w-[180px]">
                    <label className="mb-1 block text-xs font-medium text-[#6B7069]">
                        Estado
                    </label>
                    <Select
                        value={status || 'all'}
                        onValueChange={(value) => setStatus(value === 'all' ? '' : value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {statusOptions.map((opt) => (
                                <SelectItem key={opt.value || 'all'} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <button
                    type="submit"
                    className="rounded-md border border-[#E3E5E0] bg-white px-3 py-2 text-sm font-medium hover:bg-[#F5F6F3] active:scale-[0.97]"
                >
                    Filtrar
                </button>
            </form>

            <DataTable isEmpty={rows.length === 0} empty="Sin productos en inventario.">
                <table className="unitra-table">
                    <thead>
                        <tr>
                            <th>IMEI</th>
                            <th>Marca</th>
                            <th>Estado</th>
                            <th>Precio mín.</th>
                            {canViewCosts && <th>Costo</th>}
                            <th className="text-right">Ver</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((item) => (
                            <tr key={item.id}>
                                <td className="font-mono text-xs font-medium">
                                    {item.imei}
                                </td>
                                <td>{labelOf(item)}</td>
                                <td>
                                    <StatusBadge status={item.status as InventoryStatus} />
                                </td>
                                <td>
                                    <Money
                                        amount={item.min_sale_price ?? item.min_price ?? null}
                                    />
                                </td>
                                {canViewCosts && (
                                    <td>
                                        <Money amount={item.cost} />
                                    </td>
                                )}
                                <td className="text-right">
                                    <Link
                                        href={`/inventory/${item.id}`}
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

            <Modal show={open} onClose={closeModal} maxWidth="2xl">
                <form onSubmit={submit} className="p-5">
                    <h3 className="font-display text-2xl font-semibold uppercase tracking-wide text-[#111315]">
                        Nuevo producto
                    </h3>
                    <p className="mt-1 text-sm text-[#6B7069]">
                        Unidad con IMEI — elige o crea su Marca
                    </p>

                    <div className="mt-4 space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setMode('existing')}
                                className={`rounded-md px-3 py-2 text-sm font-medium transition active:scale-[0.97] ${
                                    mode === 'existing'
                                        ? 'bg-[#111315] text-white'
                                        : 'border border-[#E3E5E0] bg-white'
                                }`}
                            >
                                Usar Marca existente
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('new')}
                                className={`rounded-md px-3 py-2 text-sm font-medium transition active:scale-[0.97] ${
                                    mode === 'new'
                                        ? 'bg-[#111315] text-white'
                                        : 'border border-[#E3E5E0] bg-white'
                                }`}
                            >
                                Crear Marca nueva
                            </button>
                        </div>

                        {mode === 'existing' ? (
                            <div>
                                <InputLabel value="Marca" />
                                <Select
                                    value={data.product_id || undefined}
                                    onValueChange={(value) => setData('product_id', value)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Seleccionar…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Marcas.map((m) => (
                                            <SelectItem key={m.id} value={String(m.id)}>
                                                {m.name ??
                                                    [m.brand, m.model, m.storage, m.color]
                                                        .filter(Boolean)
                                                        .join(' · ')}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.product_id} className="mt-1" />
                            </div>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <InputLabel value="Marca" />
                                    <TextInput
                                        className="mt-1 block w-full"
                                        value={data.brand}
                                        onChange={(e) => setData('brand', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.brand} className="mt-1" />
                                </div>
                                <div>
                                    <InputLabel value="Modelo" />
                                    <TextInput
                                        className="mt-1 block w-full"
                                        value={data.model}
                                        onChange={(e) => setData('model', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.model} className="mt-1" />
                                </div>
                                <div>
                                    <InputLabel value="Almacenamiento" />
                                    <TextInput
                                        className="mt-1 block w-full"
                                        value={data.storage}
                                        onChange={(e) => setData('storage', e.target.value)}
                                        placeholder="128GB"
                                    />
                                </div>
                                <div>
                                    <InputLabel value="Color" />
                                    <TextInput
                                        className="mt-1 block w-full"
                                        value={data.color}
                                        onChange={(e) => setData('color', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <InputLabel value="IMEI" />
                                <TextInput
                                    className="mt-1 block w-full font-mono"
                                    value={data.imei}
                                    onChange={(e) => setData('imei', e.target.value)}
                                    required
                                />
                                <InputError message={errors.imei} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel value="Serial" />
                                <TextInput
                                    className="mt-1 block w-full font-mono"
                                    value={data.serial}
                                    onChange={(e) => setData('serial', e.target.value)}
                                />
                            </div>
                            <div>
                                <InputLabel value="Condición" />
                                <TextInput
                                    className="mt-1 block w-full"
                                    value={data.condition_grade}
                                    onChange={(e) =>
                                        setData('condition_grade', e.target.value)
                                    }
                                    placeholder="Como nuevo / Grado B"
                                />
                            </div>
                            <div>
                                <InputLabel value="Batería %" />
                                <TextInput
                                    type="number"
                                    min="1"
                                    max="100"
                                    className="mt-1 block w-full"
                                    value={data.battery_health}
                                    onChange={(e) =>
                                        setData('battery_health', e.target.value)
                                    }
                                />
                            </div>
                            <div>
                                <InputLabel value="Costo" />
                                <TextInput
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="mt-1 block w-full"
                                    value={data.cost}
                                    onChange={(e) => setData('cost', e.target.value)}
                                    required
                                />
                                <InputError message={errors.cost} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel value="Precio mín. venta" />
                                <TextInput
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="mt-1 block w-full"
                                    value={data.min_sale_price}
                                    onChange={(e) =>
                                        setData('min_sale_price', e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        <div>
                            <InputLabel value="Notas" />
                            <textarea
                                className="unitra-input mt-1"
                                rows={2}
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mt-5 flex justify-end gap-2">
                        <SecondaryButton type="button" onClick={closeModal}>
                            Cancelar
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            Guardar en inventario
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
