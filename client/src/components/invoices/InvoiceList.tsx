import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FileText, Search, Plus, Download, Calendar, Clock, DollarSign, Trash, 
  ArrowUpDown, MoreHorizontal, Filter, CheckCircle, XCircle, AlertCircle, Eye
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Link } from "wouter";
import { formatCurrency, cn } from "@/lib/utils";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatedCard, AnimatedList, AnimatedListItem } from "@/components/ui/animated-container";
import { motion, AnimatePresence } from "framer-motion";

export interface InvoiceListItem {
  id: number;
  invoiceNumber: string;
  clientName: string;
  totalAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  issuedDate: string;
  dueDate: string;
  paidDate?: string;
}

type InvoiceListProps = {
  invoices: InvoiceListItem[];
  onCreateInvoice?: () => void;
  onFilterChange?: (filters: InvoiceFilters) => void;
  isLoading?: boolean;
};

export interface InvoiceFilters {
  search?: string;
  status?: string;
  dateRange?: string;
}

export function InvoiceList({ 
  invoices = [], 
  onCreateInvoice = () => {},
  onFilterChange = () => {},
  isLoading = false 
}: InvoiceListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      const res = await apiRequest('DELETE', `/api/invoices/${invoiceId}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete invoice');
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      toast({
        title: "Invoice deleted",
        description: "The invoice has been deleted successfully",
      });
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting invoice",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    onFilterChange({
      search: value,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      dateRange: dateFilter !== 'all' ? dateFilter : undefined,
    });
  };
  
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    onFilterChange({
      search,
      status: value !== 'all' ? value : undefined,
      dateRange: dateFilter !== 'all' ? dateFilter : undefined,
    });
  };
  
  const handleDateFilterChange = (value: string) => {
    setDateFilter(value);
    onFilterChange({
      search,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      dateRange: value !== 'all' ? value : undefined,
    });
  };
  
  const handleDeleteInvoice = (id: number) => {
    setSelectedInvoiceId(id);
    setDeleteDialogOpen(true);
  };
  
  const confirmDeleteInvoice = () => {
    if (selectedInvoiceId) {
      deleteInvoiceMutation.mutate(selectedInvoiceId);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
      case 'sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="h-4 w-4 text-gray-500" />;
      case 'sent': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'paid': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'overdue': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <>
      <AnimatedCard 
        animation="container" 
        className="shadow-md"
      >
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold">Invoices</CardTitle>
              <CardDescription>Manage and track all client invoices</CardDescription>
            </div>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button onClick={onCreateInvoice}>
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </motion.div>
          </div>
        </CardHeader>
        <CardContent>
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col md:flex-row gap-4 mb-6"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices by number, client..."
                className="pl-8"
                value={search}
                onChange={handleSearchChange}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-[140px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>Status</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={handleDateFilterChange}>
                <SelectTrigger className="w-[160px]">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Date Range</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="last7days">Last 7 Days</SelectItem>
                  <SelectItem value="last30days">Last 30 Days</SelectItem>
                  <SelectItem value="last90days">Last 90 Days</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Issue Date</span>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Due Date</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span>Amount</span>
                    </div>
                  </TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <motion.div 
                        className="flex justify-center"
                        animate={{
                          opacity: [0.5, 1, 0.5],
                          scale: [0.98, 1, 0.98],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
                      </motion.div>
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <motion.div 
                        className="flex flex-col items-center gap-2"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <FileText className="h-6 w-6 text-muted-foreground" />
                        <span className="text-muted-foreground">No invoices found</span>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button variant="outline" size="sm" onClick={onCreateInvoice}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Your First Invoice
                          </Button>
                        </motion.div>
                      </motion.div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <AnimatedList>
                    {invoices.map((invoice, index) => (
                      <AnimatedListItem key={invoice.id} staggerIndex={index}>
                        <TableRow>
                          <TableCell>
                            <Link to={`/invoices/${invoice.id}`} className="font-medium hover:underline text-primary">
                              {invoice.invoiceNumber}
                            </Link>
                          </TableCell>
                          <TableCell>{invoice.clientName}</TableCell>
                          <TableCell>
                            <motion.div
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.1 + (index * 0.03) }}
                            >
                              <Badge className={cn("gap-1", getStatusColor(invoice.status))}>
                                {getStatusIcon(invoice.status)}
                                <span>{invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}</span>
                              </Badge>
                            </motion.div>
                          </TableCell>
                          <TableCell>{formatDate(invoice.issuedDate)}</TableCell>
                          <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(invoice.totalAmount)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                  <Link to={`/invoices/${invoice.id}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download PDF
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteInvoice(invoice.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      </AnimatedListItem>
                    ))}
                  </AnimatedList>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {invoices.length} invoices
          </div>
        </CardFooter>
      </AnimatedCard>
      
      {/* Delete Invoice Dialog */}
      <AnimatePresence>
        {deleteDialogOpen && (
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent
              asChild
              forceMount
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this invoice? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                  >
                    <AlertDialogAction 
                      onClick={confirmDeleteInvoice}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </motion.div>
                </AlertDialogFooter>
              </motion.div>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </AnimatePresence>
    </>
  );
}