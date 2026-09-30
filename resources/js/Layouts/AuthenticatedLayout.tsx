import FlashToast from '@/Components/FlashToast';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Package,
    Boxes,
    ShoppingCart,
    Store,
    Receipt,
    Wallet,
    BarChart3,
    LogOut,
    Menu,
    X,
} from 'lucide-react';
import { PropsWithChildren, ReactNode, useMemo, useState } from 'react';
import { PageProps } from '@/types';

type NavItem = {
    label: string;
    href: string;
    icon: typeof LayoutDashboard;
    match: string[];
};

const NAV: NavItem[] = [
    {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        match: ['dashboard', '/dashboard'],
    },
    {
        label: 'Productos',
        href: '/inventory',
        icon: Boxes,
        match: ['inventory', '/inventory'],
    },
    {
        label: 'Marca',
        href: '/products',
        icon: Package,
        match: ['products', '/products'],
    },
    {
        label: 'Compras',
        href: '/purchases',
        icon: ShoppingCart,
        match: ['purchases', '/purchases'],
    },
    {
        label: 'POS',
        href: '/pos',
        icon: Store,
        match: ['pos', '/pos'],
    },
    {
        label: 'Ventas',
        href: '/invoices',
        icon: Receipt,
        match: ['invoices', '/invoices'],
    },
    {
        label: 'Caja',
        href: '/cash',
        icon: Wallet,
        match: ['cash', '/cash'],
    },
    {
        label: 'Reportes',
        href: '/reports',
        icon: BarChart3,
        match: ['reports', '/reports'],
    },
];

function isActive(match: string[], url: string, component?: string) {
    const path = url.split('?')[0];
    if (match.some((m) => path === m || path.startsWith(`${m}/`))) return true;
    if (component) {
        const lower = component.toLowerCase();
        return match.some((m) => lower.startsWith(m.replace('/', '')));
    }
    return false;
}

const ROLE_LABELS: Record<string, string> = {
    admin: 'Admin',
    manager: 'Gerente',
    cashier: 'Cajero',
    viewer: 'Visor',
};

export default function AuthenticatedLayout({
    children,
    header,
    title,
}: PropsWithChildren<{ header?: ReactNode; title?: string }>) {
    const page = usePage<PageProps>();
    const user = page.props.auth.user;
    const [mobileOpen, setMobileOpen] = useState(false);

    const roleLabel = useMemo(
        () => ROLE_LABELS[user.role ?? ''] ?? user.role ?? 'Usuario',
        [user.role],
    );

    const NavList = ({ onNavigate }: { onNavigate?: () => void }) => (
        <nav className="flex flex-1 flex-col gap-0.5 px-2 py-3">
            {NAV.map((item) => {
                const active = isActive(
                    item.match,
                    page.url,
                    page.component,
                );
                const Icon = item.icon;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        className={`group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                            active
                                ? 'bg-white/10 text-white'
                                : 'text-white/70 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        {active && (
                            <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-[#B8E34B]" />
                        )}
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="font-medium">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );

    return (
        <div className="flex min-h-screen bg-[#F5F6F3]">
            <FlashToast />

            {/* Desktop sidebar */}
            <aside className="hidden w-56 shrink-0 flex-col bg-[#111315] text-white lg:flex">
                <div className="flex h-14 items-center border-b border-white/10 px-4">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded border border-[#B8E34B]/40 text-xs font-bold text-[#B8E34B]">
                            U
                        </span>
                        <span className="font-display text-xl font-semibold tracking-wider">
                            UNITRA
                        </span>
                    </Link>
                </div>
                <NavList />
                <div className="border-t border-white/10 px-4 py-3 text-[11px] text-white/40">
                    Inventory · Trade-In · POS
                </div>
            </aside>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div className="fixed inset-0 z-40 flex lg:hidden">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setMobileOpen(false)}
                        aria-label="Cerrar menú"
                    />
                    <aside className="relative z-10 flex h-full w-64 flex-col bg-[#111315] text-white">
                        <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
                            <span className="font-display text-xl font-semibold tracking-wider">
                                UNITRA
                            </span>
                            <button
                                type="button"
                                onClick={() => setMobileOpen(false)}
                                className="rounded p-1 text-white/70 hover:bg-white/10"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <NavList onNavigate={() => setMobileOpen(false)} />
                    </aside>
                </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex h-14 items-center justify-between border-b border-[#E3E5E0] bg-white px-4">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            className="rounded p-1.5 text-[#6B7069] hover:bg-[#F5F6F3] lg:hidden"
                            onClick={() => setMobileOpen(true)}
                            aria-label="Abrir menú"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <div className="min-w-0">
                            {title ? (
                                <p className="truncate text-sm font-medium text-[#252925]">
                                    {title}
                                </p>
                            ) : header ? (
                                header
                            ) : (
                                <p className="text-sm text-[#6B7069]">
                                    UNITRA POS
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-medium leading-tight text-[#252925]">
                                {user.name}
                            </p>
                            <p className="text-xs text-[#6B7069]">{roleLabel}</p>
                        </div>
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="inline-flex items-center gap-1.5 rounded-md border border-[#E3E5E0] px-2.5 py-1.5 text-xs font-medium text-[#252925] transition hover:bg-[#F5F6F3] active:scale-[0.97]"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                            Salir
                        </Link>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
            </div>
        </div>
    );
}
