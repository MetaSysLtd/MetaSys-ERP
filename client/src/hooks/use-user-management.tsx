import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Role, Organization, InsertUser } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Hook for managing users
export function useUserManagement() {
  const { toast } = useToast();

  // Get all users
  const {
    data: users,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery<User[]>({
    queryKey: ["/api/users"],
    retry: 1,
  });

  // Get all roles
  const {
    data: roles,
    isLoading: isLoadingRoles,
    error: rolesError,
  } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
    retry: 1,
  });

  // Get all organizations
  const {
    data: organizations,
    isLoading: isLoadingOrganizations,
    error: organizationsError,
  } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
    retry: 1,
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const res = await apiRequest("POST", "/api/users", userData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "User created successfully",
        description: "The new user has been added to the system.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: number; userData: Partial<User> }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, userData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "User updated successfully",
        description: "The user information has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Manage user organizations mutation
  const updateUserOrganizationsMutation = useMutation({
    mutationFn: async ({ userId, organizationIds }: { userId: number; organizationIds: number[] }) => {
      const res = await apiRequest("POST", `/api/users/${userId}/organizations`, { organizationIds });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "User organizations updated",
        description: "The user's organization access has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update user organizations",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get user organizations
  const getUserOrganizations = (userId: number) => {
    return useQuery<Organization[]>({
      queryKey: [`/api/users/${userId}/organizations`],
      enabled: !!userId,
      retry: 1,
    });
  };

  // Get users by organization
  const getUsersByOrganization = (organizationId: number) => {
    return useQuery<User[]>({
      queryKey: [`/api/organizations/${organizationId}/users`],
      enabled: !!organizationId,
      retry: 1,
    });
  };

  // Get users by role
  const getUsersByRole = (roleId: number) => {
    return useQuery<User[]>({
      queryKey: [`/api/roles/${roleId}/users`],
      enabled: !!roleId,
      retry: 1,
    });
  };

  // Get users by department
  const getUsersByDepartment = (department: string) => {
    return useQuery<User[]>({
      queryKey: [`/api/users/department/${department}`],
      enabled: !!department,
      retry: 1,
    });
  };

  return {
    // Data
    users,
    roles,
    organizations,
    
    // Loading states
    isLoadingUsers,
    isLoadingRoles,
    isLoadingOrganizations,
    
    // Errors
    usersError,
    rolesError,
    organizationsError,
    
    // Mutations
    createUserMutation,
    updateUserMutation,
    updateUserOrganizationsMutation,
    
    // Query functions
    getUserOrganizations,
    getUsersByOrganization,
    getUsersByRole,
    getUsersByDepartment,
  };
}