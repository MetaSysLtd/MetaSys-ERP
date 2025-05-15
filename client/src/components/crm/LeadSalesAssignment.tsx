import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle, UserPlus, UserMinus, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface LeadSalesAssignmentProps {
  leadId: number;
  initialSalesUsers?: LeadSalesUser[];
}

interface LeadSalesUser {
  id: number;
  leadId: number;
  userId: number;
  role: string;
  createdAt: string;
  user?: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
}

interface SalesUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  department?: string;
  role?: string;
}

const roleOptions = [
  { value: "starter", label: "Starter (Lead Generator)" },
  { value: "closer", label: "Closer (Deal Finalizer)" },
  { value: "direct", label: "Direct (Full Sale)" }
];

export default function LeadSalesAssignment({ leadId, initialSalesUsers = [] }: LeadSalesAssignmentProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string | undefined>();
  const [selectedUser, setSelectedUser] = useState<number | undefined>();
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [userToRemove, setUserToRemove] = useState<LeadSalesUser | null>(null);

  // Fetch lead sales users
  const { 
    data: leadSalesUsers = initialSalesUsers, 
    isLoading: isLoadingUsers,
    error: usersError
  } = useQuery({
    queryKey: ["/api/commissions/lead-sales-users", leadId],
    queryFn: async () => {
      const res = await fetch(`/api/commissions/lead-sales-users/${leadId}`);
      if (!res.ok) throw new Error("Failed to fetch lead sales users");
      return res.json();
    },
    enabled: !!leadId,
    initialData: initialSalesUsers
  });

  // Fetch sales users (filtered by department)
  const { 
    data: salesUsers = [], 
    isLoading: isLoadingSalesUsers
  } = useQuery({
    queryKey: ["/api/users", "sales"],
    queryFn: async () => {
      const res = await fetch(`/api/users?department=sales`);
      if (!res.ok) throw new Error("Failed to fetch sales users");
      return res.json();
    }
  });

  // Filter out users that are already assigned in the selected role
  const availableUsers = salesUsers.filter((sUser: SalesUser) => {
    // Filter users by selected role
    if (!selectedRole) return false;
    
    // For "direct" role, the user shouldn't be assigned in any role
    if (selectedRole === "direct") {
      return !leadSalesUsers.some((lsu: LeadSalesUser) => lsu.userId === sUser.id);
    }
    
    // For starter/closer roles, the user shouldn't be assigned in the same role
    return !leadSalesUsers.some((lsu: LeadSalesUser) => 
      lsu.userId === sUser.id && lsu.role === selectedRole
    );
  });

  // Create lead sales user assignment
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: { leadId: number; userId: number; role: string }) => {
      const res = await apiRequest("POST", "/api/commissions/lead-sales-users", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to assign user");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "User assigned successfully",
        description: "The user has been assigned to the lead with the selected role.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/commissions/lead-sales-users", leadId] });
      setSelectedRole(undefined);
      setSelectedUser(undefined);
    },
    onError: (error) => {
      toast({
        title: "Failed to assign user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete lead sales user assignment
  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/commissions/lead-sales-users/${id}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to remove assignment");
      }
      return res.status === 204 ? null : res.json();
    },
    onSuccess: () => {
      toast({
        title: "Assignment removed",
        description: "The user has been removed from this lead role.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/commissions/lead-sales-users", leadId] });
      setUserToRemove(null);
      setOpenConfirmDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to remove assignment",
        description: error.message,
        variant: "destructive",
      });
      setOpenConfirmDialog(false);
    },
  });

  const handleAssign = () => {
    if (!selectedUser || !selectedRole) {
      toast({
        title: "Incomplete selection",
        description: "Please select both a role and a user.",
        variant: "destructive",
      });
      return;
    }

    createAssignmentMutation.mutate({
      leadId,
      userId: selectedUser,
      role: selectedRole
    });
  };

  const handleRemove = (lsu: LeadSalesUser) => {
    setUserToRemove(lsu);
    setOpenConfirmDialog(true);
  };

  const confirmRemove = () => {
    if (userToRemove) {
      deleteAssignmentMutation.mutate(userToRemove.id);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "starter":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "closer":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "direct":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  if (usersError) {
    return (
      <Card className="border-red-200 dark:border-red-900">
        <CardContent className="p-4">
          <div className="flex items-center text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Failed to load sales assignments</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Sales Team Assignment</CardTitle>
        <CardDescription>
          Assign sales team members for commission calculation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Current Assignments */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-2">Current Assignments</h4>
          {isLoadingUsers ? (
            <div className="flex items-center justify-center h-20">
              <div className="animate-spin h-5 w-5 border-2 border-t-transparent rounded-full" />
            </div>
          ) : leadSalesUsers.length > 0 ? (
            <div className="space-y-2">
              {leadSalesUsers.map((lsu: LeadSalesUser) => (
                <div key={lsu.id} className="flex items-center justify-between p-2 rounded-md bg-slate-50 dark:bg-slate-900">
                  <div className="flex items-center">
                    <div className="mr-3">
                      {lsu.user?.profileImageUrl ? (
                        <img 
                          src={lsu.user.profileImageUrl} 
                          alt={`${lsu.user.firstName} ${lsu.user.lastName}`}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300">
                          {lsu.user?.firstName?.[0] || ''}
                          {lsu.user?.lastName?.[0] || ''}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">
                        {lsu.user?.firstName} {lsu.user?.lastName}
                      </div>
                      <Badge variant="outline" className={getRoleBadgeColor(lsu.role)}>
                        {lsu.role.charAt(0).toUpperCase() + lsu.role.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleRemove(lsu)}
                    disabled={deleteAssignmentMutation.isPending}
                  >
                    <UserMinus className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-20 text-slate-500 dark:text-slate-400">
              <AlertTriangle className="h-5 w-5 mb-1" />
              <span className="text-sm">No sales team members assigned</span>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* New Assignment Form */}
        <h4 className="text-sm font-medium mb-3">Add New Assignment</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="role-select">Role</Label>
            <Select
              value={selectedRole}
              onValueChange={setSelectedRole}
            >
              <SelectTrigger id="role-select">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="user-select">Sales Team Member</Label>
            <Select
              value={selectedUser?.toString()}
              onValueChange={(value) => setSelectedUser(Number(value))}
              disabled={!selectedRole || isLoadingSalesUsers}
            >
              <SelectTrigger id="user-select">
                <SelectValue placeholder={isLoadingSalesUsers ? "Loading users..." : "Select a user"} />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((user: SalesUser) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.firstName} {user.lastName}
                  </SelectItem>
                ))}
                {selectedRole && availableUsers.length === 0 && (
                  <SelectItem value="none" disabled>
                    No available users for this role
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end">
            <Button
              onClick={handleAssign}
              disabled={!selectedRole || !selectedUser || createAssignmentMutation.isPending}
              className="w-full"
            >
              {createAssignmentMutation.isPending ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent rounded-full" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign User
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Commission Rules Information */}
        <div className="mt-6 p-3 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded-md text-sm">
          <div className="font-medium mb-1">Commission Rules:</div>
          <ul className="list-disc pl-5 space-y-1">
            <li>Direct role receives 100% of the commission</li>
            <li>Starter role receives 60% of the commission</li>
            <li>Closer role receives 40% of the commission</li>
            <li>Inbound leads receive a 25% reduction in commission</li>
          </ul>
        </div>
      </CardContent>

      {/* Confirmation Dialog */}
      <AlertDialog open={openConfirmDialog} onOpenChange={setOpenConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Sales Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {userToRemove?.user?.firstName} {userToRemove?.user?.lastName} as a{userToRemove?.role === 'closer' ? ' closer' : userToRemove?.role === 'starter' ? ' starter' : ' direct sales'} for this lead?
              This will affect commission calculations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove} className="bg-red-600 hover:bg-red-700">
              {deleteAssignmentMutation.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}