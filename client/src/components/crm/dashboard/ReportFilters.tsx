import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, FilterIcon } from "lucide-react";
import { formatDate } from "@/lib/formatters";

interface ReportFiltersProps {
  onFilterChange: (filters: {
    timeframe: string;
    dateRange?: { from: Date; to: Date } | undefined;
    source?: string;
    salesRep?: string;
  }) => void;
  salesReps?: Array<{ id: number; name: string }>;
  sources?: Array<string>;
}

export function ReportFilters({ onFilterChange, salesReps = [], sources = [] }: ReportFiltersProps) {
  const [timeframe, setTimeframe] = useState<string>("week");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(undefined);
  const [source, setSource] = useState<string>("");
  const [salesRep, setSalesRep] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
    // Reset date range if a preset timeframe is selected
    if (value !== "custom") {
      setDateRange(undefined);
      setShowDatePicker(false);
    } else {
      setShowDatePicker(true);
    }
    onFilterChange({ timeframe: value, dateRange, source, salesRep });
  };

  const handleDateRangeChange = (range: { from: Date; to: Date } | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      onFilterChange({ timeframe: "custom", dateRange: range, source, salesRep });
    }
  };

  const handleSourceChange = (value: string) => {
    setSource(value);
    onFilterChange({ timeframe, dateRange, source: value, salesRep });
  };

  const handleSalesRepChange = (value: string) => {
    setSalesRep(value);
    onFilterChange({ timeframe, dateRange, source, salesRep: value });
  };

  const resetFilters = () => {
    setTimeframe("week");
    setDateRange(undefined);
    setSource("");
    setSalesRep("");
    setShowDatePicker(false);
    onFilterChange({ timeframe: "week" });
  };

  const formatDateRange = () => {
    if (!dateRange || !dateRange.from || !dateRange.to) return "Select date range";
    
    const fromDate = formatDate(dateRange.from, "MMM D, YYYY");
    const toDate = formatDate(dateRange.to, "MMM D, YYYY");
    
    return `${fromDate} - ${toDate}`;
  };

  return (
    <div className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
        <div className="flex items-center mb-2 sm:mb-0">
          <FilterIcon className="h-4 w-4 mr-2 text-gray-500" />
          <h3 className="text-sm font-medium">Filter Dashboard</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 w-full sm:w-auto">
          <Select value={timeframe} onValueChange={handleTimeframeChange}>
            <SelectTrigger className="h-8 w-[120px]">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {sources.length > 0 && (
            <Select value={source} onValueChange={handleSourceChange}>
              <SelectTrigger className="h-8 w-[160px]">
                <SelectValue placeholder="Lead source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Sources</SelectItem>
                {sources.map((src) => (
                  <SelectItem key={src} value={src}>
                    {src}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {salesReps.length > 0 && (
            <Select value={salesRep} onValueChange={handleSalesRepChange}>
              <SelectTrigger className="h-8 w-[160px]">
                <SelectValue placeholder="Sales rep" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Reps</SelectItem>
                {salesReps.map((rep) => (
                  <SelectItem key={rep.id} value={rep.id.toString()}>
                    {rep.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {(timeframe === "custom" || showDatePicker) && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "justify-start text-left font-normal h-8 w-[160px]",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDateRange()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={handleDateRangeChange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
      
      {(timeframe !== "week" || source || salesRep) && (
        <div className="flex justify-end mt-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={resetFilters}
            className="text-xs h-7"
          >
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  );
}