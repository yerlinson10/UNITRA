import DataTable from '@/Components/DataTable';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useServerTable } from '@/hooks/useServerTable';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Paginated, Product } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { FormEventHandler, useCallback, useMemo, useState } from 'react';

type Props = PageProps<{
    products?: Paginated<Product>;
    filters?: { search?: string };
}>;

type BrandForm = {
    brand: string;
    model: string;
    storage: string;
    color: string;
};

const emptyForm: BrandForm = {
    brand: '',
    model: '',
    storage: '',
    color: '',
};

export default function ProductsIndex({ products, filters = {} }: Props) {
    const rows = products?.data ?? [];
    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState<Product | null>(null);

    const createForm = useForm<BrandForm>({ ...emptyForm });
    const editForm = useForm<BrandForm>({ ...emptyForm });

    const table = useServerTable({
        url: '/products',
        paginated: products,
        filters,
        only: ['products', 'filters'],
    });

    const closeCreate = () => {
        setCreateOpen(false);
        createForm.clearErrors();
        createForm.reset();
    };

    const openCreate = () => {
        createForm.reset();
        createForm.clearErrors();
        setCreateOpen(true);
    };

    const closeEdit = () => {
        setEditing(null);
        editForm.clearErrors();
        editForm.reset();
    };

    const openEdit = useCallback(
        (product: Product) => {
            editForm.clearErrors();
            editForm.setData({
                brand: product.brand ?? '',
                model: product.model ?? '',
                storage: product.storage ?? '',
                color: product.color ?? '',
            });
            setEditing(product);
        },
        [editForm],
    );

    const columns = useMemo<ColumnDef<Product>[]>(
        () => [
            {
                accessorKey: 'brand',
                header: 'Marca',
                cell: ({ row }) => (
                    <span className="font-medium">{row.original.brand}</span>
                ),
            },
            {
                accessorKey: 'model',
                header: 'Modelo',
            },
            {
                accessorKey: 'storage',
                header: 'Almacenamiento',
                cell: ({ getValue }) => (getValue() as string | null) ?? '—',
            },
            {
                accessorKey: 'color',
                header: 'Color',
                cell: ({ getValue }) => (getValue() as string | null) ?? '—',
            },
            {
                id: 'actions',
                header: 'Acciones',
                meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
                cell: ({ row }) => (
                    <button
                        type="button"
                        onClick={() => openEdit(row.original)}
                        className="text-sm font-medium text-[#111315] underline-offset-2 hover:underline"
                    >
                        Editar
                    </button>
                ),
            },
        ],
        [openEdit],
    );

    const submitCreate: FormEventHandler = (e) => {
        e.preventDefault();
        createForm.post('/products', {
            preserveScroll: true,
            onSuccess: () => closeCreate(),
        });
    };

    const submitEdit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editing) return;

        editForm.put(`/products/${editing.id}`, {
            preserveScroll: true,
            onSuccess: () => closeEdit(),
        });
    };

    return (
        <AuthenticatedLayout title="Marca">
            <Head title="Marca" />

            <PageHeader
                title="Marca"
                subtitle="Tipos de equipo (marca · modelo · storage · color)"
                actions={
                    <PrimaryButton type="button" onClick={openCreate}>
                        <Plus className="mr-1.5 h-4 w-4" />
                        Nueva Marca
                    </PrimaryButton>
                }
            />

            <DataTable
                columns={columns}
                data={rows}
                empty="No hay Marcas registradas."
                searchPlaceholder="Marca, modelo, SKU…"
                manualPagination
                manualFiltering
                pageCount={table.pageCount}
                pagination={table.pagination}
                onPaginationChange={(updater) => {
                    const next =
                        typeof updater === 'function'
                            ? updater(table.pagination)
                            : updater;
                    table.setPage(next.pageIndex + 1);
                }}
                globalFilter={table.search}
                onGlobalFilterChange={table.setSearch}
                onSearchSubmit={table.submitSearch}
                from={table.from}
                to={table.to}
                total={table.total}
            />

            <Modal show={createOpen} onClose={closeCreate} maxWidth="lg">
                <form onSubmit={submitCreate} className="p-5">
                    <h3 className="font-display text-2xl font-semibold uppercase tracking-wide text-[#111315]">
                        Nueva Marca
                    </h3>
                    <p className="mt-1 text-sm text-[#6B7069]">
                        Tipo de equipo reutilizable
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="create-brand" value="Marca" />
                            <TextInput
                                id="create-brand"
                                className="mt-1 block w-full"
                                value={createForm.data.brand}
                                onChange={(e) => createForm.setData('brand', e.target.value)}
                                required
                                autoFocus
                            />
                            <InputError message={createForm.errors.brand} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="create-model" value="Modelo" />
                            <TextInput
                                id="create-model"
                                className="mt-1 block w-full"
                                value={createForm.data.model}
                                onChange={(e) => createForm.setData('model', e.target.value)}
                                required
                            />
                            <InputError message={createForm.errors.model} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="create-storage" value="Almacenamiento" />
                            <TextInput
                                id="create-storage"
                                className="mt-1 block w-full"
                                value={createForm.data.storage}
                                onChange={(e) => createForm.setData('storage', e.target.value)}
                                placeholder="128GB"
                            />
                            <InputError message={createForm.errors.storage} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="create-color" value="Color" />
                            <TextInput
                                id="create-color"
                                className="mt-1 block w-full"
                                value={createForm.data.color}
                                onChange={(e) => createForm.setData('color', e.target.value)}
                                placeholder="Negro"
                            />
                            <InputError message={createForm.errors.color} className="mt-1" />
                        </div>
                    </div>

                    <div className="mt-5 flex justify-end gap-2">
                        <SecondaryButton type="button" onClick={closeCreate}>
                            Cancelar
                        </SecondaryButton>
                        <PrimaryButton disabled={createForm.processing}>
                            Guardar Marca
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={!!editing} onClose={closeEdit} maxWidth="lg">
                <form onSubmit={submitEdit} className="p-5">
                    <h3 className="font-display text-2xl font-semibold uppercase tracking-wide text-[#111315]">
                        Editar Marca
                    </h3>
                    <p className="mt-1 text-sm text-[#6B7069]">
                        Actualiza los datos del tipo de equipo
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="edit-brand" value="Marca" />
                            <TextInput
                                id="edit-brand"
                                className="mt-1 block w-full"
                                value={editForm.data.brand}
                                onChange={(e) => editForm.setData('brand', e.target.value)}
                                required
                                autoFocus
                            />
                            <InputError message={editForm.errors.brand} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="edit-model" value="Modelo" />
                            <TextInput
                                id="edit-model"
                                className="mt-1 block w-full"
                                value={editForm.data.model}
                                onChange={(e) => editForm.setData('model', e.target.value)}
                                required
                            />
                            <InputError message={editForm.errors.model} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="edit-storage" value="Almacenamiento" />
                            <TextInput
                                id="edit-storage"
                                className="mt-1 block w-full"
                                value={editForm.data.storage}
                                onChange={(e) => editForm.setData('storage', e.target.value)}
                                placeholder="128GB"
                            />
                            <InputError message={editForm.errors.storage} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="edit-color" value="Color" />
                            <TextInput
                                id="edit-color"
                                className="mt-1 block w-full"
                                value={editForm.data.color}
                                onChange={(e) => editForm.setData('color', e.target.value)}
                                placeholder="Negro"
                            />
                            <InputError message={editForm.errors.color} className="mt-1" />
                        </div>
                    </div>

                    <div className="mt-5 flex justify-end gap-2">
                        <SecondaryButton type="button" onClick={closeEdit}>
                            Cancelar
                        </SecondaryButton>
                        <PrimaryButton disabled={editForm.processing}>Actualizar</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
