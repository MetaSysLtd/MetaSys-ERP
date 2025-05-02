import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Truck, 
  Plus, 
  Search, 
  FileSpreadsheet, 
  ArrowUpDown, 
  MapPin,
  CalendarDays,
  DollarSign,
  AlertCircle,
  Filter,
  LayoutGrid,
  List,
  MoreHorizontal,
  FileText,
  Printer,
  Copy,
  Trash2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { MotionWrapper } from "@/components/ui/motion-wrapper";

export default function DispatchLoadsPage() {
  const { toast } = useToast();
  const { user, role } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const queryClient = useQueryClient();
  const searchParams = new URLSearchParams(search);
  
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredLoads, setFilteredLoads] = useState<any[]>([]);
  const [viewTab, setViewTab] = useState<string>("all");
  
  // Get loads from the API
  const { data: loads, isLoading, error, isError } = useQuery({
    queryKey: ["/api/dispatch/loads"],
  });
  
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load dispatch data. Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  // Filter loads based on status and search query
  useEffect(() => {
    if (!loads) return;
    
    // Make sure loads is treated as an array
    let filtered = Array.isArray(loads) ? [...loads] : [];
    
    // Filter by status
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((load) => load.status === statusFilter);
    }
    
    // Filter by view tab
    if (viewTab === "upcoming") {
      filtered = filtered.filter((load) => 
        new Date(load.pickupDate) > new Date() && 
        ["pending", "assigned", "in_transit"].includes(load.status)
      );
    } else if (viewTab === "in_transit") {
      filtered = filtered.filter((load) => load.status === "in_transit");
    } else if (viewTab === "completed") {
      filtered = filtered.filter((load) => load.status === "delivered");
    } else if (viewTab === "issue") {
      filtered = filtered.filter((load) => load.hasIssue);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (load) =>
          (load.loadNumber && load.loadNumber.toLowerCase().includes(query)) ||
          (load.origin && load.origin.toLowerCase().includes(query)) ||
          (load.destination && load.destination.toLowerCase().includes(query)) ||
          (load.client && load.client.name && load.client.name.toLowerCase().includes(query))
      );
    }
    
    setFilteredLoads(filtered);
  }, [loads, statusFilter, viewTab, searchQuery]);
  
  // Determine user permissions
  const canCreateLoad = 
    role?.department === "admin" || 
    role?.department === "dispatch" ||
    (role?.permissions && role?.permissions.canCreateLoads);
  
  // Format status for display
  const formatStatus = (status: string) => {
    const statusMap = {
      "pending": { label: "Pending", color: "text-amber-600 bg-amber-50 border-amber-200" },
      "assigned": { label: "Assigned", color: "text-blue-600 bg-blue-50 border-blue-200" },
      "in_transit": { label: "In Transit", color: "text-purple-600 bg-purple-50 border-purple-200" },
      "delivered": { label: "Delivered", color: "text-green-600 bg-green-50 border-green-200" },
      "cancelled": { label: "Cancelled", color: "text-red-600 bg-red-50 border-red-200" },
      "issue": { label: "Issue", color: "text-red-600 bg-red-50 border-red-200" },
    };
    
    return statusMap[status as keyof typeof statusMap] || { label: status, color: "text-gray-600 bg-gray-50 border-gray-200" };
  };

  // Render loading skeleton
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-12 w-full mb-6" />
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    );
  }

  // Render error state
  if (isError) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <AlertCircle className="mr-2 h-5 w-5" />
              Error Loading Dispatch Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              {error instanceof Error ? error.message : "Failed to load dispatch data"}
            </p>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/dispatch/loads"] })}
            >
              Retry
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const dummyLoads = [
    {
      id: 1,
      loadNumber: "LD-001",
      origin: "Chicago, IL",
      destination: "Dallas, TX",
      pickupDate: "2025-05-01",
      deliveryDate: "2025-05-03",
      client: { name: "ABC Logistics" },
      status: "in_transit",
      rate: 2500,
      driver: "John Smith",
      equipment: "Dry Van",
      miles: 967,
      weight: "42000 lbs",
      hasIssue: false
    },
    {
      id: 2,
      loadNumber: "LD-002",
      origin: "Atlanta, GA",
      destination: "Miami, FL",
      pickupDate: "2025-05-02",
      deliveryDate: "2025-05-04",
      client: { name: "XYZ Transport" },
      status: "pending",
      rate: 1800,
      equipment: "Reefer",
      miles: 663,
      weight: "38000 lbs",
      hasIssue: false
    },
    {
      id: 3,
      loadNumber: "LD-003",
      origin: "Denver, CO",
      destination: "Phoenix, AZ",
      pickupDate: "2025-05-01",
      deliveryDate: "2025-05-02",
      client: { name: "Fast Freight Inc." },
      status: "delivered",
      rate: 2200,
      driver: "Sarah Johnson",
      equipment: "Flatbed",
      miles: 862,
      weight: "44000 lbs",
      hasIssue: false
    }
  ];

  // Use dummy data only if production data is not available
  const displayLoads = filteredLoads.length > 0 ? filteredLoads : dummyLoads;

  return (
    <div className="container mx-auto">
      {/* Page header */}
      <MotionWrapper animation="fade-down" delay={0.1}>
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Dispatch Load Management
              </h1>
              <p className="text-gray-500 mt-1">
                Manage and track all loads in the system
              </p>
            </div>
            {canCreateLoad && (
              <Button
                onClick={() => setLocation("/dispatch/new-load")}
                className="mt-4 sm:mt-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Load
              </Button>
            )}
          </div>
        </div>
      </MotionWrapper>
      
      {/* Tabs for different views */}
      <MotionWrapper animation="fade-up" delay={0.2}>
        <Tabs defaultValue="all" value={viewTab} onValueChange={setViewTab} className="mb-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <TabsTrigger value="all">All Loads</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="in_transit">In Transit</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="issue">Issues</TabsTrigger>
          </TabsList>
        </Tabs>
      </MotionWrapper>
      
      {/* Search and filter controls */}
      <MotionWrapper animation="fade-up" delay={0.3}>
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-1/4">
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value)}
                >
                  <SelectTrigger id="status-filter" className="w-full">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="issue">Issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-3/4">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="search"
                    type="text"
                    placeholder="Search by load #, origin, destination, client..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {displayLoads.length} {displayLoads.length === 1 ? 'load' : 'loads'} found
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Export functionality would go here
                    toast({
                      title: "Export Started",
                      description: "Your export is being prepared",
                    });
                  }}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </MotionWrapper>
      
      {/* Loads table */}
      <MotionWrapper animation="fade-up" delay={0.4}>
        <Card className="shadow overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Load #</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayLoads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No loads found. Create a new load to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayLoads.map((load) => (
                    <TableRow key={load.id}>
                      <TableCell className="font-medium">
                        {load.loadNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center text-sm">
                            <MapPin className="h-3 w-3 mr-1 text-gray-500" />
                            <span className="text-gray-700">{load.origin}</span>
                          </div>
                          <div className="flex items-center text-sm mt-1">
                            <MapPin className="h-3 w-3 mr-1 text-gray-500" />
                            <span className="text-gray-700">{load.destination}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-gray-900">
                          {load.client?.name}
                        </div>
                        {load.driver && (
                          <div className="text-xs text-gray-500">
                            Driver: {load.driver}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <div className="flex items-center">
                            <CalendarDays className="h-3 w-3 mr-1 text-gray-500" />
                            <span>Pickup: {formatDate(load.pickupDate)}</span>
                          </div>
                          {load.deliveryDate && (
                            <div className="flex items-center mt-1">
                              <CalendarDays className="h-3 w-3 mr-1 text-gray-500" />
                              <span>Delivery: {formatDate(load.deliveryDate)}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${formatStatus(load.status).color}`}>
                          {formatStatus(load.status).label}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium text-gray-900">
                          ${load.rate?.toLocaleString()}
                        </div>
                        {load.miles && (
                          <div className="text-xs text-gray-500">
                            {load.miles} miles
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setLocation(`/dispatch/loads/${load.id}`)}
                          >
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              toast({
                                title: "Feature Not Available",
                                description: "Load editing is coming soon",
                              });
                            }}
                          >
                            Edit
                          </Button>
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
    </div>
  );
}