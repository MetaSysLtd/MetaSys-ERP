import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useRealTime } from '@/contexts/RealTimeContext';
import { useToast } from '@/hooks/use-toast';

// Module types we support
export type ModuleType = 'leads' | 'clients' | 'commissions' | 'activities' | 
  'dispatches' | 'invoices' | 'tasks' | 'performance' | 'dashboard';

/**
 * Custom hook to fetch data from different modules with permission handling
 */
export function useCrossModuleData<T>(dataType: ModuleType, options: {
  includeDetails?: boolean;
  entityId?: number;
  enabled?: boolean;
  onPermissionDenied?: () => void;
} = {}) {
  const { toast } = useToast();
  const { subscribe } = useRealTime();
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  // If an entityId is provided, get integrated data
  const url = options.entityId 
    ? `/api/cross-module/${dataType}/${options.entityId}`
    : `/api/cross-module/${dataType}`;
    
  const queryParams = options.includeDetails ? '?includeDetails=true' : '';
  
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<T>({
    queryKey: options.entityId
      ? ['crossModule', dataType, options.entityId]
      : ['crossModule', dataType],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `${url}${queryParams}`);
        
        if (response.status === 403) {
          setPermissionDenied(true);
          options.onPermissionDenied?.();
          return null;
        }
        
        return await response.json();
      } catch (err) {
        if (err.message?.includes('Forbidden') || err.status === 403) {
          setPermissionDenied(true);
          options.onPermissionDenied?.();
        }
        throw err;
      }
    },
    enabled: options.enabled !== false
  });
  
  // Subscribe to real-time updates for this data type
  useEffect(() => {
    if (permissionDenied) return;
    
    // Subscribe to general data updates
    const unsubscribe = subscribe('dataUpdated', (eventData) => {
      if (eventData.type === dataType) {
        refetch();
      }
    });
    
    // Subscribe to entity-specific updates if we have an entityId
    if (options.entityId) {
      // Setup entity-specific subscription
      const specificEvent = `${dataType}.entity.${options.entityId}.updated`;
      const unsubscribeSpecific = subscribe(specificEvent, () => {
        refetch();
      });
      
      return () => {
        unsubscribe();
        unsubscribeSpecific();
      };
    }
    
    return unsubscribe;
  }, [dataType, options.entityId, permissionDenied, refetch, subscribe]);
  
  return {
    data,
    isLoading,
    isError,
    error,
    refetch,
    permissionDenied
  };
}

/**
 * Hook to get unified dashboard data from multiple modules
 */
export function useUnifiedDashboard() {
  const { toast } = useToast();
  const { subscribe } = useRealTime();
  const [hasPermissionIssues, setHasPermissionIssues] = useState(false);
  
  const {
    data: unifiedData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['crossModule', 'dashboard', 'unified'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/cross-module/dashboard/unified`);
        
        if (response.status === 403) {
          setHasPermissionIssues(true);
          toast({
            title: "Permission Error",
            description: "You don't have permission to access some dashboard components",
            variant: "destructive",
          });
          return null;
        }
        
        return await response.json();
      } catch (err) {
        if (err.message?.includes('Forbidden') || err.status === 403) {
          setHasPermissionIssues(true);
          toast({
            title: "Permission Error",
            description: "You don't have permission to access some dashboard components",
            variant: "destructive",
          });
        }
        throw err;
      }
    }
  });
  
  // Subscribe to updates for all related data types
  useEffect(() => {
    const unsubscribeHandlers: (() => void)[] = [];
    
    const dataTypes: ModuleType[] = [
      'dashboard', 'leads', 'clients', 'commissions', 
      'activities', 'tasks', 'performance'
    ];
    
    // Subscribe to each data type
    dataTypes.forEach(type => {
      const unsubscribe = subscribe(`${type}.updated`, () => {
        refetch();
      });
      
      unsubscribeHandlers.push(unsubscribe);
    });
    
    // General data update event
    const unsubscribeGeneral = subscribe('dataUpdated', (eventData) => {
      if (dataTypes.includes(eventData.type as ModuleType)) {
        refetch();
      }
    });
    
    unsubscribeHandlers.push(unsubscribeGeneral);
    
    return () => {
      unsubscribeHandlers.forEach(handler => handler());
    };
  }, [refetch, subscribe]);
  
  const hasPermission = (moduleType: string) => {
    if (!unifiedData) return false;
    return !unifiedData[moduleType]?.restricted;
  };
  
  return {
    dashboardData: unifiedData?.dashboard,
    leadsData: unifiedData?.leads,
    commissionsData: unifiedData?.commissions,
    performanceData: unifiedData?.performance,
    isLoading,
    isError,
    error,
    refetch,
    hasPermissionIssues,
    hasPermission
  };
}

/**
 * Hook to emit cross-module updates
 */
export function useEmitModuleUpdate() {
  const { toast } = useToast();
  
  const updateMutation = useMutation({
    mutationFn: async ({
      sourceModule,
      dataType,
      data,
      targetUsers = []
    }: {
      sourceModule: string;
      dataType: string;
      data: any;
      targetUsers?: number[];
    }) => {
      const response = await apiRequest('POST', '/api/cross-module/emit-update', {
        sourceModule,
        dataType,
        data,
        targetUsers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to emit update');
      }
      
      return await response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate queries based on the data type that was updated
      queryClient.invalidateQueries({ 
        queryKey: ['crossModule', variables.dataType]
      });
      
      toast({
        title: "Update Emitted",
        description: `${variables.sourceModule} module update was broadcast successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: `Failed to emit update: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const emitUpdate = useCallback(
    (sourceModule: string, dataType: string, data: any, targetUsers?: number[]) => {
      updateMutation.mutate({ sourceModule, dataType, data, targetUsers });
    },
    [updateMutation]
  );
  
  return {
    emitUpdate,
    isEmitting: updateMutation.isPending,
    error: updateMutation.error
  };
}