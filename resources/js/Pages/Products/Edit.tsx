import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Product } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

type Props = PageProps<{
    product: Product;
}>;

export default function ProductsEdit({ product }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        brand: product.brand ?? '',
        model: product.model ?? '',
        storage: product.storage ?? '',
        color: product.color ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(`/products/${product.id}`);
    };

    return (
        <AuthenticatedLayout title="Editar Marca">
            <Head title="Editar Marca" />

            <PageHeader
                title="Editar Marca"
                subtitle={`#${product.id}`}
                actions={
                    <Link
                        href="/products"
                        className="rounded-md border border-[#E3E5E0] bg-white px-3 py-2 text-sm font-medium text-[#252925] hover:bg-[#F5F6F3]"
                    >
                        Volver
                    </Link>
                }
            />

            <form onSubmit={submit} className="unitra-card max-w-2xl space-y-4 p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="brand" value="Marca" />
                        <TextInput
                            id="brand"
                            className="mt-1 block w-full"
                            value={data.brand}
                            onChange={(e) => setData('brand', e.target.value)}
                            required
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
                        />
                        <InputError message={errors.color} className="mt-1" />
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <PrimaryButton disabled={processing}>Actualizar</PrimaryButton>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
