import { InventoryStatus } from '@/types';

const STATUS_LABELS: Record<InventoryStatus, string> = {
    available: 'Disponible',
    sold: 'Vendido',
    in_repair: 'Reparación',
    pending: 'Pendiente',
    returned: 'Devuelto',
};

const STATUS_CLASSES: Record<InventoryStatus, string> = {
    available: 'bg-[#22A06B]/15 text-[#22A06B] ring-[#22A06B]/30',
    sold: 'bg-[#111315]/10 text-[#111315] ring-[#111315]/20',
    in_repair: 'bg-[#D97706]/15 text-[#D97706] ring-[#D97706]/30',
    pending: 'bg-[#D97706]/15 text-[#D97706] ring-[#D97706]/30',
    returned: 'bg-[#DC4444]/15 text-[#DC4444] ring-[#DC4444]/30',
};

export default function StatusBadge({
    status,
    className = '',
}: {
    status: InventoryStatus | string;
    className?: string;
}) {
    const key = (status in STATUS_LABELS
        ? status
        : 'pending') as InventoryStatus;

    return (
        <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_CLASSES[key]} ${className}`}
        >
            {STATUS_LABELS[key] ?? status}
        </span>
    );
}
