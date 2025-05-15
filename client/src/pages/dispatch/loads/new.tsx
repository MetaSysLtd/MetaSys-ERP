import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useSocket } from "@/hooks/use-socket";

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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Truck, DollarSign, Building, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Create form schema
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
});

type LoadFormValues = z.infer<typeof loadFormSchema>;

export default function NewLoadPage() {
  const { toast } = useToast();
  const { user, role } = useAuth();
  const [, setLocation] = useLocation();
  const socket = useSocket();
  const [isCalculating, setIsCalculating] = useState(false);
  const [commissionEstimate, setCommissionEstimate] = useState<number | null>(null);
  
  // Parse clientId from URL if present
  const searchParams = new URLSearchParams(window.location.search);
  const clientIdParam = searchParams.get("clientId");
  const initialClientId = clientIdParam ? parseInt(clientIdParam, 10) : undefined;
  
  // Initialize form
  const form = useForm<LoadFormValues>({
    resolver: zodResolver(loadFormSchema),
    defaultValues: {
      leadId: initialClientId || 0,
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
  
  // Get active clients (dispatch clients with leads)
  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ["/api/dispatch/clients"],
  });
  
  // Get active leads (alternative way to select clients)
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
    onSuccess: (response) => {
      response.json().then(data => {
        // Send socket notification about commission
        if (socket && data.id) {
          // Notify about the new load commission
          socket.emit("commission_event", {
            type: "load_created",
            userId: user?.id,
            leadId: form.getValues("leadId"),
            loadId: data.id,
            amount: calculateCommission(form.getValues("freightAmount"), form.getValues("serviceCharge")),
            message: `New load commission from ${form.getValues("origin")} to ${form.getValues("destination")}`
          });
        }
        
        toast({
          title: "Load created",
          description: "The load has been created successfully.",
        });
        
        // Redirect to loads page
        setLocation("/dispatch");
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ["/api/loads"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dispatch/clients"] });
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create load.",
        variant: "destructive",
      });
    },
  });
  
  // Get sales agent closing rate for a lead
  const { data: leadDetails } = useQuery({
    queryKey: ["/api/leads", form.watch("leadId")],
    enabled: !!form.watch("leadId"),
  });

  const salesClosingRate = leadDetails?.salesClosingRate || 0;
  
  // Calculate commission based on service charge and freight amount
  const calculateCommission = (freightAmount: number, serviceCharge: number): number => {
    // Default calculation: 2% of freight + 15% of service charge
    const freightCommission = freightAmount * 0.02;
    const serviceCommission = serviceCharge * 0.15;
    return parseFloat((freightCommission + serviceCommission).toFixed(2));
  };
  
  // Watch freight amount to auto-calculate service charge
  const freightAmount = form.watch("freightAmount");
  useEffect(() => {
    if (freightAmount > 0) {
      const serviceCharge = calculateServiceCharge(freightAmount);
      form.setValue("serviceCharge", serviceCharge);
      
      // Calculate commission estimate
      setIsCalculating(true);
      setTimeout(() => {
        const commission = calculateCommission(freightAmount, serviceCharge);
        setCommissionEstimate(commission);
        setIsCalculating(false);
      }, 500);
    }
  }, [freightAmount, form]);
  
  // Handle form submission
  const onSubmit = (values: LoadFormValues) => {
    createLoadMutation.mutate(values);
  };
  
  // Redirect if user doesn't have permission
  useEffect(() => {
    if (role && role.department !== "dispatch" && role.department !== "admin") {
      toast({
        title: "Access denied",
        description: "You don't have permission to create loads.",
        variant: "destructive",
      });
      setLocation("/dispatch");
    }
  }, [role, toast, setLocation]);
  
  // Filter active clients
  const activeClients = clients?.filter((client: any) => 
    client.status?.toLowerCase() === "active"
  ) || [];
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Create New Load</h1>
        <Button
          variant="outline"
          onClick={() => setLocation("/dispatch")}
        >
          Cancel
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="mr-2 h-5 w-5" />
                Load Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <FormField
                      control={form.control}
                      name="leadId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client*</FormLabel>
                          <Select
                            value={field.value.toString()}
                            onValueChange={(value) => field.onChange(parseInt(value, 10))}
                            disabled={isLoadingClients}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select client" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {activeClients.length === 0 ? (
                                <SelectItem value="0" disabled>No active clients</SelectItem>
                              ) : (
                                activeClients.map((client: any) => {
                                  const leadName = client.lead?.companyName || "Unknown";
                                  return (
                                    <SelectItem 
                                      key={client.leadId} 
                                      value={client.leadId.toString()}
                                    >
                                      {leadName}
                                    </SelectItem>
                                  );
                                })
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
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="booked">Booked</SelectItem>
                              <SelectItem value="in_transit">In Transit</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="origin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Origin*</FormLabel>
                          <FormControl>
                            <Input placeholder="Start location" {...field} />
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
                          <FormLabel>Destination*</FormLabel>
                          <FormControl>
                            <Input placeholder="End location" {...field} />
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
                          <FormLabel>Pickup Date*</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
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
                          <FormLabel>Delivery Date*</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
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
                          <FormLabel>Freight Amount*</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                              <Input 
                                type="number" 
                                step="0.01" 
                                min="0" 
                                className="pl-10" 
                                {...field} 
                                onChange={(e) => {
                                  field.onChange(e.target.valueAsNumber || 0);
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Enter the amount paid to the carrier
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="serviceCharge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Service Charge*</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  min="0" 
                                  className="pl-10" 
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e.target.valueAsNumber || 0);
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Enter negotiated service charge
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormItem>
                        <FormLabel>Sales Closing Rate</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type="text"
                              value={`${salesClosingRate}%`}
                              className="bg-gray-50 dark:bg-gray-800"
                              disabled
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Historical closing rate for this client
                        </FormDescription>
                      </FormItem>
                    </div>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter any special instructions or details about this load" 
                            className="min-h-[100px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={createLoadMutation.isPending || !form.formState.isValid}
                      className="bg-[#457B9D] hover:bg-[#2EC4B6] text-white rounded-md transition-colors duration-200"
                    >
                      {createLoadMutation.isPending ? "Creating..." : "Create Load"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Freight Amount:</span>
                  <span className="font-semibold">
                    ${freightAmount ? freightAmount.toFixed(2) : '0.00'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Service Charge:</span>
                  <span className="font-semibold">
                    ${form.getValues("serviceCharge").toFixed(2)}
                  </span>
                </div>
                
                <div className="border-t pt-2 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Total Invoice Amount:</span>
                  <span className="font-semibold text-lg">
                    ${(freightAmount + form.getValues("serviceCharge")).toFixed(2)}
                  </span>
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Commission Estimate</h3>
                  {isCalculating ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : commissionEstimate ? (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-green-800">Your Commission:</span>
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                          ${commissionEstimate.toFixed(2)}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Based on current commission rates and load details
                      </p>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm italic">
                      Enter freight amount to see estimated commission
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="mr-2 h-5 w-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {form.getValues("leadId") > 0 ? (
                (() => {
                  const selectedClientId = form.getValues("leadId");
                  const client = activeClients.find((c: any) => c.leadId === selectedClientId);
                  const lead = leads?.find((l: any) => l.id === selectedClientId);
                  
                  if (!client && !lead) {
                    return (
                      <div className="flex items-center text-amber-600">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        <span className="text-sm">Client data not available</span>
                      </div>
                    );
                  }
                  
                  const clientData = client || { lead };
                  const leadData = clientData.lead || lead || {};
                  
                  return (
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Company</h3>
                        <p className="font-medium">{leadData.companyName || "Unknown"}</p>
                      </div>
                      
                      {leadData.contactName && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Contact</h3>
                          <p>{leadData.contactName}</p>
                        </div>
                      )}
                      
                      {leadData.email && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Email</h3>
                          <p className="text-sm">{leadData.email}</p>
                        </div>
                      )}
                      
                      {leadData.phoneNumber && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                          <p className="text-sm">{leadData.phoneNumber}</p>
                        </div>
                      )}
                      
                      {leadData.mcNumber && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">MC Number</h3>
                          <p className="text-sm">{leadData.mcNumber}</p>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Building className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>Select a client to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}