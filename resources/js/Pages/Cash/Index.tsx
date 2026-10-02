import DataTable from '@/Components/DataTable';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Money from '@/Components/Money';
import NumberInput from '@/Components/NumberInput';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { useServerTable } from '@/hooks/useServerTable';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { CashMovement, CashSession, PageProps, Paginated } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { FormEventHandler, useMemo } from 'react';

type Props = PageProps<{
    openSession?: (CashSession & { movements?: CashMovement[] }) | null;
    sessions?: Paginated<CashSession>;
    expectedAmount?: number | null;
    filters?: { search?: string; status?: string };
    statuses?: Array<{ value: string; label: string }>;
    isAdmin?: boolean;
}>;

export default function CashIndex({
    openSession = null,
    sessions,
    expectedAmount = null,
    filters = {},
    statuses = [],
}: Props) {
    const openForm = useForm({ opening_amount: '0', notes: '' });
    const closeForm = useForm({ closing_amount: '', notes: '' });

    const table = useServerTable({
        url: '/cash',
        paginated: sessions,
        filters,
        only: ['sessions', 'filters', 'statuses', 'openSession', 'expectedAmount'],
    });

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

    const movementColumns = useMemo<ColumnDef<CashMovement>[]>(
        () => [
            {
                accessorKey: 'type',
                header: 'Tipo',
                cell: ({ getValue }) => (
                    <span className="text-sm">{String(getValue())}</span>
                ),
            },
            {
                accessorKey: 'amount',
                header: 'Monto',
                cell: ({ row }) => <Money amount={Number(row.original.amount)} />,
            },
            {
                id: 'notes',
                accessorFn: (row) => row.notes ?? row.description ?? '',
                header: 'Notas',
                cell: ({ getValue }) => (
                    <span className="text-sm text-[#6B7069]">
                        {(getValue() as string) || '—'}
                    </span>
                ),
            },
        ],
        [],
    );

    const sessionColumns = useMemo<ColumnDef<CashSession>[]>(
        () => [
            {
                accessorKey: 'status',
                header: 'Estado',
                cell: ({ getValue }) => (
                    <span className="text-sm capitalize">{String(getValue())}</span>
                ),
            },
            {
                accessorKey: 'opening_amount',
                header: 'Apertura',
                cell: ({ row }) => (
                    <Money amount={Number(row.original.opening_amount)} />
                ),
            },
            {
                accessorKey: 'closing_amount',
                header: 'Cierre',
                cell: ({ row }) =>
                    row.original.closing_amount != null ? (
                        <Money amount={Number(row.original.closing_amount)} />
                    ) : (
                        '—'
                    ),
            },
            {
                accessorKey: 'opened_at',
                header: 'Abierta',
                cell: ({ row }) => (
                    <span className="text-sm text-[#6B7069]">
                        {row.original.opened_at
                            ? new Date(row.original.opened_at).toLocaleString('es-DO')
                            : '—'}
                    </span>
                ),
            },
        ],
        [],
    );

    return (
        <AuthenticatedLayout title="Caja">
            <Head title="Caja" />

            <PageHeader
                title="Caja"
                subtitle={openSession ? 'Sesión abierta' : 'Sin sesión abierta'}
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
                        <NumberInput
                            className="unitra-input mt-1 block w-full"
                            value={openForm.data.opening_amount}
                            onValueChange={(value) =>
                                openForm.setData('opening_amount', value)
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
                            <NumberInput
                                className="unitra-input block w-full"
                                value={closeForm.data.closing_amount}
                                onValueChange={(value) =>
                                    closeForm.setData('closing_amount', value)
                                }
                                required
                            />
                            <PrimaryButton disabled={closeForm.processing}>
                                Cerrar caja
                            </PrimaryButton>
                        </form>
                    </div>

                    <DataTable
                        columns={movementColumns}
                        data={movements}
                        empty="Sin movimientos en la sesión."
                        searchPlaceholder="Buscar movimiento…"
                        initialPageSize={10}
                    />
                </div>
            )}

            <div className="mt-8">
                <h2 className="mb-3 font-display text-lg font-semibold uppercase">
                    Historial
                </h2>
                <DataTable
                    columns={sessionColumns}
                    data={sessions?.data ?? []}
                    empty="Sin sesiones registradas."
                    searchPlaceholder="Usuario o notas…"
                    filterSlot={
                        <div className="w-full sm:w-auto sm:min-w-[180px]">
                            <label className="mb-1 block text-xs font-medium text-[#6B7069]">
                                Estado
                            </label>
                            <Select
                                value={table.filters.status || 'all'}
                                onValueChange={(value) =>
                                    table.setFilter(
                                        'status',
                                        value === 'all' ? '' : value,
                                    )
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {statuses.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    }
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
            </div>
        </AuthenticatedLayout>
    );
}
