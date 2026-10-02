import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
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
import { Product } from '@/types';
import { useState } from 'react';
import { CONDITION_GRADES, PosTradeInForm, productLabel } from './types';

type Props = {
    show: boolean;
    draft: PosTradeInForm | null;
    products: Product[];
    onClose: () => void;
    onChange: (draft: PosTradeInForm) => void;
    onApply: () => void;
};

export default function PosTradeInModal({
    show,
    draft,
    products,
    onClose,
    onChange,
    onApply,
}: Props) {
    const [localError, setLocalError] = useState<string | null>(null);

    const apply = () => {
        if (!draft) {
            return;
        }

        if (
            !draft.product_id ||
            !draft.imei.trim() ||
            !draft.credited_value ||
            !draft.seller_name.trim() ||
            !draft.seller_id_number.trim() ||
            !draft.seller_phone.trim()
        ) {
            setLocalError('Completa producto, IMEI, valor acreditado y datos del vendedor.');
            return;
        }

        setLocalError(null);
        onApply();
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            {draft && (
                <div className="p-5">
                    <h3 className="font-display text-2xl font-semibold uppercase tracking-wide text-[#111315]">
                        Trade-In
                    </h3>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <InputLabel value="Producto / modelo" />
                            <Select
                                value={draft.product_id || undefined}
                                onValueChange={(value) =>
                                    onChange({ ...draft, product_id: value })
                                }
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Seleccionar…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map((p) => (
                                        <SelectItem key={p.id} value={String(p.id)}>
                                            {productLabel(p)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <InputLabel value="IMEI" />
                            <TextInput
                                className="mt-1 block w-full font-mono"
                                value={draft.imei}
                                onChange={(e) =>
                                    onChange({ ...draft, imei: e.target.value })
                                }
                                required
                            />
                        </div>

                        <div>
                            <InputLabel value="Serial" />
                            <TextInput
                                className="mt-1 block w-full font-mono"
                                value={draft.serial}
                                onChange={(e) =>
                                    onChange({ ...draft, serial: e.target.value })
                                }
                                placeholder="Opcional"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <InputLabel value="Condición" />
                            <div className="mt-1.5 flex flex-wrap gap-2">
                                {CONDITION_GRADES.map((grade) => {
                                    const active = draft.condition_grade === grade;

                                    return (
                                        <button
                                            key={grade}
                                            type="button"
                                            onClick={() =>
                                                onChange({
                                                    ...draft,
                                                    condition_grade: active ? '' : grade,
                                                })
                                            }
                                            className={`rounded-md px-3 py-1.5 text-sm font-medium transition active:scale-[0.97] ${
                                                active
                                                    ? 'bg-[#111315] text-white'
                                                    : 'border border-[#E3E5E0] bg-white text-[#252925] hover:bg-[#F5F6F3]'
                                            }`}
                                        >
                                            {grade}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <InputLabel value="Salud batería %" />
                            <NumberInput
                                className="mt-1 block w-full"
                                value={draft.battery_health}
                                onValueChange={(value) =>
                                    onChange({ ...draft, battery_health: value })
                                }
                                decimals={0}
                                placeholder="0–100"
                            />
                        </div>

                        <div>
                            <InputLabel value="Valor acreditado" />
                            <NumberInput
                                className="mt-1 block w-full"
                                value={draft.credited_value}
                                onValueChange={(value) =>
                                    onChange({ ...draft, credited_value: value })
                                }
                                required
                            />
                        </div>

                        <div>
                            <InputLabel value="Precio mín. reventa" />
                            <NumberInput
                                className="mt-1 block w-full"
                                value={draft.min_sale_price}
                                onValueChange={(value) =>
                                    onChange({ ...draft, min_sale_price: value })
                                }
                                placeholder="Opcional"
                            />
                        </div>

                        <div>
                            <InputLabel value="Precio regular reventa" />
                            <NumberInput
                                className="mt-1 block w-full"
                                value={draft.regular_sale_price}
                                onValueChange={(value) =>
                                    onChange({ ...draft, regular_sale_price: value })
                                }
                                placeholder="Opcional"
                            />
                        </div>

                        <div>
                            <InputLabel value="Notas" />
                            <TextInput
                                className="mt-1 block w-full"
                                value={draft.notes}
                                onChange={(e) =>
                                    onChange({ ...draft, notes: e.target.value })
                                }
                                placeholder="Opcional"
                            />
                        </div>

                        <div>
                            <InputLabel value="Nombre vendedor" />
                            <TextInput
                                className="mt-1 block w-full"
                                value={draft.seller_name}
                                onChange={(e) =>
                                    onChange({ ...draft, seller_name: e.target.value })
                                }
                                required
                            />
                        </div>

                        <div>
                            <InputLabel value="Tipo ID" />
                            <Select
                                value={draft.seller_id_type}
                                onValueChange={(value) =>
                                    onChange({ ...draft, seller_id_type: value })
                                }
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Seleccionar…" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cedula">Cédula</SelectItem>
                                    <SelectItem value="pasaporte">Pasaporte</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <InputLabel value="Número ID" />
                            <TextInput
                                className="mt-1 block w-full"
                                value={draft.seller_id_number}
                                onChange={(e) =>
                                    onChange({
                                        ...draft,
                                        seller_id_number: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>

                        <div>
                            <InputLabel value="Teléfono" />
                            <TextInput
                                className="mt-1 block w-full"
                                value={draft.seller_phone}
                                onChange={(e) =>
                                    onChange({ ...draft, seller_phone: e.target.value })
                                }
                                required
                            />
                        </div>
                    </div>

                    <InputError message={localError ?? undefined} className="mt-3" />

                    <div className="mt-5 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md border border-[#E3E5E0] px-3 py-2 text-sm font-medium"
                        >
                            Cancelar
                        </button>
                        <PrimaryButton type="button" onClick={apply}>
                            Aplicar Trade-In
                        </PrimaryButton>
                    </div>
                </div>
            )}
        </Modal>
    );
}
