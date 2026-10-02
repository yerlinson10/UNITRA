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
    Settings,
    Users,
} from 'lucide-react';
import { PropsWithChildren, ReactNode, useMemo, useState } from 'react';
import { PageProps } from '@/types';

type NavItem = {
    label: string;
    href: string;
    icon: typeof LayoutDashboard;
    match: string[];
    adminOnly?: boolean;
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
        adminOnly: true,
    },
    {
        label: 'Mi tienda',
        href: '/settings/store',
        icon: Settings,
        match: ['settings/store', '/settings/store'],
        adminOnly: true,
    },
    {
        label: 'Usuarios',
        href: '/settings/users',
        icon: Users,
        match: ['settings/users', '/settings/users'],
        adminOnly: true,
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

type SharedAuth = PageProps & {
    auth: {
        user: PageProps['auth']['user'] & {
            store?: {
                id: number;
                name: string;
                code?: string;
                logo_url?: string | null;
            } | null;
        };
    };
    canManageStore?: boolean;
    canManageUsers?: boolean;
};

export default function AuthenticatedLayout({
    children,
    header,
    title,
}: PropsWithChildren<{ header?: ReactNode; title?: string }>) {
    const page = usePage<SharedAuth>();
    const user = page.props.auth.user;
    const [mobileOpen, setMobileOpen] = useState(false);
    const canManageStore = page.props.canManageStore ?? user.role === 'admin';
    const canManageUsers = page.props.canManageUsers ?? user.role === 'admin';
    const storeName = user.store?.name ?? 'UNITRA';
    const storeLogo = user.store?.logo_url ?? null;

    const roleLabel = useMemo(
        () => ROLE_LABELS[user.role ?? ''] ?? user.role ?? 'Usuario',
        [user.role],
    );

    const navItems = useMemo(
        () =>
            NAV.filter((item) => {
                if (!item.adminOnly) {
                    return true;
                }
                if (item.href === '/settings/store') {
                    return canManageStore;
                }
                if (item.href === '/settings/users') {
                    return canManageUsers;
                }
                return user.role === 'admin';
            }),
        [canManageStore, canManageUsers, user.role],
    );

    const BrandMark = () => (
        <Link href="/dashboard" className="flex items-center gap-2">
            {storeLogo ? (
                <img
                    src={storeLogo}
                    alt={storeName}
                    className="h-7 w-7 rounded object-contain"
                />
            ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded border border-[#B8E34B]/40 text-xs font-bold text-[#B8E34B]">
                    {(storeName[0] ?? 'U').toUpperCase()}
                </span>
            )}
            <span className="truncate font-display text-xl font-semibold tracking-wider">
                {storeName}
            </span>
        </Link>
    );

    const NavList = ({ onNavigate }: { onNavigate?: () => void }) => (
        <nav className="flex flex-1 flex-col gap-0.5 px-2 py-3">
            {navItems.map((item) => {
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

            <aside className="hidden w-56 shrink-0 flex-col bg-[#111315] text-white lg:flex">
                <div className="flex h-14 items-center border-b border-white/10 px-4">
                    <BrandMark />
                </div>
                <NavList />
                <div className="border-t border-white/10 px-4 py-3 text-[11px] text-white/40">
                    Inventory · Trade-In · POS
                </div>
            </aside>

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
                            <BrandMark />
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
                                    {storeName} POS
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
