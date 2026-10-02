import { InventoryItem, Product } from '@/types';

export type PosLookupItem = {
    id: number;
    imei: string;
    min_sale_price?: number | null;
    regular_sale_price?: number | null;
    cost?: number | null;
    condition_grade?: string | null;
    battery_health?: number | null;
    product?: {
        id?: number;
        name?: string | null;
        brand?: string;
        model?: string;
        storage?: string | null;
        color?: string | null;
    };
};

export type PosCartItem = {
    inventory_item_id: number;
    imei: string;
    product_label: string;
    sale_price: string;
    min_sale_price: number | null;
    regular_sale_price: number | null;
    cost: number | null;
    condition_grade: string | null;
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

export type PosAvailableItem = InventoryItem & {
    product?: Product & { name?: string | null };
};

export const CONDITION_GRADES = [
    'Como nuevo',
    'Grado A',
    'Grado B',
    'Grado C',
] as const;

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
    product?: {
        name?: string | null;
        brand?: string;
        model?: string;
        storage?: string | null;
        color?: string | null;
    } | null,
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
        product_label: productLabel(item.product, `Unidad ${item.imei}`),
        sale_price: defaultSalePrice(item.regular_sale_price, item.min_sale_price),
        min_sale_price: toNullableNumber(item.min_sale_price),
        regular_sale_price: toNullableNumber(item.regular_sale_price),
        cost: toNullableNumber(item.cost),
        condition_grade: item.condition_grade ?? null,
    };
}

export function availableToCartItem(item: PosAvailableItem): PosCartItem {
    const min =
        item.min_sale_price != null
            ? Number(item.min_sale_price)
            : item.min_price != null
              ? Number(item.min_price)
              : null;

    return {
        inventory_item_id: item.id,
        imei: item.imei,
        product_label: productLabel(item.product, `Unidad ${item.imei}`),
        sale_price: defaultSalePrice(item.regular_sale_price, min),
        min_sale_price: min,
        regular_sale_price: toNullableNumber(item.regular_sale_price),
        cost: item.cost != null ? Number(item.cost) : null,
        condition_grade: item.condition_grade ?? item.condition ?? null,
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
