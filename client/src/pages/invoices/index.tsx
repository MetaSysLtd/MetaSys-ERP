import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Plus, Search, Download, RefreshCw } from "lucide-react";

export default function InvoicesPage() {
  const { toast } = useToast();
  const { role } = useAuth();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredInvoices, setFilteredInvoices] = useState<any[]>([]);
  
  // Get invoices from the API
  const { data: invoices, isLoading, error } = useQuery({
    queryKey: ["/api/invoices"],
  });
  
  // Show error toast if invoices fetch fails
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load invoices data. Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  // Filter invoices based on status and search query
  useEffect(() => {
    if (!invoices) return;
    
    let filtered = [...invoices];
    
    // Filter by status
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((invoice) => invoice.status === statusFilter);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoiceNumber.toLowerCase().includes(query)
      );
    }
    
    setFilteredInvoices(filtered);
  }, [invoices, statusFilter, searchQuery]);
  
  // Handle search form submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by the useEffect above
  };
  
  // Check if user can create invoices
  const canCreateInvoice = role && (role.level >= 3);
  
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Loading invoices...</h3>
          <p className="mt-1 text-sm text-gray-500">Please wait while we fetch your data.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      {/* Page header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2 sm:mb-0">
              Invoices
            </h1>
            <div className="flex flex-wrap space-x-2">
              {canCreateInvoice && (
                <Button
                  onClick={() => {
                    toast({
                      title: "Feature in development",
                      description: "Create invoice functionality is coming soon.",
                    });
                  }}
                  size="sm"
                  className="h-9"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New Invoice
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => {
                  toast({
                    title: "Feature in development",
                    description: "Generate weekly invoices functionality is coming soon.",
                  });
                }}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Generate Weekly Invoices
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Page content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <Card className="shadow mb-6">
          <CardHeader className="px-5 py-4 border-b border-gray-200">
            <CardTitle className="text-lg leading-6 font-medium text-gray-900">
              Invoice Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-1/3">
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter" className="w-full">
                    <SelectValue placeholder="All Invoices" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Invoices</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full sm:w-2/3">
                <label htmlFor="search-invoices" className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <form onSubmit={handleSearch}>
                  <div className="relative text-gray-400 focus-within:text-gray-600">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5" />
                    </div>
                    <Input
                      id="search-invoices"
                      className="pl-10"
                      placeholder="Search by invoice number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow overflow-hidden">
          <CardHeader className="px-5 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg leading-6 font-medium text-gray-900">
                Invoices
              </CardTitle>
              <span className="text-sm text-gray-500">
                Showing {filteredInvoices.length} invoices
              </span>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Issued Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <FileText className="h-12 w-12 mb-2" />
                        <h3 className="text-lg font-medium">No invoices found</h3>
                        <p className="text-sm max-w-md mt-1">
                          {statusFilter !== "all"
                            ? `No invoices match the "${statusFilter}" status filter. Try changing your filters.`
                            : searchQuery
                            ? "No invoices match your search criteria. Try a different search term."
                            : "No invoices have been created yet."}
                        </p>
                        {canCreateInvoice && (
                          <Button
                            onClick={() => {
                              toast({
                                title: "Feature in development",
                                description: "Create invoice functionality is coming soon.",
                              });
                            }}
                            className="mt-4"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Create New Invoice
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => {
                    const statusStyle = getStatusColor(invoice.status);
                    
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell>
                          {/* In a real app, we would show the company name from the lead */}
                          Company {invoice.leadId}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(invoice.totalAmount)}
                        </TableCell>
                        <TableCell>
                          {formatDate(invoice.issuedDate)}
                        </TableCell>
                        <TableCell>
                          {formatDate(invoice.dueDate)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={`${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} px-2 inline-flex text-xs leading-5 font-semibold rounded-full`}
                          >
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                toast({
                                  title: "Feature in development",
                                  description: "View invoice functionality is coming soon.",
                                });
                              }}
                            >
                              <span className="sr-only">View</span>
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                toast({
                                  title: "Feature in development",
                                  description: "Download invoice functionality is coming soon.",
                                });
                              }}
                            >
                              <span className="sr-only">Download</span>
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
