import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, FileText, ArrowDownUp, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { QueryErrorHandler } from '@/hooks/use-query-error-handler';
import { handleApiError } from '@/lib/api-error-handler';

// This is a placeholder component that shows how to use our new error handling approach
export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Example query with proper error handling
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

  return (
    <ErrorBoundary moduleName="invoices">
      <div className="p-2">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-[#025E73]">
              Invoices
            </h1>
          </div>
          
          <p className="text-gray-600">
            Manage and track all your customer invoices
          </p>
          
          {/* Search and filter bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
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
              
              <Button className="bg-[#025E73] text-white hover:bg-[#025E73]/90 flex gap-2 items-center">
                <Plus size={16} />
                <span>New Invoice</span>
              </Button>
            </div>
          </div>
          
          {/* Invoices content using the error handler */}
          <QueryErrorHandler
            query={invoicesQuery}
            moduleName="invoices"
          >
            {(data) => (
              <div className="grid gap-6 mt-4">
                <EmptyState
                  title="No invoices found"
                  description="You haven't created any invoices yet. Create your first invoice to get started."
                  icon={<FileText className="h-14 w-14 text-muted-foreground/60" />}
                  action={
                    <Button
                      onClick={() => console.log('Create invoice clicked')}
                      className="mt-4"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Invoice
                    </Button>
                  }
                />
              </div>
            )}
          </QueryErrorHandler>
        </div>
      </div>
    </ErrorBoundary>
  );
}