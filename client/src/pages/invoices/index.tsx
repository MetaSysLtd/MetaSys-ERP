import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, Filter, FileText, ArrowDownUp, Plus, Calendar, AlertTriangle, 
  CheckCircle, Download, RefreshCw, MailCheck, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { QueryErrorHandler } from '@/hooks/use-query-error-handler';
import { handleApiError } from '@/lib/api-error-handler';
import { useToast } from '@/hooks/use-toast';
import { InvoiceList } from '@/components/invoices/InvoiceList';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest } from '@/lib/queryClient';

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isWeeklyGenerateDialogOpen, setIsWeeklyGenerateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Example query with proper error handling for all invoices
  const invoicesQuery = useQuery({
    queryKey: ['/api/invoices'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/invoices');
        
        if (!response.ok) {
          throw new Error('Failed to load invoices data. Please try again.');
        }
        
        return response.json();
      } catch (error) {
        return handleApiError(error, 'Invoices page', 'invoices');
      }
    },
    // This will minimize showing the loading state when refreshing data
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Mutation for generating weekly invoices
  const generateWeeklyInvoicesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/invoices/generate-weekly');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate weekly invoices');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      
      toast({
        title: "Weekly Invoices Generated",
        description: `Successfully generated ${data.count} invoices for clients with delivered loads.`,
        variant: "default",
      });
      
      setIsWeeklyGenerateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Generate Invoices",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Function to handle the weekly invoice generation
  const handleGenerateWeeklyInvoices = () => {
    generateWeeklyInvoicesMutation.mutate();
  };
  
  // Handle create invoice click
  const handleCreateInvoiceClick = () => {
    console.log('Create invoice clicked');
    // This would normally navigate to invoice creation page
    toast({
      title: "Create Invoice",
      description: "Invoice creation form would open here",
    });
  };

  return (
    <ErrorBoundary moduleName="invoices">
      <div className="p-4">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-[#025E73]">
              Invoices
            </h1>
          </div>
          
          <p className="text-gray-600">
            Manage and track all your customer invoices
          </p>
          
          <Tabs defaultValue="all-invoices" className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full mb-4">
              <TabsTrigger value="all-invoices">All Invoices</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="weekly-automation">Weekly Automation</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all-invoices">
              {/* Search and filter bar */}
              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center mb-6">
                <div className="relative w-full sm:w-auto flex-grow">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder="Search invoices..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" className="flex gap-2 items-center">
                    <Filter size={16} />
                    <span>Filter</span>
                  </Button>
                  
                  <Button variant="outline" className="flex gap-2 items-center">
                    <ArrowDownUp size={16} />
                    <span>Sort</span>
                  </Button>
                  
                  <Button 
                    id="create-invoice-btn"
                    className="bg-[#025E73] text-white hover:bg-[#025E73]/90 flex gap-2 items-center"
                    onClick={handleCreateInvoiceClick}
                  >
                    <Plus size={16} />
                    <span>Create Invoice</span>
                  </Button>
                </div>
              </div>
              
              {/* Invoices content using the error handler */}
              <QueryErrorHandler
                error={invoicesQuery.error}
                fallback={<div className="text-center py-8">Error loading invoice data</div>}
              >
                <div className="grid gap-6 mt-4">
                  {invoicesQuery.data?.invoices?.length === 0 || !invoicesQuery.data ? (
                    <EmptyState
                      title="No invoices found"
                      description="You haven't created any invoices yet. Create your first invoice to get started."
                      icon={<FileText className="h-14 w-14 text-muted-foreground/60" />}
                      action={
                        <Button
                          onClick={() => document.getElementById('create-invoice-btn')?.click()}
                          className="mt-4 bg-[#025E73] text-white hover:bg-[#025E73]/90"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create Invoice
                        </Button>
                      }
                    />
                  ) : (
                    <div>
                      {/* Invoice list will go here */}
                      <InvoiceList 
                        invoices={invoicesQuery.data.invoices} 
                        isLoading={invoicesQuery.isLoading}
                        onCreateInvoice={handleCreateInvoiceClick}
                      />
                    </div>
                  )}
                </div>
              </QueryErrorHandler>
            </TabsContent>
            
            <TabsContent value="pending">
              <div className="text-center py-8">
                <FileText className="h-14 w-14 text-muted-foreground/60 mx-auto mb-4" />
                <h3 className="text-lg font-medium">Pending Invoices View</h3>
                <p className="text-muted-foreground">This tab will show invoices awaiting payment or approval.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="paid">
              <div className="text-center py-8">
                <CheckCircle className="h-14 w-14 text-muted-foreground/60 mx-auto mb-4" />
                <h3 className="text-lg font-medium">Paid Invoices View</h3>
                <p className="text-muted-foreground">This tab will show invoices that have been paid.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="weekly-automation">
              <Card className="border-2 border-[#025E73]/20">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5 text-[#025E73]" />
                    Weekly Invoice Automation
                  </CardTitle>
                  <CardDescription>
                    Automatically generate invoices for all delivered loads from the past week, grouped by client
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-md bg-[#F2A71B]/10 border border-[#F2A71B]/30 flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-[#F2A71B] flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-[#412754]">Weekly Invoice Generation</h4>
                        <p className="text-sm text-muted-foreground">
                          This feature will create one invoice per client for all their delivered loads from the past 7 days.
                          Invoices will be in "Draft" status and must be approved before sending to clients.
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="bg-background p-4 rounded-md border flex flex-col items-center text-center">
                        <FileText className="h-8 w-8 text-[#025E73] mb-2" />
                        <h4 className="font-medium">One Invoice Per Client</h4>
                        <p className="text-sm text-muted-foreground">Loads are grouped by client for cleaner billing</p>
                      </div>
                      
                      <div className="bg-background p-4 rounded-md border flex flex-col items-center text-center">
                        <Calendar className="h-8 w-8 text-[#025E73] mb-2" />
                        <h4 className="font-medium">Last 7 Days</h4>
                        <p className="text-sm text-muted-foreground">Only includes loads delivered in the past week</p>
                      </div>
                      
                      <div className="bg-background p-4 rounded-md border flex flex-col items-center text-center">
                        <MailCheck className="h-8 w-8 text-[#025E73] mb-2" />
                        <h4 className="font-medium">Email Integration</h4>
                        <p className="text-sm text-muted-foreground">Option to send approved invoices directly to clients</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Dialog open={isWeeklyGenerateDialogOpen} onOpenChange={setIsWeeklyGenerateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-[#025E73] text-white hover:bg-[#025E73]/90 w-full">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Generate Weekly Invoices
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Generate Weekly Invoices</DialogTitle>
                        <DialogDescription>
                          This will create one invoice per client for all their delivered loads from the past 7 days.
                          Are you sure you want to proceed?
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                          <div className="flex items-center">
                            <InfoIcon className="mr-2 h-4 w-4" />
                            <p>
                              Only loads with "Delivered" status that haven't been invoiced yet will be included.
                            </p>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsWeeklyGenerateDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          className="bg-[#025E73]"
                          onClick={handleGenerateWeeklyInvoices}
                          disabled={generateWeeklyInvoicesMutation.isPending}
                        >
                          {generateWeeklyInvoicesMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>Generate</>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ErrorBoundary>
  );
}

// InfoIcon component
function InfoIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
}