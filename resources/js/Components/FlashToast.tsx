import { usePage } from '@inertiajs/react';
import { CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PageProps } from '@/types';

export default function FlashToast() {
    const { flash } = usePage<PageProps>().props;
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [tone, setTone] = useState<'success' | 'error' | 'warning'>('success');

    useEffect(() => {
        const next =
            flash?.success || flash?.error || flash?.warning || flash?.message || null;

        if (!next) {
            setVisible(false);
            return;
        }

        setMessage(next);
        if (flash?.error) setTone('error');
        else if (flash?.warning) setTone('warning');
        else setTone('success');
        setVisible(true);

        const timer = window.setTimeout(() => setVisible(false), 4500);
        return () => window.clearTimeout(timer);
    }, [flash?.success, flash?.error, flash?.warning, flash?.message]);

    if (!visible || !message) return null;

    const styles = {
        success: 'border-[#22A06B]/30 bg-white text-[#252925]',
        error: 'border-[#DC4444]/30 bg-white text-[#252925]',
        warning: 'border-[#D97706]/30 bg-white text-[#252925]',
    }[tone];

    const Icon = {
        success: CheckCircle2,
        error: XCircle,
        warning: AlertTriangle,
    }[tone];

    const iconColor = {
        success: 'text-[#22A06B]',
        error: 'text-[#DC4444]',
        warning: 'text-[#D97706]',
    }[tone];

    return (
        <div className="pointer-events-none fixed right-4 top-4 z-50 w-full max-w-sm">
            <div
                className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${styles}`}
            >
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`} />
                <p className="flex-1 text-sm font-medium">{message}</p>
                <button
                    type="button"
                    onClick={() => setVisible(false)}
                    className="rounded p-0.5 text-[#6B7069] hover:bg-[#F5F6F3]"
                    aria-label="Cerrar"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
