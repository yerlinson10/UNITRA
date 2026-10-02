import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Money from '@/Components/Money';
import NumberInput from '@/Components/NumberInput';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { ArrowLeftRight, Check } from 'lucide-react';
import { FormEventHandler } from 'react';
import { PosTradeInForm } from './types';

type Props = {
    customerName: string;
    customerPhone: string;
    onCustomerNameChange: (value: string) => void;
    onCustomerPhoneChange: (value: string) => void;
    paymentMethod: string;
    onPaymentMethodChange: (value: string) => void;
    amountPaid: string;
    onAmountPaidChange: (value: string) => void;
    tradeIns: PosTradeInForm[];
    onRemoveTradeIn: (index: number) => void;
    onOpenTradeIn: () => void;
    subtotal: number;
    tradeInCredit: number;
    amountDue: number;
    change: number;
    processing: boolean;
    disabled: boolean;
    cashSessionOpen: boolean;
    errors: Record<string, string>;
    flashError?: string | null;
    onSubmit: FormEventHandler;
};

function nestedError(
    errors: Record<string, string>,
    prefix: string,
): string | undefined {
    return Object.entries(errors).find(([key]) => key === prefix || key.startsWith(`${prefix}.`))?.[1];
}

export default function PosCheckout({
    customerName,
    customerPhone,
    onCustomerNameChange,
    onCustomerPhoneChange,
    paymentMethod,
    onPaymentMethodChange,
    amountPaid,
    onAmountPaidChange,
    tradeIns,
    onRemoveTradeIn,
    onOpenTradeIn,
    subtotal,
    tradeInCredit,
    amountDue,
    change,
    processing,
    disabled,
    cashSessionOpen,
    errors,
    flashError,
    onSubmit,
}: Props) {
    const isCash = paymentMethod === 'cash';

    return (
        <form
            onSubmit={onSubmit}
            className="unitra-card space-y-4 p-5 xl:sticky xl:top-4"
        >
            <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
                Cobro
            </h2>

            {!cashSessionOpen && (
                <p className="rounded-md border border-[#D97706]/30 bg-[#D97706]/10 px-3 py-2 text-sm text-[#252925]">
                    Completar venta está bloqueado hasta abrir caja.
                </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div>
                    <InputLabel htmlFor="customer_name" value="Cliente" />
                    <TextInput
                        id="customer_name"
                        className="mt-1 block w-full"
                        value={customerName}
                        onChange={(e) => onCustomerNameChange(e.target.value)}
                        placeholder="Nombre (opcional)"
                    />
                    <InputError message={errors.customer_name} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="customer_phone" value="Teléfono" />
                    <TextInput
                        id="customer_phone"
                        className="mt-1 block w-full"
                        value={customerPhone}
                        onChange={(e) => onCustomerPhoneChange(e.target.value)}
                        placeholder="809…"
                    />
                    <InputError message={errors.customer_phone} className="mt-1" />
                </div>
            </div>

            <div>
                <InputLabel htmlFor="payment_method" value="Método de pago" />
                <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
                    <SelectTrigger id="payment_method" className="mt-1">
                        <SelectValue placeholder="Seleccionar…" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="cash">Efectivo</SelectItem>
                        <SelectItem value="card">Tarjeta</SelectItem>
                        <SelectItem value="transfer">Transferencia</SelectItem>
                    </SelectContent>
                </Select>
                <InputError message={errors.payment_method} className="mt-1" />
            </div>

            {isCash && (
                <div>
                    <InputLabel htmlFor="amount_paid" value="Monto recibido" />
                    <NumberInput
                        id="amount_paid"
                        className="mt-1 block w-full"
                        value={amountPaid}
                        onValueChange={onAmountPaidChange}
                        placeholder={String(amountDue || '')}
                    />
                    <InputError message={errors.amount_paid} className="mt-1" />
                    {change > 0 && (
                        <p className="mt-2 text-sm font-medium text-[#252925]">
                            Cambio:{' '}
                            <span className="font-display text-lg">
                                <Money amount={change} />
                            </span>
                        </p>
                    )}
                    {Number.parseFloat(amountPaid) > 0 &&
                        Number.parseFloat(amountPaid) < amountDue && (
                            <p className="mt-1 text-xs font-medium text-[#DC4444]">
                                Monto insuficiente
                            </p>
                        )}
                </div>
            )}

            <div className="space-y-3 rounded-md border border-[#E3E5E0] bg-[#F5F6F3] p-3">
                {tradeIns.map((t, idx) => (
                    <div key={`${t.imei}-${idx}`} className="rounded bg-white p-2 text-sm">
                        <div className="flex justify-between gap-2">
                            <span className="font-mono text-xs">{t.imei}</span>
                            <button
                                type="button"
                                className="text-xs text-[#DC4444]"
                                onClick={() => onRemoveTradeIn(idx)}
                            >
                                Quitar
                            </button>
                        </div>
                        {t.condition_grade && (
                            <p className="mt-0.5 text-xs text-[#6B7069]">
                                {t.condition_grade}
                            </p>
                        )}
                        <Money amount={Number(t.credited_value) || 0} />
                    </div>
                ))}
                <button
                    type="button"
                    onClick={onOpenTradeIn}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-[#E3E5E0] bg-white px-3 py-3 text-sm font-medium text-[#252925] hover:border-[#B8E34B]"
                >
                    <ArrowLeftRight className="h-4 w-4" />
                    Agregar Trade-In
                </button>
                <InputError message={nestedError(errors, 'trade_ins')} />
            </div>

            <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <dt className="text-[#6B7069]">Subtotal</dt>
                    <dd>
                        <Money amount={subtotal} />
                    </dd>
                </div>
                <div className="flex justify-between">
                    <dt className="text-[#6B7069]">Trade-In</dt>
                    <dd>
                        − <Money amount={tradeInCredit} />
                    </dd>
                </div>
                <div className="flex justify-between border-t border-[#E3E5E0] pt-2">
                    <dt className="font-display text-xl font-semibold uppercase">
                        A pagar
                    </dt>
                    <dd className="font-display text-2xl font-semibold text-[#111315]">
                        <Money amount={amountDue} />
                    </dd>
                </div>
            </dl>

            <InputError message={errors.items} />
            <InputError message={nestedError(errors, 'items')} />
            {flashError && <p className="text-sm text-[#DC4444]">{flashError}</p>}

            <PrimaryButton
                type="submit"
                className="w-full justify-center py-3"
                disabled={disabled || processing}
            >
                <Check className="mr-1.5 h-4 w-4" />
                {processing ? 'Procesando…' : 'Completar venta'}
            </PrimaryButton>
        </form>
    );
}
