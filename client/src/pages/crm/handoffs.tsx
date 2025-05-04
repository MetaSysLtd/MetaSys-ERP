import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Plus,
  Check,
  X,
  Clock,
  ExternalLink,
  UserCheck,
  Loader2,
  BarChart3,
  FileCheck,
  StopCircle,
  CheckCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from 'wouter';

// Form schema for creating/updating lead handoffs
const leadHandoffSchema = z.object({
  leadId: z.number().positive('Lead ID is required'),
  status: z.string().min(1, 'Status is required'),
  salesRepId: z.number().positive('Sales rep is required'),
  dispatcherId: z.number().nullable().optional(),
  handoffNotes: z.string().optional(),
  validationPoints: z.array(z.string()).min(1, 'At least one validation point is required'),
  qualityRating: z.number().min(1, 'Quality rating is required').max(5, 'Quality rating cannot exceed 5'),
  requiredDocuments: z.array(z.string()).optional(),
  documentationComplete: z.boolean().default(false),
  handoffDate: z.date().optional(),
  pricingVerified: z.boolean().default(false),
  customerVerified: z.boolean().default(false),
  requiredFormsFilled: z.boolean().default(false),
});

type LeadHandoffFormValues = z.infer<typeof leadHandoffSchema>;

// Function to format date strings
function formatDate(dateString: string | Date) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  let variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'success' = 'default';
  let icon = Clock;

  switch (status.toLowerCase()) {
    case 'pending':
      variant = 'secondary';
      icon = Clock;
      break;
    case 'approved':
      variant = 'success';
      icon = Check;
      break;
    case 'rejected':
      variant = 'destructive';
      icon = X;
      break;
    case 'in_review':
      variant = 'outline';
      icon = UserCheck;
      break;
    default:
      variant = 'default';
      icon = Clock;
  }

  return (
    <Badge variant={variant} className="flex items-center gap-1">
      {icon && <icon className="h-3 w-3" />}
      <span>{status.replace('_', ' ')}</span>
    </Badge>
  );
}

export default function LeadHandoffsPage() {
  const { toast } = useToast();
  const [isNewHandoffOpen, setIsNewHandoffOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isLeadDetailsOpen, setIsLeadDetailsOpen] = useState(false);

  // Fetch leads for dropdown
  const { data: leads } = useQuery({
    queryKey: ['/api/crm'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch users for dropdowns
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch lead handoffs
  const { data: handoffs, isLoading, isError } = useQuery({
    queryKey: ['/api/crm/lead-handoffs'],
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Create lead handoff mutation
  const createMutation = useMutation({
    mutationFn: async (data: LeadHandoffFormValues) => {
      const response = await apiRequest('POST', '/api/crm/lead-handoffs', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Lead handoff created successfully',
      });
      setIsNewHandoffOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/crm/lead-handoffs'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create lead handoff: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Setup form for creating new handoffs
  const newForm = useForm<LeadHandoffFormValues>({
    resolver: zodResolver(leadHandoffSchema),
    defaultValues: {
      leadId: 0,
      status: 'pending',
      salesRepId: 0,
      dispatcherId: null,
      handoffNotes: '',
      validationPoints: [''],
      qualityRating: 3,
      requiredDocuments: [],
      documentationComplete: false,
      pricingVerified: false,
      customerVerified: false,
      requiredFormsFilled: false,
    },
  });

  // Handle create form submission
  const onCreateSubmit = (data: LeadHandoffFormValues) => {
    const formData = {
      ...data,
      handoffDate: data.handoffDate || new Date(),
    };
    createMutation.mutate(formData);
  };

  // Add validation point to the form
  const addValidationPoint = () => {
    const currentPoints = newForm.getValues('validationPoints') || [];
    newForm.setValue('validationPoints', [...currentPoints, '']);
  };

  // Remove validation point from the form
  const removeValidationPoint = (index: number) => {
    const currentPoints = newForm.getValues('validationPoints');
    if (currentPoints.length > 1) {
      newForm.setValue(
        'validationPoints',
        currentPoints.filter((_, i) => i !== index)
      );
    } else {
      toast({
        title: 'Warning',
        description: 'At least one validation point is required',
        variant: 'destructive',
      });
    }
  };

  // Add required document to the form
  const addRequiredDocument = () => {
    const currentDocs = newForm.getValues('requiredDocuments') || [];
    newForm.setValue('requiredDocuments', [...currentDocs, '']);
  };

  // Remove required document from the form
  const removeRequiredDocument = (index: number) => {
    const currentDocs = newForm.getValues('requiredDocuments') || [];
    newForm.setValue(
      'requiredDocuments',
      currentDocs.filter((_, i) => i !== index)
    );
  };

  // Handle opening lead details
  const handleViewLead = (lead: any) => {
    setSelectedLead(lead);
    setIsLeadDetailsOpen(true);
  };

  // Filter handoffs based on active tab
  const filteredHandoffs = handoffs ? handoffs.filter((handoff: any) => {
    if (activeTab === 'all') return true;
    return handoff.status.toLowerCase() === activeTab.toLowerCase();
  }) : [];

  // Loading state
  if (isLoading) {
    return (
      <div className="container py-6">
        <PageHeader title="Lead Handoffs" description="Manage lead handoffs between sales and dispatch teams" />
        <div className="my-6">
          <Skeleton className="h-12 w-full mb-6" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full mb-4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-9 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="container py-6">
        <PageHeader title="Lead Handoffs" description="Manage lead handoffs between sales and dispatch teams" />
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load lead handoffs. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center">
        <PageHeader title="Lead Handoffs" description="Manage lead handoffs between sales and dispatch teams" />
        <Dialog open={isNewHandoffOpen} onOpenChange={setIsNewHandoffOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#025E73] hover:bg-[#025E73]/90">
              <Plus className="mr-2 h-4 w-4" /> New Handoff
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Lead Handoff</DialogTitle>
              <DialogDescription>
                Handoff a qualified lead from sales to the dispatch team.
              </DialogDescription>
            </DialogHeader>
            <Form {...newForm}>
              <form onSubmit={newForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={newForm.control}
                    name="leadId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lead*</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a lead" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {leads?.map((lead: any) => (
                              <SelectItem key={lead.id} value={lead.id.toString()}>
                                {lead.contactName} - {lead.companyName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={newForm.control}
                    name="dispatcherId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dispatcher</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                          defaultValue={field.value?.toString() || ''}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a dispatcher" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {users?.filter((user: any) => user.department === 'dispatch').map((user: any) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.firstName} {user.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          If not selected, the handoff will be available for any dispatcher to claim
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={newForm.control}
                  name="handoffNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Handoff Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter any additional notes about this handoff"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={newForm.control}
                  name="qualityRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead Quality Rating (1-5)*</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={5}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Rate the quality of this lead (1 = Poor, 5 = Excellent)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Validation Points</h3>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addValidationPoint}
                      className="text-[#025E73]"
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Validation Point
                    </Button>
                  </div>
                  {newForm.watch('validationPoints').map((point, index) => (
                    <div key={index} className="flex gap-2 mb-3">
                      <FormField
                        control={newForm.control}
                        name={`validationPoints.${index}`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Enter validation point" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeValidationPoint(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Required Documents</h3>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addRequiredDocument}
                      className="text-[#025E73]"
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Document
                    </Button>
                  </div>
                  {(newForm.watch('requiredDocuments') || []).map((doc, index) => (
                    <div key={index} className="flex gap-2 mb-3">
                      <FormField
                        control={newForm.control}
                        name={`requiredDocuments.${index}`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Enter document name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeRequiredDocument(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={newForm.control}
                    name="pricingVerified"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300 text-[#025E73] focus:ring-[#025E73]"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Pricing Verified</FormLabel>
                          <FormDescription>
                            All pricing details have been confirmed with the client
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={newForm.control}
                    name="customerVerified"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300 text-[#025E73] focus:ring-[#025E73]"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Customer Verified</FormLabel>
                          <FormDescription>
                            Customer identity and requirements have been confirmed
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={newForm.control}
                  name="documentationComplete"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300 text-[#025E73] focus:ring-[#025E73]"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Documentation Complete</FormLabel>
                        <FormDescription>
                          All required documentation has been collected from the client
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={newForm.control}
                  name="requiredFormsFilled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300 text-[#025E73] focus:ring-[#025E73]"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Required Forms Complete</FormLabel>
                        <FormDescription>
                          All required qualification forms have been completed
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsNewHandoffOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-[#025E73] hover:bg-[#025E73]/90"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Handoff'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lead Details Dialog */}
      <Dialog open={isLeadDetailsOpen} onOpenChange={setIsLeadDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
            <DialogDescription>
              View complete information about this lead.
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Company</p>
                  <p>{selectedLead.companyName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Contact</p>
                  <p>{selectedLead.contactName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p>{selectedLead.phoneNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p>{selectedLead.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p><StatusBadge status={selectedLead.status} /></p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created Date</p>
                  <p>{formatDate(selectedLead.createdAt)}</p>
                </div>
              </div>
              
              {selectedLead.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Notes</p>
                  <p className="bg-gray-50 p-3 rounded-md whitespace-pre-wrap">{selectedLead.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsLeadDetailsOpen(false)}
                >
                  Close
                </Button>
                <Link href={`/crm/${selectedLead.id}`}>
                  <Button className="bg-[#025E73] hover:bg-[#025E73]/90">
                    <ExternalLink className="mr-2 h-4 w-4" /> Open Lead
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs defaultValue="all" className="mt-6" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all" className="px-6">All</TabsTrigger>
          <TabsTrigger value="pending" className="px-6">Pending</TabsTrigger>
          <TabsTrigger value="in_review" className="px-6">In Review</TabsTrigger>
          <TabsTrigger value="approved" className="px-6">Approved</TabsTrigger>
          <TabsTrigger value="rejected" className="px-6">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {filteredHandoffs.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-md">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">No handoffs found</h3>
              <p className="mt-2 text-sm text-gray-500">
                {activeTab === 'all'
                  ? 'Start by creating a new lead handoff'
                  : `No ${activeTab.replace('_', ' ')} handoffs available`}
              </p>
              <Button
                onClick={() => setIsNewHandoffOpen(true)}
                className="mt-4 bg-[#025E73] hover:bg-[#025E73]/90"
              >
                <Plus className="mr-2 h-4 w-4" /> Create Handoff
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredHandoffs.map((handoff: any) => {
                // Find corresponding lead
                const lead = leads?.find((l: any) => l.id === handoff.leadId);
                const salesRep = users?.find((u: any) => u.id === handoff.salesRepId);
                const dispatcher = handoff.dispatcherId ? users?.find((u: any) => u.id === handoff.dispatcherId) : null;
                
                return (
                  <Card key={handoff.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          {lead?.companyName || `Lead #${handoff.leadId}`}
                        </CardTitle>
                        <StatusBadge status={handoff.status} />
                      </div>
                      <CardDescription className="line-clamp-2">
                        {lead?.contactName || 'Unknown contact'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <UserCheck className="h-4 w-4 mr-2 text-[#025E73]" />
                          <span className="font-medium">From:</span> 
                          <span className="ml-1">
                            {salesRep ? `${salesRep.firstName} ${salesRep.lastName}` : 'Unknown'}
                          </span>
                        </div>
                        {dispatcher && (
                          <div className="flex items-center text-sm">
                            <Truck className="h-4 w-4 mr-2 text-[#025E73]" />
                            <span className="font-medium">To:</span>
                            <span className="ml-1">
                              {`${dispatcher.firstName} ${dispatcher.lastName}`}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 mr-2 text-[#025E73]" />
                          <span>{formatDate(handoff.handoffDate || handoff.createdAt)}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <div className="flex items-center">
                            <BarChart3 className="h-4 w-4 mr-2 text-[#025E73]" />
                            <span className="font-medium">Quality:</span>
                            <span className="ml-1">
                              {handoff.qualityRating}/5
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex gap-2 flex-wrap">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant={handoff.documentationComplete ? "success" : "outline"} className="cursor-help">
                                  {handoff.documentationComplete ? <Check className="h-3 w-3 mr-1" /> : <StopCircle className="h-3 w-3 mr-1" />}
                                  Docs
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Documentation {handoff.documentationComplete ? 'complete' : 'incomplete'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant={handoff.pricingVerified ? "success" : "outline"} className="cursor-help">
                                  {handoff.pricingVerified ? <Check className="h-3 w-3 mr-1" /> : <StopCircle className="h-3 w-3 mr-1" />}
                                  Pricing
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Pricing {handoff.pricingVerified ? 'verified' : 'not verified'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant={handoff.requiredFormsFilled ? "success" : "outline"} className="cursor-help">
                                  {handoff.requiredFormsFilled ? <Check className="h-3 w-3 mr-1" /> : <StopCircle className="h-3 w-3 mr-1" />}
                                  Forms
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Required forms {handoff.requiredFormsFilled ? 'completed' : 'incomplete'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <div className="w-full grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => lead && handleViewLead(lead)}
                          className="w-full"
                        >
                          <FileCheck className="mr-2 h-4 w-4" /> View Lead
                        </Button>
                        <Link href={`/crm/handoffs/${handoff.id}`} className="w-full">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-[#025E73]"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" /> Review
                          </Button>
                        </Link>
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}