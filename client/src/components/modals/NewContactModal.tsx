import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

// Schema for contact form validation
const contactFormSchema = z.object({
  companyName: z.string().min(2, { message: "Company name is required" }),
  mcNumber: z.string().min(1, { message: "MC Number is required" }),
  dotNumber: z.string().optional(),
  equipmentType: z.string().min(1, { message: "Equipment type is required" }),
  truckCategory: z.string().optional(),
  factoringStatus: z.string().min(1, { message: "Factoring status is required" }),
  serviceCharges: z.coerce.number().min(0.1, { message: "Service charges must be greater than 0" }),
  contactName: z.string().min(2, { message: "Contact name is required" }),
  phoneNumber: z.string().min(10, { message: "Valid phone number is required" }),
  email: z.string().email({ message: "Invalid email address" }).optional().or(z.literal("")),
  notes: z.string().optional(),
  status: z.string().default("qualified"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface NewContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function NewContactModal({ open, onOpenChange, onSuccess }: NewContactModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      companyName: "",
      mcNumber: "",
      dotNumber: "",
      equipmentType: "",
      truckCategory: "",
      factoringStatus: "",
      serviceCharges: 5, // Default to 5%
      contactName: "",
      phoneNumber: "",
      email: "",
      notes: "",
      status: "qualified",
    },
  });
  
  const onSubmit = async (data: ContactFormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      await apiRequest("POST", "/api/leads", {
        ...data,
        assignedTo: user.id,
        createdBy: user.id,
      });
      
      toast({
        title: "Success",
        description: "Lead has been created successfully",
      });
      
      // Reset form and close modal
      form.reset();
      onOpenChange(false);
      
      // Invalidate leads query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create lead. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10">
              <Plus className="h-6 w-6 text-primary-600" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <DialogTitle className="text-lg leading-6 font-medium text-gray-900">
                Add New Lead
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-gray-500">
                Please fill out the information for the new lead. Fields marked with * are required.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="mcNumber"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>MC Number *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Must be older than 6 months to qualify
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dotNumber"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>DOT Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="equipmentType"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>Equipment Type *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="flatbed">Flatbed</SelectItem>
                        <SelectItem value="reefer">Reefer</SelectItem>
                        <SelectItem value="dry-van">Dry Van</SelectItem>
                        <SelectItem value="step-deck">Step Deck</SelectItem>
                        <SelectItem value="lowboy">Lowboy</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="factoringStatus"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>Factoring Status *</FormLabel>
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
                        <SelectItem value="has-factoring">Has Factoring</SelectItem>
                        <SelectItem value="needs-factoring">Needs Factoring</SelectItem>
                        <SelectItem value="not-interested">Not Interested in Factoring</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="truckCategory"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>Truck Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="owner-operator">Owner Operator</SelectItem>
                        <SelectItem value="small-fleet">Small Fleet (2-5)</SelectItem>
                        <SelectItem value="medium-fleet">Medium Fleet (6-20)</SelectItem>
                        <SelectItem value="large-fleet">Large Fleet (20+)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>Contact Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="sm:col-span-6">
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="serviceCharges"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>Service Charges (%) *</FormLabel>
                    <FormControl>
                      <div className="relative rounded-md">
                        <Input {...field} type="number" step="0.1" min="0.1" max="20" />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">%</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      Standard is between 3-5%
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="sm:col-span-6">
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        rows={3} 
                        placeholder="Add any additional information about the contact"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Lead"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}