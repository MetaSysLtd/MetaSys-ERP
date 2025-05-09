import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { adminService } from "@/services/adminService";
import { useAuth } from "@/hooks/use-auth";

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'boolean' | 'select' | 'date' | 'email';
  options?: { label: string; value: string | number | boolean }[];
  readOnly?: boolean;
  disabled?: boolean;
  description?: string;
  required?: boolean;
  pattern?: {
    value: RegExp;
    message: string;
  };
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
}

interface AdminControlsOptions {
  module: string;
  queryKey: string | string[];
  moduleFields?: FieldConfig[];
}

export function useAdminControls({ 
  module, 
  queryKey,
  moduleFields
}: AdminControlsOptions) {
  const { toast } = useToast();
  const auth = useAuth();
  const role = auth?.role || { level: 0 };
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isAdminActionLoading, setIsAdminActionLoading] = useState(false);
  const isSystemAdmin = (role?.level || 0) >= 5;
  
  // Default field configuration for common entity types
  const defaultFields: Record<string, FieldConfig[]> = {
    leads: [
      { name: "companyName", label: "Company Name", type: "text", required: true },
      { name: "mcNumber", label: "MC Number", type: "text", required: true },
      { name: "dotNumber", label: "DOT Number", type: "text" },
      { name: "equipmentType", label: "Equipment Type", type: "text", required: true },
      { name: "truckCategory", label: "Truck Category", type: "text" },
      { name: "factoringStatus", label: "Factoring Status", type: "text", required: true },
      { name: "serviceCharges", label: "Service Charges", type: "number" },
      { name: "contactName", label: "Contact Name", type: "text", required: true },
      { name: "phoneNumber", label: "Phone Number", type: "text", required: true },
      { name: "email", label: "Email", type: "email" },
      { name: "status", label: "Status", type: "select", required: true, options: [
        { label: "New", value: "New" },
        { label: "In Progress", value: "InProgress" },
        { label: "Follow Up", value: "FollowUp" },
        { label: "Hand To Dispatch", value: "HandToDispatch" },
        { label: "Active", value: "Active" },
        { label: "Lost", value: "Lost" },
      ]},
      { name: "source", label: "Source", type: "select", required: true, options: [
        { label: "SQL", value: "SQL" },
        { label: "MQL", value: "MQL" },
        { label: "Website", value: "Website" },
        { label: "Referral", value: "Referral" },
        { label: "Cold Call", value: "Cold Call" },
        { label: "Event", value: "Event" },
        { label: "Partner", value: "Partner" },
        { label: "Other", value: "Other" },
      ]},
      { name: "sourceDetails", label: "Source Details", type: "text" },
      { name: "qualificationScore", label: "Qualification Score", type: "select", options: [
        { label: "Low", value: "Low" },
        { label: "Medium", value: "Medium" },
        { label: "High", value: "High" },
        { label: "Very High", value: "Very High" },
      ]},
      { name: "validationStatus", label: "Validation Status", type: "select", options: [
        { label: "Valid", value: "Valid" },
        { label: "Invalid", value: "Invalid" },
        { label: "Pending", value: "Pending" },
      ]},
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  };
  
  // Use provided fields or fall back to default fields for the module
  const fields = moduleFields || defaultFields[module] || [];

  // Define query keys for invalidation
  const queryKeyArray = Array.isArray(queryKey) ? queryKey : [queryKey];

  // Create mutation for updating entities
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      setIsAdminActionLoading(true);
      try {
        const result = await adminService.updateEntity(module, data);
        return result;
      } finally {
        setIsAdminActionLoading(false);
      }
    },
    onSuccess: () => {
      // Using the object form of invalidateQueries for TanStack Query v5
      queryClient.invalidateQueries({ queryKey: queryKeyArray });
      toast({
        title: "Updated successfully",
        description: `The ${module} has been updated successfully.`,
      });
      setIsEditModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || `Failed to update ${module}.`,
        variant: "destructive",
      });
    }
  });

  // Create mutation for deleting entities
  const deleteMutation = useMutation({
    mutationFn: async (id: number | string) => {
      setIsAdminActionLoading(true);
      try {
        const result = await adminService.deleteEntity(module, id);
        return result;
      } finally {
        setIsAdminActionLoading(false);
      }
    },
    onSuccess: () => {
      // Using the object form of invalidateQueries for TanStack Query v5
      queryClient.invalidateQueries({ queryKey: queryKeyArray });
      toast({
        title: "Deleted successfully",
        description: `The ${module} has been removed.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || `Failed to delete ${module}.`,
        variant: "destructive",
      });
    }
  });

  // Function to open edit modal
  const openEditModal = (item: any) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  // Function to handle entity update
  const updateEntity = async (data: any) => {
    return updateMutation.mutateAsync({ ...data, id: selectedItem.id });
  };

  // Function to handle entity deletion
  const deleteEntity = async (id: number | string) => {
    if (window.confirm(`Are you sure you want to delete this ${module}? This action cannot be undone.`)) {
      return deleteMutation.mutateAsync(id);
    }
    return true;
  };

  return {
    openEditModal,
    updateEntity,
    deleteEntity,
    isEditModalOpen,
    setIsEditModalOpen,
    selectedItem,
    isAdminActionLoading,
    isSystemAdmin,
    isLoading: isAdminActionLoading,
    fields
  };
}