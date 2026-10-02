import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/Components/Modal';
import Money from '@/Components/Money';
import SecondaryButton from '@/Components/SecondaryButton';
import { ReactNode } from 'react';
import { ORIGIN_LABELS, PosDeviceDetails } from './types';

type Props = {
    show: boolean;
    device: PosDeviceDetails | null;
    canViewCosts: boolean;
    onClose: () => void;
};

function formatDate(value?: string | null): string {
    if (!value) {
        return '—';
    }

    const d = new Date(value.includes('T') ? value : `${value}T12:00:00`);
    if (Number.isNaN(d.getTime())) {
        return value;
    }

    return d.toLocaleDateString('es-DO');
}

function DetailRow({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="grid grid-cols-[8.5rem_1fr] gap-x-3 gap-y-1 border-b border-[#E3E5E0] py-2.5 text-sm last:border-b-0">
            <dt className="text-[#6B7069]">{label}</dt>
            <dd className="min-w-0 break-words font-medium text-[#252925]">
                {children}
            </dd>
        </div>
    );
}

function display(value: string | number | null | undefined, suffix = ''): string {
    if (value === null || value === undefined || value === '') {
        return '—';
    }

    return `${value}${suffix}`;
}

export default function PosItemDetailModal({
    show,
    device,
    canViewCosts,
    onClose,
}: Props) {
    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            {device && (
                <>
                    <ModalHeader
                        title="Detalle del dispositivo"
                        subtitle={device.product_label}
                    />
                    <ModalBody>
                        <dl>
                            <DetailRow label="Marca">
                                {display(device.brand)}
                            </DetailRow>
                            <DetailRow label="Modelo">
                                {display(device.model)}
                            </DetailRow>
                            <DetailRow label="Almacenamiento">
                                {display(device.storage)}
                            </DetailRow>
                            <DetailRow label="Color">
                                {display(device.color)}
                            </DetailRow>
                            <DetailRow label="IMEI">
                                <span className="font-mono">{device.imei}</span>
                            </DetailRow>
                            <DetailRow label="Serial">
                                <span className="font-mono">
                                    {display(device.serial)}
                                </span>
                            </DetailRow>
                            <DetailRow label="Condición">
                                {display(device.condition_grade)}
                            </DetailRow>
                            <DetailRow label="Batería">
                                {device.battery_health != null
                                    ? `${device.battery_health}%`
                                    : '—'}
                            </DetailRow>
                            <DetailRow label="Origen">
                                {device.origin
                                    ? (ORIGIN_LABELS[device.origin] ?? device.origin)
                                    : '—'}
                            </DetailRow>
                            <DetailRow label="Compra">
                                {formatDate(device.purchased_at)}
                            </DetailRow>
                            <DetailRow label="Garantía">
                                {device.warranty_expires_at
                                    ? formatDate(device.warranty_expires_at)
                                    : device.warranty_months != null
                                      ? `${device.warranty_months} mes${device.warranty_months === 1 ? '' : 'es'}`
                                      : '—'}
                            </DetailRow>
                            <DetailRow label="Precio regular">
                                {device.regular_sale_price != null ? (
                                    <Money amount={device.regular_sale_price} />
                                ) : (
                                    '—'
                                )}
                            </DetailRow>
                            <DetailRow label="Precio mínimo">
                                {device.min_sale_price != null ? (
                                    <Money amount={device.min_sale_price} />
                                ) : (
                                    '—'
                                )}
                            </DetailRow>
                            {canViewCosts && (
                                <DetailRow label="Costo">
                                    {device.cost != null ? (
                                        <Money amount={device.cost} />
                                    ) : (
                                        '—'
                                    )}
                                </DetailRow>
                            )}
                            <DetailRow label="Notas">
                                {display(device.notes)}
                            </DetailRow>
                        </dl>
                    </ModalBody>
                    <ModalFooter className="flex justify-end">
                        <SecondaryButton type="button" onClick={onClose}>
                            Cerrar
                        </SecondaryButton>
                    </ModalFooter>
                </>
            )}
        </Modal>
    );
}
