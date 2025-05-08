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
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { 
  Plus, 
  Star, 
  StarHalf, 
  File, 
  FileCheck2, 
  BarChart, 
  ArrowUpRight, 
  Phone, 
  Check, 
  X,
  ClipboardCheck,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from 'wouter';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';

// Form schema for updating lead qualification
const leadQualificationSchema = z.object({
  id: z.number(),
  qualificationScore: z.enum(['High', 'Medium', 'Low']),
  qualified: z.boolean().default(false),
  validationStatus: z.enum(['Pending', 'InProgress', 'Complete', 'Failed']),
  validationSteps: z.array(z.object({
    title: z.string(),
    complete: z.boolean().default(false),
    notes: z.string().optional(),
  })).optional(),
  financialQualification: z.object({
    creditScore: z.string().optional(),
    pastDueAccounts: z.boolean().default(false),
    financingApproved: z.boolean().default(false),
  }).optional(),
  operationalQualification: z.object({
    equipmentCount: z.number().min(0, 'Equipment count must be 0 or greater').optional(),
    compliantSafety: z.boolean().default(false),
    properInsurance: z.boolean().default(false),
  }).optional(),
  timelineQualification: z.object({
    readyToStart: z.boolean().default(false),
    expectedStartDate: z.string().optional(),
  }).optional(),
  callAttempts: z.number().min(0).optional(),
  emailsSent: z.number().min(0).optional(),
  lastContactDate: z.string().optional(),
  nextContactDate: z.string().optional(),
  notes: z.string().optional(),
});

type LeadQualificationFormValues = z.infer<typeof leadQualificationSchema>;

// Function to calculate qualification percentage
function calculateQualificationPercentage(lead: any): number {
  if (!lead) return 0;
  
  let totalPoints = 0;
  let earnedPoints = 0;
  
  // Financial qualification (3 points)
  if (lead.financialQualification) {
    totalPoints += 3;
    if (lead.financialQualification.creditScore) earnedPoints += 1;
    if (!lead.financialQualification.pastDueAccounts) earnedPoints += 1;
    if (lead.financialQualification.financingApproved) earnedPoints += 1;
  }
  
  // Operational qualification (3 points)
  if (lead.operationalQualification) {
    totalPoints += 3;
    if (lead.operationalQualification.equipmentCount > 0) earnedPoints += 1;
    if (lead.operationalQualification.compliantSafety) earnedPoints += 1;
    if (lead.operationalQualification.properInsurance) earnedPoints += 1;
  }
  
  // Timeline qualification (2 points)
  if (lead.timelineQualification) {
    totalPoints += 2;
    if (lead.timelineQualification.readyToStart) earnedPoints += 1;
    if (lead.timelineQualification.expectedStartDate) earnedPoints += 1;
  }
  
  // Validation steps
  if (lead.validationSteps && lead.validationSteps.length > 0) {
    totalPoints += lead.validationSteps.length;
    earnedPoints += lead.validationSteps.filter((step: any) => step.complete).length;
  }
  
  // Return percentage
  return totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
}

// Format date for display
function formatDate(dateString: string | Date | undefined): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Lead qualification score badge
function QualificationScoreBadge({ score }: { score: string }) {
  switch (score) {
    case 'High':
      return (
        <Badge className="bg-green-500 hover:bg-green-600">
          <Star className="h-3 w-3 mr-1 fill-current" />
          High
        </Badge>
      );
    case 'Medium':
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600">
          <StarHalf className="h-3 w-3 mr-1 fill-current" />
          Medium
        </Badge>
      );
    case 'Low':
      return (
        <Badge variant="outline" className="text-gray-500">
          <Star className="h-3 w-3 mr-1" />
          Low
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-gray-500">
          Unrated
        </Badge>
      );
  }
}

// Validation status badge
function ValidationStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'Complete':
      return (
        <Badge className="bg-green-500 hover:bg-green-600">
          <Check className="h-3 w-3 mr-1" />
          Complete
        </Badge>
      );
    case 'InProgress':
      return (
        <Badge className="bg-blue-500 hover:bg-blue-600">
          <ClipboardCheck className="h-3 w-3 mr-1" />
          In Progress
        </Badge>
      );
    case 'Failed':
      return (
        <Badge variant="destructive">
          <X className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-gray-500">
          Pending
        </Badge>
      );
  }
}

export default function LeadQualificationPage() {
  const { toast } = useToast();
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isQualificationModalOpen, setIsQualificationModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');

  // Fetch leads
  const { data: leads, isLoading, isError } = useQuery({
    queryKey: ['/api/crm'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update lead qualification mutation
  const updateMutation = useMutation({
    mutationFn: async (data: LeadQualificationFormValues) => {
      const response = await apiRequest('PUT', `/api/crm/leads/${data.id}/qualification`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Lead qualification updated successfully',
      });
      setIsQualificationModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/crm'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update lead qualification: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Setup form for updating qualification
  const qualificationForm = useForm<LeadQualificationFormValues>({
    resolver: zodResolver(leadQualificationSchema),
    defaultValues: {
      id: 0,
      qualificationScore: 'Medium',
      qualified: false,
      validationStatus: 'Pending',
      validationSteps: [],
      financialQualification: {
        creditScore: '',
        pastDueAccounts: false,
        financingApproved: false,
      },
      operationalQualification: {
        equipmentCount: 0,
        compliantSafety: false,
        properInsurance: false,
      },
      timelineQualification: {
        readyToStart: false,
        expectedStartDate: '',
      },
      callAttempts: 0,
      emailsSent: 0,
      notes: '',
    },
  });

  // Handle edit qualification click
  const handleEditQualification = (lead: any) => {
    setSelectedLead(lead);
    
    // Set form values from lead data
    qualificationForm.reset({
      id: lead.id,
      qualificationScore: lead.qualificationScore || 'Medium',
      qualified: lead.qualified || false,
      validationStatus: lead.validationStatus || 'Pending',
      validationSteps: lead.validationSteps || [
        { title: 'Identity Verification', complete: false, notes: '' },
        { title: 'Document Collection', complete: false, notes: '' },
        { title: 'Credit Check', complete: false, notes: '' },
        { title: 'Equipment Verification', complete: false, notes: '' },
      ],
      financialQualification: lead.financialQualification || {
        creditScore: '',
        pastDueAccounts: false,
        financingApproved: false,
      },
      operationalQualification: lead.operationalQualification || {
        equipmentCount: 0,
        compliantSafety: false,
        properInsurance: false,
      },
      timelineQualification: lead.timelineQualification || {
        readyToStart: false,
        expectedStartDate: '',
      },
      callAttempts: lead.callAttempts || 0,
      emailsSent: lead.emailsSent || 0,
      lastContactDate: lead.lastContactDate || '',
      nextContactDate: lead.nextContactDate || '',
      notes: lead.notes || '',
    });
    
    setIsQualificationModalOpen(true);
  };

  // Handle update qualification submission
  const onUpdateQualification = (data: LeadQualificationFormValues) => {
    updateMutation.mutate(data);
  };

  // Add validation step to the form
  const addValidationStep = () => {
    const currentSteps = qualificationForm.getValues('validationSteps') || [];
    qualificationForm.setValue('validationSteps', [
      ...currentSteps,
      { title: '', complete: false, notes: '' },
    ]);
  };

  // Remove validation step from the form
  const removeValidationStep = (index: number) => {
    const currentSteps = qualificationForm.getValues('validationSteps') || [];
    qualificationForm.setValue(
      'validationSteps',
      currentSteps.filter((_, i) => i !== index)
    );
  };

  // Filter leads based on active tab
  const filteredLeads = leads ? leads.filter((lead: any) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'qualified') return lead.qualified;
    if (activeTab === 'high') return lead.qualificationScore === 'High';
    if (activeTab === 'medium') return lead.qualificationScore === 'Medium';
    if (activeTab === 'low') return lead.qualificationScore === 'Low';
    if (activeTab === 'unqualified') return lead.qualificationScore && !lead.qualified;
    return true;
  }) : [];

  // Loading state
  if (isLoading) {
    return (
      <div className="container py-6">
        <PageHeader title="Lead Qualification" description="Qualify and validate leads before handoff to dispatch" />
        <div className="my-6">
          <Skeleton className="h-12 w-full mb-6" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="container py-6">
        <PageHeader title="Lead Qualification" description="Qualify and validate leads before handoff to dispatch" />
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load leads. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <PageHeader title="Lead Qualification" description="Qualify and validate leads before handoff to dispatch" />

      {/* Lead Qualification Modal */}
      <Dialog open={isQualificationModalOpen} onOpenChange={setIsQualificationModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Lead Qualification</DialogTitle>
            <DialogDescription>
              Update qualification and validation details for this lead.
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <Form {...qualificationForm}>
              <form onSubmit={qualificationForm.handleSubmit(onUpdateQualification)} className="space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="text-lg font-medium">{selectedLead.companyName || 'Unknown Company'}</h3>
                    <p className="text-sm text-gray-500">{selectedLead.contactName || 'Unknown Contact'}</p>
                  </div>
                  <Badge variant={selectedLead.status === 'Active' ? 'default' : 'outline'}>
                    {selectedLead.status}
                  </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={qualificationForm.control}
                    name="qualificationScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qualification Score*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select score" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Rate the overall quality of this lead
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={qualificationForm.control}
                    name="validationStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Validation Status*</FormLabel>
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
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="InProgress">In Progress</SelectItem>
                            <SelectItem value="Complete">Complete</SelectItem>
                            <SelectItem value="Failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Current status of lead validation process
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={qualificationForm.control}
                  name="qualified"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Qualified Lead</FormLabel>
                        <FormDescription>
                          Mark this lead as fully qualified for handoff to dispatch
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Contact Metrics */}
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-4">Contact Metrics</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={qualificationForm.control}
                      name="callAttempts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Call Attempts</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={qualificationForm.control}
                      name="emailsSent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emails Sent</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={qualificationForm.control}
                      name="lastContactDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Contact Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={qualificationForm.control}
                      name="nextContactDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Next Contact Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Financial Qualification */}
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-4">Financial Qualification</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={qualificationForm.control}
                      name="financialQualification.creditScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credit Score</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter score or range"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex flex-col gap-4">
                      <FormField
                        control={qualificationForm.control}
                        name="financialQualification.pastDueAccounts"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Past Due Accounts</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={qualificationForm.control}
                        name="financialQualification.financingApproved"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Financing Approved</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Operational Qualification */}
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-4">Operational Qualification</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={qualificationForm.control}
                      name="operationalQualification.equipmentCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Equipment Count</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex flex-col gap-4">
                      <FormField
                        control={qualificationForm.control}
                        name="operationalQualification.compliantSafety"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Compliant Safety Record</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={qualificationForm.control}
                        name="operationalQualification.properInsurance"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Proper Insurance</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Timeline Qualification */}
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-4">Timeline Qualification</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={qualificationForm.control}
                      name="timelineQualification.expectedStartDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Start Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={qualificationForm.control}
                      name="timelineQualification.readyToStart"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Ready to Start</FormLabel>
                            <FormDescription>
                              Lead is ready to begin operations immediately
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Validation Steps */}
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Validation Steps</h3>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addValidationStep}
                      className="text-[#025E73]"
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Step
                    </Button>
                  </div>
                  {(qualificationForm.watch('validationSteps') || []).map((step, index) => (
                    <div key={index} className="p-4 border rounded-md mb-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Validation Step {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeValidationStep(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <FormField
                          control={qualificationForm.control}
                          name={`validationSteps.${index}.title`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Step Title*</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter step title" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={qualificationForm.control}
                          name={`validationSteps.${index}.notes`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter notes" 
                                  {...field} 
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={qualificationForm.control}
                          name={`validationSteps.${index}.complete`}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Complete</FormLabel>
                                <FormDescription>
                                  Mark this step as completed
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                <FormField
                  control={qualificationForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qualification Notes</FormLabel>
                      <FormControl>
                        <textarea
                          className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Enter additional notes about qualification"
                          {...field}
                          value={field.value || ''}
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
                    onClick={() => {
                      setIsQualificationModalOpen(false);
                      setSelectedLead(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-[#025E73] hover:bg-[#025E73]/90"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Qualification'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs defaultValue="all" className="mt-6" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all" className="px-6">All Leads</TabsTrigger>
          <TabsTrigger value="qualified" className="px-6">Qualified</TabsTrigger>
          <TabsTrigger value="high" className="px-6">High Score</TabsTrigger>
          <TabsTrigger value="medium" className="px-6">Medium Score</TabsTrigger>
          <TabsTrigger value="low" className="px-6">Low Score</TabsTrigger>
          <TabsTrigger value="unqualified" className="px-6">Unqualified</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-md">
              <File className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">No leads found</h3>
              <p className="mt-2 text-sm text-gray-500">
                {activeTab === 'all'
                  ? 'Start by adding new leads to qualify'
                  : `No ${activeTab} leads available`}
              </p>
              {/* "Add New Lead" button removed per requirements - leads should only be added via CRM > Leads */}
            </div>
          ) : (
            <div className="bg-white rounded-md shadow overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Validation</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Contacts</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead: any) => {
                    const qualificationPercentage = calculateQualificationPercentage(lead);
                    
                    return (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">
                          {lead.companyName || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{lead.contactName || 'Unknown'}</span>
                            {lead.phoneNumber && (
                              <span className="text-xs text-gray-500 flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {lead.phoneNumber}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={lead.status === 'Active' ? 'default' : 'outline'}>
                            {lead.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <QualificationScoreBadge score={lead.qualificationScore || 'Low'} />
                        </TableCell>
                        <TableCell>
                          <ValidationStatusBadge status={lead.validationStatus || 'Pending'} />
                        </TableCell>
                        <TableCell>
                          <div className="w-full flex items-center gap-2">
                            <Progress value={qualificationPercentage} className="h-2" />
                            <span className="text-xs font-medium">{qualificationPercentage}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-gray-50">
                              <Phone className="h-3 w-3 mr-1" />
                              {lead.callAttempts || 0}
                            </Badge>
                            <Badge variant="outline" className="bg-gray-50">
                              <FileCheck2 className="h-3 w-3 mr-1" />
                              {lead.emailsSent || 0}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditQualification(lead)}
                              className="h-8 px-2 text-[#025E73]"
                            >
                              <BarChart className="h-4 w-4 mr-1" /> Qualify
                            </Button>
                            <Link href={`/crm/${lead.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2"
                              >
                                <ArrowUpRight className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}