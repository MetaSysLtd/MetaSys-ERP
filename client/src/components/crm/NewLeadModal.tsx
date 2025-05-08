import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle } from "lucide-react";

interface NewLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewLeadModal({ open, onOpenChange }: NewLeadModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form state
  const [formData, setFormData] = useState({
    companyName: "",
    mcNumber: "",
    mcAge: 0,
    dotNumber: "",
    contactName: "",
    status: "New",
    assignedTo: user?.id || 0,
    serviceCharges: 0,
    commissionRate: 10,
    priority: "Medium",
    category: "Carrier",
    currentAvailability: "Unknown",
    equipmentType: "",
    truckCategory: "",
    factoringStatus: "",
    phoneNumber: "",
    email: "",
    source: "SQL",
    sourceDetails: "",
    remarks: "",
    tags: [] as string[]
  });
  
  const [errors, setErrors] = useState<{
    mcNumber?: string;
    serviceCharges?: string;
    general?: string;
  }>({});
  
  // Get the list of sales team members for the owner selection
  const { data: salesTeam } = useQueryClient().getQueryState<any[]>(["/api/users/sales-team"]) || {};
  
  // Create lead mutation
  const createLeadMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/leads", {
        ...data,
        serviceCharges: Number(data.serviceCharges),
        assignedTo: Number(data.assignedTo),
        orgId: 1, // Set default organization ID
        createdBy: user?.id,
        status: "New", // Always start with New status
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create lead");
      }
      
      return await res.json();
    },
    onSuccess: (data) => {
      // Create an activity for the lead creation
      apiRequest("POST", "/api/activities", {
        entityType: "lead",
        entityId: data.id,
        action: "created",
        details: `Lead created: ${data.companyName}`,
        notes: formData.remarks || undefined
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Success",
        description: "Lead created successfully",
        variant: "default",
      });
      onOpenChange(false);
      
      // Reset form data
      setFormData({
        companyName: "",
        mcNumber: "",
        mcAge: 0,
        dotNumber: "",
        contactName: "",
        status: "New",
        assignedTo: user?.id || 0,
        serviceCharges: 0,
        commissionRate: 10,
        priority: "Medium",
        category: "Carrier",
        currentAvailability: "Unknown",
        equipmentType: "",
        truckCategory: "",
        factoringStatus: "",
        phoneNumber: "",
        email: "",
        source: "SQL",
        sourceDetails: "",
        remarks: "",
        tags: []
      });
      setErrors({});
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create lead",
        variant: "destructive",
      });
    }
  });
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear the error for this field if it exists
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear the error for this field if it exists
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  // Handle tag input
  const [tagInput, setTagInput] = useState('');
  
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };
  
  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const newErrors: typeof errors = {};
    
    if (!formData.companyName) {
      newErrors.general = "Company Name is required";
    }
    
    if (!formData.contactName) {
      newErrors.general = newErrors.general || "Contact Name is required";
    }
    
    if (!formData.phoneNumber) {
      newErrors.general = newErrors.general || "Phone Number is required";
    }
    
    if (!formData.mcNumber) {
      newErrors.mcNumber = "MC Number is required";
    }
    
    if (formData.serviceCharges === 0 || formData.serviceCharges === null) {
      newErrors.serviceCharges = "Service Charges are required";
    }
    
    // If there are validation errors, don't submit
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      
      if (newErrors.general) {
        toast({
          title: "Validation Error",
          description: newErrors.general,
          variant: "destructive",
        });
      }
      
      return;
    }
    
    // Submit the form data
    createLeadMutation.mutate(formData);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Lead</DialogTitle>
          <DialogDescription>
            Add a new lead to the CRM system. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">
                  Company Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Company Name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactName">
                  Contact Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contactName"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  placeholder="Contact Name"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mcNumber" className="flex items-center">
                  MC Number <span className="text-red-500">*</span>
                  {errors.mcNumber && (
                    <span className="ml-2 text-xs text-red-500 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.mcNumber}
                    </span>
                  )}
                </Label>
                <Input
                  id="mcNumber"
                  name="mcNumber"
                  value={formData.mcNumber}
                  onChange={handleChange}
                  placeholder="MC Number"
                  className={errors.mcNumber ? "border-red-500" : ""}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mcAge">
                  MC Age <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="mcAge"
                  name="mcAge"
                  type="number"
                  min="0"
                  value={formData.mcAge.toString()}
                  onChange={handleChange}
                  placeholder="Age in months"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dotNumber">
                DOT Number
              </Label>
              <Input
                id="dotNumber"
                name="dotNumber"
                value={formData.dotNumber}
                onChange={handleChange}
                placeholder="DOT Number"
              />
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Phone Number"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="assignedTo">
                  Owner <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.assignedTo.toString()}
                  onValueChange={(value) => handleSelectChange("assignedTo", value)}
                >
                  <SelectTrigger id="assignedTo">
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {salesTeam && salesTeam.length > 0 ? (
                      salesTeam.map((member: any) => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                          {member.firstName} {member.lastName}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value={user?.id?.toString() || "0"}>
                        {user?.firstName} {user?.lastName}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="serviceCharges" className="flex items-center">
                  Service Charges (%) <span className="text-red-500">*</span>
                  {errors.serviceCharges && (
                    <span className="ml-2 text-xs text-red-500 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.serviceCharges}
                    </span>
                  )}
                </Label>
                <Input
                  id="serviceCharges"
                  name="serviceCharges"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.serviceCharges.toString()}
                  onChange={handleChange}
                  placeholder="Service Charges"
                  className={errors.serviceCharges ? "border-red-500" : ""}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="commissionRate">
                  Commission Rate (%) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="commissionRate"
                  name="commissionRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.commissionRate.toString()}
                  onChange={handleChange}
                  placeholder="Commission Rate"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">
                  Priority
                </Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleSelectChange("priority", value)}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleSelectChange("category", value)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Carrier">Carrier</SelectItem>
                    <SelectItem value="Shipper">Shipper</SelectItem>
                    <SelectItem value="Broker">Broker</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currentAvailability">
                  Current Availability
                </Label>
                <Select
                  value={formData.currentAvailability}
                  onValueChange={(value) => handleSelectChange("currentAvailability", value)}
                >
                  <SelectTrigger id="currentAvailability">
                    <SelectValue placeholder="Select availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Limited">Limited</SelectItem>
                    <SelectItem value="Unavailable">Unavailable</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="equipmentType">
                  Equipment Type
                </Label>
                <Select
                  value={formData.equipmentType}
                  onValueChange={(value) => handleSelectChange("equipmentType", value)}
                >
                  <SelectTrigger id="equipmentType">
                    <SelectValue placeholder="Select equipment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flatbed">Flatbed</SelectItem>
                    <SelectItem value="dry-van">Dry Van</SelectItem>
                    <SelectItem value="reefer">Reefer</SelectItem>
                    <SelectItem value="step-deck">Step Deck</SelectItem>
                    <SelectItem value="lowboy">Lowboy</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="factoringStatus">
                  Factoring Status
                </Label>
                <Select
                  value={formData.factoringStatus}
                  onValueChange={(value) => handleSelectChange("factoringStatus", value)}
                >
                  <SelectTrigger id="factoringStatus">
                    <SelectValue placeholder="Select factoring status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="has-factoring">Has Factoring</SelectItem>
                    <SelectItem value="needs-factoring">Needs Factoring</SelectItem>
                    <SelectItem value="not-applicable">Not Applicable</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="source">
                  Lead Source
                </Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) => handleSelectChange("source", value)}
                >
                  <SelectTrigger id="source">
                    <SelectValue placeholder="Select lead source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SQL">SQL</SelectItem>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Cold Call">Cold Call</SelectItem>
                    <SelectItem value="Event">Event</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sourceDetails">
                  Source Details
                </Label>
                <Input
                  id="sourceDetails"
                  name="sourceDetails"
                  value={formData.sourceDetails}
                  onChange={handleChange}
                  placeholder="Additional source information"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Add any additional remarks about this lead"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-gray-200"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} &times;
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  placeholder="Add tag"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" size="sm" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setErrors({});
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createLeadMutation.isPending}
              className="bg-gradient-to-r from-[#025E73] to-[#011F26] hover:opacity-90 text-white"
            >
              {createLeadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Lead'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}