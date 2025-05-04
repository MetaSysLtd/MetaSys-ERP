import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  getFilteredRowModel,
} from '@tanstack/react-table';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import PageLayout from '@/components/layout/PageLayout';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { 
  ArrowDown, 
  ArrowUp, 
  ArrowUpDown, 
  MoreHorizontal, 
  Search, 
  ClipboardList, 
  Copy, 
  ExternalLink,
  User,
  Calendar,
  Star,
  Send,
  CheckCircle2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Define the Survey interface to match the backend schema
interface Survey {
  id: number;
  title: string;
  type: 'nps' | 'satisfaction' | 'feedback' | 'custom';
  status: 'pending' | 'sent' | 'completed' | 'expired';
  questions: any;
  responses: any;
  leadId: number;
  accountId: number | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  completedAt: string | null;
  token: string;
  leadName?: string;
  accountName?: string;
  score?: number;
}

// Define the Lead type (simplified for this component)
interface Lead {
  id: number;
  contactName: string;
  phoneNumber: string;
  email: string | null;
}

// Define the Account type (simplified for this component)
interface Account {
  id: number;
  name: string;
}

// Define the form schema for survey creation/editing
const surveyFormSchema = z.object({
  title: z.string().min(1, { message: 'Survey title is required' }),
  type: z.enum(['nps', 'satisfaction', 'feedback', 'custom'], {
    required_error: 'Please select a survey type',
  }),
  leadId: z.number({
    required_error: 'Please select a lead',
  }),
  accountId: z.number().nullable().optional(),
  questions: z.any(), // Simplified for now
});

type SurveyFormValues = z.infer<typeof surveyFormSchema>;

export default function SurveysPage() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  
  // Query to fetch all surveys
  const { data: surveys, isLoading: isLoadingSurveys, isError: isSurveysError } = useQuery({
    queryKey: ['/api/crm/surveys'],
    retry: 1,
  });
  
  // Query to fetch leads for the dropdown
  const { data: leads, isLoading: isLoadingLeads } = useQuery({
    queryKey: ['/api/crm/leads'],
    retry: 1,
  });
  
  // Query to fetch accounts for the dropdown
  const { data: accounts, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['/api/crm/accounts'],
    retry: 1,
  });
  
  // Mutation for creating a new survey
  const createSurveyMutation = useMutation({
    mutationFn: async (data: SurveyFormValues) => {
      // Prepare default questions based on survey type
      let questions = data.questions;
      if (!questions || Object.keys(questions).length === 0) {
        if (data.type === 'nps') {
          questions = {
            npsQuestion: 'How likely are you to recommend our services to a friend or colleague?',
            feedback: 'What\'s the reason for your score?'
          };
        } else if (data.type === 'satisfaction') {
          questions = {
            overall: 'How satisfied are you with our services?',
            feedback: 'What could we improve?'
          };
        } else if (data.type === 'feedback') {
          questions = {
            feedback: 'Please share your feedback about our services:',
            improvements: 'What could we do better?'
          };
        }
      }
      
      const surveyData = {
        ...data,
        questions,
        responses: {},
        status: 'pending'
      };
      
      const response = await apiRequest('POST', '/api/crm/surveys', surveyData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create survey');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Survey Created',
        description: 'The survey has been successfully created and is ready to send.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/surveys'] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Create Survey',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Mutation for updating a survey
  const updateSurveyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<SurveyFormValues> }) => {
      const response = await apiRequest('PUT', `/api/crm/surveys/${id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update survey');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Survey Updated',
        description: 'The survey has been successfully updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/surveys'] });
      setIsCreateDialogOpen(false);
      setSelectedSurvey(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Update Survey',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Mutation for sending a survey
  const sendSurveyMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('PUT', `/api/crm/surveys/${id}`, { status: 'sent' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send survey');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Survey Sent',
        description: 'The survey has been sent to the recipient.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/surveys'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Send Survey',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Setup form with React Hook Form
  const form = useForm<SurveyFormValues>({
    resolver: zodResolver(surveyFormSchema),
    defaultValues: {
      title: '',
      type: 'nps',
      leadId: undefined,
      accountId: null,
      questions: {},
    },
  });
  
  // When a survey is selected for editing, populate the form
  useEffect(() => {
    if (selectedSurvey) {
      form.reset({
        title: selectedSurvey.title,
        type: selectedSurvey.type,
        leadId: selectedSurvey.leadId,
        accountId: selectedSurvey.accountId,
        questions: selectedSurvey.questions,
      });
      setIsCreateDialogOpen(true);
    }
  }, [selectedSurvey, form]);
  
  // Function to handle form submission
  const onSubmit = (data: SurveyFormValues) => {
    if (selectedSurvey) {
      updateSurveyMutation.mutate({ id: selectedSurvey.id, data });
    } else {
      createSurveyMutation.mutate(data);
    }
  };
  
  // Function to get lead info for display (could be optimized)
  const getLeadInfo = (leadId: number) => {
    if (!leads) return { contactName: 'Unknown' };
    return leads.find((lead: Lead) => lead.id === leadId) || { contactName: 'Unknown' };
  };
  
  // Function to get account info for display (could be optimized)
  const getAccountInfo = (accountId: number | null) => {
    if (!accountId || !accounts) return { name: 'N/A' };
    return accounts.find((account: Account) => account.id === accountId) || { name: 'N/A' };
  };
  
  // Define the columns for the surveys table
  const columns = useMemo<ColumnDef<Survey>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'title',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Title
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center">
            <ClipboardList className="h-4 w-4 mr-2 text-muted-foreground" />
            <div className="font-medium">{row.getValue('title')}</div>
          </div>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => {
          const type = row.getValue('type') as string;
          return (
            <div className="capitalize">{type}</div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.getValue('status') as string;
          let variant: 'default' | 'outline' | 'secondary' | 'destructive' = 'outline';
          let icon = null;
          
          switch (status) {
            case 'pending':
              variant = 'outline';
              break;
            case 'sent':
              variant = 'secondary';
              icon = <Send className="h-3 w-3 mr-1" />;
              break;
            case 'completed':
              variant = 'default';
              icon = <CheckCircle2 className="h-3 w-3 mr-1" />;
              break;
            case 'expired':
              variant = 'destructive';
              break;
          }
          
          return (
            <Badge variant={variant} className="capitalize">
              {icon}
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'leadId',
        header: 'Recipient',
        cell: ({ row }) => {
          const leadId = row.getValue('leadId') as number;
          const lead = getLeadInfo(leadId);
          return (
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-muted-foreground" />
              <div>{lead.contactName}</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'accountId',
        header: 'Account',
        cell: ({ row }) => {
          const accountId = row.getValue('accountId') as number | null;
          const account = getAccountInfo(accountId);
          return <div>{account.name}</div>;
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => {
          const date = new Date(row.getValue('createdAt'));
          return (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <div>{date.toLocaleDateString()}</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'score',
        header: 'Score',
        cell: ({ row }) => {
          const score = row.getValue('score') as number | undefined;
          if (score === undefined) return <div>Not rated</div>;
          
          return (
            <div className="flex items-center">
              <Star className="h-4 w-4 mr-1 text-yellow-500" />
              <div>{score}/10</div>
            </div>
          );
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const survey = row.original;
          const surveyUrl = `${window.location.origin}/surveys/${survey.token}`;
          
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setLocation(`/crm/surveys/${survey.id}`)}>
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedSurvey(survey)}>
                  Edit Survey
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    navigator.clipboard.writeText(surveyUrl);
                    toast({
                      title: 'Link Copied',
                      description: 'Survey link copied to clipboard',
                    });
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(surveyUrl, '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Survey
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {survey.status === 'pending' && (
                  <DropdownMenuItem onClick={() => sendSurveyMutation.mutate(survey.id)}>
                    <Send className="h-4 w-4 mr-2" />
                    Send Survey
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [leads, accounts, sendSurveyMutation, setLocation]
  );
  
  // Initialize the table
  const table = useReactTable({
    data: surveys || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });
  
  // Handle new survey creation dialog
  const handleCreateSurvey = () => {
    setSelectedSurvey(null);
    form.reset();
    setIsCreateDialogOpen(true);
  };
  
  // Render loading state
  if (isLoadingSurveys || isLoadingLeads || isLoadingAccounts) {
    return (
      <PageLayout title="Surveys" description="Manage client satisfaction surveys and feedback">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-[250px]" />
            <Skeleton className="h-10 w-[100px]" />
          </div>
          <div className="border rounded-md">
            <div className="h-12 px-4 border-b flex items-center">
              <Skeleton className="h-4 w-full" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 px-4 flex items-center">
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }
  
  // Render error state
  if (isSurveysError) {
    return (
      <PageLayout title="Surveys" description="Manage client satisfaction surveys and feedback">
        <div className="flex flex-col items-center justify-center h-full p-4">
          <div className="text-destructive text-xl font-semibold mb-2">Error Loading Surveys</div>
          <p className="text-muted-foreground mb-4">
            There was a problem loading your surveys. Please try again later.
          </p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/crm/surveys'] })}>
            Retry
          </Button>
        </div>
      </PageLayout>
    );
  }
  
  return (
    <PageLayout
      title="Surveys & Feedback"
      description="Manage client satisfaction surveys and collect feedback"
      actionLabel="Create Survey"
      onAction={handleCreateSurvey}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center w-full max-w-sm">
          <Input
            placeholder="Filter surveys..."
            value={(table.getColumn('title')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('title')?.setFilterValue(event.target.value)}
            className="max-w-sm"
          />
          <Search className="h-4 w-4 absolute ml-3 text-muted-foreground" />
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No surveys found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedSurvey ? 'Edit Survey' : 'Create Survey'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Survey Title*</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Customer Satisfaction Survey" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Survey Type*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a survey type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="nps">NPS (Net Promoter Score)</SelectItem>
                          <SelectItem value="satisfaction">Satisfaction</SelectItem>
                          <SelectItem value="feedback">General Feedback</SelectItem>
                          <SelectItem value="custom">Custom Survey</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="leadId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient Lead*</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a lead" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {leads?.map((lead: Lead) => (
                            <SelectItem key={lead.id} value={lead.id.toString()}>
                              {lead.contactName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="accountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Account</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : null)} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an account (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {accounts?.map((account: Account) => (
                            <SelectItem key={account.id} value={account.id.toString()}>
                              {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setSelectedSurvey(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedSurvey ? 'Update Survey' : 'Create Survey'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}