import { Paginated, TableFilters } from '@/types';
import { router } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type UseServerTableOptions = {
    url: string;
    paginated?: Paginated<unknown> | null;
    filters?: TableFilters;
    only?: string[];
    searchKey?: string;
    pageKey?: string;
    debounceMs?: number;
};

function cleanParams(
    params: Record<string, string | number | undefined | null>,
): Record<string, string | number> {
    return Object.fromEntries(
        Object.entries(params).filter(
            ([, value]) => value !== undefined && value !== null && value !== '',
        ),
    ) as Record<string, string | number>;
}

export function useServerTable({
    url,
    paginated,
    filters = {},
    only,
    searchKey = 'search',
    pageKey = 'page',
    debounceMs = 300,
}: UseServerTableOptions) {
    const initialSearch = filters[searchKey] ?? '';
    const [searchInput, setSearchInput] = useState(initialSearch);
    const [localFilters, setLocalFilters] = useState<TableFilters>(() => {
        const next = { ...filters };
        delete next[searchKey];
        return next;
    });
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const filtersRef = useRef(localFilters);
    filtersRef.current = localFilters;

    useEffect(() => {
        setSearchInput(filters[searchKey] ?? '');
        const next = { ...filters };
        delete next[searchKey];
        setLocalFilters(next);
    }, [filters, searchKey]);

    const visit = useCallback(
        (params: Record<string, string | number | undefined | null>) => {
            router.get(url, cleanParams(params), {
                preserveState: true,
                replace: true,
                preserveScroll: true,
                ...(only ? { only } : {}),
            });
        },
        [only, url],
    );

    const apply = useCallback(
        (overrides: {
            search?: string;
            page?: number;
            filters?: TableFilters;
        } = {}) => {
            const nextFilters = overrides.filters ?? filtersRef.current;
            visit({
                ...nextFilters,
                [searchKey]:
                    overrides.search !== undefined
                        ? overrides.search
                        : searchInput,
                [pageKey]: overrides.page ?? 1,
            });
        },
        [pageKey, searchInput, searchKey, visit],
    );

    const setSearch = useCallback(
        (value: string) => {
            setSearchInput(value);
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
            debounceRef.current = setTimeout(() => {
                visit({
                    ...filtersRef.current,
                    [searchKey]: value,
                    [pageKey]: 1,
                });
            }, debounceMs);
        },
        [debounceMs, pageKey, searchKey, visit],
    );

    const submitSearch = useCallback(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        apply({ search: searchInput, page: 1 });
    }, [apply, searchInput]);

    const setFilter = useCallback(
        (key: string, value: string) => {
            const next = {
                ...filtersRef.current,
                [key]: value || undefined,
            };
            setLocalFilters(next);
            visit({
                ...next,
                [searchKey]: searchInput,
                [pageKey]: 1,
            });
        },
        [pageKey, searchInput, searchKey, visit],
    );

    const setPage = useCallback(
        (page: number) => {
            apply({ page });
        },
        [apply],
    );

    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    const pagination = useMemo(
        () => ({
            pageIndex: Math.max(0, (paginated?.current_page ?? 1) - 1),
            pageSize: paginated?.per_page ?? 20,
        }),
        [paginated?.current_page, paginated?.per_page],
    );

    return {
        search: searchInput,
        setSearch,
        submitSearch,
        filters: localFilters,
        setFilter,
        setPage,
        pagination,
        pageCount: paginated?.last_page ?? 1,
        from: paginated?.from ?? null,
        to: paginated?.to ?? null,
        total: paginated?.total ?? 0,
        links: paginated?.links ?? [],
    };
}
