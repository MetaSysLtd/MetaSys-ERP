import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Filter, 
  CalendarIcon, 
  UserIcon, 
  HeartIcon, 
  DatabaseIcon 
} from "lucide-react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

type ReportFiltersProps = {
  onFilterChange?: (filters: any) => void;
};

export function ReportFilters({ onFilterChange }: ReportFiltersProps) {
  const [filters, setFilters] = useState({
    timeframe: "week",
    leadSource: "all",
    leadStatus: "all",
    assignedTo: "all",
    dateRange: {
      from: undefined as Date | undefined,
      to: undefined as Date | undefined
    }
  });
  
  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };
  
  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    const newFilters = { 
      ...filters, 
      dateRange: {
        from: range.from,
        to: range.to
      } 
    };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };
  
  return (
    <Card className="shadow hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-[#025E73] font-medium flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Report Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Timeframe filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 flex items-center mb-1">
              <CalendarIcon className="h-4 w-4 mr-1" />
              Timeframe
            </label>
            <Select 
              value={filters.timeframe} 
              onValueChange={(value) => handleFilterChange('timeframe', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Date Range Picker (only shown when custom timeframe is selected) */}
          {filters.timeframe === 'custom' && (
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 flex items-center mb-1">
                <CalendarIcon className="h-4 w-4 mr-1" />
                Custom Date Range
              </label>
              <div className="flex items-center space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left font-normal"
                    >
                      {filters.dateRange.from ? (
                        filters.dateRange.to ? (
                          <>
                            {format(filters.dateRange.from, "LLL dd, y")} - {format(filters.dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(filters.dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={{
                        from: filters.dateRange.from,
                        to: filters.dateRange.to,
                      }}
                      onSelect={handleDateRangeChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
          
          {/* Lead Source filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 flex items-center mb-1">
              <DatabaseIcon className="h-4 w-4 mr-1" />
              Lead Source
            </label>
            <Select 
              value={filters.leadSource} 
              onValueChange={(value) => handleFilterChange('leadSource', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="social">Social Media</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="cold_call">Cold Call</SelectItem>
                <SelectItem value="partner">Partner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Lead Status filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 flex items-center mb-1">
              <HeartIcon className="h-4 w-4 mr-1" />
              Lead Status
            </label>
            <Select 
              value={filters.leadStatus} 
              onValueChange={(value) => handleFilterChange('leadStatus', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="InProgress">In Progress</SelectItem>
                <SelectItem value="FollowUp">Follow Up</SelectItem>
                <SelectItem value="HandToDispatch">Hand to Dispatch</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Assigned To filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 flex items-center mb-1">
              <UserIcon className="h-4 w-4 mr-1" />
              Assigned To
            </label>
            <Select 
              value={filters.assignedTo} 
              onValueChange={(value) => handleFilterChange('assignedTo', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="1">Alex Johnson</SelectItem>
                <SelectItem value="2">Sarah Kim</SelectItem>
                <SelectItem value="3">Carlos Rodriguez</SelectItem>
                <SelectItem value="4">Maya Johnson</SelectItem>
                <SelectItem value="current">Assigned to Me</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}