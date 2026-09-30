/** Format: miles con coma, decimales con punto — ej. 12,500.50 */

export function parseNumericInput(display: string): string {
    if (!display) return '';

    let negative = false;
    let cleaned = display.trim();

    if (cleaned.startsWith('-')) {
        negative = true;
        cleaned = cleaned.slice(1);
    }

    cleaned = cleaned.replace(/,/g, '').replace(/[^\d.]/g, '');

    const parts = cleaned.split('.');
    if (parts.length > 2) {
        cleaned = `${parts[0]}.${parts.slice(1).join('')}`;
    }

    if (negative && cleaned !== '') {
        return `-${cleaned}`;
    }

    return cleaned;
}

export function formatNumericDisplay(
    raw: string,
    options: { maxDecimals?: number; allowTrailingDot?: boolean } = {},
): string {
    const { maxDecimals, allowTrailingDot = true } = options;

    if (raw === '' || raw === '-') return raw;

    const negative = raw.startsWith('-');
    const body = negative ? raw.slice(1) : raw;
    const endsWithDot = body.endsWith('.');
    const [intPart = '', ...rest] = body.split('.');
    let decPart = rest.join('');

    if (typeof maxDecimals === 'number') {
        decPart = decPart.slice(0, maxDecimals);
    }

    const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    let result = intFormatted;
    if (rest.length > 0 || (endsWithDot && allowTrailingDot)) {
        result = `${intFormatted}.${decPart}`;
    }

    return negative ? `-${result}` : result;
}

export function toNumber(raw: string): number {
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) ? n : 0;
}
