import TextInput from '@/Components/TextInput';
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    OnChangeFn,
    PaginationState,
    RowData,
    useReactTable,
} from '@tanstack/react-table';
import { Search } from 'lucide-react';
import {
    FormEventHandler,
    ReactNode,
    useEffect,
    useMemo,
    useState,
} from 'react';

declare module '@tanstack/react-table' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface ColumnMeta<TData extends RowData, TValue> {
        headerClassName?: string;
        cellClassName?: string;
    }
}

type DataTableProps<TData> = {
    columns: ColumnDef<TData, any>[];
    data: TData[];
    empty?: ReactNode;
    searchPlaceholder?: string;
    filterSlot?: ReactNode;
    toolbarExtra?: ReactNode;
    showSearch?: boolean;
    showPagination?: boolean;
    /** Server-side / manual mode */
    manualPagination?: boolean;
    manualFiltering?: boolean;
    pageCount?: number;
    pagination?: PaginationState;
    onPaginationChange?: OnChangeFn<PaginationState>;
    globalFilter?: string;
    onGlobalFilterChange?: (value: string) => void;
    onSearchSubmit?: () => void;
    from?: number | null;
    to?: number | null;
    total?: number;
    /** Client-side defaults */
    initialPageSize?: number;
    getRowId?: (row: TData, index: number) => string;
};

function pageNumbers(current: number, last: number): number[] {
    if (last <= 7) {
        return Array.from({ length: last }, (_, i) => i + 1);
    }

    const pages = new Set<number>([1, last, current, current - 1, current + 1]);
    return [...pages].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b);
}

export default function DataTable<TData>({
    columns,
    data,
    empty = 'Sin registros',
    searchPlaceholder = 'Buscar…',
    filterSlot,
    toolbarExtra,
    showSearch = true,
    showPagination = true,
    manualPagination = false,
    manualFiltering = false,
    pageCount,
    pagination: controlledPagination,
    onPaginationChange,
    globalFilter: controlledGlobalFilter,
    onGlobalFilterChange,
    onSearchSubmit,
    from,
    to,
    total,
    initialPageSize = 20,
    getRowId,
}: DataTableProps<TData>) {
    const [internalPagination, setInternalPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: initialPageSize,
    });
    const [internalFilter, setInternalFilter] = useState('');
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const pagination = controlledPagination ?? internalPagination;
    const setPagination = onPaginationChange ?? setInternalPagination;
    const globalFilter = controlledGlobalFilter ?? internalFilter;

    const setGlobalFilter = (value: string) => {
        if (onGlobalFilterChange) {
            onGlobalFilterChange(value);
        } else {
            setInternalFilter(value);
            setInternalPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }
    };

    const table = useReactTable({
        data,
        columns,
        pageCount: manualPagination ? pageCount : undefined,
        state: {
            pagination,
            globalFilter,
            columnFilters,
        },
        onPaginationChange: setPagination,
        onGlobalFilterChange: (updater) => {
            const next =
                typeof updater === 'function' ? updater(globalFilter) : updater;
            setGlobalFilter(String(next ?? ''));
        },
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: manualPagination
            ? undefined
            : getPaginationRowModel(),
        getFilteredRowModel: manualFiltering ? undefined : getFilteredRowModel(),
        manualPagination,
        manualFiltering,
        getRowId,
    });

    useEffect(() => {
        if (!manualPagination) {
            table.setPageSize(initialPageSize);
        }
    }, [initialPageSize, manualPagination, table]);

    const rows = table.getRowModel().rows;
    const isEmpty = rows.length === 0;

    const rangeLabel = useMemo(() => {
        if (manualPagination) {
            if (!total) {
                return null;
            }
            const start = from ?? 0;
            const end = to ?? 0;
            return `Mostrando ${start}–${end} de ${total}`;
        }

        const filtered = table.getFilteredRowModel().rows.length;
        if (filtered === 0) {
            return null;
        }

        const start = pagination.pageIndex * pagination.pageSize + 1;
        const end = Math.min(start + pagination.pageSize - 1, filtered);
        return `Mostrando ${start}–${end} de ${filtered}`;
    }, [
        from,
        manualPagination,
        pagination.pageIndex,
        pagination.pageSize,
        table,
        to,
        total,
    ]);

    const currentPage = pagination.pageIndex + 1;
    const lastPage = manualPagination
        ? Math.max(1, pageCount ?? 1)
        : Math.max(1, table.getPageCount());

    const handleSearchSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        onSearchSubmit?.();
    };

    const showToolbar = showSearch || filterSlot || toolbarExtra || rangeLabel;

    return (
        <div className="space-y-3">
            {showToolbar && (
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                    {showSearch && (
                        <form
                            onSubmit={handleSearchSubmit}
                            className="min-w-0 flex-1 sm:min-w-[220px]"
                        >
                            <label className="mb-1 block text-xs font-medium text-[#6B7069]">
                                Buscar
                            </label>
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7069]" />
                                <TextInput
                                    className="block w-full pl-9"
                                    value={globalFilter}
                                    onChange={(e) => setGlobalFilter(e.target.value)}
                                    placeholder={searchPlaceholder}
                                />
                            </div>
                        </form>
                    )}
                    {filterSlot}
                    {toolbarExtra}
                    {rangeLabel && (
                        <p className="pb-2 text-xs text-[#6B7069] sm:ml-auto">
                            {rangeLabel}
                        </p>
                    )}
                </div>
            )}

            {isEmpty ? (
                <div className="unitra-card px-4 py-10 text-center text-sm text-[#6B7069]">
                    {empty}
                </div>
            ) : (
                <div className="unitra-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="unitra-table">
                            <thead>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <th
                                                key={header.id}
                                                className={
                                                    header.column.columnDef.meta
                                                        ?.headerClassName
                                                }
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column.columnDef
                                                              .header,
                                                          header.getContext(),
                                                      )}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.id}>
                                        {row.getVisibleCells().map((cell) => (
                                            <td
                                                key={cell.id}
                                                className={
                                                    cell.column.columnDef.meta
                                                        ?.cellClassName
                                                }
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext(),
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showPagination && lastPage > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                        type="button"
                        disabled={!table.getCanPreviousPage()}
                        onClick={() => table.previousPage()}
                        className="min-h-10 rounded-md border border-[#E3E5E0] bg-white px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#F5F6F3]"
                    >
                        Anterior
                    </button>
                    <div className="flex flex-wrap items-center gap-1">
                        {pageNumbers(currentPage, lastPage).map((page, index, all) => {
                            const prev = all[index - 1];
                            const showEllipsis = prev != null && page - prev > 1;

                            return (
                                <span key={page} className="flex items-center gap-1">
                                    {showEllipsis && (
                                        <span className="px-1 text-xs text-[#6B7069]">
                                            …
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => table.setPageIndex(page - 1)}
                                        className={`min-h-10 min-w-10 rounded-md border px-2 text-sm font-medium ${
                                            page === currentPage
                                                ? 'border-[#111315] bg-[#111315] text-white'
                                                : 'border-[#E3E5E0] bg-white hover:bg-[#F5F6F3]'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                </span>
                            );
                        })}
                    </div>
                    <button
                        type="button"
                        disabled={!table.getCanNextPage()}
                        onClick={() => table.nextPage()}
                        className="min-h-10 rounded-md border border-[#E3E5E0] bg-white px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#F5F6F3]"
                    >
                        Siguiente
                    </button>
                </div>
            )}
        </div>
    );
}
