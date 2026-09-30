import {
    formatNumericDisplay,
    parseNumericInput,
} from '@/lib/numberFormat';
import { cn } from '@/lib/utils';
import {
    ChangeEvent,
    FocusEvent,
    InputHTMLAttributes,
    forwardRef,
    useEffect,
    useState,
} from 'react';

type NumberInputProps = Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'type' | 'value' | 'onChange' | 'inputMode'
> & {
    value: string;
    onValueChange: (raw: string) => void;
    /** Máximo de decimales. `0` = solo enteros. Default `2`. */
    decimals?: number;
    className?: string;
};

/**
 * Input numérico con miles por coma y decimales por punto.
 * `value` / `onValueChange` usan el valor crudo sin comas (ej. "12500.5").
 */
const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
    function NumberInput(
        {
            value,
            onValueChange,
            decimals = 2,
            className = '',
            onBlur,
            onFocus,
            ...props
        },
        ref,
    ) {
        const [focused, setFocused] = useState(false);
        const [display, setDisplay] = useState(() =>
            formatNumericDisplay(value, {
                maxDecimals: decimals,
                allowTrailingDot: false,
            }),
        );

        useEffect(() => {
            if (!focused) {
                setDisplay(
                    formatNumericDisplay(value, {
                        maxDecimals: decimals,
                        allowTrailingDot: false,
                    }),
                );
            }
        }, [value, decimals, focused]);

        const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
            const raw = parseNumericInput(e.target.value);

            if (decimals === 0) {
                const intOnly = raw.replace(/\./g, '');
                onValueChange(intOnly);
                setDisplay(
                    formatNumericDisplay(intOnly, {
                        maxDecimals: 0,
                        allowTrailingDot: false,
                    }),
                );
                return;
            }

            const [intPart, decPart] = raw.replace(/^-/, '').split('.');
            if (decPart !== undefined && decPart.length > decimals) {
                const clipped = `${raw.startsWith('-') ? '-' : ''}${intPart}.${decPart.slice(0, decimals)}`;
                onValueChange(clipped);
                setDisplay(
                    formatNumericDisplay(clipped, {
                        maxDecimals: decimals,
                        allowTrailingDot: false,
                    }),
                );
                return;
            }

            onValueChange(raw);
            setDisplay(
                formatNumericDisplay(raw, {
                    maxDecimals: decimals,
                    allowTrailingDot: true,
                }),
            );
        };

        const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
            setFocused(true);
            onFocus?.(e);
        };

        const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
            setFocused(false);
            const normalized = formatNumericDisplay(value, {
                maxDecimals: decimals,
                allowTrailingDot: false,
            });
            setDisplay(normalized);
            onBlur?.(e);
        };

        return (
            <input
                {...props}
                ref={ref}
                type="text"
                inputMode={decimals === 0 ? 'numeric' : 'decimal'}
                value={display}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className={cn('unitra-input', className)}
            />
        );
    },
);

export default NumberInput;
