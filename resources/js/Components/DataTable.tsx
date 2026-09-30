import { PropsWithChildren, ReactNode } from 'react';

export default function DataTable({
    children,
    empty,
    isEmpty = false,
}: PropsWithChildren<{
    empty?: ReactNode;
    isEmpty?: boolean;
}>) {
    if (isEmpty) {
        return (
            <div className="unitra-card px-4 py-10 text-center text-sm text-[#6B7069]">
                {empty ?? 'Sin registros'}
            </div>
        );
    }

    return (
        <div className="unitra-card overflow-hidden">
            <div className="overflow-x-auto">{children}</div>
        </div>
    );
}
