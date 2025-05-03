import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate, formatPhone, getStatusColor } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Edit, 
  Truck, 
  FileText, 
  Activity, 
  UserCheck, 
  AlertTriangle,
  Clipboard,
  ArrowRightCircle,
  Check,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface LeadDetailsProps {
  params: {
    id: string;
  };
}

const statusUpdateSchema = z.object({
  status: z.string(),
  notes: z.string().optional(),
});

type StatusUpdateFormValues = z.infer<typeof statusUpdateSchema>;

export default function LeadDetails({ params }: LeadDetailsProps) {
  const { id } = params;
  const { toast } = useToast();
  const { user, role } = useAuth();
  const [, navigate] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [remarkDialogOpen, setRemarkDialogOpen] = useState(false);
  const [remark, setRemark] = useState("");
  
  // Fetch lead details
  const { data: lead, isLoading, error } = useQuery({
    queryKey: [`/api/leads/${id}`],
  });
  
  // Fetch activities for this lead
  const { data: activities } = useQuery({
    queryKey: [`/api/activities/entity/lead/${id}`],
    enabled: !!id,
  });
  
  // Fetch loads for this lead
  const { data: loads } = useQuery({
    queryKey: [`/api/loads`, { leadId: id }],
    enabled: !!id,
  });
  
  // Status update form
  const form = useForm<StatusUpdateFormValues>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: {
      status: "",
      notes: "",
    },
  });
  
  // Set default status when lead data is loaded
  useEffect(() => {
    if (lead) {
      form.setValue("status", lead.status);
    }
  }, [lead, form]);
  
  // Determine next status based on current status
  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      "New": "InProgress",
      "InProgress": "HandToDispatch",
      "HandToDispatch": "Active", 
      "Active": "Active" // No next state after Active
    };
    
    return statusFlow[currentStatus as keyof typeof statusFlow] || currentStatus;
  };
  
  // Get status display text
  const getStatusDisplayText = (status: string) => {
    const statusMap: Record<string, string> = {
      "New": "New",
      "InProgress": "In Progress",
      "HandToDispatch": "Hand To Dispatch",
      "Active": "Active",
      "Lost": "Lost"
    };
    
    return statusMap[status] || status;
  };
  
  // Create Dispatch Client when lead is set to Active
  const createDispatchClient = async (leadId: number) => {
    try {
      // Create a new dispatch client record
      const res = await apiRequest("POST", "/api/dispatch-clients", {
        leadId: leadId,
        status: "Active",
        orgId: user?.orgId || 1,
        approvedBy: user?.id,
        notes: "Automatically created from CRM lead"
      });
      
      if (!res.ok) {
        throw new Error("Failed to create dispatch client");
      }
      
      return await res.json();
    } catch (error: any) {
      console.error("Error creating dispatch client:", error);
      throw error;
    }
  };
  
  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (values: StatusUpdateFormValues) => {
      const response = await apiRequest("PATCH", `/api/leads/${id}`, {
        status: values.status,
        notes: values.notes,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update lead status");
      }
      
      const data = await response.json();
      
      // If status is now Active, create a dispatch client
      if (values.status === "Active") {
        await createDispatchClient(Number(id));
        
        // Notify administrators and dispatch users
        await apiRequest("POST", "/api/notifications", {
          title: "Lead Activated",
          message: `${lead.companyName} has been activated and is ready for dispatch`,
          type: "lead_activation",
          entityId: Number(id),
          entityType: "lead",
          userId: user?.id,
          targetRoles: ["admin", "dispatch"]
        });
      }
      
      // Log the status change activity
      await apiRequest("POST", "/api/activities", {
        entityType: "lead",
        entityId: Number(id),
        action: "status_changed",
        details: `Status changed from ${lead.status} to ${values.status}`,
        notes: values.notes || undefined
      });
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "The lead status has been updated successfully.",
      });
      setStatusDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/activities/entity/lead/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/dispatch-clients`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update lead status.",
        variant: "destructive",
      });
    },
  });
  
  // Add remark mutation
  const addRemarkMutation = useMutation({
    mutationFn: async (remarkText: string) => {
      // Add a remark to the lead
      const response = await apiRequest("POST", "/api/lead-remarks", {
        leadId: Number(id),
        text: remarkText,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add remark");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Remark added",
        description: "Your remark has been added to the lead timeline.",
      });
      setRemarkDialogOpen(false);
      setRemark("");
      queryClient.invalidateQueries({ queryKey: [`/api/activities/entity/lead/${id}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add remark.",
        variant: "destructive",
      });
    },
  });
  
  const handleStatusUpdate = (values: StatusUpdateFormValues) => {
    updateStatusMutation.mutate(values);
  };
  
  const handleRemarkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remark.trim()) {
      toast({
        title: "Empty remark",
        description: "Please add some text for your remark.",
        variant: "destructive",
      });
      return;
    }
    
    addRemarkMutation.mutate(remark);
  };
  
  // Check if user can edit this lead
  const canEditLead = () => {
    if (!user || !role || !lead) return false;
    
    // Super admin can edit all leads
    if (role.level === 5) return true;
    
    // Only sales department can edit leads
    if (role.department !== "sales" && role.department !== "admin") return false;
    
    // Sales reps can only edit their own leads
    if (role.level === 1 && lead.assignedTo !== user.id) return false;
    
    return true;
  };
  
  // Check if the lead can be moved to the next status
  const canMoveToNextStatus = () => {
    if (!lead || !canEditLead()) return false;
    
    // Can't progress past Active
    if (lead.status === "Active" || lead.status === "Lost") return false;
    
    return true;
  };
  
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Loading lead details...</h3>
          <p className="mt-1 text-sm text-gray-500">Please wait while we fetch the data.</p>
        </div>
      </div>
    );
  }
  
  if (error || !lead) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Lead not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The lead you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button 
            className="mt-4" 
            variant="outline" 
            onClick={() => navigate("/crm")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to CRM
          </Button>
        </div>
      </div>
    );
  }
  
  const statusStyle = getStatusColor(lead.status);
  const nextStatus = getNextStatus(lead.status);
  
  return (
    <div>
      {/* Page header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                className="mr-2" 
                onClick={() => navigate("/crm")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-semibold text-gray-900">
                {lead.companyName}
              </h1>
              <Badge 
                variant="outline"
                className={`ml-3 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
              >
                {getStatusDisplayText(lead.status)}
              </Badge>
            </div>
            <div className="flex space-x-2 mt-2 sm:mt-0">
              {canMoveToNextStatus() && (
                <Button
                  size="sm"
                  className="h-9 bg-gradient-to-r from-[#025E73] to-[#011F26] hover:opacity-90 text-white"
                  onClick={() => {
                    form.setValue("status", nextStatus);
                    form.setValue("notes", `Moving lead to ${getStatusDisplayText(nextStatus)} status`);
                    setStatusDialogOpen(true);
                  }}
                >
                  <ArrowRightCircle className="h-4 w-4 mr-1" />
                  {lead.status === "HandToDispatch" ? "Activate Lead" : `Move to ${getStatusDisplayText(nextStatus)}`}
                </Button>
              )}
              
              {canEditLead() && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => setRemarkDialogOpen(true)}
                >
                  <Clipboard className="h-4 w-4 mr-1" />
                  Add Remark
                </Button>
              )}
              
              {canEditLead() && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => setStatusDialogOpen(true)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Update Status
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Status Progress Indicators */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2 w-full sm:w-1/4 justify-center">
              <div className={`rounded-full h-10 w-10 flex items-center justify-center 
                ${lead.status === "New" || lead.status === "InProgress" || lead.status === "HandToDispatch" || lead.status === "Active" 
                  ? "bg-green-100 text-green-600" 
                  : "bg-gray-100 text-gray-400"}`}>
                <Check className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">New</p>
                <p className="text-xs text-gray-500">Initial Contact</p>
              </div>
            </div>
            
            <div className="w-full sm:w-1/6 px-2">
              <div className={`h-1 ${lead.status === "InProgress" || lead.status === "HandToDispatch" || lead.status === "Active" 
                ? "bg-green-400" 
                : "bg-gray-200"}`}></div>
            </div>
            
            <div className="flex items-center space-x-2 w-full sm:w-1/4 justify-center">
              <div className={`rounded-full h-10 w-10 flex items-center justify-center 
                ${lead.status === "InProgress" || lead.status === "HandToDispatch" || lead.status === "Active" 
                  ? "bg-green-100 text-green-600" 
                  : "bg-gray-100 text-gray-400"}`}>
                {lead.status === "InProgress" || lead.status === "HandToDispatch" || lead.status === "Active" 
                  ? <Check className="h-5 w-5" /> 
                  : <ArrowRightCircle className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm font-medium">In Progress</p>
                <p className="text-xs text-gray-500">Qualification</p>
              </div>
            </div>
            
            <div className="w-full sm:w-1/6 px-2">
              <div className={`h-1 ${lead.status === "HandToDispatch" || lead.status === "Active" 
                ? "bg-green-400" 
                : "bg-gray-200"}`}></div>
            </div>
            
            <div className="flex items-center space-x-2 w-full sm:w-1/4 justify-center">
              <div className={`rounded-full h-10 w-10 flex items-center justify-center 
                ${lead.status === "HandToDispatch" || lead.status === "Active" 
                  ? "bg-green-100 text-green-600" 
                  : "bg-gray-100 text-gray-400"}`}>
                {lead.status === "HandToDispatch" || lead.status === "Active" 
                  ? <Check className="h-5 w-5" /> 
                  : <ArrowRightCircle className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm font-medium">Hand To Dispatch</p>
                <p className="text-xs text-gray-500">Ready for dispatch</p>
              </div>
            </div>
            
            <div className="w-full sm:w-1/6 px-2">
              <div className={`h-1 ${lead.status === "Active" 
                ? "bg-green-400" 
                : "bg-gray-200"}`}></div>
            </div>
            
            <div className="flex items-center space-x-2 w-full sm:w-1/4 justify-center">
              <div className={`rounded-full h-10 w-10 flex items-center justify-center 
                ${lead.status === "Active" 
                  ? "bg-green-100 text-green-600" 
                  : "bg-gray-100 text-gray-400"}`}>
                {lead.status === "Active" 
                  ? <Check className="h-5 w-5" /> 
                  : <ArrowRightCircle className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-gray-500">Client Onboarded</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Page content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="details">
          <TabsList className="mb-6">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="loads">Loads</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Lead Information */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Lead Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Company Name</h3>
                      <p className="mt-1 text-sm text-gray-900">{lead.companyName}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">MC Age</h3>
                      <p className="mt-1 text-sm text-gray-900">{lead.mcNumber}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Service Charges</h3>
                      <p className="mt-1 text-sm text-gray-900">{lead.serviceCharges}%</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Created Date</h3>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(lead.createdAt)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(lead.updatedAt)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Status</h3>
                      <Badge 
                        variant="outline"
                        className={`mt-1 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                      >
                        {getStatusDisplayText(lead.status)}
                      </Badge>
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Tags</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {lead.tags && lead.tags.length > 0 ? (
                        lead.tags.map((tag: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">No tags</span>
                      )}
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Remarks</h3>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                      {lead.remarks || "No remarks available."}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Contact Name</h3>
                      <p className="mt-1 text-sm text-gray-900">{lead.contactName}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Phone Number</h3>
                      <p className="mt-1 text-sm text-gray-900">{formatPhone(lead.phoneNumber)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Email</h3>
                      <p className="mt-1 text-sm text-gray-900">{lead.email || "-"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Assigned To</h3>
                      <div className="flex items-center mt-1">
                        <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center">
                          <UserCheck className="h-3.5 w-3.5 text-gray-500" />
                        </div>
                        <p className="ml-2 text-sm text-gray-900">
                          {lead.assignedToName || "Unassigned"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="w-full space-y-2">
                    {lead.phoneNumber && (
                      <Button className="w-full" variant="outline">
                        Call Contact
                      </Button>
                    )}
                    {lead.email && (
                      <Button className="w-full" variant="outline">
                        Email Contact
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="loads">
            <Card>
              <CardHeader>
                <CardTitle>Loads</CardTitle>
              </CardHeader>
              <CardContent>
                {!loads || loads.length === 0 ? (
                  <div className="text-center py-8">
                    <Truck className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No loads found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {lead.status === "Active"
                        ? "There are no loads associated with this lead yet."
                        : "This lead needs to be activated before loads can be created."}
                    </p>
                    {lead.status === "Active" && role?.department === "dispatch" && (
                      <Button className="mt-4">
                        Create Load
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Origin
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Destination
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pickup Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {loads.map((load: any) => {
                          const loadStatusStyle = getStatusColor(load.status);
                          
                          return (
                            <tr key={load.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{load.origin}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{load.destination}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{formatDate(load.pickupDate)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge 
                                  variant="outline"
                                  className={`${loadStatusStyle.bg} ${loadStatusStyle.text} ${loadStatusStyle.border}`}
                                >
                                  {load.status.charAt(0).toUpperCase() + load.status.slice(1)}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">${load.price.toFixed(2)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Button
                                  variant="link"
                                  className="text-primary-600 hover:text-primary-900"
                                  onClick={() => navigate(`/dispatch/${load.id}`)}
                                >
                                  View
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
              </CardHeader>
              <CardContent>
                {!activities || activities.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No activity found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No activities have been recorded for this lead yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity: any) => (
                      <div key={activity.id} className="flex py-3 border-b border-gray-200 last:border-0">
                        <div className="mr-4 flex-shrink-0">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full 
                            ${activity.action === 'created' ? 'bg-blue-100' : 
                              activity.action === 'status_changed' ? 'bg-green-100' : 'bg-primary-100'}`}>
                            {activity.action === 'created' && <Clipboard className="h-4 w-4 text-blue-600" />}
                            {activity.action === 'status_changed' && <ArrowRightCircle className="h-4 w-4 text-green-600" />}
                            {activity.action !== 'created' && activity.action !== 'status_changed' && 
                              <Activity className="h-4 w-4 text-primary-600" />}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{activity.details}</p>
                          <div className="mt-1 flex space-x-2 text-xs text-gray-500">
                            <p>{formatDate(activity.timestamp)}</p>
                          </div>
                          {activity.notes && (
                            <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">
                              {activity.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Lead Status</DialogTitle>
            <DialogDescription>
              Change the status of this lead and add optional notes about the change.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleStatusUpdate)} className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="InProgress">In Progress</SelectItem>
                        <SelectItem value="HandToDispatch">Hand To Dispatch</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add notes about this status change (optional)"
                        className="resize-none"
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
                  onClick={() => setStatusDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateStatusMutation.isPending}
                  className="bg-gradient-to-r from-[#025E73] to-[#011F26] hover:opacity-90 text-white"
                >
                  {updateStatusMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Status"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Add Remark Dialog */}
      <Dialog open={remarkDialogOpen} onOpenChange={setRemarkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Remark</DialogTitle>
            <DialogDescription>
              Add a new remark to this lead's timeline.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleRemarkSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="remark">Remark</Label>
              <Textarea
                id="remark"
                placeholder="Enter your remark here"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows={4}
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setRemarkDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={addRemarkMutation.isPending}
                className="bg-gradient-to-r from-[#025E73] to-[#011F26] hover:opacity-90 text-white"
              >
                {addRemarkMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Remark"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}