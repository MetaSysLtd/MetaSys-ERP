import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { CalendarIcon, FilterIcon, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
  salesReps: { id: number; name: string }[];
  statuses: { id: string; name: string }[];
}

export interface FilterValues {
  timeframe: string;
  salesRep?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

const timeframeOptions = [
  { value: "day", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "year", label: "This Year" },
  { value: "custom", label: "Custom Range" }
];

export function ReportFilters({ onFilterChange, salesReps, statuses }: ReportFiltersProps) {
  const [filters, setFilters] = useState<FilterValues>({
    timeframe: "month",
  });
  
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>({
    timeframe: "month",
  });
  
  const [showDateRange, setShowDateRange] = useState(false);
  
  const handleTimeframeChange = (value: string) => {
    const isCustom = value === "custom";
    setShowDateRange(isCustom);
    
    setFilters({
      ...filters,
      timeframe: value,
      ...(isCustom ? {} : { dateFrom: undefined, dateTo: undefined })
    });
  };
  
  const handleFilterChange = (key: keyof FilterValues, value: any) => {
    setFilters({
      ...filters,
      [key]: value
    });
  };
  
  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    onFilterChange(filters);
  };
  
  const handleResetFilters = () => {
    const defaultFilters = {
      timeframe: "month",
    };
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setShowDateRange(false);
    onFilterChange(defaultFilters);
  };
  
  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-[#025E73] flex items-center">
          <FilterIcon className="mr-2 h-5 w-5" />
          Report Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeframe">Time Period</Label>
              <Select
                value={filters.timeframe}
                onValueChange={handleTimeframeChange}
              >
                <SelectTrigger id="timeframe">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  {timeframeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="salesRep">Sales Representative</Label>
              <Select
                value={filters.salesRep}
                onValueChange={(value) => handleFilterChange("salesRep", value)}
              >
                <SelectTrigger id="salesRep">
                  <SelectValue placeholder="All Sales Reps" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sales Reps</SelectItem>
                  {salesReps.map((rep) => (
                    <SelectItem key={rep.id} value={rep.id.toString()}>
                      {rep.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", {
            "hidden": !showDateRange
          })}>
            <div className="space-y-2">
              <Label htmlFor="dateFrom">From Date</Label>
              <div className="flex">
                <DatePicker
                  id="dateFrom"
                  selected={filters.dateFrom}
                  onSelect={(date) => handleFilterChange("dateFrom", date)}
                  placeholder="Select start date"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateTo">To Date</Label>
              <div className="flex">
                <DatePicker
                  id="dateTo"
                  selected={filters.dateTo}
                  onSelect={(date) => handleFilterChange("dateTo", date)}
                  placeholder="Select end date"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Lead Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status.id} value={status.id}>
                    {status.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-between mt-2 space-x-2">
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              <X className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button onClick={handleApplyFilters} size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Apply Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}