import DataTable from '@/Components/DataTable';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { CashMovement, CashSession, PageProps, Paginated } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

type Props = PageProps<{
    openSession?: (CashSession & { movements?: CashMovement[] }) | null;
    sessions?: Paginated<CashSession>;
    expectedAmount?: number | null;
    isAdmin?: boolean;
}>;

export default function CashIndex({
    openSession = null,
    sessions,
    expectedAmount = null,
}: Props) {
    const openForm = useForm({ opening_amount: '0', notes: '' });
    const closeForm = useForm({ closing_amount: '', notes: '' });

    const openSessionSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        openForm.post('/cash');
    };

    const closeSessionSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!openSession) return;
        closeForm.post(`/cash/${openSession.id}/close`);
    };

    const movements = openSession?.movements ?? [];

    return (
        <AuthenticatedLayout title="Caja">
            <Head title="Caja" />

            <PageHeader
                title="Caja"
                subtitle={
                    openSession
                        ? 'Sesión abierta'
                        : 'Sin sesión abierta'
                }
            />

            {!openSession ? (
                <form
                    onSubmit={openSessionSubmit}
                    className="unitra-card max-w-md space-y-4 p-5"
                >
                    <h2 className="font-display text-lg font-semibold uppercase">
                        Abrir caja
                    </h2>
                    <div>
                        <InputLabel value="Monto inicial" />
                        <TextInput
                            type="number"
                            step="0.01"
                            min="0"
                            className="mt-1 block w-full"
                            value={openForm.data.opening_amount}
                            onChange={(e) =>
                                openForm.setData('opening_amount', e.target.value)
                            }
                            required
                        />
                        <InputError message={openForm.errors.opening_amount} />
                    </div>
                    <PrimaryButton disabled={openForm.processing}>
                        Abrir sesión
                    </PrimaryButton>
                </form>
            ) : (
                <div className="space-y-5">
                    <div className="unitra-card grid gap-4 p-5 sm:grid-cols-3">
                        <div>
                            <p className="text-xs uppercase text-[#6B7069]">Apertura</p>
                            <p className="font-display text-2xl font-semibold">
                                <Money amount={Number(openSession.opening_amount)} />
                            </p>
                        </div>
                        <div>
                            <p className="text-xs uppercase text-[#6B7069]">Esperado</p>
                            <p className="font-display text-2xl font-semibold">
                                <Money amount={Number(expectedAmount ?? 0)} />
                            </p>
                        </div>
                        <form onSubmit={closeSessionSubmit} className="space-y-2">
                            <InputLabel value="Cierre (contado)" />
                            <TextInput
                                type="number"
                                step="0.01"
                                min="0"
                                className="block w-full"
                                value={closeForm.data.closing_amount}
                                onChange={(e) =>
                                    closeForm.setData('closing_amount', e.target.value)
                                }
                                required
                            />
                            <PrimaryButton disabled={closeForm.processing}>
                                Cerrar caja
                            </PrimaryButton>
                        </form>
                    </div>

                    <DataTable>
                        <thead>
                            <tr className="border-b border-[#E3E5E0] text-left text-xs uppercase text-[#6B7069]">
                                <th className="px-3 py-2">Tipo</th>
                                <th className="px-3 py-2">Monto</th>
                                <th className="px-3 py-2">Notas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {movements.map((m) => (
                                <tr key={m.id} className="border-b border-[#E3E5E0]">
                                    <td className="px-3 py-2 text-sm">{String(m.type)}</td>
                                    <td className="px-3 py-2">
                                        <Money amount={Number(m.amount)} />
                                    </td>
                                    <td className="px-3 py-2 text-sm text-[#6B7069]">
                                        {m.description ?? '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </DataTable>
                </div>
            )}

            {sessions?.data && sessions.data.length > 0 && (
                <div className="mt-8">
                    <h2 className="mb-3 font-display text-lg font-semibold uppercase">
                        Historial
                    </h2>
                    <DataTable>
                        <thead>
                            <tr className="border-b border-[#E3E5E0] text-left text-xs uppercase text-[#6B7069]">
                                <th className="px-3 py-2">Estado</th>
                                <th className="px-3 py-2">Apertura</th>
                                <th className="px-3 py-2">Cierre</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.data.map((s) => (
                                <tr key={s.id} className="border-b border-[#E3E5E0]">
                                    <td className="px-3 py-2 text-sm">{s.status}</td>
                                    <td className="px-3 py-2">
                                        <Money amount={Number(s.opening_amount)} />
                                    </td>
                                    <td className="px-3 py-2">
                                        {s.closing_amount != null ? (
                                            <Money amount={Number(s.closing_amount)} />
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </DataTable>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
