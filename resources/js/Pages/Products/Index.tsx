import DataTable from '@/Components/DataTable';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Paginated, Product } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

type Props = PageProps<{
    products?: Paginated<Product>;
}>;

function productLabel(p: Product) {
    return [p.brand, p.model, p.storage, p.color].filter(Boolean).join(' · ');
}

export default function ProductsIndex({ products }: Props) {
    const rows = products?.data ?? [];
    const [open, setOpen] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        brand: '',
        model: '',
        storage: '',
        color: '',
    });

    const closeModal = () => {
        setOpen(false);
        clearErrors();
        reset();
    };

    const openModal = () => {
        reset();
        clearErrors();
        setOpen(true);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/products', {
            preserveScroll: true,
            onSuccess: () => closeModal(),
        });
    };

    return (
        <AuthenticatedLayout title="Marca">
            <Head title="Marca" />

            <PageHeader
                title="Marca"
                subtitle="Tipos de equipo (marca · modelo · storage · color)"
                actions={
                    <PrimaryButton type="button" onClick={openModal}>
                        <Plus className="mr-1.5 h-4 w-4" />
                        Nueva Marca
                    </PrimaryButton>
                }
            />

            <DataTable isEmpty={rows.length === 0} empty="No hay Marcas registradas.">
                <table className="unitra-table">
                    <thead>
                        <tr>
                            <th>Marca</th>
                            <th>Modelo</th>
                            <th>Almacenamiento</th>
                            <th>Color</th>
                            <th className="text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((product) => (
                            <tr key={product.id}>
                                <td className="font-medium">{product.brand}</td>
                                <td>{product.model}</td>
                                <td>{product.storage ?? '—'}</td>
                                <td>{product.color ?? '—'}</td>
                                <td className="text-right">
                                    <Link
                                        href={`/products/${product.id}/edit`}
                                        className="text-sm font-medium text-[#111315] underline-offset-2 hover:underline"
                                        title={productLabel(product)}
                                    >
                                        Editar
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </DataTable>

            <Modal show={open} onClose={closeModal} maxWidth="lg">
                <form onSubmit={submit} className="p-5">
                    <h3 className="font-display text-2xl font-semibold uppercase tracking-wide text-[#111315]">
                        Nueva Marca
                    </h3>
                    <p className="mt-1 text-sm text-[#6B7069]">
                        Tipo de equipo reutilizable
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="brand" value="Marca" />
                            <TextInput
                                id="brand"
                                className="mt-1 block w-full"
                                value={data.brand}
                                onChange={(e) => setData('brand', e.target.value)}
                                required
                                autoFocus
                            />
                            <InputError message={errors.brand} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="model" value="Modelo" />
                            <TextInput
                                id="model"
                                className="mt-1 block w-full"
                                value={data.model}
                                onChange={(e) => setData('model', e.target.value)}
                                required
                            />
                            <InputError message={errors.model} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="storage" value="Almacenamiento" />
                            <TextInput
                                id="storage"
                                className="mt-1 block w-full"
                                value={data.storage}
                                onChange={(e) => setData('storage', e.target.value)}
                                placeholder="128GB"
                            />
                            <InputError message={errors.storage} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="color" value="Color" />
                            <TextInput
                                id="color"
                                className="mt-1 block w-full"
                                value={data.color}
                                onChange={(e) => setData('color', e.target.value)}
                                placeholder="Negro"
                            />
                            <InputError message={errors.color} className="mt-1" />
                        </div>
                    </div>

                    <div className="mt-5 flex justify-end gap-2">
                        <SecondaryButton type="button" onClick={closeModal}>
                            Cancelar
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>Guardar Marca</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
