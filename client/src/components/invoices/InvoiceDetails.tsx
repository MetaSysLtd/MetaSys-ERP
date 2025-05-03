import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  Mail, 
  Printer, 
  Clock, 
  DollarSign, 
  Calendar, 
  FileText, 
  Send, 
  MessageSquare 
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface InvoiceItem {
  id: number;
  invoiceId: number;
  loadId: number;
  description: string;
  amount: number;
  loadInfo?: {
    loadNumber: string;
    origin: string;
    destination: string;
    date: string;
  };
}

export interface InvoiceDetailsData {
  id: number;
  invoiceNumber: string;
  leadId: number;
  clientName: string;
  clientEmail: string;
  totalAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  issuedDate: string;
  dueDate: string;
  paidDate?: string;
  paidAmount?: number;
  invoicePdf?: string;
  notes?: string;
  items: InvoiceItem[];
  createdBy: number;
  createdByName: string;
}

export function InvoiceDetails({ invoice }: { invoice: InvoiceDetailsData }) {
  const [sendEmailDialogOpen, setSendEmailDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('standard');
  const [emailMessage, setEmailMessage] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
      case 'sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Send invoice mutation
  const sendInvoiceEmailMutation = useMutation({
    mutationFn: async ({ invoiceId, template, message }: { invoiceId: number, template: string, message: string }) => {
      const res = await apiRequest('POST', `/api/invoices/${invoiceId}/send`, {
        template,
        message
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to send invoice');
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices', invoice.id] });
      setSendEmailDialogOpen(false);
      toast({
        title: "Invoice sent",
        description: `Invoice #${invoice.invoiceNumber} has been sent to ${invoice.clientEmail}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error sending invoice",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Approve and send invoice mutation
  const approveAndSendMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      const res = await apiRequest('POST', `/api/invoices/${invoiceId}/approve-and-send`, {});
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to approve and send invoice');
      }
      
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices', invoice.id] });
      toast({
        title: "Invoice approved and sent",
        description: `Invoice #${invoice.invoiceNumber} has been approved and ${data.emailSent ? 'sent via email' : 'could not be sent via email (check SMTP settings)'}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error approving invoice",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mark as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      const res = await apiRequest('PATCH', `/api/invoices/${invoiceId}`, {
        status: 'paid',
        paidDate: new Date().toISOString(),
        paidAmount: invoice.totalAmount
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to mark invoice as paid');
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices', invoice.id] });
      toast({
        title: "Invoice marked as paid",
        description: `Invoice #${invoice.invoiceNumber} has been marked as paid`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating invoice",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleSendInvoice = () => {
    if (!emailMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message for the email",
        variant: "destructive",
      });
      return;
    }
    
    sendInvoiceEmailMutation.mutate({
      invoiceId: invoice.id,
      template: selectedTemplate,
      message: emailMessage
    });
  };
  
  const handleMarkAsPaid = () => {
    markAsPaidMutation.mutate(invoice.id);
  };
  
  // Handle approve and send invoice
  const handleApproveAndSend = () => {
    approveAndSendMutation.mutate(invoice.id);
  };
  
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Invoice #{invoice.invoiceNumber}</CardTitle>
              <CardDescription>
                Created by {invoice.createdByName} for {invoice.clientName}
              </CardDescription>
            </div>
            <Badge className={getStatusColor(invoice.status)}>
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Client</h3>
                <p className="text-base font-semibold">{invoice.clientName}</p>
                <p className="text-sm">{invoice.clientEmail}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Invoice Date</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p>{formatDate(invoice.issuedDate)}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Due Date</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p>{formatDate(invoice.dueDate)}</p>
                </div>
              </div>
              
              {invoice.paidDate && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Paid Date</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <p>{formatDate(invoice.paidDate)}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="font-medium">Total Amount:</span>
                <span className="text-xl font-bold">{formatCurrency(invoice.totalAmount)}</span>
              </div>
              
              {invoice.paidAmount !== undefined && (
                <div className="flex items-center justify-between pb-2">
                  <span className="font-medium">Paid Amount:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(invoice.paidAmount)}</span>
                </div>
              )}
              
              {invoice.paidAmount !== undefined && invoice.paidAmount < invoice.totalAmount && (
                <div className="flex items-center justify-between pb-2">
                  <span className="font-medium">Balance Due:</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(invoice.totalAmount - invoice.paidAmount)}
                  </span>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2 mt-4">
                {invoice.invoicePdf && (
                  <Button variant="outline" size="sm" className="h-9">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                )}
                <Button variant="outline" size="sm" className="h-9">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9"
                  onClick={() => setSendEmailDialogOpen(true)}
                  disabled={invoice.status === 'draft'}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                {invoice.status === 'draft' && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="h-9 bg-[#025E73] text-white hover:bg-[#025E73]/90"
                    onClick={handleApproveAndSend}
                    disabled={approveAndSendMutation.isPending}
                  >
                    {approveAndSendMutation.isPending ? (
                      <>
                        <MessageSquare className="h-4 w-4 mr-2 animate-pulse" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Approve & Send
                      </>
                    )}
                  </Button>
                )}
                
                {invoice.status !== 'paid' && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="h-9"
                    onClick={handleMarkAsPaid}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Mark as Paid
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="font-semibold text-lg mb-4">Invoice Items</h3>
            <div className="rounded-md border">
              <div className="grid grid-cols-12 bg-muted p-3 rounded-t-md">
                <div className="col-span-5 font-medium">Description</div>
                <div className="col-span-4 font-medium">Load Info</div>
                <div className="col-span-3 font-medium text-right">Amount</div>
              </div>
              <div className="divide-y">
                {invoice.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 p-3">
                    <div className="col-span-5">{item.description}</div>
                    <div className="col-span-4">
                      {item.loadInfo ? (
                        <div className="text-sm">
                          <p className="font-medium">{item.loadInfo.loadNumber}</p>
                          <p className="text-muted-foreground">{item.loadInfo.origin} to {item.loadInfo.destination}</p>
                          <p className="text-muted-foreground">{new Date(item.loadInfo.date).toLocaleDateString()}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Load #{item.loadId}</span>
                      )}
                    </div>
                    <div className="col-span-3 text-right font-medium">{formatCurrency(item.amount)}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end bg-muted p-3 rounded-b-md">
                <div className="w-1/3 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium">Subtotal:</span>
                    <span>{formatCurrency(invoice.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(invoice.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {invoice.notes && (
            <div className="mt-6">
              <h3 className="font-semibold text-lg mb-2">Notes</h3>
              <div className="bg-muted rounded-md p-3">
                <p>{invoice.notes}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Send Email Dialog */}
      <Dialog open={sendEmailDialogOpen} onOpenChange={setSendEmailDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Send Invoice Email</DialogTitle>
            <DialogDescription>
              Send invoice #{invoice.invoiceNumber} to {invoice.clientName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Template</label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Template</SelectItem>
                  <SelectItem value="friendly">Friendly Reminder</SelectItem>
                  <SelectItem value="urgent">Urgent Payment</SelectItem>
                  <SelectItem value="overdue">Overdue Notice</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Recipient</label>
              <div className="flex items-center border rounded-md p-2 bg-muted">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{invoice.clientEmail}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Message</label>
              <Textarea 
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Enter additional message to include in the email..."
                className="min-h-[120px]"
              />
            </div>
            
            <div className="rounded-md border p-3">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>Invoice-{invoice.invoiceNumber}.pdf will be attached automatically</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendInvoice}
              disabled={sendInvoiceEmailMutation.isPending}
            >
              {sendInvoiceEmailMutation.isPending ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invoice
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}