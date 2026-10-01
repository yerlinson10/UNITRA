import DataTable from '@/Components/DataTable';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/Components/Modal';
import Money from '@/Components/Money';
import NumberInput from '@/Components/NumberInput';
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
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';

type Row = InventoryItem & {
    min_sale_price?: number | null;
    condition_grade?: string | null;
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

function conditionOf(item: Row) {
    return item.condition_grade ?? item.condition ?? null;
}

function todayDate(): string {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
}

function formatDate(value?: string | null): string {
    if (!value) return '—';
    const d = new Date(value.includes('T') ? value : `${value}T12:00:00`);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('es-DO');
}

export default function InventoryIndex({
    items,
    Marcas = [],
    filters = {},
    statuses,
    canViewCosts = false,
}: Props) {
    const page = usePage();
    const [status, setStatus] = useState(filters.status ?? '');
    const [search, setSearch] = useState(filters.search ?? '');
    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState<Row | null>(null);
    const [mode, setMode] = useState<'existing' | 'new'>(
        Marcas.length > 0 ? 'existing' : 'new',
    );
    const rows = rowsOf(items);

    const createForm = useForm({
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
        purchased_at: todayDate(),
        warranty_months: '3',
        warranty_expires_at: '',
        notes: '',
        origin: 'other',
    });

    const editForm = useForm({
        product_id: '',
        imei: '',
        serial: '',
        condition_grade: '',
        battery_health: '',
        cost: '',
        min_sale_price: '',
        purchased_at: todayDate(),
        warranty_months: '3',
        warranty_expires_at: '',
        status: 'available',
        notes: '',
    });

    const statusOptions = statuses ?? [
        { value: 'available', label: 'Disponible' },
        { value: 'in_repair', label: 'Reparación' },
        { value: 'sold', label: 'Vendido' },
        { value: 'returned', label: 'Devuelto' },
    ];

    const queryItemId = useMemo(() => {
        const params = new URLSearchParams(page.url.split('?')[1] ?? '');
        return params.get('item');
    }, [page.url]);

    useEffect(() => {
        if (!queryItemId) return;
        const found = rows.find((row) => String(row.id) === String(queryItemId));
        if (found) {
            openEdit(found);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryItemId, rows.length]);

    const closeCreate = () => {
        setCreateOpen(false);
        createForm.clearErrors();
        createForm.reset();
        setMode(Marcas.length > 0 ? 'existing' : 'new');
    };

    const openCreate = () => {
        createForm.reset();
        createForm.clearErrors();
        createForm.setData('purchased_at', todayDate());
        createForm.setData('warranty_months', '3');
        createForm.setData('warranty_expires_at', '');
        setMode(Marcas.length > 0 ? 'existing' : 'new');
        setCreateOpen(true);
    };

    const openEdit = (item: Row) => {
        setEditing(item);
        editForm.clearErrors();
        editForm.setData({
            product_id: String(item.product_id),
            imei: item.imei ?? '',
            serial: item.serial ?? '',
            condition_grade: conditionOf(item) ?? '',
            battery_health:
                item.battery_health != null ? String(item.battery_health) : '',
            cost: item.cost != null ? String(item.cost) : '',
            min_sale_price:
                item.min_sale_price != null
                    ? String(item.min_sale_price)
                    : item.min_price != null
                      ? String(item.min_price)
                      : '',
            purchased_at: item.purchased_at
                ? String(item.purchased_at).slice(0, 10)
                : todayDate(),
            warranty_months:
                item.warranty_months != null ? String(item.warranty_months) : '3',
            warranty_expires_at: item.warranty_expires_at
                ? String(item.warranty_expires_at).slice(0, 10)
                : '',
            status: String(item.status ?? 'available'),
            notes: item.notes ?? '',
        });
    };

    const closeEdit = () => {
        setEditing(null);
        editForm.clearErrors();
        editForm.reset();
        if (queryItemId) {
            router.get('/inventory', {}, { replace: true, preserveState: true });
        }
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

    const submitCreate: FormEventHandler = (e) => {
        e.preventDefault();
        createForm.transform((form) => {
            const warrantyFields = {
                purchased_at: form.purchased_at,
                warranty_months:
                    form.warranty_months !== ''
                        ? Number(form.warranty_months)
                        : 3,
                warranty_expires_at: form.warranty_expires_at || null,
            };

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
                    ...warrantyFields,
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
                ...warrantyFields,
                notes: form.notes || null,
                origin: form.origin,
            };
        });
        createForm.post('/inventory', {
            preserveScroll: true,
            onSuccess: () => closeCreate(),
            onFinish: () => createForm.transform((d) => d),
        });
    };

    const submitEdit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editing) return;

        editForm.transform((form) => ({
            product_id: Number(form.product_id),
            imei: form.imei,
            serial: form.serial || null,
            condition_grade: form.condition_grade || null,
            battery_health: form.battery_health
                ? Number(form.battery_health)
                : null,
            cost: canViewCosts
                ? form.cost !== ''
                    ? Number(form.cost)
                    : null
                : undefined,
            min_sale_price: form.min_sale_price
                ? Number(form.min_sale_price)
                : null,
            purchased_at: form.purchased_at,
            warranty_months:
                form.warranty_months !== '' ? Number(form.warranty_months) : 3,
            warranty_expires_at: form.warranty_expires_at || null,
            status: form.status,
            notes: form.notes || null,
        }));

        editForm.put(`/inventory/${editing.id}`, {
            preserveScroll: true,
            onSuccess: () => closeEdit(),
            onFinish: () => editForm.transform((d) => d),
        });
    };

    return (
        <AuthenticatedLayout title="Productos">
            <Head title="Productos" />

            <PageHeader
                title="Productos"
                subtitle={`${rows.length} unidades por IMEI`}
                actions={
                    <PrimaryButton type="button" onClick={openCreate}>
                        <Plus className="mr-1.5 h-4 w-4" />
                        Nuevo producto
                    </PrimaryButton>
                }
            />

            <form
                onSubmit={applyFilter}
                className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
            >
                <div className="min-w-0 flex-1 sm:min-w-[220px]">
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
                <div className="w-full sm:w-auto sm:min-w-[180px]">
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
                    className="min-h-11 w-full rounded-md border border-[#E3E5E0] bg-white px-3 py-2 text-sm font-medium hover:bg-[#F5F6F3] active:scale-[0.97] sm:w-auto"
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
                            <th>Compra</th>
                            <th>Garantía</th>
                            <th>Vendido</th>
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
                                <td className="whitespace-nowrap text-xs">
                                    {formatDate(item.purchased_at)}
                                </td>
                                <td className="whitespace-nowrap text-xs">
                                    {item.warranty_expires_at
                                        ? formatDate(item.warranty_expires_at)
                                        : item.warranty_months != null
                                          ? `${item.warranty_months} mes${item.warranty_months === 1 ? '' : 'es'}`
                                          : '—'}
                                </td>
                                <td className="whitespace-nowrap text-xs">
                                    {formatDate(item.sold_at)}
                                </td>
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
                                    <button
                                        type="button"
                                        onClick={() => openEdit(item)}
                                        className="min-h-11 text-sm font-medium underline-offset-2 hover:underline"
                                    >
                                        Detalle
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </DataTable>

            <Modal show={createOpen} onClose={closeCreate} maxWidth="2xl">
                <form onSubmit={submitCreate} className="flex min-h-0 flex-1 flex-col">
                    <ModalHeader
                        title="Nuevo producto"
                        subtitle="Unidad con IMEI — elige o crea su Marca"
                    />
                    <ModalBody>
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setMode('existing')}
                                    className={`min-h-11 rounded-md px-3 py-2 text-sm font-medium transition active:scale-[0.97] ${
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
                                    className={`min-h-11 rounded-md px-3 py-2 text-sm font-medium transition active:scale-[0.97] ${
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
                                        value={createForm.data.product_id || undefined}
                                        onValueChange={(value) =>
                                            createForm.setData('product_id', value)
                                        }
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
                                    <InputError
                                        message={createForm.errors.product_id}
                                        className="mt-1"
                                    />
                                </div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <InputLabel value="Marca" />
                                        <TextInput
                                            className="mt-1 block w-full"
                                            value={createForm.data.brand}
                                            onChange={(e) =>
                                                createForm.setData('brand', e.target.value)
                                            }
                                            required
                                        />
                                        <InputError
                                            message={createForm.errors.brand}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <InputLabel value="Modelo" />
                                        <TextInput
                                            className="mt-1 block w-full"
                                            value={createForm.data.model}
                                            onChange={(e) =>
                                                createForm.setData('model', e.target.value)
                                            }
                                            required
                                        />
                                        <InputError
                                            message={createForm.errors.model}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <InputLabel value="Almacenamiento" />
                                        <TextInput
                                            className="mt-1 block w-full"
                                            value={createForm.data.storage}
                                            onChange={(e) =>
                                                createForm.setData('storage', e.target.value)
                                            }
                                            placeholder="128GB"
                                        />
                                    </div>
                                    <div>
                                        <InputLabel value="Color" />
                                        <TextInput
                                            className="mt-1 block w-full"
                                            value={createForm.data.color}
                                            onChange={(e) =>
                                                createForm.setData('color', e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <InputLabel value="IMEI" />
                                    <TextInput
                                        className="mt-1 block w-full font-mono"
                                        value={createForm.data.imei}
                                        onChange={(e) =>
                                            createForm.setData('imei', e.target.value)
                                        }
                                        required
                                    />
                                    <InputError
                                        message={createForm.errors.imei}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <InputLabel value="Serial" />
                                    <TextInput
                                        className="mt-1 block w-full font-mono"
                                        value={createForm.data.serial}
                                        onChange={(e) =>
                                            createForm.setData('serial', e.target.value)
                                        }
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <InputLabel value="Condición" />
                                    <TextInput
                                        className="mt-1 block w-full"
                                        value={createForm.data.condition_grade}
                                        onChange={(e) =>
                                            createForm.setData(
                                                'condition_grade',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Como nuevo / Grado B"
                                    />
                                    <InputError
                                        message={createForm.errors.condition_grade}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <InputLabel value="Batería %" />
                                    <NumberInput
                                        decimals={0}
                                        className="mt-1 block w-full"
                                        value={createForm.data.battery_health}
                                        onValueChange={(value) =>
                                            createForm.setData('battery_health', value)
                                        }
                                    />
                                </div>
                                <div>
                                    <InputLabel value="Costo" />
                                    <NumberInput
                                        className="mt-1 block w-full"
                                        value={createForm.data.cost}
                                        onValueChange={(value) =>
                                            createForm.setData('cost', value)
                                        }
                                        required
                                    />
                                    <InputError
                                        message={createForm.errors.cost}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <InputLabel value="Precio mín. venta" />
                                    <NumberInput
                                        className="mt-1 block w-full"
                                        value={createForm.data.min_sale_price}
                                        onValueChange={(value) =>
                                            createForm.setData('min_sale_price', value)
                                        }
                                    />
                                </div>
                                <div>
                                    <InputLabel value="Fecha de compra" />
                                    <TextInput
                                        type="date"
                                        className="mt-1 block w-full min-h-11"
                                        value={createForm.data.purchased_at}
                                        onChange={(e) =>
                                            createForm.setData(
                                                'purchased_at',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    <InputError
                                        message={createForm.errors.purchased_at}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <InputLabel value="Meses de garantía" />
                                    <NumberInput
                                        decimals={0}
                                        className="mt-1 block w-full min-h-11"
                                        value={createForm.data.warranty_months}
                                        onValueChange={(value) =>
                                            createForm.setData('warranty_months', value)
                                        }
                                    />
                                    <InputError
                                        message={createForm.errors.warranty_months}
                                        className="mt-1"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <InputLabel value="Vence garantía" />
                                    <TextInput
                                        type="date"
                                        className="mt-1 block w-full min-h-11"
                                        value={createForm.data.warranty_expires_at}
                                        onChange={(e) =>
                                            createForm.setData(
                                                'warranty_expires_at',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <p className="mt-1 text-xs text-[#6B7069]">
                                        Si lo dejas vacío, se calcula al vender
                                    </p>
                                    <InputError
                                        message={createForm.errors.warranty_expires_at}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div>
                                <InputLabel value="Notas" />
                                <textarea
                                    className="unitra-input mt-1"
                                    rows={2}
                                    value={createForm.data.notes}
                                    onChange={(e) =>
                                        createForm.setData('notes', e.target.value)
                                    }
                                />
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <SecondaryButton
                            type="button"
                            onClick={closeCreate}
                            className="w-full sm:w-auto"
                        >
                            Cancelar
                        </SecondaryButton>
                        <PrimaryButton
                            disabled={createForm.processing}
                            className="w-full sm:w-auto"
                        >
                            Guardar en inventario
                        </PrimaryButton>
                    </ModalFooter>
                </form>
            </Modal>

            <Modal show={!!editing} onClose={closeEdit} maxWidth="2xl">
                {editing && (
                    <form onSubmit={submitEdit} className="flex min-h-0 flex-1 flex-col">
                        <ModalHeader
                            title="Detalle del producto"
                            subtitle={editing.imei}
                        >
                            <StatusBadge status={editing.status as InventoryStatus} />
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <div>
                                    <InputLabel value="Marca" />
                                    <Select
                                        value={editForm.data.product_id || undefined}
                                        onValueChange={(value) =>
                                            editForm.setData('product_id', value)
                                        }
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
                                    <InputError
                                        message={editForm.errors.product_id}
                                        className="mt-1"
                                    />
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <InputLabel value="IMEI" />
                                        <TextInput
                                            className="mt-1 block w-full font-mono"
                                            value={editForm.data.imei}
                                            onChange={(e) =>
                                                editForm.setData('imei', e.target.value)
                                            }
                                            required
                                        />
                                        <InputError
                                            message={editForm.errors.imei}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <InputLabel value="Serial" />
                                        <TextInput
                                            className="mt-1 block w-full font-mono"
                                            value={editForm.data.serial}
                                            onChange={(e) =>
                                                editForm.setData('serial', e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <InputLabel value="Condición" />
                                        <TextInput
                                            className="mt-1 block w-full"
                                            value={editForm.data.condition_grade}
                                            onChange={(e) =>
                                                editForm.setData(
                                                    'condition_grade',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Como nuevo / Grado B"
                                        />
                                        <InputError
                                            message={editForm.errors.condition_grade}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <InputLabel value="Batería %" />
                                        <NumberInput
                                            decimals={0}
                                            className="mt-1 block w-full"
                                            value={editForm.data.battery_health}
                                            onValueChange={(value) =>
                                                editForm.setData('battery_health', value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <InputLabel value="Estado" />
                                        <Select
                                            value={editForm.data.status}
                                            onValueChange={(value) =>
                                                editForm.setData('status', value)
                                            }
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {statusOptions.map((opt) => (
                                                    <SelectItem
                                                        key={opt.value}
                                                        value={opt.value}
                                                    >
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={editForm.errors.status}
                                            className="mt-1"
                                        />
                                    </div>
                                    {canViewCosts && (
                                        <div>
                                            <InputLabel value="Costo" />
                                            <NumberInput
                                                className="mt-1 block w-full"
                                                value={editForm.data.cost}
                                                onValueChange={(value) =>
                                                    editForm.setData('cost', value)
                                                }
                                            />
                                            <InputError
                                                message={editForm.errors.cost}
                                                className="mt-1"
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <InputLabel value="Precio mín. venta" />
                                        <NumberInput
                                            className="mt-1 block w-full"
                                            value={editForm.data.min_sale_price}
                                            onValueChange={(value) =>
                                                editForm.setData('min_sale_price', value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <InputLabel value="Fecha de compra" />
                                        <TextInput
                                            type="date"
                                            className="mt-1 block w-full min-h-11"
                                            value={editForm.data.purchased_at}
                                            onChange={(e) =>
                                                editForm.setData(
                                                    'purchased_at',
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        />
                                        <InputError
                                            message={editForm.errors.purchased_at}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <InputLabel value="Meses de garantía" />
                                        <NumberInput
                                            decimals={0}
                                            className="mt-1 block w-full min-h-11"
                                            value={editForm.data.warranty_months}
                                            onValueChange={(value) =>
                                                editForm.setData(
                                                    'warranty_months',
                                                    value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={editForm.errors.warranty_months}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <InputLabel value="Vence garantía" />
                                        <TextInput
                                            type="date"
                                            className="mt-1 block w-full min-h-11"
                                            value={editForm.data.warranty_expires_at}
                                            onChange={(e) =>
                                                editForm.setData(
                                                    'warranty_expires_at',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <p className="mt-1 text-xs text-[#6B7069]">
                                            Si lo dejas vacío, se calcula al vender
                                        </p>
                                        <InputError
                                            message={
                                                editForm.errors.warranty_expires_at
                                            }
                                            className="mt-1"
                                        />
                                    </div>
                                    {editing?.sold_at && (
                                        <div className="sm:col-span-2">
                                            <InputLabel value="Fecha de venta" />
                                            <p className="mt-1 min-h-11 rounded-md border border-[#E3E5E0] bg-[#F5F6F3] px-3 py-2 text-sm">
                                                {formatDate(editing.sold_at)}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <InputLabel value="Notas" />
                                    <textarea
                                        className="unitra-input mt-1"
                                        rows={2}
                                        value={editForm.data.notes}
                                        onChange={(e) =>
                                            editForm.setData('notes', e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <SecondaryButton
                                type="button"
                                onClick={closeEdit}
                                className="w-full sm:w-auto"
                            >
                                Cancelar
                            </SecondaryButton>
                            <PrimaryButton
                                disabled={editForm.processing}
                                className="w-full sm:w-auto"
                            >
                                Guardar cambios
                            </PrimaryButton>
                        </ModalFooter>
                    </form>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}
