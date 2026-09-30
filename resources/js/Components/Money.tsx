export default function Money({
    amount,
    className = '',
    currency = 'DOP',
}: {
    amount?: number | string | null;
    className?: string;
    currency?: string;
}) {
    const value =
        typeof amount === 'string' ? Number.parseFloat(amount) : (amount ?? 0);

    const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0);

    return <span className={`tabular-nums ${className}`}>{formatted}</span>;
}
