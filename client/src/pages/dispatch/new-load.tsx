import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useSocket } from "@/hooks/use-socket";

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MotionWrapper } from "@/components/ui/motion-wrapper";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Save, 
  Truck, 
  MapPin, 
  Calendar,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Info,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";

// Form components
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Create form schema based on the backend requirements
const loadFormSchema = z.object({
  leadId: z.coerce.number().min(1, { message: "Client is required" }),
  origin: z.string().min(2, { message: "Origin is required" }),
  destination: z.string().min(2, { message: "Destination is required" }),
  pickupDate: z.string().min(1, { message: "Pickup date is required" }),
  deliveryDate: z.string().min(1, { message: "Delivery date is required" }),
  freightAmount: z.coerce.number().min(1, { message: "Freight amount is required" }),
  serviceCharge: z.coerce.number().min(0, { message: "Service charge must be a valid number" }),
  notes: z.string().optional(),
  status: z.string().default("booked"),
  assignedTo: z.number().optional(),
  dispatcherId: z.number().optional(),
});

type LoadFormValues = z.infer<typeof loadFormSchema>;

export default function NewLoadPage() {
  const { toast } = useToast();
  const { user, role } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const search = useSearch();
  const socket = useSocket();
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Parse clientId from URL if present
  const searchParams = new URLSearchParams(search);
  const initialClientId = searchParams.get("clientId");
  
  // Initialize form
  const form = useForm<LoadFormValues>({
    resolver: zodResolver(loadFormSchema),
    defaultValues: {
      leadId: initialClientId ? parseInt(initialClientId, 10) : 0,
      origin: "",
      destination: "",
      pickupDate: new Date().toISOString().split("T")[0],
      deliveryDate: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
      freightAmount: 0,
      serviceCharge: 0,
      notes: "",
      status: "booked",
      dispatcherId: user?.id,
    },
  });
  
  // Get active clients (dispatch clients with leads)
  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ["/api/dispatch/clients"],
  });
  
  // Get active leads (alternative way to select clients)
  const { data: leads, isLoading: isLoadingLeads } = useQuery({
    queryKey: ["/api/leads", { status: "active" }],
  });
  
  // Get dispatchers for the dispatcher dropdown
  const { data: dispatchers, isLoading: isLoadingDispatchers } = useQuery({
    queryKey: ["/api/users/department/dispatch"],
  });
  
  // Create load mutation
  const createLoadMutation = useMutation({
    mutationFn: async (values: LoadFormValues) => {
      // Make sure we have the current user's ID to assign the load
      if (!values.assignedTo && user?.id) {
        values.assignedTo = user.id;
      }
      
      // Make sure we have dispatcherId value
      if (!values.dispatcherId && user?.id) {
        values.dispatcherId = user.id;
      }
      
      return apiRequest("POST", "/api/dispatch/loads", values);
    },
    onSuccess: (response) => {
      response.json().then(data => {
        // Send socket notification about the new load
        if (socket && data.id) {
          socket.emit("load_event", {
            type: "load_created",
            loadId: data.id,
            message: `New load created from ${form.getValues("origin")} to ${form.getValues("destination")}`
          });
        }
        
        queryClient.invalidateQueries({ queryKey: ["/api/dispatch/loads"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dispatch/clients"] });
        
        toast({
          title: "Success",
          description: "Load created successfully",
          variant: "default",
        });
        
        setLocation("/dispatch/loads");
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create load",
        variant: "destructive",
      });
    }
  });
  
  // Calculate service charge based on freight amount
  const calculateServiceCharge = (freightAmount: number): number => {
    // Default to 10% of freight amount unless the client has a special rate
    const serviceChargeRate = 0.10;
    return parseFloat((freightAmount * serviceChargeRate).toFixed(2));
  };
  
  // Handle updating service charge when freight amount changes
  useEffect(() => {
    const freightAmount = form.getValues("freightAmount");
    if (freightAmount > 0) {
      setIsCalculating(true);
      const serviceCharge = calculateServiceCharge(freightAmount);
      form.setValue("serviceCharge", serviceCharge);
      setIsCalculating(false);
    }
  }, [form.watch("freightAmount")]);
  
  // Form submission handler
  const onSubmit = (values: LoadFormValues) => {
    // Ensure we have assignedTo value
    if (!values.assignedTo && user?.id) {
      values.assignedTo = user.id;
    }
    
    // Ensure we have dispatcherId value
    if (!values.dispatcherId && user?.id) {
      values.dispatcherId = user.id;
    }
    
    createLoadMutation.mutate(values);
  };
  
  // Loading state
  if (isLoadingClients || isLoadingLeads || isLoadingDispatchers) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-12 w-full mb-6" />
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    );
  }
  
  // Get active clients for the select dropdown
  const activeLeads = Array.isArray(leads) ? leads.filter((lead: any) => 
    lead.status === "Active" || lead.status === "HandToDispatch"
  ) : [];
  
  // Get active dispatch clients
  const activeDispatchClients = Array.isArray(clients) ? clients.filter((client: any) => 
    client.status === "Active"
  ) : [];

  return (
    <div className="container mx-auto">
      {/* Page header */}
      <MotionWrapper animation="slideDown" delay={0.1}>
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="mr-2"
                onClick={() => setLocation("/dispatch/loads")}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <h1 className="text-2xl font-semibold text-gray-900">
                Create New Load
              </h1>
            </div>
          </div>
        </div>
      </MotionWrapper>
      
      {/* Form */}
      <MotionWrapper animation="slideUp" delay={0.2}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main form column */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Load Details</CardTitle>
                  <CardDescription>
                    Enter the basic information about this load
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="leadId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client <span className="text-red-500">*</span></FormLabel>
                          <Select 
                            value={field.value.toString()} 
                            onValueChange={(value) => field.onChange(parseInt(value, 10))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select client" />
                            </SelectTrigger>
                            <SelectContent>
                              {activeLeads.length === 0 ? (
                                <SelectItem value="no_clients" disabled>No active clients</SelectItem>
                              ) : (
                                activeLeads.map((lead: any) => (
                                  <SelectItem 
                                    key={lead.id} 
                                    value={lead.id.toString()}
                                  >
                                    {lead.companyName || `Client ${lead.id}`}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select 
                            value={field.value} 
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="booked">Booked</SelectItem>
                              <SelectItem value="in_transit">In Transit</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="invoiced">Invoiced</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="origin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Origin <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input
                              placeholder="City, State"
                              {...field}
                            />
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
                          <FormLabel>Destination <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input
                              placeholder="City, State"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="pickupDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pickup Date <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                            />
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
                          <FormLabel>Delivery Date <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                            />
                          </FormControl>
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
                            placeholder="Enter any additional notes about this load"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dispatcherId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dispatcher</FormLabel>
                          <Select 
                            value={field.value ? field.value.toString() : ""} 
                            onValueChange={(value) => field.onChange(parseInt(value, 10))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select dispatcher" />
                            </SelectTrigger>
                            <SelectContent>
                              {!dispatchers || dispatchers.length === 0 ? (
                                <SelectItem value="no_dispatchers" disabled>No dispatchers available</SelectItem>
                              ) : (
                                <>
                                  {user?.id && (
                                    <SelectItem 
                                      key={`current-${user.id}`}
                                      value={user.id.toString()}
                                    >
                                      {user.firstName || user.username} (You)
                                    </SelectItem>
                                  )}
                                  {Array.isArray(dispatchers) && dispatchers
                                    .filter(d => d.id !== user?.id) // Don't show current user twice
                                    .map((dispatcher: any) => (
                                      <SelectItem 
                                        key={dispatcher.id} 
                                        value={dispatcher.id.toString()}
                                      >
                                        {dispatcher.firstName || dispatcher.username}
                                      </SelectItem>
                                    ))
                                  }
                                </>
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The dispatcher responsible for this load
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Financials</CardTitle>
                  <CardDescription>
                    Enter the financial details for this load
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="freightAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Freight Amount <span className="text-red-500">*</span></FormLabel>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <DollarSign className="h-4 w-4 text-gray-500" />
                            </div>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="pl-8"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(parseFloat(e.target.value) || 0);
                                }}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="serviceCharge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Charge</FormLabel>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <DollarSign className="h-4 w-4 text-gray-500" />
                            </div>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="pl-8"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(parseFloat(e.target.value) || 0);
                                }}
                              />
                            </FormControl>
                          </div>
                          <FormDescription>
                            {isCalculating ? (
                              <span className="text-xs text-gray-500">Calculating...</span>
                            ) : (
                              <span className="text-xs text-gray-500">Service charge is automatically calculated as 10% of freight amount</span>
                            )}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Sidebar column */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={createLoadMutation.isPending || !form.formState.isValid}
                    >
                      {createLoadMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Create Load
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setLocation("/dispatch/loads")}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Load Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Status:</span>
                      <span className="font-medium">Draft</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Created by:</span>
                      <span className="font-medium">{user?.username || "You"}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Date:</span>
                      <span className="font-medium">{new Date().toLocaleDateString()}</span>
                    </div>
                    
                    <Separator />
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Estimated Total:</span>
                      <span className="font-medium">${(
                        parseFloat(form.getValues("freightAmount").toString() || "0") + 
                        parseFloat(form.getValues("serviceCharge").toString() || "0")
                      ).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </form>
        </Form>
      </MotionWrapper>
    </div>
  );
}