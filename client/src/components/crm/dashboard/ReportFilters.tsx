import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Filter, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { format } from "date-fns";

interface ReportFiltersProps {
  onFilterChange: (filters: {
    dateRange: { from: Date | undefined; to: Date | undefined };
    salesRep: string | undefined;
    status: string | undefined;
    searchTerm: string | undefined;
  }) => void;
  salesReps: { id: string; name: string }[];
  statuses: { id: string; label: string }[];
}

export function ReportFilters({ onFilterChange, salesReps, statuses }: ReportFiltersProps) {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [salesRep, setSalesRep] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined);
  
  // Update parent component with all current filters
  const updateFilters = () => {
    onFilterChange({
      dateRange,
      salesRep,
      status,
      searchTerm
    });
  };
  
  // Reset all filters
  const resetFilters = () => {
    setDateRange({ from: undefined, to: undefined });
    setSalesRep(undefined);
    setStatus(undefined);
    setSearchTerm(undefined);
    
    onFilterChange({
      dateRange: { from: undefined, to: undefined },
      salesRep: undefined,
      status: undefined,
      searchTerm: undefined
    });
  };

  return (
    <Card className="shadow-sm mb-6 border-[#f2f2f2]">
      <CardContent className="pt-6">
        <div className="flex flex-col space-y-4 md:flex-row md:items-end md:space-x-4 md:space-y-0">
          <div className="grid gap-2 flex-1">
            <Label htmlFor="search" className="text-xs font-medium text-[#025E73]">
              Search Leads
            </Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name, email, or company..."
                className="pl-8"
                value={searchTerm || ""}
                onChange={(e) => {
                  setSearchTerm(e.target.value || undefined);
                }}
              />
            </div>
          </div>
          
          <div className="grid gap-2 w-full md:w-[180px]">
            <Label htmlFor="dateRange" className="text-xs font-medium text-[#025E73]">
              Date Range
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="dateRange"
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd")} -{" "}
                        {format(dateRange.to, "LLL dd")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Select dates</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{ 
                    from: dateRange.from,
                    to: dateRange.to 
                  }}
                  onSelect={(range) => {
                    setDateRange({
                      from: range?.from,
                      to: range?.to
                    });
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="grid gap-2 w-full md:w-[150px]">
            <Label htmlFor="salesRep" className="text-xs font-medium text-[#025E73]">
              Sales Rep
            </Label>
            <Select
              value={salesRep}
              onValueChange={(value) => setSalesRep(value)}
            >
              <SelectTrigger id="salesRep">
                <SelectValue placeholder="Any Rep" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any Rep</SelectItem>
                {salesReps.map((rep) => (
                  <SelectItem key={rep.id} value={rep.id}>
                    {rep.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2 w-full md:w-[150px]">
            <Label htmlFor="status" className="text-xs font-medium text-[#025E73]">
              Status
            </Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Any Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any Status</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status.id} value={status.id}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={updateFilters}
              className="bg-[#025E73] text-white hover:bg-[#02485a]"
            >
              <Filter className="mr-2 h-4 w-4" />
              Apply
            </Button>
            <Button 
              variant="outline" 
              onClick={resetFilters}
              className="border-[#025E73] text-[#025E73]"
            >
              <X className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}