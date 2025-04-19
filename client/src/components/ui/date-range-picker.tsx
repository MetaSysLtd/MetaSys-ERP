
import * as React from "react"
import { format, subDays, subMonths, subYears, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, startOfYear, endOfYear } from "date-fns"
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DateRangePickerProps {
  from: Date
  to: Date
  onSelect: (range: { from: Date; to: Date }) => void
  className?: string
}

export function DateRangePicker({ from, to, onSelect, className }: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: from || startOfMonth(new Date()),
    to: to || new Date(),
  })
  
  const [rangeText, setRangeText] = React.useState<string>("This Month")
  
  // Predefined ranges
  const ranges = {
    "Today": {
      from: startOfDay(new Date()),
      to: endOfDay(new Date())
    },
    "Yesterday": {
      from: startOfDay(subDays(new Date(), 1)),
      to: endOfDay(subDays(new Date(), 1))
    },
    "Weekly": {
      from: startOfWeek(new Date()),
      to: endOfWeek(new Date())
    },
    "This Month": {
      from: startOfMonth(new Date()),
      to: new Date()
    },
    "Monthly": {
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date())
    },
    "Yearly": {
      from: startOfYear(new Date()),
      to: endOfYear(new Date())
    },
    "YTD": {
      from: startOfYear(new Date()),
      to: new Date()
    },
    "Past 1 Year": {
      from: subYears(new Date(), 1),
      to: new Date()
    },
    "Custom": {
      from: from,
      to: to
    }
  }

  React.useEffect(() => {
    if (date?.from && date?.to) {
      onSelect({ from: date.from, to: date.to })
    }
  }, [date, onSelect])

  const selectPredefinedRange = (rangeName: string) => {
    const selectedRange = ranges[rangeName as keyof typeof ranges]
    setDate(selectedRange)
    setRangeText(rangeName)
  }

  // Handle custom date selection
  const handleDateSelect = (newDate: DateRange | undefined) => {
    if (newDate) {
      setDate(newDate)
      setRangeText("Custom")
    }
  }

  return (
    <div className={cn("flex gap-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-9 py-1 px-3">
            {rangeText} <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {Object.keys(ranges).map((rangeName) => (
            <DropdownMenuItem 
              key={rangeName}
              onClick={() => selectPredefinedRange(rangeName)}
            >
              {rangeName}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
