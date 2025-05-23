import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MotionWrapper } from "@/components/ui/motion-wrapper";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminActions } from "@/components/admin/AdminActions";
import { useAdminControls } from "@/hooks/use-admin-controls";
import { AdminEditModal } from "@/components/admin/AdminEditModal";
import { 
  Plus, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Filter, 
  Users, 
  UserPlus,
  LayoutGrid, 
  List, 
  Loader2,
  AlertCircle,
  ChevronsUpDown,
  ArrowUpDown,
  Eye,
  Phone,
  Mail,
  Tag,
  Truck,
  CalendarClock,
  Calendar as CalendarIcon,
  Star,
  ArrowDown10,
  ArrowUp10,
  BadgeCheck,
  Building2,
  DollarSign,
  Info
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import NewLeadModal from "@/components/crm/NewLeadModal";
import { formatDate, cn } from "@/lib/utils";
import { KanbanView } from "@/components/crm/KanbanView";
import { format } from "date-fns";

export default function CRMLeadsPage() {
  const { toast } = useToast();
  const { user, role } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const queryClient = useQueryClient();
  const searchParams = new URLSearchParams(search);
  
  const [newLeadModalOpen, setNewLeadModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredLeads, setFilteredLeads] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  // Setup admin controls
  const { 
    isSystemAdmin,
    isEditModalOpen, 
    setIsEditModalOpen,
    selectedItem,
    fields,
    isLoading: isAdminActionLoading,
    openEditModal,
    updateEntity,
    deleteEntity 
  } = useAdminControls({ 
    module: 'leads', 
    queryKey: ["/api/leads"] 
  });
  
  // Get leads from the API
  const { data: leads, isLoading, error, isError } = useQuery({
    queryKey: ["/api/leads"],
  });
  
  // Handle sort toggle
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load leads data. Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  // Filter and sort leads
  useEffect(() => {
    if (!leads) return;
    
    // Make sure leads is treated as an array
    let filtered = Array.isArray(leads) ? [...leads] : [];
    
    // Filter by status
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((lead) => lead.status === statusFilter);
    }
    
    // Filter by category
    if (categoryFilter && categoryFilter !== "all") {
      filtered = filtered.filter((lead) => lead.category === categoryFilter);
    }
    
    // Filter by date range
    if (dateRange?.from) {
      filtered = filtered.filter((lead) => {
        const leadDate = new Date(lead.createdAt);
        const fromDate = new Date(dateRange.from!);
        const toDate = dateRange.to ? new Date(dateRange.to) : new Date();
        
        // Reset time to start/end of day for accurate comparison
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);
        
        return leadDate >= fromDate && leadDate <= toDate;
      });
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          (lead.companyName ? lead.companyName.toLowerCase().includes(query) : false) ||
          (lead.contactName ? lead.contactName.toLowerCase().includes(query) : false) ||
          (lead.phoneNumber ? lead.phoneNumber.includes(query) : false) ||
          (lead.email ? lead.email.toLowerCase().includes(query) : false) ||
          (lead.mcNumber ? lead.mcNumber.toLowerCase().includes(query) : false) ||
          (lead.dotNumber ? lead.dotNumber.toLowerCase().includes(query) : false)
      );
    }
    
    // Sort filtered leads
    if (sortField) {
      filtered.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        // Handle nullish values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
        if (bValue == null) return sortDirection === 'asc' ? 1 : -1;
        
        // Handle dates
        if (sortField === 'createdAt' || sortField === 'updatedAt') {
          const aDate = new Date(aValue).getTime();
          const bDate = new Date(bValue).getTime();
          return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
        }
        
        // Handle strings
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        }
        
        // Handle numbers
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }
    
    setFilteredLeads(filtered);
  }, [leads, statusFilter, searchQuery, categoryFilter, dateRange, sortField, sortDirection]);
  
  // Determine user permissions - allow authenticated users to create leads
  const canCreateLead = user && (
    role?.department === "admin" || 
    role?.department === "sales" ||
    role?.department === "crm" ||
    user.id // fallback: any authenticated user can create leads
  );

  // Format status for display
  const formatStatus = (status: string) => {
    return {
      "New": { label: "New", color: "bg-blue-50 text-blue-700 border-blue-200" },
      "Contacted": { label: "Contacted", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
      "Active": { label: "Active", color: "bg-green-50 text-green-700 border-green-200" },
      "FollowUp": { label: "Follow Up", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
      "Lost": { label: "Lost", color: "bg-gray-50 text-gray-700 border-gray-200" },
      "Pending": { label: "Pending", color: "bg-purple-50 text-purple-700 border-purple-200" },
      "Inactive": { label: "Inactive", color: "bg-red-50 text-red-700 border-red-200" },
    }[status] || { label: status, color: "bg-gray-50 text-gray-700 border-gray-200" };
  };

  // Render loading skeleton
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-36" />
        </div>
        <Card className="mb-6">
          <CardHeader className="pb-0">
            <Skeleton className="h-6 w-32 mb-2" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-9 w-32" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0">
            <div className="p-4">
              <div className="grid grid-cols-6 gap-4 mb-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="grid grid-cols-6 gap-4 mb-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render error state
  if (isError) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <AlertCircle className="mr-2 h-5 w-5" />
              Error Loading Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              {error instanceof Error ? error.message : "Failed to load leads data"}
            </p>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/leads"] })}
              className="bg-white hover:bg-gray-50"
            >
              Retry
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Get unique categories for filter
  const categories = Array.isArray(leads) 
    ? ['all', ...Array.from(new Set(leads.map(lead => lead.category).filter(Boolean)))] 
    : ['all'];

  // Render leads page
  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* Page header */}
      <MotionWrapper animation="fade-down" delay={0.1}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-[#025E73] to-[#011F26] bg-clip-text text-transparent">
              CRM Leads Management
            </h1>
            <p className="text-gray-500 mt-1">Track, qualify and convert prospects into customers</p>
          </div>
          
          {canCreateLead && (
            <Button
              onClick={() => setNewLeadModalOpen(true)}
              size="sm"
              className="mt-4 md:mt-0 bg-gradient-to-r from-[#025E73] to-[#011F26] text-white hover:opacity-90 shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Lead
            </Button>
          )}
        </div>
      </MotionWrapper>
      
      {/* Filters and view controls */}
      <MotionWrapper animation="fade-up" delay={0.2}>
        <Card className="mb-6 border-t-4 border-t-[#025E73] shadow-md">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg text-gray-900 flex items-center">
              <Filter className="h-5 w-5 mr-2 text-[#025E73]" />
              Lead Filters
            </CardTitle>
            <CardDescription>
              Filter and search through your leads
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
              {/* Status filter */}
              <div className="md:col-span-3">
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Tag className="h-4 w-4 mr-1.5 text-[#025E73]" />
                  Status
                </label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value)}
                >
                  <SelectTrigger id="status-filter" className="w-full bg-white border-gray-200 focus:ring-[#025E73] focus:border-[#025E73]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="New">
                      <span className="flex items-center">
                        <Badge className="mr-2 bg-blue-50 text-blue-700 border-blue-200">New</Badge>
                        New Leads
                      </span>
                    </SelectItem>
                    <SelectItem value="Contacted">
                      <span className="flex items-center">
                        <Badge className="mr-2 bg-indigo-50 text-indigo-700 border-indigo-200">Contacted</Badge>
                        Contacted
                      </span>
                    </SelectItem>
                    <SelectItem value="Active">
                      <span className="flex items-center">
                        <Badge className="mr-2 bg-green-50 text-green-700 border-green-200">Active</Badge>
                        Active Leads
                      </span>
                    </SelectItem>
                    <SelectItem value="FollowUp">
                      <span className="flex items-center">
                        <Badge className="mr-2 bg-yellow-50 text-yellow-700 border-yellow-200">Follow Up</Badge>
                        Follow-up
                      </span>
                    </SelectItem>
                    <SelectItem value="Qualifying">
                      <span className="flex items-center">
                        <Badge className="mr-2 bg-purple-50 text-purple-700 border-purple-200">Qualifying</Badge>
                        In Qualification
                      </span>
                    </SelectItem>
                    <SelectItem value="Inactive">
                      <span className="flex items-center">
                        <Badge className="mr-2 bg-red-50 text-red-700 border-red-200">Inactive</Badge>
                        Inactive
                      </span>
                    </SelectItem>
                    <SelectItem value="Lost">
                      <span className="flex items-center">
                        <Badge className="mr-2 bg-gray-50 text-gray-700 border-gray-200">Lost</Badge>
                        Lost
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Category filter */}
              <div className="md:col-span-3">
                <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Info className="h-4 w-4 mr-1.5 text-[#025E73]" />
                  Lead Category
                </label>
                <Select
                  value={categoryFilter}
                  onValueChange={(value) => setCategoryFilter(value)}
                >
                  <SelectTrigger id="category-filter" className="w-full bg-white border-gray-200 focus:ring-[#025E73] focus:border-[#025E73]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Date filter - now functional */}
              <div className="md:col-span-3">
                <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1.5 text-[#025E73]" />
                  Date Range
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date-filter"
                      variant="outline"
                      size="default"
                      className="w-full justify-start text-left font-normal bg-white border-gray-200 focus:ring-[#025E73] focus:border-[#025E73]"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <span>
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                            </>
                          ) : (
                            dateRange.from.toLocaleDateString()
                          )
                        ) : (
                          "Select date range"
                        )}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Search field */}
              <div className="md:col-span-3">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Search className="h-4 w-4 mr-1.5 text-[#025E73]" />
                  Search Leads
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="search"
                    type="text"
                    placeholder="Name, email, phone, MC/DOT..."
                    className="pl-10 bg-white border-gray-200 focus:ring-[#025E73] focus:border-[#025E73]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* Results count and view toggles */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700 mr-2">View:</span>
                  <div className="flex border rounded-md overflow-hidden shadow-sm">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className={`rounded-l-md px-3 border ${
                              viewMode === 'list'
                                ? 'bg-[#025E73] text-white border-[#025E73] shadow-md'
                                : 'bg-white text-[#025E73] border-[#025E73] hover:bg-[#025E73] hover:text-white'
                            }`}
                          >
                            <List className="h-5 w-5 stroke-2" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>List View</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('kanban')}
                            className={`rounded-r-md px-3 border-l-0 border ${
                              viewMode === 'kanban'
                                ? 'bg-[#025E73] text-white border-[#025E73] shadow-md'
                                : 'bg-white text-[#025E73] border-[#025E73] hover:bg-[#025E73] hover:text-white'
                            }`}
                          >
                            <LayoutGrid className="h-5 w-5 stroke-2" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Kanban Board</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700 mr-2">Sort:</span>
                  <Select
                    value={`${sortField}-${sortDirection}`}
                    onValueChange={(value) => {
                      const [field, direction] = value.split('-');
                      setSortField(field);
                      setSortDirection(direction as "asc" | "desc");
                    }}
                  >
                    <SelectTrigger className="w-[180px] h-9 border-gray-200 focus:ring-[#025E73] focus:border-[#025E73]">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt-desc">
                        <span className="flex items-center">
                          <ArrowDown10 className="h-3.5 w-3.5 mr-2" />
                          Newest First
                        </span>
                      </SelectItem>
                      <SelectItem value="createdAt-asc">
                        <span className="flex items-center">
                          <ArrowUp10 className="h-3.5 w-3.5 mr-2" />
                          Oldest First
                        </span>
                      </SelectItem>
                      <SelectItem value="companyName-asc">
                        <span className="flex items-center">
                          <Building2 className="h-3.5 w-3.5 mr-2" />
                          Company (A-Z)
                        </span>
                      </SelectItem>
                      <SelectItem value="companyName-desc">
                        <span className="flex items-center">
                          <Building2 className="h-3.5 w-3.5 mr-2" />
                          Company (Z-A)
                        </span>
                      </SelectItem>
                      <SelectItem value="qualificationScore-desc">
                        <span className="flex items-center">
                          <Star className="h-3.5 w-3.5 mr-2 text-yellow-500" />
                          Highest Score First
                        </span>
                      </SelectItem>
                      <SelectItem value="priority-desc">
                        <span className="flex items-center">
                          <BadgeCheck className="h-3.5 w-3.5 mr-2 text-blue-500" />
                          High Priority First
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="text-sm">
                <Badge variant="outline" className="bg-[#F2F5F9] text-[#025E73] border-[#025E73] font-semibold">
                  {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'} 
                  {statusFilter !== 'all' ? ` (${statusFilter})` : ''}
                </Badge>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "flex gap-1 items-center", 
                    viewMode === 'list' ? "bg-[#025E73] hover:bg-[#025E73]/90 text-white" : ""
                  )}
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">List</span>
                </Button>
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className={cn(
                    "flex gap-1 items-center",
                    viewMode === 'kanban' ? "bg-[#025E73] hover:bg-[#025E73]/90 text-white" : ""
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">Kanban</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </MotionWrapper>
      
      {/* Display leads in selected view mode */}
      {viewMode === 'kanban' ? (
        <MotionWrapper animation="fade-up" delay={0.3}>
          <KanbanView leads={filteredLeads} setLocation={setLocation} showFilter={statusFilter} />
        </MotionWrapper>
      ) : (
        <MotionWrapper animation="fade-up" delay={0.3}>
          <Card className="shadow-md overflow-hidden border rounded-lg border-gray-200">
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead 
                      className="w-[18%] cursor-pointer hover:bg-gray-100 transition-colors rounded-tl-md"
                      onClick={() => toggleSort('companyName')}
                    >
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-1.5 text-[#025E73]" />
                        <span className="font-semibold text-gray-700">Company</span>
                        {sortField === 'companyName' ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp10 className="ml-1 h-4 w-4 text-[#025E73]" />
                          ) : (
                            <ArrowDown10 className="ml-1 h-4 w-4 text-[#025E73]" />
                          )
                        ) : (
                          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 text-gray-400" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="w-[18%]">
                      <div className="flex items-center">
                        <UserPlus className="h-4 w-4 mr-1.5 text-[#025E73]" />
                        <span className="font-semibold text-gray-700">Contact Information</span>
                      </div>
                    </TableHead>
                    <TableHead 
                      className="w-[13%] cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleSort('status')}
                    >
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 mr-1.5 text-[#025E73]" />
                        <span className="font-semibold text-gray-700">Status</span>
                        {sortField === 'status' ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp10 className="ml-1 h-4 w-4 text-[#025E73]" />
                          ) : (
                            <ArrowDown10 className="ml-1 h-4 w-4 text-[#025E73]" />
                          )
                        ) : (
                          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 text-gray-400" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="w-[15%] cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleSort('qualificationScore')}
                    >
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-1.5 text-[#025E73]" />
                        <span className="font-semibold text-gray-700">Qualification</span>
                        {sortField === 'qualificationScore' ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp10 className="ml-1 h-4 w-4 text-[#025E73]" />
                          ) : (
                            <ArrowDown10 className="ml-1 h-4 w-4 text-[#025E73]" />
                          )
                        ) : (
                          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 text-gray-400" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="w-[13%]">
                      <div className="flex items-center">
                        <Truck className="h-4 w-4 mr-1.5 text-[#025E73]" />
                        <span className="font-semibold text-gray-700">Equipment</span>
                      </div>
                    </TableHead>
                    <TableHead 
                      className="w-[13%] cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleSort('createdAt')}
                    >
                      <div className="flex items-center">
                        <CalendarClock className="h-4 w-4 mr-1.5 text-[#025E73]" />
                        <span className="font-semibold text-gray-700">Date</span>
                        {sortField === 'createdAt' ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp10 className="ml-1 h-4 w-4 text-[#025E73]" />
                          ) : (
                            <ArrowDown10 className="ml-1 h-4 w-4 text-[#025E73]" />
                          )
                        ) : (
                          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 text-gray-400" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="w-[10%] text-right rounded-tr-md">
                      <div className="flex items-center justify-end">
                        <span className="font-semibold text-gray-700">Action</span>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <SearchIcon className="h-10 w-10 mb-2 text-gray-400" />
                          <p>No leads found matching your filters</p>
                          <Button
                            variant="link"
                            onClick={() => {
                              setStatusFilter('all');
                              setCategoryFilter('all');
                              setSearchQuery('');
                            }}
                            className="mt-2"
                          >
                            Clear filters
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.map((lead) => (
                      <TableRow 
                        key={lead.id} 
                        className={`hover:bg-gray-50 cursor-pointer transition-colors border-l-2 ${
                          lead.priority === "High" 
                            ? "border-l-red-500" 
                            : lead.qualificationScore > 80
                              ? "border-l-green-500"
                              : lead.status === "New"
                                ? "border-l-blue-500"
                                : "border-l-transparent"
                        }`}
                        onClick={() => setLocation(`/crm/leads/${lead.id}`)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <div className="flex items-center">
                              <span className="text-[#025E73] font-semibold hover:underline">
                                {lead.companyName}
                              </span>
                              {lead.priority === "High" && (
                                <Badge className="ml-2 bg-red-100 text-red-700 border-none shadow-sm">
                                  Priority
                                </Badge>
                              )}
                              {lead.qualificationScore > 80 && (
                                <Badge className="ml-2 bg-green-100 text-green-700 border-none shadow-sm">
                                  <Star className="h-3 w-3 mr-1 fill-current" />
                                  High Score
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center mt-1">
                              {lead.mcNumber && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                  MC: {lead.mcNumber}
                                </span>
                              )}
                              {lead.dotNumber && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded ml-1">
                                  DOT: {lead.dotNumber}
                                </span>
                              )}
                              {lead.category && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded ml-1">
                                  {lead.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium flex items-center">
                              <Avatar className="h-7 w-7 mr-2 bg-[#025E73] text-white border-2 border-white shadow-sm">
                                <AvatarFallback className="text-xs font-bold">{lead.contactName?.charAt(0) || '?'}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{lead.contactName || 'Unknown Contact'}</span>
                            </div>
                            {lead.phoneNumber && (
                              <div className="text-xs text-gray-600 flex items-center hover:text-[#025E73]">
                                <Phone className="h-3 w-3 mr-1" />
                                {lead.phoneNumber}
                              </div>
                            )}
                            {lead.email && (
                              <div className="text-xs text-gray-600 flex items-center hover:text-[#025E73]">
                                <Mail className="h-3 w-3 mr-1" />
                                <span className="truncate max-w-[150px]">{lead.email}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${formatStatus(lead.status).color} font-medium shadow-sm`}>
                            {formatStatus(lead.status).label}
                          </Badge>
                          {lead.updatedAt && lead.status === "FollowUp" && (
                            <div className="text-xs mt-1 text-amber-600 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Due: {formatDate(lead.updatedAt, true)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {lead.qualificationScore ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger className="flex flex-col items-start w-full">
                                  <div className="flex justify-between w-full items-center mb-1">
                                    <span className="text-sm font-medium">
                                      Score: {lead.qualificationScore}
                                    </span>
                                    <Badge variant="outline" className={
                                      lead.qualificationScore > 80
                                        ? "bg-green-50 text-green-700 border-green-200" 
                                        : lead.qualificationScore > 50
                                          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                          : "bg-gray-50 text-gray-700 border-gray-200"
                                    }>
                                      {lead.qualificationScore > 80 ? "High" : lead.qualificationScore > 50 ? "Medium" : "Low"}
                                    </Badge>
                                  </div>
                                  <Progress 
                                    value={lead.qualificationScore || 0} 
                                    max={100}
                                    className={`h-2 ${
                                      lead.qualificationScore > 80
                                        ? "bg-green-100" 
                                        : lead.qualificationScore > 50
                                          ? "bg-yellow-100"
                                          : "bg-gray-100"
                                    }`}
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Qualification Score: {lead.qualificationScore}/100</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                              Not Scored
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Truck className="h-3.5 w-3.5 mr-1.5 text-[#025E73]" />
                            <span className="capitalize">
                              {lead.equipmentType ? lead.equipmentType.replace("-", " ") : "N/A"}
                            </span>
                          </div>
                          {lead.truckCategory && (
                            <div className="text-xs text-gray-600 mt-1 ml-5 bg-gray-50 px-1.5 py-0.5 rounded-sm inline-block">
                              {lead.truckCategory}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <CalendarClock className="h-3.5 w-3.5 mr-1.5 text-[#025E73]" />
                            {formatDate(lead.createdAt)}
                          </div>
                          {lead.assignedTo && (
                            <div className="text-xs text-gray-600 mt-1 flex items-center">
                              <UserPlus className="h-3 w-3 mr-1 text-gray-500" />
                              Rep: {lead.assignedTo}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 border-[#025E73] text-[#025E73] hover:bg-[#025E73] hover:text-white transition-colors shadow-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/crm/leads/${lead.id}`);
                              }}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              View
                            </Button>
                            
                            <AdminActions 
                              item={lead}
                              module="leads"
                              onEdit={() => openEditModal(lead)}
                              onDelete={async () => {
                                await deleteEntity(lead.id);
                                return;
                              }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </MotionWrapper>
      )}
      
      {/* New Lead Modal */}
      <NewLeadModal 
        open={newLeadModalOpen} 
        onOpenChange={setNewLeadModalOpen}
      />
      
      {/* Admin Edit Modal */}
      <AdminEditModal
        title={`Edit Lead`}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        fields={fields}
        data={selectedItem}
        onSubmit={updateEntity}
        isLoading={isAdminActionLoading}
      />
    </div>
  );
}

// Custom icon for empty state
function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
      <path d="M11 8v6" />
      <path d="M8 11h6" />
    </svg>
  );
}