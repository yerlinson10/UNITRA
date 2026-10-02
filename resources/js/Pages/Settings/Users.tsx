import PageHeader from '@/Components/PageHeader';
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
import { FormEvent, useState } from 'react';

type ManagedUser = {
    id: number;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    store_id?: number | null;
    created_at?: string | null;
};

type RoleOption = { value: string; label: string };

type Props = PageProps<{
    users: ManagedUser[];
    roles: RoleOption[];
}>;

export default function UsersSettingsPage({ users, roles }: Props) {
    const [editingId, setEditingId] = useState<number | null>(null);

    const createForm = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'cashier',
    });

    const editForm = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'cashier',
        is_active: true as boolean,
    });

    const startEdit = (user: ManagedUser) => {
        setEditingId(user.id);
        editForm.setData({
            name: user.name,
            email: user.email,
            password: '',
            password_confirmation: '',
            role: user.role,
            is_active: user.is_active,
        });
        editForm.clearErrors();
    };

    const submitCreate = (e: FormEvent) => {
        e.preventDefault();
        createForm.post(route('settings.users.store'), {
            preserveScroll: true,
            onSuccess: () => createForm.reset(),
        });
    };

    const submitEdit = (e: FormEvent) => {
        e.preventDefault();
        if (!editingId) {
            return;
        }
        editForm.put(route('settings.users.update', editingId), {
            preserveScroll: true,
            onSuccess: () => setEditingId(null),
        });
    };

    return (
        <AuthenticatedLayout title="Usuarios">
            <Head title="Usuarios" />
            <PageHeader
                title="Usuarios"
                subtitle="Administra accesos Admin y Cajero"
            />

            <div className="grid gap-6 lg:grid-cols-2">
                <form
                    onSubmit={submitCreate}
                    className="unitra-card space-y-3 p-5"
                >
                    <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
                        Nuevo usuario
                    </h2>
                    <label className="block text-sm">
                        <span className="mb-1 block font-medium">Nombre</span>
                        <input
                            className="w-full rounded-md border border-[#E3E5E0] px-3 py-2"
                            value={createForm.data.name}
                            onChange={(e) =>
                                createForm.setData('name', e.target.value)
                            }
                        />
                        {createForm.errors.name && (
                            <span className="text-xs text-[#DC4444]">
                                {createForm.errors.name}
                            </span>
                        )}
                    </label>
                    <label className="block text-sm">
                        <span className="mb-1 block font-medium">Email</span>
                        <input
                            type="email"
                            className="w-full rounded-md border border-[#E3E5E0] px-3 py-2"
                            value={createForm.data.email}
                            onChange={(e) =>
                                createForm.setData('email', e.target.value)
                            }
                        />
                        {createForm.errors.email && (
                            <span className="text-xs text-[#DC4444]">
                                {createForm.errors.email}
                            </span>
                        )}
                    </label>
                    <div className="block text-sm">
                        <span className="mb-1 block font-medium">Rol</span>
                        <Select
                            value={createForm.data.role}
                            onValueChange={(value) =>
                                createForm.setData('role', value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar rol" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((role) => (
                                    <SelectItem
                                        key={role.value}
                                        value={role.value}
                                    >
                                        {role.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <label className="block text-sm">
                        <span className="mb-1 block font-medium">Contraseña</span>
                        <input
                            type="password"
                            className="w-full rounded-md border border-[#E3E5E0] px-3 py-2"
                            value={createForm.data.password}
                            onChange={(e) =>
                                createForm.setData('password', e.target.value)
                            }
                        />
                        {createForm.errors.password && (
                            <span className="text-xs text-[#DC4444]">
                                {createForm.errors.password}
                            </span>
                        )}
                    </label>
                    <label className="block text-sm">
                        <span className="mb-1 block font-medium">
                            Confirmar contraseña
                        </span>
                        <input
                            type="password"
                            className="w-full rounded-md border border-[#E3E5E0] px-3 py-2"
                            value={createForm.data.password_confirmation}
                            onChange={(e) =>
                                createForm.setData(
                                    'password_confirmation',
                                    e.target.value,
                                )
                            }
                        />
                    </label>
                    <button
                        type="submit"
                        disabled={createForm.processing}
                        className="rounded-md bg-[#B8E34B] px-4 py-2 text-sm font-semibold text-[#111315] disabled:opacity-50"
                    >
                        Crear usuario
                    </button>
                </form>

                <div className="unitra-card overflow-hidden">
                    <div className="border-b border-[#E3E5E0] px-4 py-3">
                        <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
                            Equipo
                        </h2>
                    </div>
                    <ul className="divide-y divide-[#E3E5E0]">
                        {users.map((user) => (
                            <li key={user.id} className="p-4">
                                {editingId === user.id ? (
                                    <form
                                        onSubmit={submitEdit}
                                        className="space-y-2"
                                    >
                                        <input
                                            className="w-full rounded-md border border-[#E3E5E0] px-3 py-2 text-sm"
                                            value={editForm.data.name}
                                            onChange={(e) =>
                                                editForm.setData(
                                                    'name',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <input
                                            className="w-full rounded-md border border-[#E3E5E0] px-3 py-2 text-sm"
                                            value={editForm.data.email}
                                            onChange={(e) =>
                                                editForm.setData(
                                                    'email',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <Select
                                            value={editForm.data.role}
                                            onValueChange={(value) =>
                                                editForm.setData('role', value)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar rol" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles.map((role) => (
                                                    <SelectItem
                                                        key={role.value}
                                                        value={role.value}
                                                    >
                                                        {role.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={editForm.data.is_active}
                                                onChange={(e) =>
                                                    editForm.setData(
                                                        'is_active',
                                                        e.target.checked,
                                                    )
                                                }
                                            />
                                            Activo
                                        </label>
                                        <input
                                            type="password"
                                            placeholder="Nueva contraseña (opcional)"
                                            className="w-full rounded-md border border-[#E3E5E0] px-3 py-2 text-sm"
                                            value={editForm.data.password}
                                            onChange={(e) =>
                                                editForm.setData(
                                                    'password',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <input
                                            type="password"
                                            placeholder="Confirmar contraseña"
                                            className="w-full rounded-md border border-[#E3E5E0] px-3 py-2 text-sm"
                                            value={
                                                editForm.data
                                                    .password_confirmation
                                            }
                                            onChange={(e) =>
                                                editForm.setData(
                                                    'password_confirmation',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                type="submit"
                                                className="rounded-md bg-[#B8E34B] px-3 py-1.5 text-sm font-semibold"
                                            >
                                                Guardar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setEditingId(null)
                                                }
                                                className="rounded-md border border-[#E3E5E0] px-3 py-1.5 text-sm"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-medium text-[#252925]">
                                                {user.name}
                                            </p>
                                            <p className="text-sm text-[#6B7069]">
                                                {user.email}
                                            </p>
                                            <p className="mt-1 text-xs uppercase tracking-wide text-[#6B7069]">
                                                {user.role}
                                                {!user.is_active && ' · Inactivo'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => startEdit(user)}
                                            className="rounded-md border border-[#E3E5E0] px-3 py-1.5 text-sm hover:bg-[#F5F6F3]"
                                        >
                                            Editar
                                        </button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
