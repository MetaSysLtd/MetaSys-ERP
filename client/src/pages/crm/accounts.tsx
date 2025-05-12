import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { useQueryErrorHandler } from '@/hooks/use-query-error-handler';
import { Alert } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { generateQueryKey } from '@/lib/api-client';
import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import PageLayout from '@/components/layout/PageLayout.tsx';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal, Search, Building, UserRound, Phone, Mail } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Define the Account interface to match the backend schema
interface Account {
  id: number;
  name: string;
  industry: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  status: 'active' | 'inactive' | 'lead' | 'prospect' | 'customer';
  type: 'client' | 'vendor' | 'partner' | 'other';
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  totalRevenue: number | null;
  employeeCount: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  assignedTo: number;
  orgId: number;
  primaryContactName: string | null;
  primaryContactTitle: string | null;
  primaryContactPhone: string | null;
  primaryContactEmail: string | null;
}

// Define the form schema for account creation/editing
const accountFormSchema = z.object({
  name: z.string().min(1, { message: 'Account name is required' }),
  industry: z.string().min(1, { message: 'Industry is required' }),
  website: z.string().url({ message: 'Must be a valid URL' }).nullish(),
  phone: z.string().nullish(),
  email: z.string().email({ message: 'Must be a valid email' }).nullish(),
  status: z.enum(['active', 'inactive', 'lead', 'prospect', 'customer']),
  type: z.enum(['client', 'vendor', 'partner', 'other']),
  addressLine1: z.string().nullish(),
  addressLine2: z.string().nullish(),
  city: z.string().nullish(),
  state: z.string().nullish(),
  zipCode: z.string().nullish(),
  country: z.string().nullish(),
  totalRevenue: z.number().nullish(),
  employeeCount: z.number().int().positive().nullish(),
  notes: z.string().nullish(),
  primaryContactName: z.string().nullish(),
  primaryContactTitle: z.string().nullish(),
  primaryContactPhone: z.string().nullish(),
  primaryContactEmail: z.string().email({ message: 'Must be a valid email' }).nullish(),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

export default function AccountsPage() {
  const handleError = useQueryErrorHandler();

  const { data: accounts, error, isLoading, refetch } = useQuery({
    queryKey: generateQueryKey('/api/accounts'),
    retry: 3,
    onError: handleError
  });

  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  // Mutation for creating a new account
  const createAccountMutation = useMutation({
    mutationFn: async (data: AccountFormValues) => {
      const response = await apiRequest('POST', '/api/accounts', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create account');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Account Created',
        description: 'The account has been successfully created.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Create Account',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation for updating an account
  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<AccountFormValues> }) => {
      const response = await apiRequest('PUT', `/api/accounts/${id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update account');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Account Updated',
        description: 'The account has been successfully updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/crm/accounts'] });
      setIsCreateDialogOpen(false);
      setSelectedAccount(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Update Account',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Setup form with React Hook Form
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: '',
      industry: '',
      website: '',
      phone: '',
      email: '',
      status: 'prospect',
      type: 'client',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      notes: '',
      primaryContactName: '',
      primaryContactTitle: '',
      primaryContactPhone: '',
      primaryContactEmail: '',
    },
  });

  // When an account is selected for editing, populate the form
  useEffect(() => {
    if (selectedAccount) {
      form.reset({
        name: selectedAccount.name,
        industry: selectedAccount.industry,
        website: selectedAccount.website || '',
        phone: selectedAccount.phone || '',
        email: selectedAccount.email || '',
        status: selectedAccount.status,
        type: selectedAccount.type,
        addressLine1: selectedAccount.addressLine1 || '',
        addressLine2: selectedAccount.addressLine2 || '',
        city: selectedAccount.city || '',
        state: selectedAccount.state || '',
        zipCode: selectedAccount.zipCode || '',
        country: selectedAccount.country || '',
        notes: selectedAccount.notes || '',
        primaryContactName: selectedAccount.primaryContactName || '',
        primaryContactTitle: selectedAccount.primaryContactTitle || '',
        primaryContactPhone: selectedAccount.primaryContactPhone || '',
        primaryContactEmail: selectedAccount.primaryContactEmail || '',
      });
      setIsCreateDialogOpen(true);
    }
  }, [selectedAccount, form]);

  // Function to handle form submission
  const onSubmit = (data: AccountFormValues) => {
    if (selectedAccount) {
      updateAccountMutation.mutate({ id: selectedAccount.id, data });
    } else {
      createAccountMutation.mutate(data);
    }
  };

  // Define the columns for the accounts table
  const columns = useMemo<ColumnDef<Account>[]>(
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
        accessorKey: 'name',
        header: ({ column }) => (
          <div className="flex items-center">
            Building
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              Name
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center">
            <Building className="h-4 w-4 mr-2 text-muted-foreground" />
            <div className="font-medium">{row.getValue('name')}</div>
          </div>
        ),
      },
      {
        accessorKey: 'industry',
        header: 'Industry',
        cell: ({ row }) => <div>{row.getValue('industry')}</div>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.getValue('status') as string;
          let colorClass = 'bg-gray-500';
          
          switch (status) {
            case 'active':
              colorClass = 'bg-green-500';
              break;
            case 'lead':
              colorClass = 'bg-yellow-500';
              break;
            case 'prospect':
              colorClass = 'bg-blue-500';
              break;
            case 'customer':
              colorClass = 'bg-purple-500';
              break;
            case 'inactive':
              colorClass = 'bg-red-500';
              break;
          }
          
          return (
            <Badge variant="outline" className="capitalize">
              <div className={`h-2 w-2 rounded-full ${colorClass} mr-2`} />
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'primaryContactName',
        header: 'Primary Contact',
        cell: ({ row }) => (
          <div className="flex items-center">
            <UserRound className="h-4 w-4 mr-2 text-muted-foreground" />
            <div>{row.getValue('primaryContactName') || 'N/A'}</div>
          </div>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => (
          <div className="flex items-center">
            <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
            <div>{row.getValue('phone') || 'N/A'}</div>
          </div>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <div className="flex items-center">
            <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
            <div>{row.getValue('email') || 'N/A'}</div>
          </div>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const account = row.original;
          
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
                <DropdownMenuItem onClick={() => setLocation(`/crm/accounts/${account.id}`)}>
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedAccount(account)}>
                  Edit Account
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Add Activity</DropdownMenuItem>
                <DropdownMenuItem>Add Opportunity</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    []
  );

  // Initialize the table
  const table = useReactTable({
    data: accounts || [],
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

  // Handle new account creation dialog
  const handleCreateAccount = () => {
    setSelectedAccount(null);
    form.reset();
    setIsCreateDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4"
      >
        <Alert variant="destructive" className="mb-4">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
            Error Loading Accounts
          </h3>
          <p className="text-sm">
            There was a problem loading your accounts. Please try again later.
          </p>
        </Alert>
        <Button
          onClick={() => {
            refetch();
            toast({
              title: "Retrying...",
              description: "Attempting to reload accounts",
              variant: "default"
            });
          }}
          className="bg-[#025E73] hover:bg-[#011F26] text-white rounded-md transition-all duration-200"
        >
          Retry
        </Button>
      </motion.div>
    );
  }

  return (
    <PageLayout
      title="Accounts"
      description="Manage your client and vendor accounts"
      actionLabel="Add Account"
      onAction={handleCreateAccount}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center w-full max-w-sm">
          <Input
            placeholder="Filter accounts..."
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('name')?.setFilterValue(event.target.value)}
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
                  No accounts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedAccount ? 'Edit Account' : 'Create Account'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter account name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter industry" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Additional form fields would go here */}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setSelectedAccount(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedAccount ? 'Update Account' : 'Create Account'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}