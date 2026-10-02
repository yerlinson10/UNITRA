import PageHeader from '@/Components/PageHeader';
import FileUploader from '@/Components/FileUploader';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

type StoreSettings = {
    id: number;
    name: string;
    code?: string;
    address?: string | null;
    phone?: string | null;
    legal_name?: string | null;
    rnc?: string | null;
    warranty_notes?: string | null;
    default_print_format: '80mm' | 'a4';
    logo_url?: string | null;
    is_active?: boolean;
};

type Props = PageProps<{
    store: StoreSettings;
}>;

export default function StoreSettingsPage({ store }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: store.name ?? '',
        address: store.address ?? '',
        phone: store.phone ?? '',
        legal_name: store.legal_name ?? '',
        rnc: store.rnc ?? '',
        warranty_notes: store.warranty_notes ?? '',
        default_print_format: store.default_print_format ?? '80mm',
        logo: null as File | null,
        remove_logo: false as boolean,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('settings.store.update'), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout title="Configuración de tienda">
            <Head title="Mi tienda" />
            <PageHeader
                title="Mi tienda"
                subtitle="Datos, logo y preferencias de factura"
            />

            <form
                onSubmit={submit}
                className="unitra-card mx-auto max-w-2xl space-y-5 p-5"
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm sm:col-span-2">
                        <span className="mb-1 block font-medium text-[#252925]">
                            Nombre comercial
                        </span>
                        <input
                            className="w-full rounded-md border border-[#E3E5E0] px-3 py-2"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        {errors.name && (
                            <span className="mt-1 block text-xs text-[#DC4444]">
                                {errors.name}
                            </span>
                        )}
                    </label>

                    <label className="block text-sm sm:col-span-2">
                        <span className="mb-1 block font-medium text-[#252925]">
                            Razón social
                        </span>
                        <input
                            className="w-full rounded-md border border-[#E3E5E0] px-3 py-2"
                            value={data.legal_name}
                            onChange={(e) => setData('legal_name', e.target.value)}
                        />
                        {errors.legal_name && (
                            <span className="mt-1 block text-xs text-[#DC4444]">
                                {errors.legal_name}
                            </span>
                        )}
                    </label>

                    <label className="block text-sm">
                        <span className="mb-1 block font-medium text-[#252925]">
                            RNC
                        </span>
                        <input
                            className="w-full rounded-md border border-[#E3E5E0] px-3 py-2"
                            value={data.rnc}
                            onChange={(e) => setData('rnc', e.target.value)}
                        />
                        {errors.rnc && (
                            <span className="mt-1 block text-xs text-[#DC4444]">
                                {errors.rnc}
                            </span>
                        )}
                    </label>

                    <label className="block text-sm">
                        <span className="mb-1 block font-medium text-[#252925]">
                            Teléfono
                        </span>
                        <input
                            className="w-full rounded-md border border-[#E3E5E0] px-3 py-2"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                        />
                        {errors.phone && (
                            <span className="mt-1 block text-xs text-[#DC4444]">
                                {errors.phone}
                            </span>
                        )}
                    </label>

                    <label className="block text-sm sm:col-span-2">
                        <span className="mb-1 block font-medium text-[#252925]">
                            Dirección
                        </span>
                        <input
                            className="w-full rounded-md border border-[#E3E5E0] px-3 py-2"
                            value={data.address}
                            onChange={(e) => setData('address', e.target.value)}
                        />
                        {errors.address && (
                            <span className="mt-1 block text-xs text-[#DC4444]">
                                {errors.address}
                            </span>
                        )}
                    </label>

                    <div className="block text-sm sm:col-span-2">
                        <span className="mb-1 block font-medium text-[#252925]">
                            Formato de impresión por defecto
                        </span>
                        <Select
                            value={data.default_print_format}
                            onValueChange={(value) =>
                                setData(
                                    'default_print_format',
                                    value as '80mm' | 'a4',
                                )
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar formato" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="80mm">
                                    80mm (térmica)
                                </SelectItem>
                                <SelectItem value="a4">A4</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <label className="block text-sm sm:col-span-2">
                        <span className="mb-1 block font-medium text-[#252925]">
                            Notas de garantía (aparecen en la factura)
                        </span>
                        <textarea
                            className="min-h-24 w-full rounded-md border border-[#E3E5E0] px-3 py-2"
                            value={data.warranty_notes}
                            onChange={(e) =>
                                setData('warranty_notes', e.target.value)
                            }
                        />
                        {errors.warranty_notes && (
                            <span className="mt-1 block text-xs text-[#DC4444]">
                                {errors.warranty_notes}
                            </span>
                        )}
                    </label>

                    <div className="sm:col-span-2">
                        <span className="mb-1 block text-sm font-medium text-[#252925]">
                            Logo
                        </span>
                        <FileUploader
                            existingUrl={
                                data.remove_logo ? null : store.logo_url
                            }
                            accept={['image/*']}
                            allowImageEdit
                            labelIdle='Arrastra el logo o <span class="filepond--label-action">elige una imagen</span>'
                            onChange={(file) => {
                                setData((current) => ({
                                    ...current,
                                    logo: file,
                                    remove_logo: file
                                        ? false
                                        : current.remove_logo,
                                }));
                            }}
                            onClearExisting={() => {
                                setData((current) => ({
                                    ...current,
                                    logo: null,
                                    remove_logo: true,
                                }));
                            }}
                        />
                        {errors.logo && (
                            <span className="mt-1 block text-xs text-[#DC4444]">
                                {errors.logo}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-[#E3E5E0] pt-4">
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-md bg-[#B8E34B] px-4 py-2 text-sm font-semibold text-[#111315] hover:opacity-90 disabled:opacity-50"
                    >
                        Guardar
                    </button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
