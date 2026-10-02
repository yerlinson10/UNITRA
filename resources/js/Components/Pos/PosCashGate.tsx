import { Link } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';

type Props = {
    open: boolean;
};

export default function PosCashGate({ open }: Props) {
    if (open) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#D97706]/40 bg-[#D97706]/10 px-4 py-3 text-sm text-[#252925]">
            <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#D97706]" />
                <div>
                    <p className="font-medium">Caja cerrada</p>
                    <p className="text-[#6B7069]">
                        Abre una sesión de caja para poder completar ventas.
                    </p>
                </div>
            </div>
            <Link
                href={route('cash.index')}
                className="rounded-md bg-[#111315] px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
                Ir a Caja
            </Link>
        </div>
    );
}
