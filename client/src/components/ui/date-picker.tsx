import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface DatePickerProps {
  date?: Date;
  setDate?: (date: Date) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  date,
  setDate,
  disabled = false,
  label,
  placeholder = "Select date",
  className,
}: DatePickerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Simple date picker using a native date input for now
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value && setDate) {
      setDate(new Date(e.target.value));
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      {label && <Label htmlFor="date">{label}</Label>}
      <div className="relative">
        <Input
          ref={inputRef}
          type="date"
          id="date"
          disabled={disabled}
          value={date ? format(date, "yyyy-MM-dd") : ""}
          onChange={handleChange}
          className="w-full"
        />
      </div>
    </div>
  );
}