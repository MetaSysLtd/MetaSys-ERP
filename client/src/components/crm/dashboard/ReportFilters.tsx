import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { CalendarIcon, FilterIcon } from "lucide-react";

interface ReportFiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
  timeframe: "day" | "week" | "month";
}

export interface FilterOptions {
  timeframe: "day" | "week" | "month";
  startDate?: Date;
  endDate?: Date;
  source?: string;
  territory?: string;
  salesRep?: number;
}

export function ReportFilters({ onFilterChange, timeframe }: ReportFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    timeframe,
    startDate: undefined,
    endDate: undefined,
    source: undefined,
    territory: undefined,
    salesRep: undefined,
  });

  const [isCustomRange, setIsCustomRange] = useState(false);

  const handleTimeframeChange = (value: "day" | "week" | "month") => {
    const newFilters = { ...filters, timeframe: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setFilters({ ...filters, startDate: date });
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setFilters({ ...filters, endDate: date });
  };

  const handleSourceChange = (value: string) => {
    setFilters({ ...filters, source: value });
  };

  const handleTerritoryChange = (value: string) => {
    setFilters({ ...filters, territory: value });
  };

  const handleSalesRepChange = (value: string) => {
    setFilters({ ...filters, salesRep: parseInt(value, 10) });
  };

  const handleApplyFilters = () => {
    onFilterChange(filters);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      timeframe,
      startDate: undefined,
      endDate: undefined,
      source: undefined,
      territory: undefined,
      salesRep: undefined,
    };
    setFilters(resetFilters);
    setIsCustomRange(false);
    onFilterChange(resetFilters);
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-[#025E73]">Report Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Time Period</label>
            <Select value={filters.timeframe} onValueChange={handleTimeframeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="custom" onClick={() => setIsCustomRange(true)}>Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isCustomRange && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Start Date</label>
                <DatePicker
                  selected={filters.startDate}
                  onSelect={handleStartDateChange}
                >
                  <Button variant="outline" className="w-full">
                    {filters.startDate ? new Date(filters.startDate).toLocaleDateString() : "Select start date"}
                    <CalendarIcon className="ml-auto h-4 w-4" />
                  </Button>
                </DatePicker>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">End Date</label>
                <DatePicker
                  selected={filters.endDate}
                  onSelect={handleEndDateChange}
                  disabled={!filters.startDate}
                  fromDate={filters.startDate}
                >
                  <Button variant="outline" className="w-full" disabled={!filters.startDate}>
                    {filters.endDate ? new Date(filters.endDate).toLocaleDateString() : "Select end date"}
                    <CalendarIcon className="ml-auto h-4 w-4" />
                  </Button>
                </DatePicker>
              </div>
            </>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Lead Source</label>
            <Select value={filters.source} onValueChange={handleSourceChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="call">Cold Call</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Territory</label>
            <Select value={filters.territory} onValueChange={handleTerritoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Territories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Territories</SelectItem>
                <SelectItem value="north">North</SelectItem>
                <SelectItem value="south">South</SelectItem>
                <SelectItem value="east">East</SelectItem>
                <SelectItem value="west">West</SelectItem>
                <SelectItem value="central">Central</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Sales Rep</label>
            <Select value={filters.salesRep?.toString()} onValueChange={handleSalesRepChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Sales Reps" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All Sales Reps</SelectItem>
                <SelectItem value="1">John Smith</SelectItem>
                <SelectItem value="2">Sarah Johnson</SelectItem>
                <SelectItem value="3">Michael Brown</SelectItem>
                <SelectItem value="4">Jennifer Davis</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={handleResetFilters}>
            Reset
          </Button>
          <Button onClick={handleApplyFilters}>
            <FilterIcon className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}