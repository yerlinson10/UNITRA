import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { Calendar } from '@/Components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';
import { cn } from '@/lib/utils';

type DatePickerProps = {
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    id?: string;
    className?: string;
    disabled?: boolean;
};

function parseValue(value?: string): Date | undefined {
    if (!value) return undefined;
    const date = parseISO(value);
    return isValid(date) ? date : undefined;
}

export default function DatePicker({
    value,
    onChange,
    placeholder = 'Seleccionar fecha',
    id,
    className,
    disabled = false,
}: DatePickerProps) {
    const [open, setOpen] = useState(false);
    const selected = parseValue(value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    id={id}
                    type="button"
                    disabled={disabled}
                    className={cn(
                        'unitra-input mt-1 flex h-10 w-full items-center justify-between gap-2 text-left',
                        !selected && 'text-[#6B7069]',
                        disabled && 'cursor-not-allowed opacity-50',
                        className,
                    )}
                >
                    <span className="truncate">
                        {selected
                            ? format(selected, 'dd MMM yyyy', { locale: es })
                            : placeholder}
                    </span>
                    <CalendarIcon className="h-4 w-4 shrink-0 text-[#6B7069]" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={selected}
                    onSelect={(date) => {
                        onChange(date ? format(date, 'yyyy-MM-dd') : '');
                        setOpen(false);
                    }}
                    defaultMonth={selected}
                />
            </PopoverContent>
        </Popover>
    );
}
