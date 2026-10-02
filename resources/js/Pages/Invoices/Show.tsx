import DataTable from '@/Components/DataTable';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Invoice, PageProps, SaleItem, TradeIn } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Download, Printer, Share2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type PrintFormat = '80mm' | 'a4';

type Props = PageProps<{
    invoice: Invoice;
    canVoid?: boolean;
    defaultPrintFormat?: PrintFormat;
    autoPrint?: boolean;
    printFormat?: PrintFormat;
}>;

export default function InvoicesShow({
    invoice,
    auth,
    canVoid: canVoidProp,
    defaultPrintFormat = '80mm',
    autoPrint = false,
    printFormat,
}: Props) {
    const isAdmin = auth.user.role === 'admin';
    const canVoid =
        canVoidProp ?? (isAdmin && invoice.status !== 'void');
    const items = invoice.items ?? [];
    const tradeIns = invoice.trade_ins ?? [];

    const [format, setFormat] = useState<PrintFormat>(
        printFormat === 'a4' || printFormat === '80mm'
            ? printFormat
            : defaultPrintFormat,
    );
    const [pdfStatus, setPdfStatus] = useState(
        invoice.pdf_status ?? (invoice.pdf_url ? 'ready' : 'pending'),
    );
    const [pdfUrl, setPdfUrl] = useState(invoice.pdf_url ?? null);
    const [sharing, setSharing] = useState(false);
    const [shareMessage, setShareMessage] = useState<string | null>(null);
    const autoPrintDone = useRef(false);

    const voidInvoice = () => {
        const reason = window.prompt(
            'Motivo de anulación (obligatorio):',
            'Error de venta',
        );
        if (!reason?.trim()) {
            return;
        }
        if (!confirm('¿Anular esta factura? Esta acción no se puede deshacer.')) {
            return;
        }
        router.post(`/invoices/${invoice.id}/void`, {
            void_reason: reason.trim(),
        });
    };

    const openPrint = (selected: PrintFormat = format, auto = false) => {
        const url = route('invoices.print', {
            invoice: invoice.id,
            format: selected,
            ...(auto ? { auto: 1 } : {}),
        });
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    useEffect(() => {
        if (!autoPrint || autoPrintDone.current) {
            return;
        }
        autoPrintDone.current = true;
        const selected =
            printFormat === 'a4' || printFormat === '80mm'
                ? printFormat
                : format;
        openPrint(selected, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoPrint]);

    useEffect(() => {
        if (pdfStatus === 'ready' && pdfUrl) {
            return;
        }

        let cancelled = false;
        let timer: ReturnType<typeof setTimeout> | undefined;

        const poll = async () => {
            try {
                const response = await fetch(
                    route('invoices.pdf-status', invoice.id),
                    {
                        headers: { Accept: 'application/json' },
                        credentials: 'same-origin',
                    },
                );
                if (!response.ok || cancelled) {
                    return;
                }
                const data = (await response.json()) as {
                    pdf_status: string;
                    pdf_url: string | null;
                    ready: boolean;
                };
                setPdfStatus(data.pdf_status);
                setPdfUrl(data.pdf_url);
                if (!data.ready && !cancelled) {
                    timer = setTimeout(poll, 2000);
                }
            } catch {
                if (!cancelled) {
                    timer = setTimeout(poll, 3000);
                }
            }
        };

        poll();

        return () => {
            cancelled = true;
            if (timer) {
                clearTimeout(timer);
            }
        };
    }, [invoice.id, pdfStatus, pdfUrl]);

    const downloadPdf = () => {
        if (!pdfUrl) {
            return;
        }
        window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    };

    const shareInvoice = async () => {
        if (!pdfUrl) {
            setShareMessage('El PDF aún se está generando…');
            return;
        }

        setSharing(true);
        setShareMessage(null);

        try {
            const response = await fetch(pdfUrl, {
                credentials: 'same-origin',
            });
            if (!response.ok) {
                throw new Error('No se pudo obtener el PDF');
            }
            const blob = await response.blob();
            const fileName = `${invoice.number ?? `factura-${invoice.id}`}.pdf`;
            const file = new File([blob], fileName, {
                type: 'application/pdf',
            });

            const nav = navigator as Navigator & {
                canShare?: (data?: ShareData) => boolean;
            };

            if (
                typeof navigator.share === 'function' &&
                (!nav.canShare || nav.canShare({ files: [file] }))
            ) {
                await navigator.share({
                    title: `Factura ${invoice.number ?? invoice.id}`,
                    text: `Factura ${invoice.number ?? invoice.id}`,
                    files: [file],
                });
                setShareMessage('Compartido.');
                return;
            }

            if (typeof navigator.share === 'function') {
                await navigator.share({
                    title: `Factura ${invoice.number ?? invoice.id}`,
                    text: `Factura ${invoice.number ?? invoice.id}`,
                    url: pdfUrl,
                });
                setShareMessage('Enlace compartido.');
                return;
            }

            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(
                    new URL(pdfUrl, window.location.origin).toString(),
                );
                setShareMessage('Enlace del PDF copiado. También puedes descargarlo.');
            } else {
                setShareMessage('Usa Descargar PDF para guardar el documento.');
            }
            downloadPdf();
        } catch (error) {
            if ((error as Error)?.name === 'AbortError') {
                setShareMessage(null);
            } else {
                setShareMessage(
                    'No se pudo compartir. Descarga el PDF e intenta de nuevo.',
                );
            }
        } finally {
            setSharing(false);
        }
    };

    const itemColumns = useMemo<ColumnDef<SaleItem>[]>(
        () => [
            {
                id: 'product',
                header: 'Producto',
                accessorFn: (row) =>
                    row.product_label ?? row.product_name ?? '',
                cell: ({ row }) =>
                    row.original.product_label ??
                    row.original.product_name ??
                    '—',
            },
            {
                id: 'imei',
                header: 'IMEI',
                accessorFn: (row) => row.imei ?? row.inventory_item?.imei ?? '',
                cell: ({ row }) => (
                    <span className="font-mono text-xs">
                        {row.original.imei ??
                            row.original.inventory_item?.imei ??
                            '—'}
                    </span>
                ),
            },
            {
                id: 'warranty',
                header: 'Garantía',
                cell: ({ row }) => {
                    const item = row.original;
                    const date =
                        item.warranty_expires_at ??
                        item.inventory_item?.warranty_expires_at ??
                        null;
                    return (
                        <span className="text-xs">
                            {date
                                ? new Date(`${date}T12:00:00`).toLocaleDateString(
                                      'es-DO',
                                  )
                                : '—'}
                        </span>
                    );
                },
            },
            {
                id: 'price',
                header: 'Precio',
                cell: ({ row }) => (
                    <Money
                        amount={
                            row.original.price ?? row.original.sale_price ?? null
                        }
                    />
                ),
            },
        ],
        [],
    );

    const tradeInColumns = useMemo<ColumnDef<TradeIn>[]>(
        () => [
            {
                id: 'equipment',
                header: 'Equipo',
                accessorFn: (row) =>
                    row.product_label ||
                    [row.brand, row.model].filter(Boolean).join(' ') ||
                    '',
                cell: ({ row }) =>
                    row.original.product_label ||
                    [row.original.brand, row.original.model]
                        .filter(Boolean)
                        .join(' ') ||
                    '—',
            },
            {
                accessorKey: 'imei',
                header: 'IMEI',
                cell: ({ getValue }) => (
                    <span className="font-mono text-xs">
                        {getValue() as string}
                    </span>
                ),
            },
            {
                accessorKey: 'condition',
                header: 'Condición',
            },
            {
                accessorKey: 'credited_value',
                header: 'Crédito',
                cell: ({ row }) => <Money amount={row.original.credited_value} />,
            },
        ],
        [],
    );

    const pdfReady = pdfStatus === 'ready' && Boolean(pdfUrl);

    return (
        <AuthenticatedLayout title={`Factura ${invoice.number ?? invoice.id}`}>
            <Head title={`Factura ${invoice.number ?? invoice.id}`} />

            <PageHeader
                title={invoice.number ?? `Factura #${invoice.id}`}
                subtitle={
                    invoice.status === 'void'
                        ? 'Anulada'
                        : invoice.created_at
                          ? new Date(invoice.created_at).toLocaleString('es-DO')
                          : undefined
                }
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={route('pos.index')}
                            className="inline-flex items-center gap-1.5 rounded-md bg-[#B8E34B] px-3 py-2 text-sm font-semibold text-[#111315] hover:opacity-90"
                        >
                            Nueva venta
                        </Link>
                        <label className="inline-flex items-center gap-1.5 rounded-md border border-[#E3E5E0] bg-white px-2 py-1.5 text-sm">
                            <span className="sr-only">Formato</span>
                            <select
                                value={format}
                                onChange={(e) =>
                                    setFormat(e.target.value as PrintFormat)
                                }
                                className="border-0 bg-transparent text-sm focus:outline-none focus:ring-0"
                            >
                                <option value="80mm">80mm</option>
                                <option value="a4">A4</option>
                            </select>
                        </label>
                        <button
                            type="button"
                            onClick={() => openPrint(format)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-[#E3E5E0] bg-white px-3 py-2 text-sm font-medium hover:bg-[#F5F6F3]"
                        >
                            <Printer className="h-4 w-4" />
                            Imprimir
                        </button>
                        <button
                            type="button"
                            onClick={downloadPdf}
                            disabled={!pdfReady}
                            className="inline-flex items-center gap-1.5 rounded-md border border-[#E3E5E0] bg-white px-3 py-2 text-sm font-medium hover:bg-[#F5F6F3] disabled:cursor-not-allowed disabled:opacity-50"
                            title={
                                pdfReady
                                    ? 'Descargar PDF'
                                    : 'Preparando PDF…'
                            }
                        >
                            <Download className="h-4 w-4" />
                            {pdfReady ? 'Descargar PDF' : 'Preparando…'}
                        </button>
                        <button
                            type="button"
                            onClick={shareInvoice}
                            disabled={!pdfReady || sharing}
                            className="inline-flex items-center gap-1.5 rounded-md border border-[#E3E5E0] bg-white px-3 py-2 text-sm font-medium hover:bg-[#F5F6F3] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Share2 className="h-4 w-4" />
                            {sharing ? 'Compartiendo…' : 'Compartir'}
                        </button>
                        {canVoid && (
                            <button
                                type="button"
                                onClick={voidInvoice}
                                className="rounded-md border border-[#DC4444]/40 px-3 py-2 text-sm font-medium text-[#DC4444] hover:bg-[#DC4444]/5"
                            >
                                Anular
                            </button>
                        )}
                        <Link
                            href="/invoices"
                            className="rounded-md border border-[#E3E5E0] bg-white px-3 py-2 text-sm font-medium hover:bg-[#F5F6F3]"
                        >
                            Volver
                        </Link>
                    </div>
                }
            />

            {shareMessage && (
                <p className="mb-4 text-sm text-[#6B7069]">{shareMessage}</p>
            )}

            <div className="mb-5 grid gap-4 sm:grid-cols-3">
                <div className="unitra-card p-4">
                    <p className="text-xs uppercase tracking-wide text-[#6B7069]">
                        Subtotal
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold">
                        <Money amount={invoice.subtotal} />
                    </p>
                </div>
                <div className="unitra-card p-4">
                    <p className="text-xs uppercase tracking-wide text-[#6B7069]">
                        Trade-In
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold">
                        <Money
                            amount={
                                invoice.trade_in_credit ??
                                invoice.trade_in_total ??
                                0
                            }
                        />
                    </p>
                </div>
                <div className="unitra-card p-4">
                    <p className="text-xs uppercase tracking-wide text-[#6B7069]">
                        A pagar
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold">
                        <Money amount={invoice.amount_due} />
                    </p>
                </div>
            </div>

            <h2 className="mb-2 font-display text-lg font-semibold uppercase tracking-wide">
                Ítems
            </h2>
            <DataTable
                columns={itemColumns}
                data={items}
                empty="Sin ítems."
                searchPlaceholder="Producto o IMEI…"
                initialPageSize={25}
                showPagination={items.length > 25}
            />

            {tradeIns.length > 0 && (
                <>
                    <h2 className="mb-2 mt-6 font-display text-lg font-semibold uppercase tracking-wide">
                        Trade-Ins
                    </h2>
                    <DataTable
                        columns={tradeInColumns}
                        data={tradeIns}
                        searchPlaceholder="Equipo o IMEI…"
                        initialPageSize={25}
                        showPagination={tradeIns.length > 25}
                    />
                </>
            )}
        </AuthenticatedLayout>
    );
}
