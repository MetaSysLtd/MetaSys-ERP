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
import { DatePicker } from '@/components/ui/date-picker';
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
  User, 
  Calendar, 
  Clock,
  Phone,
  Mail,
  MessageSquare,
  FileText,
  AlertCircle,
  Coffee,
  CalendarCheck,
  Building
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Types and interfaces
interface ExpandedActivity {
  id: number;
  timestamp: string;
  userId: number;
  entityId: number;
  entityType: 'lead' | 'account' | 'opportunity' | 'task';
  action: 'call' | 'email' | 'note' | 'meeting' | 'task' | 'reminder';
  details: string;
  duration?: number;
  reminderDate?: string;
  reminderCompleted?: boolean;
  entityName?: string;
  userName?: string;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
}

interface Lead {
  id: number;
  contactName: string;
}

interface Account {
  id: number;
  name: string;
}

// Define action types with icons
type ActivityAction = 'call' | 'email' | 'note' | 'meeting' | 'task' | 'reminder';

const actionIcons: Record<ActivityAction, React.ReactNode> = {
  call: <Phone className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  note: <FileText className="h-4 w-4" />,
  meeting: <Calendar className="h-4 w-4" />,
  task: <AlertCircle className="h-4 w-4" />,
  reminder: <Clock className="h-4 w-4" />,
};

const actionColors: Record<ActivityAction, string> = {
  call: 'text-blue-500',
  email: 'text-purple-500',
  note: 'text-gray-500',
  meeting: 'text-green-500',
  task: 'text-yellow-500',
  reminder: 'text-red-500',
};

// Define the form schema for activity creation/editing
const activityFormSchema = z.object({
  action: z.enum(['call', 'email', 'note', 'meeting', 'task', 'reminder'], {
    required_error: 'Please select an action type',
  }),
  entityType: z.enum(['lead', 'account', 'opportunity', 'task'], {
    required_error: 'Please select an entity type',
  }),
  entityId: z.number({
    required_error: 'Please select an entity',
  }),
  details: z.string().min(1, { message: 'Details are required' }),
  duration: z.number().optional(),
  reminderDate: z.date().optional().nullable(),
});

type ActivityFormValues = z.infer<typeof activityFormSchema>;

export default function ActivitiesPage() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ExpandedActivity | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Query to fetch all activities
  const { data: activities, isLoading: isLoadingActivities, isError: isActivitiesError } = useQuery({
    queryKey: ['/api/activities'],
    retry: 1,
  });
  
  // Query to fetch users for lookup
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/auth/users'],
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
  
  // Mutation for creating a new activity
  const createActivityMutation = useMutation({
    mutationFn: async (data: ActivityFormValues) => {
      const response = await apiRequest('POST', '/api/crm/activities', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create activity');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Activity Recorded',
        description: 'Your activity has been successfully recorded.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Record Activity',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Mutation for completing a reminder
  const completeReminderMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('PATCH', `/api/crm/activities/${id}/complete-reminder`, {});
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete reminder');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Reminder Completed',
        description: 'The reminder has been marked as completed.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Complete Reminder',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Setup form with React Hook Form
  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      action: 'note',
      entityType: 'lead',
      entityId: undefined,
      details: '',
      duration: 0,
      reminderDate: null,
    },
  });
  
  // Function to handle form submission
  const onSubmit = (data: ActivityFormValues) => {
    createActivityMutation.mutate(data);
  };
  
  // Helper functions to get user and entity names
  const getUserName = (userId: number): string => {
    if (!users) return 'Unknown User';
    const user = users.find((u: User) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
  };
  
  const getEntityName = (entityId: number, entityType: string): string => {
    if (entityType === 'lead') {
      if (!leads) return `Lead #${entityId}`;
      const lead = leads.find((l: Lead) => l.id === entityId);
      return lead ? lead.contactName : `Lead #${entityId}`;
    } else if (entityType === 'account') {
      if (!accounts) return `Account #${entityId}`;
      const account = accounts.find((a: Account) => a.id === entityId);
      return account ? account.name : `Account #${entityId}`;
    } else {
      return `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} #${entityId}`;
    }
  };
  
  // Process activities data to include user and entity names
  const processedActivities = useMemo(() => {
    if (!activities) return [];
    
    return activities.map((activity: ExpandedActivity) => ({
      ...activity,
      userName: getUserName(activity.userId),
      entityName: getEntityName(activity.entityId, activity.entityType),
    }));
  }, [activities, users, leads, accounts]);
  
  // Filter activities based on active tab
  const filteredActivities = useMemo(() => {
    if (activeTab === 'all') return processedActivities;
    return processedActivities.filter(activity => activity.action === activeTab);
  }, [processedActivities, activeTab]);
  
  // Define the columns for the activities table
  const columns = useMemo<ColumnDef<ExpandedActivity>[]>(
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
        accessorKey: 'action',
        header: 'Type',
        cell: ({ row }) => {
          const action = row.getValue('action') as ActivityAction;
          const icon = actionIcons[action];
          const colorClass = actionColors[action];
          
          return (
            <div className="flex items-center">
              <div className={`mr-2 ${colorClass}`}>{icon}</div>
              <div className="capitalize">{action}</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'entityName',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Related To
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const entityType = row.original.entityType;
          const icon = entityType === 'lead' ? (
            <User className="h-4 w-4 mr-2 text-muted-foreground" />
          ) : entityType === 'account' ? (
            <Building className="h-4 w-4 mr-2 text-muted-foreground" />
          ) : (
            <div className="w-4 h-4 mr-2" />
          );
          
          return (
            <div className="flex items-center">
              {icon}
              <div className="font-medium">{row.getValue('entityName')}</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'details',
        header: 'Details',
        cell: ({ row }) => (
          <div className="max-w-xs truncate">{row.getValue('details')}</div>
        ),
      },
      {
        accessorKey: 'userName',
        header: 'Created By',
        cell: ({ row }) => (
          <div className="flex items-center">
            <User className="h-4 w-4 mr-2 text-muted-foreground" />
            <div>{row.getValue('userName')}</div>
          </div>
        ),
      },
      {
        accessorKey: 'timestamp',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Date
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const timestamp = new Date(row.getValue('timestamp'));
          return (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <div>{timestamp.toLocaleDateString()} {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          );
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const activity = row.original;
          
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
                <DropdownMenuItem onClick={() => {
                  const entityUrl = 
                    activity.entityType === 'lead' 
                      ? `/crm/leads/${activity.entityId}` 
                      : activity.entityType === 'account'
                      ? `/crm/accounts/${activity.entityId}`
                      : `/${activity.entityType}s/${activity.entityId}`;
                  
                  setLocation(entityUrl);
                }}>
                  View Related {activity.entityType.charAt(0).toUpperCase() + activity.entityType.slice(1)}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {activity.action === 'reminder' && !activity.reminderCompleted && (
                  <DropdownMenuItem onClick={() => completeReminderMutation.mutate(activity.id)}>
                    <CalendarCheck className="h-4 w-4 mr-2" />
                    Mark Reminder Complete
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => {
                  const details = `Re: ${activity.details}`;
                  form.reset({
                    action: 'note',
                    entityType: activity.entityType,
                    entityId: activity.entityId,
                    details: details,
                    duration: 0,
                    reminderDate: null,
                  });
                  setIsCreateDialogOpen(true);
                }}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Follow-up Note
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [completeReminderMutation, setLocation]
  );
  
  // Initialize the table
  const table = useReactTable({
    data: filteredActivities,
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
  
  // Handle new activity creation dialog
  const handleCreateActivity = () => {
    form.reset();
    setIsCreateDialogOpen(true);
  };
  
  // Render loading state
  if (isLoadingActivities || isLoadingUsers || isLoadingLeads || isLoadingAccounts) {
    return (
      <PageLayout title="Activities" description="Track all interactions with clients">
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
  if (isActivitiesError) {
    return (
      <PageLayout title="Activities" description="Track all interactions with clients">
        <div className="flex flex-col items-center justify-center h-full p-4">
          <div className="text-destructive text-xl font-semibold mb-2">Error Loading Activities</div>
          <p className="text-muted-foreground mb-4">
            There was a problem loading your activities. Please try again later.
          </p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/crm/activities'] })}>
            Retry
          </Button>
        </div>
      </PageLayout>
    );
  }
  
  return (
    <PageLayout
      title="Activities"
      description="Track all client interactions and follow-ups"
      actionLabel="Log Activity"
      onAction={handleCreateActivity}
    >
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="all" className="flex items-center gap-1">
            All Activities
          </TabsTrigger>
          <TabsTrigger value="call" className="flex items-center gap-1">
            <Phone className="h-4 w-4" />
            Calls
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-1">
            <Mail className="h-4 w-4" />
            Emails
          </TabsTrigger>
          <TabsTrigger value="meeting" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Meetings
          </TabsTrigger>
          <TabsTrigger value="task" className="flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="reminder" className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Reminders
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center w-full max-w-sm">
          <Input
            placeholder="Filter activities..."
            value={(table.getColumn('details')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('details')?.setFilterValue(event.target.value)}
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
                  No activities found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Log New Activity</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="action"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activity Type*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an activity type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="call">Phone Call</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="note">Note</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="task">Task</SelectItem>
                          <SelectItem value="reminder">Reminder</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="entityType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related To Type*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select related entity type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="lead">Lead</SelectItem>
                          <SelectItem value="account">Account</SelectItem>
                          <SelectItem value="opportunity">Opportunity</SelectItem>
                          <SelectItem value="task">Task</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="entityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {form.watch("entityType") === 'lead' 
                          ? 'Related Lead*' 
                          : form.watch("entityType") === 'account'
                          ? 'Related Account*'
                          : `Related ${form.watch("entityType")}*`}
                      </FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={`Select a ${form.watch("entityType")}`} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {form.watch("entityType") === 'lead' && leads?.map((lead: Lead) => (
                            <SelectItem key={lead.id} value={lead.id.toString()}>
                              {lead.contactName}
                            </SelectItem>
                          ))}
                          {form.watch("entityType") === 'account' && accounts?.map((account: Account) => (
                            <SelectItem key={account.id} value={account.id.toString()}>
                              {account.name}
                            </SelectItem>
                          ))}
                          {form.watch("entityType") !== 'lead' && form.watch("entityType") !== 'account' && (
                            <SelectItem value="1">Sample {form.watch("entityType")} #1</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {form.watch("action") === 'call' && (
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Call Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Duration in minutes" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {form.watch("action") === 'reminder' && (
                  <FormField
                    control={form.control}
                    name="reminderDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Reminder Date</FormLabel>
                        <DatePicker 
                          date={field.value ? new Date(field.value) : undefined} 
                          setDate={field.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              
              <FormField
                control={form.control}
                name="details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Details*</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter activity details here..."
                        className="min-h-[120px]" 
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
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Log Activity
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}