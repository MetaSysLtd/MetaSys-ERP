import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate, getStatusColor, formatCurrency } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Truck, Plus, Search, Calendar, MapPin, DollarSign } from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loadFormSchema = z.object({
  leadId: z.coerce.number(),
  origin: z.string().min(2, { message: "Origin is required" }),
  destination: z.string().min(2, { message: "Destination is required" }),
  pickupDate: z.string().min(1, { message: "Pickup date is required" }),
  deliveryDate: z.string().min(1, { message: "Delivery date is required" }),
  freightAmount: z.coerce.number().min(1, { message: "Freight amount is required" }),
  serviceCharge: z.coerce.number().min(0.1, { message: "Service charge is required" }),
  notes: z.string().optional(),
  status: z.string().default("booked"),
});

type LoadFormValues = z.infer<typeof loadFormSchema>;

export default function DispatchPage() {
  const { toast } = useToast();
  const { user, role } = useAuth();
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active-loads");
  const [filteredLoads, setFilteredLoads] = useState<any[]>([]);
  const [activeLeads, setActiveLeads] = useState<any[]>([]);
  
  // Initialize form
  const form = useForm<LoadFormValues>({
    resolver: zodResolver(loadFormSchema),
    defaultValues: {
      leadId: 0,
      origin: "",
      destination: "",
      pickupDate: new Date().toISOString().split("T")[0],
      deliveryDate: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
      freightAmount: 0,
      serviceCharge: 0,
      notes: "",
      status: "booked",
    },
  });
  
  // Get loads from the API
  const { data: loads, isLoading: isLoadingLoads, error: loadsError } = useQuery({
    queryKey: ["/api/loads"],
  });
  
  // Get active leads for creating loads
  const { data: leads, isLoading: isLoadingLeads } = useQuery({
    queryKey: ["/api/leads", { status: "active" }],
  });
  
  // Create load mutation
  const createLoadMutation = useMutation({
    mutationFn: async (values: LoadFormValues) => {
      return apiRequest("POST", "/api/loads", {
        ...values,
        assignedTo: user?.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Load created",
        description: "The load has been created successfully.",
      });
      setLoadModalOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/loads"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create load.",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: LoadFormValues) => {
    createLoadMutation.mutate(values);
  };
  
  // Update filtered loads based on search and status filter
  useEffect(() => {
    if (!loads) return;
    
    let filtered = [...loads];
    
    // Filter by status
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((load) => load.status === statusFilter);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (load) =>
          load.origin.toLowerCase().includes(query) ||
          load.destination.toLowerCase().includes(query)
      );
    }
    
    setFilteredLoads(filtered);
  }, [loads, statusFilter, searchQuery]);
  
  // Update active leads
  useEffect(() => {
    if (leads) {
      setActiveLeads(leads.filter((lead: any) => lead.status === "active"));
    }
  }, [leads]);
  
  // Show error toast if loads fetch fails
  useEffect(() => {
    if (loadsError) {
      toast({
        title: "Error",
        description: "Failed to load dispatch data. Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [loadsError, toast]);
  
  // Check if user can create loads
  const canCreateLoad = role && (role.department === "dispatch" || role.department === "admin");
  
  if (isLoadingLoads) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Loading dispatch data...</h3>
          <p className="mt-1 text-sm text-gray-500">Please wait while we fetch your data.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      {/* Page header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2 sm:mb-0">
              Dispatch Management
            </h1>
            <div className="flex flex-wrap space-x-2">
              {canCreateLoad && (
                <Button
                  onClick={() => setLoadModalOpen(true)}
                  size="sm"
                  className="h-9"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New Load
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Page content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="active-loads" onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="active-loads">Active Loads</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
            <TabsTrigger value="invoiced">Invoiced</TabsTrigger>
          </TabsList>
          
          <Card className="shadow mb-6">
            <CardHeader className="px-5 py-4 border-b border-gray-200">
              <CardTitle className="text-lg leading-6 font-medium text-gray-900">
                Load Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-1/3">
                  <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status-filter" className="w-full">
                      <SelectValue placeholder="All Loads" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Loads</SelectItem>
                      <SelectItem value="booked">Booked</SelectItem>
                      <SelectItem value="in_transit">In Transit</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="invoiced">Invoiced</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-full sm:w-2/3">
                  <label htmlFor="search-loads" className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <form onSubmit={(e) => e.preventDefault()}>
                    <div className="relative text-gray-400 focus-within:text-gray-600">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5" />
                      </div>
                      <Input
                        id="search-loads"
                        className="pl-10"
                        placeholder="Search by origin, destination..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <TabsContent value="active-loads">
            <Card className="shadow overflow-hidden">
              <CardHeader className="px-5 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg leading-6 font-medium text-gray-900">
                    Active Loads
                  </CardTitle>
                  <span className="text-sm text-gray-500">
                    Showing {filteredLoads.filter(load => ["booked", "in_transit"].includes(load.status)).length} loads
                  </span>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Origin</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Pickup Date</TableHead>
                      <TableHead>Delivery Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Freight Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLoads.filter(load => ["booked", "in_transit"].includes(load.status)).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <Truck className="h-12 w-12 mb-2" />
                            <h3 className="text-lg font-medium">No active loads found</h3>
                            <p className="text-sm max-w-md mt-1">
                              There are no active loads that match your filters. Try changing your filters or create a new load.
                            </p>
                            {canCreateLoad && (
                              <Button
                                onClick={() => setLoadModalOpen(true)}
                                className="mt-4"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Create New Load
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLoads
                        .filter(load => ["booked", "in_transit"].includes(load.status))
                        .map((load) => {
                          const statusStyle = getStatusColor(load.status);
                          
                          return (
                            <TableRow key={load.id}>
                              <TableCell className="font-medium">
                                {load.origin}
                              </TableCell>
                              <TableCell>{load.destination}</TableCell>
                              <TableCell>{formatDate(load.pickupDate)}</TableCell>
                              <TableCell>{formatDate(load.deliveryDate)}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline"
                                  className={`${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} px-2 inline-flex text-xs leading-5 font-semibold rounded-full`}
                                >
                                  {load.status.replace("_", " ").charAt(0).toUpperCase() + load.status.replace("_", " ").slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatCurrency(load.freightAmount)}</TableCell>
                              <TableCell>
                                <Button
                                  variant="link"
                                  className="text-primary-600 hover:text-primary-900 p-0 h-auto"
                                  onClick={() => {
                                    toast({
                                      title: "Feature in development",
                                      description: "Load details view is coming soon.",
                                    });
                                  }}
                                >
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="delivered">
            <Card className="shadow overflow-hidden">
              <CardHeader className="px-5 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg leading-6 font-medium text-gray-900">
                    Delivered Loads
                  </CardTitle>
                  <span className="text-sm text-gray-500">
                    Showing {filteredLoads.filter(load => load.status === "delivered").length} loads
                  </span>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Origin</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Pickup Date</TableHead>
                      <TableHead>Delivery Date</TableHead>
                      <TableHead>Freight Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLoads.filter(load => load.status === "delivered").length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <Truck className="h-12 w-12 mb-2" />
                            <h3 className="text-lg font-medium">No delivered loads found</h3>
                            <p className="text-sm max-w-md mt-1">
                              There are no delivered loads that match your filters.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLoads
                        .filter(load => load.status === "delivered")
                        .map((load) => (
                          <TableRow key={load.id}>
                            <TableCell className="font-medium">
                              {load.origin}
                            </TableCell>
                            <TableCell>{load.destination}</TableCell>
                            <TableCell>{formatDate(load.pickupDate)}</TableCell>
                            <TableCell>{formatDate(load.deliveryDate)}</TableCell>
                            <TableCell>{formatCurrency(load.freightAmount)}</TableCell>
                            <TableCell>
                              <Button
                                variant="link"
                                className="text-primary-600 hover:text-primary-900 p-0 h-auto"
                                onClick={() => {
                                  toast({
                                    title: "Feature in development",
                                    description: "Generate invoice functionality is coming soon.",
                                  });
                                }}
                              >
                                Generate Invoice
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="invoiced">
            <Card className="shadow overflow-hidden">
              <CardHeader className="px-5 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg leading-6 font-medium text-gray-900">
                    Invoiced Loads
                  </CardTitle>
                  <span className="text-sm text-gray-500">
                    Showing {filteredLoads.filter(load => ["invoiced", "paid"].includes(load.status)).length} loads
                  </span>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Origin</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Delivery Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Freight Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLoads.filter(load => ["invoiced", "paid"].includes(load.status)).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <Truck className="h-12 w-12 mb-2" />
                            <h3 className="text-lg font-medium">No invoiced loads found</h3>
                            <p className="text-sm max-w-md mt-1">
                              There are no invoiced or paid loads that match your filters.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLoads
                        .filter(load => ["invoiced", "paid"].includes(load.status))
                        .map((load) => {
                          const statusStyle = getStatusColor(load.status);
                          
                          return (
                            <TableRow key={load.id}>
                              <TableCell className="font-medium">
                                {load.origin}
                              </TableCell>
                              <TableCell>{load.destination}</TableCell>
                              <TableCell>{formatDate(load.deliveryDate)}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline"
                                  className={`${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} px-2 inline-flex text-xs leading-5 font-semibold rounded-full`}
                                >
                                  {load.status.replace("_", " ").charAt(0).toUpperCase() + load.status.replace("_", " ").slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatCurrency(load.freightAmount)}</TableCell>
                              <TableCell>
                                <Button
                                  variant="link"
                                  className="text-primary-600 hover:text-primary-900 p-0 h-auto"
                                  onClick={() => {
                                    toast({
                                      title: "Feature in development",
                                      description: "View invoice functionality is coming soon.",
                                    });
                                  }}
                                >
                                  View Invoice
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* New Load Modal */}
      <Dialog open={loadModalOpen} onOpenChange={setLoadModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <DialogTitle className="text-lg leading-6 font-medium text-gray-900">
                  Create New Load
                </DialogTitle>
                <DialogDescription className="mt-2 text-sm text-gray-500">
                  Fill out the details to create a new load for dispatch.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="leadId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carrier *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a carrier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingLeads ? (
                          <SelectItem value="loading" disabled>Loading carriers...</SelectItem>
                        ) : activeLeads.length === 0 ? (
                          <SelectItem value="none" disabled>No active carriers available</SelectItem>
                        ) : (
                          activeLeads.map((lead) => (
                            <SelectItem key={lead.id} value={lead.id.toString()}>
                              {lead.companyName} (MC: {lead.mcNumber})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origin *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                          <Input className="pl-8" placeholder="City, State" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                          <Input className="pl-8" placeholder="City, State" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="pickupDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pickup Date *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                          <Input className="pl-8" type="date" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="deliveryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Date *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                          <Input className="pl-8" type="date" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="freightAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Freight Amount *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                          <Input className="pl-8" type="number" min="0" step="0.01" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="serviceCharge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Charge *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                          <Input className="pl-8" type="number" min="0" step="0.01" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        Based on the carrier's service charge percentage
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any additional information about the load"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLoadModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createLoadMutation.isPending}
                >
                  {createLoadMutation.isPending ? "Creating..." : "Create Load"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
