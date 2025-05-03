import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Helmet } from "react-helmet";
import { InvoiceList, InvoiceFilters, InvoiceListItem } from "@/components/invoices/InvoiceList";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { Button } from "@/components/ui/button";
import { RefreshCw, PlusCircle } from "lucide-react";
import { MotionWrapper, MotionList } from "@/components/ui/motion-wrapper-fixed";
import { CustomPagination } from "@/components/ui/custom-pagination";

interface InvoiceResponse {
  data: Array<{
    id: number;
    invoiceNumber: string;
    leadId: number;
    totalAmount: number;
    status: string;
    issuedDate: string;
    dueDate: string;
    paidDate?: string;
    createdAt: string;
    clientName?: string;
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export default function InvoicesPage() {
  const { toast } = useToast();
  const { user, role } = useAuth();
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [filters, setFilters] = useState<InvoiceFilters>({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  // Get invoices from the API
  const { data: invoiceResponse, isLoading, error, refetch } = useQuery<InvoiceResponse>({
    queryKey: ["/api/invoices", page, limit, filters],
    queryFn: async () => {
      try {
        // Build query params
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString()
        });
        
        // Add filter params if they exist
        if (filters.status) {
          queryParams.append('status', filters.status);
        }
        
        if (filters.dateRange) {
          // Convert date range to actual date parameters
          const now = new Date();
          let dateFrom;
          
          switch (filters.dateRange) {
            case 'last7days':
              dateFrom = new Date(now);
              dateFrom.setDate(now.getDate() - 7);
              queryParams.append('dateFrom', dateFrom.toISOString().split('T')[0]);
              queryParams.append('dateTo', now.toISOString().split('T')[0]);
              break;
            case 'last30days':
              dateFrom = new Date(now);
              dateFrom.setDate(now.getDate() - 30);
              queryParams.append('dateFrom', dateFrom.toISOString().split('T')[0]);
              queryParams.append('dateTo', now.toISOString().split('T')[0]);
              break;
            case 'last90days':
              dateFrom = new Date(now);
              dateFrom.setDate(now.getDate() - 90);
              queryParams.append('dateFrom', dateFrom.toISOString().split('T')[0]);
              queryParams.append('dateTo', now.toISOString().split('T')[0]);
              break;
            case 'thisYear':
              dateFrom = new Date(now.getFullYear(), 0, 1); // Jan 1 of current year
              queryParams.append('dateFrom', dateFrom.toISOString().split('T')[0]);
              queryParams.append('dateTo', now.toISOString().split('T')[0]);
              break;
          }
        }
        
        if (filters.search) {
          queryParams.append('search', filters.search);
        }
        
        const res = await apiRequest("GET", `/api/invoices?${queryParams.toString()}`);
        if (!res.ok) {
          throw new Error("Failed to fetch invoices");
        }
        return await res.json() as InvoiceResponse;
      } catch (error) {
        console.error("Error fetching invoices:", error);
        toast({
          title: "Error",
          description: "Failed to load invoices data. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
    }
  });
  
  // Transform the invoice data for the InvoiceList component
  const invoices: InvoiceListItem[] = invoiceResponse?.data?.map(invoice => {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName || `Client ${invoice.leadId}`, // Fallback if clientName not available
      totalAmount: invoice.totalAmount,
      status: invoice.status,
      issuedDate: invoice.issuedDate,
      dueDate: invoice.dueDate,
      paidDate: invoice.paidDate
    };
  }) || [];
  
  // Filter invoices based on the filters
  const filteredInvoices = invoices.filter(invoice => {
    // Filter by status
    if (filters.status && invoice.status !== filters.status) {
      return false;
    }
    
    // Filter by search term
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const invoiceNumberMatch = invoice.invoiceNumber.toLowerCase().includes(searchLower);
      const clientNameMatch = invoice.clientName.toLowerCase().includes(searchLower);
      
      if (!invoiceNumberMatch && !clientNameMatch) {
        return false;
      }
    }
    
    // Filter by date range (basic implementation)
    if (filters.dateRange) {
      const now = new Date();
      const invoiceDate = new Date(invoice.issuedDate);
      
      switch (filters.dateRange) {
        case 'last7days':
          const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
          if (invoiceDate < sevenDaysAgo) return false;
          break;
        case 'last30days':
          const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
          if (invoiceDate < thirtyDaysAgo) return false;
          break;
        case 'last90days':
          const ninetyDaysAgo = new Date(now.setDate(now.getDate() - 90));
          if (invoiceDate < ninetyDaysAgo) return false;
          break;
        case 'thisYear':
          if (invoiceDate.getFullYear() !== new Date().getFullYear()) return false;
          break;
      }
    }
    
    return true;
  });
  
  // Check if user can create invoices (admin, managers, etc.)
  const canCreateInvoice = role && (role.level >= 3 || (role.permissions || []).includes('create:invoice'));
  
  const handleFilterChange = (newFilters: InvoiceFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };
  
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };
  
  const handleGenerateWeeklyInvoices = async () => {
    try {
      const res = await apiRequest("POST", "/api/invoices/generate-weekly");
      if (!res.ok) {
        throw new Error("Failed to generate weekly invoices");
      }
      
      const data = await res.json();
      
      toast({
        title: "Success",
        description: `Generated ${data.count} weekly invoices successfully.`,
      });
      
      // Refresh the invoice list
      refetch();
    } catch (error) {
      console.error("Error generating weekly invoices:", error);
      toast({
        title: "Error",
        description: "Failed to generate weekly invoices. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleGeneratePendingInvoices = async () => {
    try {
      const res = await apiRequest("POST", "/api/invoices/generate-for-delivered");
      if (!res.ok) {
        throw new Error("Failed to generate invoices for delivered loads");
      }
      
      const data = await res.json();
      
      toast({
        title: "Success",
        description: `Generated ${data.invoices.length} invoices for delivered loads.`,
      });
      
      // Refresh the invoice list
      refetch();
    } catch (error) {
      console.error("Error generating invoices for delivered loads:", error);
      toast({
        title: "Error",
        description: "Failed to generate invoices for delivered loads. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="container py-6">
      <Helmet>
        <title>Invoices - MetaSys ERP</title>
      </Helmet>
      
      <div className="flex items-center justify-between mb-6">
        <MotionWrapper animation="fade-right" delay={0.1}>
          <h1 className="text-2xl font-bold">Invoices</h1>
        </MotionWrapper>
        
        <MotionWrapper animation="fade-left" delay={0.2}>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleGenerateWeeklyInvoices}
              className="flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate Weekly Invoices
            </Button>
            
            <Button
              variant="outline"
              onClick={handleGeneratePendingInvoices}
              className="flex items-center bg-#457B9D hover:bg-#2EC4B6 text-white rounded-md transition-colors duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate Pending Invoices
            </Button>
            
            {canCreateInvoice && (
              <Button 
                onClick={() => setInvoiceFormOpen(true)}
                className="flex items-center bg-#457B9D hover:bg-#2EC4B6 text-white rounded-md transition-colors duration-200"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            )}
          </div>
        </MotionWrapper>
      </div>
      
      <MotionWrapper animation="fade-up" delay={0.3}>
        <InvoiceList 
          invoices={filteredInvoices}
          onCreateInvoice={() => setInvoiceFormOpen(true)}
          onFilterChange={handleFilterChange}
          isLoading={isLoading}
        />
        
        {invoiceResponse?.pagination && (
          <div className="mt-6 flex justify-center">
            <CustomPagination
              currentPage={invoiceResponse.pagination.page}
              totalPages={invoiceResponse.pagination.pages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </MotionWrapper>
      
      <InvoiceForm 
        open={invoiceFormOpen}
        onOpenChange={setInvoiceFormOpen}
      />
    </div>
  );
}
