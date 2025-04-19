import { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  FileText, 
  Plus, 
  Trash, 
  CalendarIcon, 
  Users, 
  Truck, 
  DollarSign 
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";

export interface Lead {
  id: number;
  companyName: string;
  contactName: string;
  email: string;
  phoneNumber: string;
}

export interface Load {
  id: number;
  loadNumber: string;
  origin: string;
  destination: string;
  date: string;
  totalAmount: number;
  leadId: number;
}

const invoiceItemSchema = z.object({
  loadId: z.number({
    required_error: "Load is required",
  }),
  description: z.string().min(1, "Description is required"),
  amount: z.number({
    required_error: "Amount is required",
  }).min(0.01, "Amount must be greater than 0"),
});

const invoiceFormSchema = z.object({
  leadId: z.number({
    required_error: "Client is required",
  }),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  issuedDate: z.date({
    required_error: "Issue date is required",
  }),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  notes: z.string().optional(),
  status: z.enum(['draft', 'sent']).default('draft'),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<InvoiceFormValues> & { id?: number };
  isEditing?: boolean;
}

export function InvoiceForm({ 
  open,
  onOpenChange,
  initialData,
  isEditing = false
}: InvoiceFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch leads for client selection
  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ['/api/leads'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/leads');
      const data: Lead[] = await res.json();
      return data;
    }
  });
  
  // Fetch loads for load selection
  const { data: loads = [], isLoading: loadingLoads } = useQuery({
    queryKey: ['/api/loads'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/loads');
      const data: Load[] = await res.json();
      return data;
    }
  });
  
  // Default values for the form
  const defaultValues: Partial<InvoiceFormValues> = {
    leadId: initialData?.leadId,
    invoiceNumber: initialData?.invoiceNumber || generateInvoiceNumber(),
    issuedDate: initialData?.issuedDate || new Date(),
    dueDate: initialData?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    items: initialData?.items || [{ loadId: 0, description: '', amount: 0 }],
    notes: initialData?.notes || '',
    status: initialData?.status || 'draft',
  };
  
  // Form definition
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues,
  });
  
  // Set up field array for invoice items
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormValues) => {
      const res = await apiRequest('POST', '/api/invoices', {
        ...data,
        issuedDate: format(data.issuedDate, 'yyyy-MM-dd'),
        dueDate: format(data.dueDate, 'yyyy-MM-dd'),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create invoice');
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      toast({
        title: "Invoice created",
        description: "The invoice has been created successfully",
      });
      onOpenChange(false);
      form.reset(defaultValues);
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating invoice",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update invoice mutation
  const updateInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormValues & { id: number }) => {
      const { id, ...rest } = data;
      const res = await apiRequest('PATCH', `/api/invoices/${id}`, {
        ...rest,
        issuedDate: format(rest.issuedDate, 'yyyy-MM-dd'),
        dueDate: format(rest.dueDate, 'yyyy-MM-dd'),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update invoice');
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      if (initialData?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/invoices', initialData.id] });
      }
      toast({
        title: "Invoice updated",
        description: "The invoice has been updated successfully",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating invoice",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: InvoiceFormValues) => {
    if (isEditing && initialData?.id) {
      updateInvoiceMutation.mutate({ ...data, id: initialData.id });
    } else {
      createInvoiceMutation.mutate(data);
    }
  };
  
  function generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000).toString();
    return `INV-${year}${month}-${random}`;
  }
  
  // Calculate total amount of invoice
  const totalAmount = form.watch('items')?.reduce((acc, item) => {
    return acc + (item.amount || 0);
  }, 0) || 0;
  
  // Get lead information by ID
  const getLeadById = (id: number) => {
    return leads.find(lead => lead.id === id);
  };
  
  // Get load information by ID
  const getLoadById = (id: number) => {
    return loads.find(load => load.id === id);
  };
  
  // Filter loads by selected lead
  const getLoadsByLead = (leadId: number) => {
    return loads.filter(load => load.leadId === leadId);
  };
  
  // Automatically update the description when a load is selected
  const handleLoadSelect = (index: number, loadId: number) => {
    const load = getLoadById(loadId);
    if (load) {
      const description = `Load #${load.loadNumber}: ${load.origin} to ${load.destination}`;
      form.setValue(`items.${index}.description`, description);
      form.setValue(`items.${index}.amount`, load.totalAmount);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update invoice details and items' 
              : 'Add a new invoice for a client with one or more load items'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="leadId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {leads.map((lead) => (
                            <SelectItem key={lead.id} value={lead.id.toString()}>
                              {lead.companyName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the client for this invoice
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {form.watch('leadId') && (
                  <div className="rounded-md border p-3 bg-muted">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {getLeadById(form.watch('leadId'))?.contactName} • {getLeadById(form.watch('leadId'))?.email}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Number</FormLabel>
                      <FormControl>
                        <Input placeholder="INV-0001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="issuedDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Issue Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Due Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Invoice Items</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ loadId: 0, description: '', amount: 0 })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
              
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.loadId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={cn(index !== 0 && "sr-only")}>Load</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(parseInt(value));
                                handleLoadSelect(index, parseInt(value));
                              }}
                              defaultValue={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a load" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {form.watch('leadId') 
                                  ? getLoadsByLead(form.watch('leadId')).map((load) => (
                                    <SelectItem key={load.id} value={load.id.toString()}>
                                      {load.loadNumber}
                                    </SelectItem>
                                  ))
                                  : <SelectItem value="0" disabled>Select a client first</SelectItem>
                                }
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-5">
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={cn(index !== 0 && "sr-only")}>Description</FormLabel>
                            <FormControl>
                              <Input placeholder="Service description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.amount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={cn(index !== 0 && "sr-only")}>Amount</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="0.00"
                                  className="pl-8"
                                  type="number"
                                  step="0.01"
                                  {...field}
                                  onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-1 pt-8">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end mt-4 border-t pt-4">
                <div className="w-1/3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Subtotal:</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any notes or payment instructions..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Save as Draft</SelectItem>
                      <SelectItem value="sent">Mark as Sent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Save as draft to edit later, or mark as sent to indicate the invoice has been sent to the client
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createInvoiceMutation.isPending || updateInvoiceMutation.isPending}
              >
                {createInvoiceMutation.isPending || updateInvoiceMutation.isPending ? (
                  "Saving..."
                ) : isEditing ? (
                  "Save Changes"
                ) : (
                  "Create Invoice"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}