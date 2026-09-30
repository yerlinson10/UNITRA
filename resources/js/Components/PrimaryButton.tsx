import { ButtonHTMLAttributes } from 'react';

export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center justify-center rounded-md bg-[#B8E34B] px-4 py-2 text-sm font-semibold text-[#111315] transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#B8E34B] focus:ring-offset-2 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${className}`
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
