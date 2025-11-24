"use client";

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  label,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    value ? new Date(value + "T00:00:00") : undefined
  );
  const popoverRef = useRef<HTMLDivElement>(null);

  const displayText = selectedDate
    ? format(selectedDate, "PPP", { locale: es }) // "20 de enero de 2025"
    : placeholder;

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className={cn("relative", className)} ref={popoverRef}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-4 py-3 text-sm rounded-xl border transition-all",
          "bg-background hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
          "text-foreground placeholder:text-muted-foreground",
          selectedDate ? "text-foreground" : "text-muted-foreground",
          isOpen && "ring-2 ring-primary border-primary"
        )}
      >
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-muted-foreground" />
          <span className="truncate">{displayText}</span>
        </div>
        <ChevronRight
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-90"
          )}
        />
      </button>

      {/* Popover del calendario */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full animate-in fade-in slide-in duration-200">
          <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date || undefined);
                if (date) {
                  onChange(format(date, "yyyy-MM-dd"));
                }
                setIsOpen(false);
              }}
              locale={es}
              className="p-4"
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-semibold text-foreground",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                  "h-9 w-9 bg-transparent p-0 opacity-80 hover:opacity-100 hover:bg-accent rounded-lg transition-all"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell:
                  "text-muted-foreground rounded-md w-10 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: cn(
                  "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                  "h-10 w-10"
                ),
                day: cn(
                  "h-10 w-10 rounded-lg transition-all hover:bg-accent hover:text-accent-foreground",
                  "aria-selected:hover:bg-primary aria-selected:hover:text-primary-foreground"
                ),
                day_selected:
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-semibold",
                day_today: "bg-accent text-accent-foreground font-bold",
                day_disabled: "text-muted-foreground opacity-50",
                day_outside: "text-muted-foreground opacity-50",
              }}
              components={{
                IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                IconRight: () => <ChevronRight className="h-4 w-4" />,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}