import { useState } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft,
  FileEdit,
  Trash,
  RefreshCw
} from 'lucide-react';
import { InvoiceDetails, InvoiceDetailsData } from '@/components/invoices/InvoiceDetails';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import { Link } from 'wouter';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { QueryErrorHandler } from '@/hooks/use-query-error-handler';
import { handleApiError, retryFetch } from '@/lib/api-error-handler';

export default function InvoiceDetailsPage() {
  const [, params] = useRoute('/invoices/:id');
  const invoiceId = params?.id ? parseInt(params.id) : null;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Fetch the invoice details with error handling
  const invoiceQuery = useQuery({
    queryKey: ['/api/invoices', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;
      
      try {
        // Use retry fetch for resilience
        const res = await retryFetch(`/api/invoices/${invoiceId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? `Invoice #${invoiceId} could not be found. It may have been deleted.`
              : 'Failed to fetch invoice details'
          );
        }
        
        return await res.json();
      } catch (error) {
        return handleApiError(error, 'Invoice Details', 'invoice data');
      }
    },
    enabled: !!invoiceId,
    // Reduce refetch frequency to avoid error message spam
    refetchOnWindowFocus: false,
    retry: 1
  });
  
  // Fetch leads for client name mapping with error handling
  const leadsQuery = useQuery({
    queryKey: ['/api/leads'],
    queryFn: async () => {
      try {
        const res = await retryFetch('/api/leads');
        if (!res.ok) return [];
        return await res.json();
      } catch (error) {
        console.error('Error fetching leads:', error);
        return []; // Continue without leads rather than failing entire page
      }
    }
  });
  
  // Fetch loads for load details with error handling
  const loadsQuery = useQuery({
    queryKey: ['/api/loads'],
    queryFn: async () => {
      try {
        const res = await retryFetch('/api/loads');
        if (!res.ok) return [];
        return await res.json();
      } catch (error) {
        console.error('Error fetching loads:', error);
        return []; // Continue without loads rather than failing entire page
      }
    }
  });
  
  // Fetch users for created by name with error handling
  const usersQuery = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      try {
        const res = await retryFetch('/api/users');
        if (!res.ok) return [];
        return await res.json();
      } catch (error) {
        console.error('Error fetching users:', error);
        return []; // Continue without users rather than failing entire page
      }
    }
  });
  
  // Delete invoice mutation with better error handling
  const deleteInvoiceMutation = useMutation({
    mutationFn: async () => {
      if (!invoiceId) return;
      
      try {
        const res = await retryFetch(`/api/invoices/${invoiceId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!res.ok) {
          const data = await res.json().catch(() => ({ message: 'Failed to delete invoice' }));
          throw new Error(data.message || 'Failed to delete invoice');
        }
        
        return true;
      } catch (error) {
        return handleApiError(error, 'Invoice Deletion', 'invoice');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      toast({
        title: 'Success',
        description: 'The invoice has been deleted successfully',
      });
      
      // Navigate back to the invoices list
      window.location.href = '/invoices';
    }
  });
  
  // Handle the delete button click
  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };
  
  // Handle the confirm delete action
  const confirmDelete = () => {
    deleteInvoiceMutation.mutate();
  };

  // Common page header with back button
  const PageHeader = () => (
    <div className="mb-6">
      <Link to="/invoices">
        <Button variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Invoices
        </Button>
      </Link>
    </div>
  );
  
  // Show loading skeleton
  if (invoiceQuery.isLoading) {
    return (
      <div className="container py-6">
        <Helmet>
          <title>Loading Invoice - MetaSys ERP</title>
        </Helmet>
        <PageHeader />
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-9 w-32" />
          </div>
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary moduleName="invoice details">
      <div className="container py-6">
        <Helmet>
          <title>Invoice Details - MetaSys ERP</title>
        </Helmet>
        
        <PageHeader />
        
        <QueryErrorHandler
          query={invoiceQuery}
          moduleName="invoice"
          emptyStateMessage="This invoice could not be found. It may have been deleted."
        >
          {(invoice) => {
            // Extract related data
            const leads = leadsQuery.data || [];
            const loads = loadsQuery.data || [];
            const users = usersQuery.data || [];
            
            // Get client name from leads
            const lead = leads.find(l => l.id === invoice.leadId);
            const clientName = lead ? lead.companyName : `Client ${invoice.leadId}`;
            const clientEmail = lead ? lead.email : '';
            
            // Get creator name
            const creator = users.find(u => u.id === invoice.createdBy);
            const creatorName = creator ? `${creator.firstName} ${creator.lastName}` : `User ${invoice.createdBy}`;
            
            // Prepare invoice items with load details
            const invoiceItemsWithLoadInfo = invoice.items.map(item => {
              const load = loads.find(l => l.id === item.loadId);
              
              return {
                ...item,
                loadInfo: load ? {
                  loadNumber: load.loadNumber,
                  origin: load.origin,
                  destination: load.destination,
                  date: load.date
                } : undefined
              };
            });
            
            // Prepare the complete invoice data for the component
            const invoiceData: InvoiceDetailsData = {
              ...invoice,
              clientName,
              clientEmail,
              createdByName: creatorName,
              items: invoiceItemsWithLoadInfo
            };
            
            // Prepare form data for editing
            const initialFormData = {
              id: invoice.id,
              leadId: invoice.leadId,
              invoiceNumber: invoice.invoiceNumber,
              issuedDate: new Date(invoice.issuedDate),
              dueDate: new Date(invoice.dueDate),
              items: invoice.items.map(item => ({
                loadId: item.loadId,
                description: item.description,
                amount: item.amount
              })),
              notes: invoice.notes,
              status: invoice.status
            };
                        
            return (
              <>
                <Helmet>
                  <title>Invoice {invoice.invoiceNumber} - MetaSys ERP</title>
                </Helmet>
                
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold">
                    Invoice #{invoice.invoiceNumber}
                  </h1>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleDelete}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                    
                    <Button 
                      size="sm"
                      onClick={() => setEditDialogOpen(true)}
                    >
                      <FileEdit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
                
                <InvoiceDetails invoice={invoiceData} />
                
                {/* Edit Invoice Form */}
                <InvoiceForm 
                  open={editDialogOpen}
                  onOpenChange={setEditDialogOpen}
                  initialData={initialFormData}
                  isEditing={true}
                />
                
                {/* Delete Confirmation Dialog */}
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete invoice #{invoice.invoiceNumber}? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={confirmDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            );
          }}
        </QueryErrorHandler>
      </div>
    </ErrorBoundary>
  );
}