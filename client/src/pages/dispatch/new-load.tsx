import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/hooks/use-auth";
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
      // Make sure we have the current user's ID to assign the load
      if (!values.assignedTo && user?.id) {
        values.assignedTo = user.id;
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
  
  // Loading state
  if (isLoadingClients) {
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

  return (
    <div className="container mx-auto">
      {/* Page header */}
      <MotionWrapper animation="fade-down" delay={0.1}>
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
      
      {/* Note for development */}
      <MotionWrapper animation="fade-up" delay={0.2}>
        <Card className="border-amber-200 bg-amber-50 mb-6">
          <CardContent className="pt-6 pb-4">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
              <div>
                <p className="text-amber-700 text-sm">
                  This page is a skeleton implementation. The form is set up to collect the data but the backend storage and API integration is still in development.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </MotionWrapper>
      
      {/* Form */}
      <MotionWrapper animation="fade-up" delay={0.3}>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <div className="space-y-2">
                      <Label htmlFor="clientId">Client <span className="text-red-500">*</span></Label>
                      <Select 
                        value={formData.clientId} 
                        onValueChange={(value) => setFormData({...formData, clientId: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeClients.length === 0 ? (
                            <SelectItem value="no_clients" disabled>No active clients</SelectItem>
                          ) : (
                            activeClients.map((client: any) => (
                              <SelectItem 
                                key={client.id} 
                                value={client.id.toString()}
                              >
                                {client.companyName || client.name || `Client ${client.id}`}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="loadType">Load Type</Label>
                      <Select 
                        value={formData.loadType} 
                        onValueChange={(value) => setFormData({...formData, loadType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select load type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="expedited">Expedited</SelectItem>
                          <SelectItem value="hazardous">Hazardous</SelectItem>
                          <SelectItem value="refrigerated">Refrigerated</SelectItem>
                          <SelectItem value="oversized">Oversized</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="origin">Origin <span className="text-red-500">*</span></Label>
                      <Input
                        id="origin"
                        name="origin"
                        placeholder="City, State"
                        value={formData.origin}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="destination">Destination <span className="text-red-500">*</span></Label>
                      <Input
                        id="destination"
                        name="destination"
                        placeholder="City, State"
                        value={formData.destination}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pickupDate">Pickup Date <span className="text-red-500">*</span></Label>
                      <Input
                        id="pickupDate"
                        name="pickupDate"
                        type="date"
                        value={formData.pickupDate}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="deliveryDate">Delivery Date</Label>
                      <Input
                        id="deliveryDate"
                        name="deliveryDate"
                        type="date"
                        value={formData.deliveryDate}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="equipmentType">Equipment Type</Label>
                      <Select 
                        value={formData.equipmentType} 
                        onValueChange={(value) => setFormData({...formData, equipmentType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select equipment type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dry_van">Dry Van</SelectItem>
                          <SelectItem value="reefer">Reefer</SelectItem>
                          <SelectItem value="flatbed">Flatbed</SelectItem>
                          <SelectItem value="step_deck">Step Deck</SelectItem>
                          <SelectItem value="lowboy">Lowboy</SelectItem>
                          <SelectItem value="tanker">Tanker</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight (lbs)</Label>
                      <Input
                        id="weight"
                        name="weight"
                        type="number"
                        placeholder="Weight in pounds"
                        value={formData.weight}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="Enter any additional notes about this load"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={4}
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
                    <div className="space-y-2">
                      <Label htmlFor="rate">Rate <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                        </div>
                        <Input
                          id="rate"
                          name="rate"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="pl-8"
                          value={formData.rate}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
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
                      disabled={createLoadMutation.isPending}
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
                  <CardTitle>Client Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {formData.clientId ? (
                    (() => {
                      const client = activeClients.find((c: any) => c.id.toString() === formData.clientId);
                      
                      if (!client) {
                        return (
                          <div className="flex items-center text-amber-600">
                            <AlertCircle className="h-5 w-5 mr-2" />
                            <span className="text-sm">Client not found</span>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="space-y-3">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Company</h3>
                            <p className="font-medium">{client.companyName}</p>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Contact</h3>
                            <p>{client.contactName}</p>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                            <p>{client.phoneNumber}</p>
                          </div>
                          
                          {client.email && (
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Email</h3>
                              <p className="text-sm">{client.email}</p>
                            </div>
                          )}
                          
                          <Separator />
                          
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">MC Number</h3>
                            <p>{client.mcNumber}</p>
                          </div>
                          
                          {client.dotNumber && (
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">DOT Number</h3>
                              <p>{client.dotNumber}</p>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4 text-gray-500">
                      <Truck className="h-8 w-8 mb-2 text-gray-300" />
                      <p className="text-center">Select a client to see their information</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </MotionWrapper>
    </div>
  );
}