import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/formatters";
import { CalendarIcon, Filter, RefreshCw } from "lucide-react";
import { useState } from "react";

interface ReportFiltersProps {
  onFilterChange?: (filters: any) => void;
  onRefresh?: () => void;
}

export function ReportFilters({ onFilterChange, onRefresh }: ReportFiltersProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  const [salesRep, setSalesRep] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  // Dummy data for demo
  const salesReps = [
    { id: "1", name: "John Doe" },
    { id: "2", name: "Jane Smith" },
    { id: "3", name: "Alex Johnson" },
  ];

  const statuses = [
    { id: "new", name: "New" },
    { id: "inprogress", name: "In Progress" },
    { id: "followup", name: "Follow Up" },
    { id: "handtodispatch", name: "Hand to Dispatch" },
    { id: "active", name: "Active" },
    { id: "lost", name: "Lost" },
  ];

  const handleFilterApply = () => {
    if (onFilterChange) {
      onFilterChange({
        dateRange,
        salesRep,
        status,
      });
    }
  };

  const handleReset = () => {
    setDateRange({ from: undefined, to: undefined });
    setSalesRep("");
    setStatus("");
    if (onFilterChange) {
      onFilterChange({
        dateRange: undefined,
        salesRep: "",
        status: "",
      });
    }
  };

  return (
    <Card className="mt-4 shadow-sm border-slate-200">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateRange?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {formatDate(dateRange.from, "MMM D, YYYY")} -{" "}
                        {formatDate(dateRange.to, "MMM D, YYYY")}
                      </>
                    ) : (
                      formatDate(dateRange.from, "MMM D, YYYY")
                    )
                  ) : (
                    <span>Date Range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={new Date()}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            {/* Sales Rep Filter */}
            <Select value={salesRep} onValueChange={setSalesRep}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Sales Rep" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Sales Reps</SelectItem>
                {salesReps.map((rep) => (
                  <SelectItem key={rep.id} value={rep.id}>
                    {rep.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                {statuses.map((statusItem) => (
                  <SelectItem key={statusItem.id} value={statusItem.id}>
                    {statusItem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Apply Filter Button */}
            <Button
              size="sm"
              variant="default"
              onClick={handleFilterApply}
              className="bg-[#025E73] hover:bg-[#014759]"
            >
              <Filter className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>

            {/* Reset Filters */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              className="border-slate-300"
            >
              Reset
            </Button>
          </div>

          {/* Refresh Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            className="h-9"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}