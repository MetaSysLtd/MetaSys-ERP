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
import { ArrowLeft, Edit, Truck, FileText, Activity, UserCheck, AlertTriangle } from "lucide-react";
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
  
  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (values: StatusUpdateFormValues) => {
      return apiRequest("PATCH", `/api/leads/${id}`, {
        status: values.status,
        notes: values.notes,
      });
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "The lead status has been updated successfully.",
      });
      setStatusDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/activities/entity/lead/${id}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update lead status.",
        variant: "destructive",
      });
    },
  });
  
  const handleStatusUpdate = (values: StatusUpdateFormValues) => {
    updateStatusMutation.mutate(values);
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
  
  // Check if user can convert lead to active
  const canConvertToActive = () => {
    if (!lead) return false;
    if (lead.status === "active") return false;
    return canEditLead() && lead.status === "qualified";
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
            onClick={() => navigate("/leads")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Leads
          </Button>
        </div>
      </div>
    );
  }
  
  const statusStyle = getStatusColor(lead.status);
  
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
                onClick={() => navigate("/leads")}
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
                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
              </Badge>
            </div>
            <div className="flex space-x-2 mt-2 sm:mt-0">
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
              {canConvertToActive() && (
                <Button
                  size="sm"
                  className="h-9"
                  onClick={() => {
                    form.setValue("status", "active");
                    setStatusDialogOpen(true);
                  }}
                >
                  <UserCheck className="h-4 w-4 mr-1" />
                  Convert to Active
                </Button>
              )}
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
                      <h3 className="text-sm font-medium text-gray-500">MC Number</h3>
                      <p className="mt-1 text-sm text-gray-900">{lead.mcNumber}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">DOT Number</h3>
                      <p className="mt-1 text-sm text-gray-900">{lead.dotNumber || "-"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Equipment Type</h3>
                      <p className="mt-1 text-sm text-gray-900 capitalize">
                        {lead.equipmentType.replace("-", " ")}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Truck Category</h3>
                      <p className="mt-1 text-sm text-gray-900 capitalize">
                        {lead.truckCategory ? lead.truckCategory.replace("-", " ") : "-"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Factoring Status</h3>
                      <p className="mt-1 text-sm text-gray-900 capitalize">
                        {lead.factoringStatus.replace("-", " ")}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Service Charges</h3>
                      <p className="mt-1 text-sm text-gray-900">{lead.serviceCharges}%</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Created Date</h3>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(lead.createdAt)}</p>
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                      {lead.notes || "No notes available."}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
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
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="w-full space-y-2">
                    <Button className="w-full" variant="outline">
                      Call Contact
                    </Button>
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
                      {lead.status === "active"
                        ? "There are no loads associated with this lead yet."
                        : "This lead needs to be converted to active status before loads can be created."}
                    </p>
                    {lead.status === "active" && role?.department === "dispatch" && (
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
                                  {load.status.replace("_", " ").charAt(0).toUpperCase() + load.status.replace("_", " ").slice(1)}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">${load.freightAmount.toFixed(2)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Button variant="link" className="text-primary-600 hover:text-primary-900">
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
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No activities recorded</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No activity has been recorded for this lead yet.
                    </p>
                  </div>
                ) : (
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {activities.map((activity: any, activityIdx: number) => (
                        <li key={activity.id}>
                          <div className="relative pb-8">
                            {activityIdx !== activities.length - 1 ? (
                              <span
                                className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                aria-hidden="true"
                              />
                            ) : null}
                            <div className="relative flex space-x-3">
                              <div>
                                <span
                                  className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                    activity.action === "created"
                                      ? "bg-primary-500"
                                      : activity.action === "status_changed"
                                      ? "bg-yellow-500"
                                      : "bg-gray-500"
                                  }`}
                                >
                                  {activity.action === "created" ? (
                                    <Plus className="h-5 w-5 text-white" />
                                  ) : activity.action === "status_changed" ? (
                                    <Edit className="h-5 w-5 text-white" />
                                  ) : (
                                    <Activity className="h-5 w-5 text-white" />
                                  )}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p className="text-sm text-gray-500">
                                    {activity.details}{" "}
                                    <span className="font-medium text-gray-900">
                                      {activity.action === "created" ? "created" : activity.action === "status_changed" ? "updated" : "modified"}
                                    </span>
                                  </p>
                                </div>
                                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                  {formatDate(activity.timestamp)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Lead Status</DialogTitle>
            <DialogDescription>
              Change the status of the lead to reflect its current stage in the sales process.
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
                        <SelectItem value="unqualified">Unqualified</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                        <SelectItem value="won">Won</SelectItem>
                        <SelectItem value="follow-up">Follow-Up</SelectItem>
                        <SelectItem value="nurture">Nurture</SelectItem>
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
                    <FormLabel>Status Change Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add notes about this status change (optional)"
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
                >
                  {updateStatusMutation.isPending ? "Updating..." : "Update Status"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
