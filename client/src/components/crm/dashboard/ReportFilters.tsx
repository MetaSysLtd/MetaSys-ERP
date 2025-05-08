import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export interface FilterValues {
  dateRange: { from: Date | undefined; to: Date | undefined };
  salesRep: string | undefined;
  status: string | undefined;
  searchTerm: string | undefined;
}

interface ReportFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
  salesReps: { id: string; name: string }[];
  statuses: { id: string; label: string }[];
}

export function ReportFilters({ 
  onFilterChange, 
  salesReps, 
  statuses 
}: ReportFiltersProps) {
  const [date, setDate] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [salesRep, setSalesRep] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined);
  const [isOpen, setIsOpen] = useState(false);

  const handleApplyFilters = () => {
    onFilterChange({
      dateRange: date,
      salesRep,
      status,
      searchTerm,
    });
    setIsOpen(false);
  };

  const handleResetFilters = () => {
    setDate({ from: undefined, to: undefined });
    setSalesRep(undefined);
    setStatus(undefined);
    setSearchTerm(undefined);
    onFilterChange({
      dateRange: { from: undefined, to: undefined },
      salesRep: undefined,
      status: undefined,
      searchTerm: undefined,
    });
    setIsOpen(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // For immediate search feedback, apply filter on each keystroke
    if (e.target.value === "") {
      onFilterChange({
        dateRange: date,
        salesRep,
        status,
        searchTerm: undefined,
      });
    }
  };

  return (
    <Card className="mb-6 shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads, companies, contacts..."
              className="pl-8 w-full"
              value={searchTerm || ""}
              onChange={handleSearchChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onFilterChange({
                    dateRange: date,
                    salesRep,
                    status,
                    searchTerm,
                  });
                }
              }}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                className="absolute right-0 top-0 h-9 w-9 p-0"
                onClick={() => {
                  setSearchTerm(undefined);
                  onFilterChange({
                    dateRange: date,
                    salesRep,
                    status,
                    searchTerm: undefined,
                  });
                }}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-9 flex items-center whitespace-nowrap">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  <span>Filters</span>
                  {(date.from || salesRep || status) && (
                    <span className="ml-1 rounded-full bg-[#025E73] text-white w-5 h-5 text-xs flex items-center justify-center">
                      {[date.from, salesRep, status].filter(Boolean).length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[340px] p-4" align="end">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date-range">Date Range</Label>
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="date-range"
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !date.from && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date.from ? (
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
                            mode="range"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sales-rep">Sales Rep</Label>
                    <Select
                      value={salesRep}
                      onValueChange={setSalesRep}
                    >
                      <SelectTrigger id="sales-rep">
                        <SelectValue placeholder="All sales reps" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All sales reps</SelectItem>
                        {salesReps.map((rep) => (
                          <SelectItem key={rep.id} value={rep.id}>
                            {rep.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={status}
                      onValueChange={setStatus}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All statuses</SelectItem>
                        {statuses.map((statusItem) => (
                          <SelectItem key={statusItem.id} value={statusItem.id}>
                            {statusItem.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetFilters}
                    >
                      Reset filters
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleApplyFilters}
                      className="bg-[#025E73] hover:bg-[#025E73]/90"
                    >
                      Apply filters
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}