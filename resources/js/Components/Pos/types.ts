export type PosProductInfo = {
    id?: number;
    name?: string | null;
    brand?: string;
    model?: string;
    storage?: string | null;
    color?: string | null;
};

export type PosLookupItem = {
    id: number;
    imei: string;
    serial?: string | null;
    min_sale_price?: number | null;
    regular_sale_price?: number | null;
    cost?: number | null;
    condition_grade?: string | null;
    battery_health?: number | null;
    purchased_at?: string | null;
    warranty_months?: number | null;
    warranty_expires_at?: string | null;
    origin?: string | null;
    notes?: string | null;
    status?: string | null;
    product?: PosProductInfo;
};

export type PosCartItem = {
    inventory_item_id: number;
    imei: string;
    serial: string | null;
    product_label: string;
    brand: string | null;
    model: string | null;
    storage: string | null;
    color: string | null;
    sale_price: string;
    min_sale_price: number | null;
    regular_sale_price: number | null;
    cost: number | null;
    condition_grade: string | null;
    battery_health: number | null;
    purchased_at: string | null;
    warranty_months: number | null;
    warranty_expires_at: string | null;
    origin: string | null;
    notes: string | null;
    status: string | null;
};

export type PosTradeInForm = {
    product_id: string;
    imei: string;
    serial: string;
    condition_grade: string;
    battery_health: string;
    credited_value: string;
    min_sale_price: string;
    regular_sale_price: string;
    notes: string;
    seller_name: string;
    seller_id_type: string;
    seller_id_number: string;
    seller_phone: string;
};

export type PosDeviceDetails = {
    product_label: string;
    brand: string | null;
    model: string | null;
    storage: string | null;
    color: string | null;
    imei: string;
    serial: string | null;
    condition_grade: string | null;
    battery_health: number | null;
    status: string | null;
    origin: string | null;
    purchased_at: string | null;
    warranty_months: number | null;
    warranty_expires_at: string | null;
    notes: string | null;
    min_sale_price: number | null;
    regular_sale_price: number | null;
    cost: number | null;
};

export const CONDITION_GRADES = [
    'Como nuevo',
    'Grado A',
    'Grado B',
    'Grado C',
] as const;

export const ORIGIN_LABELS: Record<string, string> = {
    purchase: 'Compra',
    trade_in: 'Trade-In',
    other: 'Otro',
};

export function emptyTradeIn(): PosTradeInForm {
    return {
        product_id: '',
        imei: '',
        serial: '',
        condition_grade: '',
        battery_health: '',
        credited_value: '',
        min_sale_price: '',
        regular_sale_price: '',
        notes: '',
        seller_name: '',
        seller_id_type: 'cedula',
        seller_id_number: '',
        seller_phone: '',
    };
}

export function productLabel(
    product?: PosProductInfo | null,
    fallback = 'Unidad',
): string {
    if (!product) {
        return fallback;
    }

    if (product.name) {
        return product.name;
    }

    const composed = [product.brand, product.model, product.storage, product.color]
        .filter(Boolean)
        .join(' · ');

    return composed || fallback;
}

function toNullableNumber(value: number | null | undefined): number | null {
    return value !== undefined && value !== null ? Number(value) : null;
}

function defaultSalePrice(
    regular: number | null | undefined,
    min: number | null | undefined,
): string {
    if (regular !== undefined && regular !== null) {
        return String(regular);
    }

    if (min !== undefined && min !== null) {
        return String(min);
    }

    return '';
}

export function lookupToCartItem(item: PosLookupItem): PosCartItem {
    return {
        inventory_item_id: item.id,
        imei: item.imei,
        serial: item.serial ?? null,
        product_label: productLabel(item.product, `Unidad ${item.imei}`),
        brand: item.product?.brand ?? null,
        model: item.product?.model ?? null,
        storage: item.product?.storage ?? null,
        color: item.product?.color ?? null,
        sale_price: defaultSalePrice(item.regular_sale_price, item.min_sale_price),
        min_sale_price: toNullableNumber(item.min_sale_price),
        regular_sale_price: toNullableNumber(item.regular_sale_price),
        cost: toNullableNumber(item.cost),
        condition_grade: item.condition_grade ?? null,
        battery_health: toNullableNumber(item.battery_health),
        purchased_at: item.purchased_at ?? null,
        warranty_months: toNullableNumber(item.warranty_months),
        warranty_expires_at: item.warranty_expires_at ?? null,
        origin: item.origin ?? null,
        notes: item.notes ?? null,
        status: item.status ?? null,
    };
}

export function cartToDeviceDetails(item: PosCartItem): PosDeviceDetails {
    return {
        product_label: item.product_label,
        brand: item.brand,
        model: item.model,
        storage: item.storage,
        color: item.color,
        imei: item.imei,
        serial: item.serial,
        condition_grade: item.condition_grade,
        battery_health: item.battery_health,
        status: item.status,
        origin: item.origin,
        purchased_at: item.purchased_at,
        warranty_months: item.warranty_months,
        warranty_expires_at: item.warranty_expires_at,
        notes: item.notes,
        min_sale_price: item.min_sale_price,
        regular_sale_price: item.regular_sale_price,
        cost: item.cost,
    };
}

export function lookupToDeviceDetails(item: PosLookupItem): PosDeviceDetails {
    return {
        product_label: productLabel(item.product, `Unidad ${item.imei}`),
        brand: item.product?.brand ?? null,
        model: item.product?.model ?? null,
        storage: item.product?.storage ?? null,
        color: item.product?.color ?? null,
        imei: item.imei,
        serial: item.serial ?? null,
        condition_grade: item.condition_grade ?? null,
        battery_health: toNullableNumber(item.battery_health),
        status: item.status ?? null,
        origin: item.origin ?? null,
        purchased_at: item.purchased_at ?? null,
        warranty_months: toNullableNumber(item.warranty_months),
        warranty_expires_at: item.warranty_expires_at ?? null,
        notes: item.notes ?? null,
        min_sale_price: toNullableNumber(item.min_sale_price),
        regular_sale_price: toNullableNumber(item.regular_sale_price),
        cost: toNullableNumber(item.cost),
    };
}

export function isBelowMinPrice(item: PosCartItem): boolean {
    if (item.min_sale_price === null) {
        return false;
    }

    const price = Number.parseFloat(item.sale_price);

    return Number.isFinite(price) && price < item.min_sale_price;
}

export function pricesMatch(
    salePrice: string,
    target: number | null,
): boolean {
    if (target === null) {
        return false;
    }

    const price = Number.parseFloat(salePrice);

    return Number.isFinite(price) && Math.abs(price - target) < 0.005;
}

export function cartPriceShortcut(item: PosCartItem): 'min' | 'regular' | null {
    const atRegular = pricesMatch(item.sale_price, item.regular_sale_price);
    const atMin = pricesMatch(item.sale_price, item.min_sale_price);

    if (!atRegular && item.regular_sale_price !== null) {
        return 'regular';
    }

    if (!atMin && item.min_sale_price !== null) {
        return 'min';
    }

    return null;
}
