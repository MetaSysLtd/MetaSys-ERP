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
  Trash
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

export default function InvoiceDetailsPage() {
  const [, params] = useRoute('/invoices/:id');
  const invoiceId = params?.id ? parseInt(params.id) : null;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Fetch the invoice details
  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['/api/invoices', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;
      
      try {
        const res = await apiRequest('GET', `/api/invoices/${invoiceId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch invoice details');
        }
        return await res.json();
      } catch (error) {
        console.error('Error fetching invoice details:', error);
        toast({
          title: 'Error',
          description: 'Failed to load invoice details. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    enabled: !!invoiceId
  });
  
  // Fetch leads for client name mapping
  const { data: leads = [] } = useQuery({
    queryKey: ['/api/leads'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/leads');
      if (!res.ok) return [];
      return await res.json();
    }
  });
  
  // Fetch loads for load details
  const { data: loads = [] } = useQuery({
    queryKey: ['/api/loads'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/loads');
      if (!res.ok) return [];
      return await res.json();
    }
  });
  
  // Fetch users for created by name
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/users');
      if (!res.ok) return [];
      return await res.json();
    }
  });
  
  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async () => {
      if (!invoiceId) return;
      
      const res = await apiRequest('DELETE', `/api/invoices/${invoiceId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete invoice');
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      toast({
        title: 'Invoice deleted',
        description: 'The invoice has been deleted successfully',
      });
      
      // Navigate back to the invoices list
      window.location.href = '/invoices';
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting invoice',
        description: error.message,
        variant: 'destructive',
      });
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
  
  if (isLoading || !invoice) {
    return (
      <div className="container py-6">
        <Helmet>
          <title>Invoice Details - MetaSys ERP</title>
        </Helmet>
        
        <div className="mb-6">
          <Link to="/invoices">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Invoices
            </Button>
          </Link>
        </div>
        
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
  
  if (error) {
    return (
      <div className="container py-6">
        <Helmet>
          <title>Error - Invoice Details - MetaSys ERP</title>
        </Helmet>
        
        <div className="mb-6">
          <Link to="/invoices">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Invoices
            </Button>
          </Link>
        </div>
        
        <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Error Loading Invoice</h2>
          <p>There was an error loading the invoice details. Please try again or contact support if the issue persists.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }
  
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
    <div className="container py-6">
      <Helmet>
        <title>Invoice {invoice.invoiceNumber} - MetaSys ERP</title>
      </Helmet>
      
      <div className="flex justify-between items-center mb-6">
        <Link to="/invoices">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
        </Link>
        
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
    </div>
  );
}