export type UserRole = 'admin' | 'manager' | 'cashier' | 'viewer';

export type InventoryStatus =
    | 'available'
    | 'sold'
    | 'in_repair'
    | 'pending'
    | 'returned';

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'mixed';

export type CashMovementType = 'in' | 'out' | 'sale' | 'purchase' | 'adjustment';

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    role?: UserRole;
    store_id?: number | null;
    can_view_costs?: boolean;
}

export interface Store {
    id: number;
    name: string;
    code?: string;
    address?: string | null;
}

export interface Product {
    id: number;
    brand: string;
    model: string;
    storage?: string | null;
    color?: string | null;
    name?: string;
    created_at?: string;
    updated_at?: string;
}

export interface InventoryItem {
    id: number;
    imei: string;
    product_id: number;
    product?: Product;
    status: InventoryStatus;
    min_price?: number | null;
    cost?: number | null;
    condition?: string | null;
    notes?: string | null;
    purchase_id?: number | null;
    store_id?: number | null;
    created_at?: string;
    updated_at?: string;
}

export interface PurchaseLine {
    id?: number;
    product_id: number | string;
    product?: Product;
    imei: string;
    cost: number | string;
}

export interface Purchase {
    id: number;
    seller_name: string;
    seller_document?: string | null;
    seller_phone?: string | null;
    notes?: string | null;
    total_cost?: number;
    lines?: PurchaseLine[];
    items?: InventoryItem[];
    created_at?: string;
    user?: User;
}

export interface SaleItem {
    inventory_item_id: number;
    imei?: string;
    product_label?: string;
    price: number;
    inventory_item?: InventoryItem;
}

export interface TradeIn {
    id?: number;
    product_id?: number | string;
    product_label?: string;
    brand?: string;
    model?: string;
    storage?: string;
    color?: string;
    imei: string;
    condition: string;
    credited_value: number;
    seller_name?: string;
    seller_document?: string | null;
    seller_phone?: string | null;
}

export interface Invoice {
    id: number;
    number?: string;
    status: 'open' | 'paid' | 'void' | string;
    payment_method?: PaymentMethod | string;
    subtotal: number;
    trade_in_total?: number;
    amount_due: number;
    voided_at?: string | null;
    pdf_url?: string | null;
    items?: SaleItem[];
    trade_ins?: TradeIn[];
    created_at?: string;
    user?: User;
    customer_name?: string | null;
}

export interface CashSession {
    id: number;
    status: 'open' | 'closed';
    opening_amount: number;
    closing_amount?: number | null;
    opened_at?: string;
    closed_at?: string | null;
    user?: User;
}

export interface CashMovement {
    id: number;
    type: CashMovementType | string;
    amount: number;
    description?: string | null;
    created_at?: string;
    user?: User;
}

export interface MarginReportRow {
    imei: string;
    product_label?: string;
    cost: number;
    sale_price: number;
    margin: number;
    sold_at?: string;
}

export interface Paginated<T> {
    data: T[];
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    links?: Array<{ url: string | null; label: string; active: boolean }>;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    flash?: {
        success?: string | null;
        error?: string | null;
        warning?: string | null;
        message?: string | null;
    };
    canViewCosts?: boolean;
};
