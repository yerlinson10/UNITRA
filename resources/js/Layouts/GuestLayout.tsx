import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F6F3] px-4">
            <div className="mb-6 text-center">
                <Link href="/" className="inline-flex flex-col items-center gap-3">
                    <span className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-[#B8E34B] bg-[#111315] font-display text-2xl font-bold text-[#B8E34B]">
                        U
                    </span>
                    <span className="font-display text-4xl font-semibold tracking-[0.12em] text-[#111315]">
                        UNITRA
                    </span>
                </Link>
                <p className="mt-2 text-sm text-[#6B7069]">
                    Inventory · Trade-In · POS
                </p>
            </div>

            <div className="w-full overflow-hidden rounded-lg border border-[#E3E5E0] bg-white px-6 py-5 shadow-sm sm:max-w-md">
                {children}
            </div>
        </div>
    );
}
