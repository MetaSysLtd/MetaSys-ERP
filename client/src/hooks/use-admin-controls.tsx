import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { adminService } from '@/services/adminService';
import { queryClient } from '@/lib/queryClient';
import { FieldConfig } from '@/components/admin/AdminEditModal';

interface UseAdminControlsOptions {
  module: string;
  queryKey: string | string[];
}

/**
 * Hook for using global admin controls to edit and delete entities
 */
export function useAdminControls({ module, queryKey }: UseAdminControlsOptions) {
  const { user, role } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [fields, setFields] = useState<FieldConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is a System Admin
  const isSystemAdmin = role?.level >= 5 || user?.isSystemAdmin;

  // Load field configuration for the module
  const loadFieldConfig = useCallback(async () => {
    if (!module) return;
    
    try {
      setIsLoading(true);
      const fieldConfig = await adminService.getModuleFieldConfig(module);
      setFields(fieldConfig);
    } catch (error) {
      console.error('Error loading field configuration:', error);
    } finally {
      setIsLoading(false);
    }
  }, [module]);

  // Open the edit modal for an item
  const openEditModal = useCallback(async (item: any) => {
    if (!isSystemAdmin || !item) return;
    
    setSelectedItem(item);
    
    // If we don't have field config yet, load it
    if (fields.length === 0) {
      await loadFieldConfig();
    }
    
    setIsEditModalOpen(true);
  }, [isSystemAdmin, fields.length, loadFieldConfig]);

  // Update an entity
  const updateEntity = useCallback(async (data: any) => {
    if (!selectedItem?.id) return;
    
    try {
      setIsLoading(true);
      await adminService.updateEntity(module, selectedItem.id, data);
      
      // Invalidate queries to refresh data
      if (Array.isArray(queryKey)) {
        queryClient.invalidateQueries({ queryKey });
      } else {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      }
      
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating entity:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [module, selectedItem, queryKey]);

  // Delete an entity
  const deleteEntity = useCallback(async (id: number | string) => {
    if (!isSystemAdmin) return;
    
    try {
      setIsLoading(true);
      await adminService.deleteEntity(module, id);
      
      // Invalidate queries to refresh data
      if (Array.isArray(queryKey)) {
        queryClient.invalidateQueries({ queryKey });
      } else {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting entity:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isSystemAdmin, module, queryKey]);

  return {
    isSystemAdmin,
    isEditModalOpen,
    setIsEditModalOpen,
    selectedItem,
    fields,
    isLoading,
    openEditModal,
    updateEntity,
    deleteEntity
  };
}