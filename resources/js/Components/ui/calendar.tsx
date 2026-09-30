import { DayPicker } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { es } from 'date-fns/locale';
import * as React from 'react';
import { cn } from '@/lib/utils';
import 'react-day-picker/style.css';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            locale={es}
            className={cn('p-3', className)}
            classNames={{
                months: 'flex flex-col sm:flex-row gap-4',
                month: 'space-y-3',
                month_caption: 'flex justify-center relative items-center h-9',
                caption_label: 'font-display text-base font-semibold uppercase tracking-wide text-[#111315]',
                nav: 'flex items-center gap-1',
                button_previous:
                    'absolute left-1 inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#E3E5E0] bg-white hover:bg-[#F5F6F3] active:scale-[0.97]',
                button_next:
                    'absolute right-1 inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#E3E5E0] bg-white hover:bg-[#F5F6F3] active:scale-[0.97]',
                month_grid: 'w-full border-collapse',
                weekdays: 'flex',
                weekday: 'w-9 text-[0.7rem] font-medium uppercase tracking-wide text-[#6B7069]',
                week: 'mt-1 flex w-full',
                day: 'relative p-0 text-center text-sm',
                day_button:
                    'inline-flex h-9 w-9 items-center justify-center rounded-md text-sm hover:bg-[#F5F6F3] focus:outline-none focus:ring-1 focus:ring-[#B8E34B]',
                selected:
                    '[&>button]:bg-[#111315] [&>button]:text-white [&>button]:hover:bg-[#111315] [&>button]:hover:text-white',
                today: '[&>button]:border [&>button]:border-[#B8E34B]',
                outside: 'text-[#6B7069]/50',
                disabled: 'text-[#6B7069]/40 [&>button]:opacity-40',
                hidden: 'invisible',
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation }) =>
                    orientation === 'left' ? (
                        <ChevronLeft className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    ),
            }}
            {...props}
        />
    );
}

Calendar.displayName = 'Calendar';

export { Calendar };
