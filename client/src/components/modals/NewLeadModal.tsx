import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

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
import { Plus, Truck, CheckCircle2, ArrowRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Schema for lead form validation - Step 1 (Company & Contact Info)
const leadFormSchemaStep1 = z.object({
  companyName: z.string().min(2, { message: "Company name is required" }),
  contactName: z.string().min(2, { message: "Contact name is required" }),
  phoneNumber: z.string().min(10, { message: "Valid phone number is required" }),
  email: z.string().email({ message: "Invalid email address" }).optional().or(z.literal("")),
  source: z.enum(["SQL", "MQL", "Website", "Referral", "Cold Call", "Event", "Partner", "Other"]).default("SQL"),
  sourceDetails: z.string().optional(),
});

// Schema for lead form validation - Step 2 (Logistics Info)
const leadFormSchemaStep2 = z.object({
  mcNumber: z.string().min(1, { message: "MC Number is required" }),
  mcAge: z.coerce.number().min(0, { message: "MC Age must be 0 or greater" }).default(0),
  dotNumber: z.string().optional(),
  equipmentType: z.string().min(1, { message: "Equipment type is required" }),
  truckCategory: z.string().optional(),
  factoringStatus: z.string().min(1, { message: "Factoring status is required" }),
  serviceCharges: z.coerce.number().min(0.1, { message: "Service charges must be greater than 0" }),
  commissionRate: z.coerce.number().min(0, { message: "Commission rate must be 0 or greater" }).default(10),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).default("Medium"),
  category: z.enum(["Carrier", "Shipper", "Broker", "Other"]).default("Carrier"),
  currentAvailability: z.enum(["Available", "Booked", "Limited", "Unknown"]).default("Unknown"),
  notes: z.string().optional(),
});

// Combined schema for both steps
const leadFormSchema = leadFormSchemaStep1.merge(leadFormSchemaStep2);

type LeadFormValuesStep1 = z.infer<typeof leadFormSchemaStep1>;
type LeadFormValuesStep2 = z.infer<typeof leadFormSchemaStep2>;
type LeadFormValues = z.infer<typeof leadFormSchema>;

interface NewLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Stub function to calculate MC age (would be replaced with API call in production)
const calculateMcAge = async (mcNumber: string): Promise<number> => {
  if (!mcNumber || mcNumber.trim() === "") return 0;
  
  // In a real implementation, this would call an API to get the actual age
  // For now, generate a random age between 0 and 60 months
  const randomAge = Math.floor(Math.random() * 60);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return randomAge;
};

export function NewLeadModal({ open, onOpenChange, onSuccess }: NewLeadModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<LeadFormValuesStep1 | null>(null);
  const [checkingMcAge, setCheckingMcAge] = useState(false);
  
  // Form for Step 1 (Company & Contact Info)
  const step1Form = useForm<LeadFormValuesStep1>({
    resolver: zodResolver(leadFormSchemaStep1),
    defaultValues: {
      companyName: "",
      contactName: "",
      phoneNumber: "",
      email: "",
      source: "SQL",
      sourceDetails: "",
    },
  });
  
  // Form for Step 2 (Logistics Info)
  const step2Form = useForm<LeadFormValuesStep2>({
    resolver: zodResolver(leadFormSchemaStep2),
    defaultValues: {
      mcNumber: "",
      mcAge: 0,
      dotNumber: "",
      equipmentType: "",
      truckCategory: "",
      factoringStatus: "",
      serviceCharges: 5, // Default to 5%
      commissionRate: 10, // Default to 10%
      priority: "Medium",
      category: "Carrier",
      currentAvailability: "Unknown",
      notes: "",
    },
  });
  
  const handleStep1Submit = async (data: LeadFormValuesStep1) => {
    setStep1Data(data);
    setCurrentStep(2);
  };
  
  const handleStep2Submit = async (data: LeadFormValuesStep2) => {
    if (!step1Data || !user) return;
    
    setIsSubmitting(true);
    
    try {
      const combinedData = {
        ...step1Data,
        ...data,
      };
      
      // Create the lead
      await apiRequest("POST", "/api/leads", {
        ...combinedData,
        assignedTo: user.id,
        createdBy: user.id,
      });
      
      toast({
        title: "Success",
        description: "Lead has been created successfully",
      });
      
      // Reset forms and close modal
      step1Form.reset();
      step2Form.reset();
      setStep1Data(null);
      setCurrentStep(1);
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
  
  // Handle MC Number change to calculate age
  const handleMcNumberChange = async (mcNumber: string) => {
    if (mcNumber && mcNumber.trim() !== "") {
      setCheckingMcAge(true);
      try {
        const mcAge = await calculateMcAge(mcNumber);
        step2Form.setValue("mcAge", mcAge);
      } catch (error) {
        console.error("Error calculating MC age:", error);
      } finally {
        setCheckingMcAge(false);
      }
    }
  };
  
  // Go back to step 1
  const goBackToStep1 = () => {
    setCurrentStep(1);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-r from-[#025E73] to-[#011F26] text-white">
              <Plus className="h-6 w-6" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <DialogTitle className="text-lg leading-6 font-medium text-gray-900">
                Add New Lead {currentStep === 2 && '- Logistics Information'}
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-gray-500">
                {currentStep === 1 
                  ? "Enter the basic contact information for the new lead. Fields marked with * are required."
                  : "Now enter the logistics and operational details for this lead."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center w-full max-w-xs space-x-2">
            <div className="flex-1 flex flex-col items-center">
              <div className={`rounded-full h-8 w-8 flex items-center justify-center ${currentStep >= 1 ? 'bg-[#025E73] text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="text-xs mt-1">Company Info</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 relative">
              <div className={`absolute top-0 left-0 h-full ${currentStep >= 2 ? 'bg-[#025E73]' : 'bg-gray-200'}`} style={{ width: '100%' }}></div>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <div className={`rounded-full h-8 w-8 flex items-center justify-center ${currentStep >= 2 ? 'bg-[#025E73] text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="text-xs mt-1">Logistics Info</span>
            </div>
          </div>
        </div>
        
        {/* Step 1: Company & Contact Info */}
        {currentStep === 1 && (
          <Form {...step1Form}>
            <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <FormField
                  control={step1Form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-6">
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter carrier company name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={step1Form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-3">
                      <FormLabel>Contact Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Full name of primary contact" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={step1Form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-3">
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input {...field} type="tel" placeholder="(555) 123-4567" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={step1Form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-6">
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="contact@company.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={step1Form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-3">
                      <FormLabel>Lead Source *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SQL">Sales Qualified (SQL)</SelectItem>
                          <SelectItem value="MQL">Marketing Qualified (MQL)</SelectItem>
                          <SelectItem value="Cold Call">Cold Call</SelectItem>
                          <SelectItem value="Referral">Referral</SelectItem>
                          <SelectItem value="Website">Website</SelectItem>
                          <SelectItem value="Event">Event/Tradeshow</SelectItem>
                          <SelectItem value="Partner">Partner</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={step1Form.control}
                  name="sourceDetails"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-3">
                      <FormLabel>Source Details</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder={
                            step1Form.watch("source") === "Referral" 
                              ? "Referred by..." 
                              : step1Form.watch("source") === "Event" 
                                ? "Event name..." 
                                : "Additional source details..."
                          }
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
                <Button type="submit" className="bg-gradient-to-r from-[#025E73] to-[#011F26] hover:opacity-90">
                  Continue to Logistics Info
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
        
        {/* Step 2: Logistics Info */}
        {currentStep === 2 && (
          <Form {...step2Form}>
            <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                {/* Display summary of step 1 */}
                {step1Data && (
                  <Card className="sm:col-span-6 bg-slate-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{step1Data.companyName}</h4>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {step1Data.source}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Contact: {step1Data.contactName} • {step1Data.phoneNumber}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <FormField
                  control={step2Form.control}
                  name="mcNumber"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-3">
                      <FormLabel>MC Number *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="MC123456" 
                          onChange={(e) => {
                            field.onChange(e);
                            handleMcNumberChange(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={step2Form.control}
                  name="mcAge"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-3">
                      <FormLabel>MC Age (months)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            {...field} 
                            type="number" 
                            min="0" 
                            disabled={checkingMcAge}
                            className={checkingMcAge ? "bg-gray-100" : ""}
                          />
                          {checkingMcAge && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      {field.value > 0 && (
                        <FormDescription className="text-xs flex items-center">
                          {field.value >= 6 ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                              <span className="text-green-700">Meets minimum age requirement</span>
                            </>
                          ) : (
                            <span className="text-amber-600">Warning: MC is less than 6 months old</span>
                          )}
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={step2Form.control}
                  name="dotNumber"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-3">
                      <FormLabel>DOT Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="DOT12345678" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={step2Form.control}
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
                          <SelectItem value="conestoga">Conestoga</SelectItem>
                          <SelectItem value="hotshot">Hotshot</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={step2Form.control}
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
                  control={step2Form.control}
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
                  control={step2Form.control}
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
                  control={step2Form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-6">
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={3} 
                          placeholder="Add any additional information about the lead"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter className="flex sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBackToStep1}
                  className="mb-2 sm:mb-0"
                >
                  Back to Contact Info
                </Button>
                <div className="space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-[#025E73] to-[#011F26] hover:opacity-90"
                  >
                    <Truck className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Creating..." : "Create Lead"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
