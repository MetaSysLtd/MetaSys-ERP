import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Pencil, Trash2, PlusCircle, UserPlus, Users, X, ChevronDown, ChevronRight, Layers } from "lucide-react";
import { toast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Define types
interface Team {
  id: number;
  name: string;
  department: string;
  teamLeadId: number | null;
  orgId: number;
  createdAt: string;
  updatedAt: string;
}

interface TeamMember {
  id: number;
  userId: number;
  teamId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: {
    id: number;
    name: string;
    level: number;
  };
}

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: number;
  roleName: string;
}

type Department = "sales" | "dispatch" | "admin" | "finance" | "hr" | "marketing";

// Form schemas
const teamFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  department: z.string().min(2, "Please select a department"),
  teamLeadId: z.number().optional().nullable(),
});

const teamMemberFormSchema = z.object({
  userId: z.number({
    required_error: "Please select a user to add to the team",
  }),
});

// Team list component
const TeamList = ({ onEditTeam, onViewTeam, onDeleteTeam }) => {
  const { data: teams, isLoading, error } = useQuery({
    queryKey: ["/api/teams"],
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load teams. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableCaption>A list of teams in your organization</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Team Name</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Members</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams && teams.length > 0 ? (
            teams.map((team) => (
              <TableRow key={team.id}>
                <TableCell className="font-medium">{team.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{team.department}</Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewTeam(team)}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    View Members
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditTeam(team)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteTeam(team)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
                No teams found. Create a new team to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

// Team form component
const TeamForm = ({ team, onSubmit, onCancel }) => {
  const form = useForm({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: team?.name || "",
      department: team?.department || "",
      teamLeadId: team?.teamLeadId || null,
    },
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
  });

  const departments: Department[] = [
    "sales",
    "dispatch",
    "admin",
    "finance",
    "hr",
    "marketing",
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter team name" {...field} />
              </FormControl>
              <FormDescription>
                The display name for this team.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept.charAt(0).toUpperCase() + dept.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The department this team belongs to.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="teamLeadId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Lead (Optional)</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number(value) || null)}
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team lead" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">No team lead</SelectItem>
                  {!isLoadingUsers &&
                    users?.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.firstName} {user.lastName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The leader of this team (can be assigned later).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {team ? "Update Team" : "Create Team"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

// Team members management component
const TeamMembers = ({ team, onClose }) => {
  const [showAddMember, setShowAddMember] = useState(false);

  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: [`/api/teams/${team.id}/members`],
    enabled: !!team.id,
  });

  const { data: availableUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/teams/available-users"],
    enabled: showAddMember,
  });

  const form = useForm({
    resolver: zodResolver(teamMemberFormSchema),
    defaultValues: {
      userId: undefined,
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async (data) => {
      const res = await apiRequest(
        "POST",
        `/api/teams/${team.id}/members`,
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Member added to team successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${team.id}/members`] });
      form.reset();
      setShowAddMember(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add member: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest(
        "DELETE",
        `/api/teams/${team.id}/members/${userId}`
      );
      return res.ok;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Member removed from team successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${team.id}/members`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to remove member: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleAddMember = (data) => {
    addMemberMutation.mutate(data);
  };

  const handleRemoveMember = (userId: number) => {
    if (confirm("Are you sure you want to remove this member from the team?")) {
      removeMemberMutation.mutate(userId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Team Members</h3>
          <p className="text-sm text-muted-foreground">
            Manage members of {team.name}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddMember(!showAddMember)}
          >
            {showAddMember ? (
              <>
                <X className="h-4 w-4 mr-2" /> Cancel
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" /> Add Member
              </>
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>

      {showAddMember && (
        <Card>
          <CardHeader>
            <CardTitle>Add Team Member</CardTitle>
            <CardDescription>
              Select a user to add to this team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleAddMember)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingUsers ? (
                            <SelectItem value="" disabled>
                              Loading users...
                            </SelectItem>
                          ) : availableUsers?.length ? (
                            availableUsers.map((user) => (
                              <SelectItem
                                key={user.id}
                                value={user.id.toString()}
                              >
                                {user.firstName} {user.lastName} ({user.email})
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="" disabled>
                              No available users
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Only users not already in a team are shown
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={addMemberMutation.isPending || isLoadingUsers}
                >
                  {addMemberMutation.isPending ? "Adding..." : "Add to Team"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <div className="rounded-md border">
        <Table>
          <TableCaption>Current members of {team.name}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingMembers ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  <div className="flex justify-center">
                    <Skeleton className="h-6 w-32" />
                  </div>
                </TableCell>
              </TableRow>
            ) : members && members.length > 0 ? (
              members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.firstName} {member.lastName}
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{member.role.name}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMember(member.userId)}
                      disabled={removeMemberMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No members in this team yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

// Team Hierarchy Visualization component
const TeamHierarchy = () => {
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>([]);
  const { data: teams, isLoading } = useQuery({
    queryKey: ["/api/teams"],
  });

  // For a real application, this endpoint would get all team members
  // For now, we'll use the existing endpoints to get members for each team
  const { data: allUsers } = useQuery({
    queryKey: ["/api/users"],
  });
  
  // Group teams by department
  const teamsByDepartment = React.useMemo(() => {
    if (!teams) return {};
    
    return teams.reduce((acc, team) => {
      const dept = team.department;
      if (!acc[dept]) {
        acc[dept] = [];
      }
      acc[dept].push(team);
      return acc;
    }, {});
  }, [teams]);

  // Toggle department expansion
  const toggleDepartment = (department: string) => {
    setExpandedDepartments(prev => 
      prev.includes(department) 
        ? prev.filter(d => d !== department)
        : [...prev, department]
    );
  };

  // Get department color class
  const getDepartmentColorClass = (department: string) => {
    switch (department) {
      case 'sales': return 'text-blue-600 border-blue-200 bg-blue-50';
      case 'dispatch': return 'text-green-600 border-green-200 bg-green-50';
      case 'admin': return 'text-purple-600 border-purple-200 bg-purple-50';
      case 'finance': return 'text-yellow-600 border-yellow-200 bg-yellow-50';
      case 'hr': return 'text-pink-600 border-pink-200 bg-pink-50';
      case 'marketing': return 'text-orange-600 border-orange-200 bg-orange-50';
      default: return 'text-gray-600 border-gray-200 bg-gray-50';
    }
  };

  // In a real application, we would use team members data directly
  // For this implementation, we'll use the team lead ID to identify the lead
  const getTeamLead = (teamLeadId: number | null) => {
    if (!teamLeadId || !allUsers) return null;
    return allUsers.find(user => user.id === teamLeadId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organization Hierarchy</CardTitle>
          <CardDescription>Loading organization structure...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organization Hierarchy</CardTitle>
          <CardDescription>View your organization's team structure</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No teams found</AlertTitle>
            <AlertDescription>
              Create teams to visualize your organization hierarchy.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Layers className="mr-2 h-5 w-5" />
          Organization Hierarchy
        </CardTitle>
        <CardDescription>
          Visualize your organization's team structure and reporting lines
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(teamsByDepartment).map(([department, departmentTeams]) => (
            <div key={department} className="border rounded-md overflow-hidden">
              <div 
                className={`flex items-center justify-between p-3 cursor-pointer ${getDepartmentColorClass(department)}`}
                onClick={() => toggleDepartment(department)}
              >
                <div className="font-medium capitalize">{department} Department</div>
                <div>
                  {expandedDepartments.includes(department) ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </div>
              </div>
              
              {expandedDepartments.includes(department) && (
                <div className="p-3 space-y-3 bg-white">
                  {departmentTeams.map((team: Team) => {
                    const teamLead = getTeamLead(team.teamLeadId);
                    
                    return (
                      <div key={team.id} className="ml-4 border-l-2 pl-4 py-1">
                        <div className="font-medium">{team.name}</div>
                        
                        {teamLead && (
                          <div className="ml-4 mt-1 flex items-center">
                            <Badge variant="outline" className="mr-2">Team Lead</Badge>
                            <span>{teamLead.firstName} {teamLead.lastName}</span>
                          </div>
                        )}
                        
                        {!teamLead && (
                          <div className="ml-4 mt-1 text-gray-400 italic">
                            No team lead assigned
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Main team management page
export default function TeamManagementPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewMembersDialogOpen, setIsViewMembersDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Query for teams data
  const { data: teams, isLoading, error } = useQuery({
    queryKey: ["/api/teams"],
  });

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", "/api/teams", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Team created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create team: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: async (data) => {
      const res = await apiRequest(
        "PUT",
        `/api/teams/${selectedTeam.id}`,
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Team updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setIsEditDialogOpen(false);
      setSelectedTeam(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update team: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/teams/${selectedTeam.id}`);
      return res.ok;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Team deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setIsDeleteDialogOpen(false);
      setSelectedTeam(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete team: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleCreateTeam = (data) => {
    createTeamMutation.mutate(data);
  };

  const handleUpdateTeam = (data) => {
    updateTeamMutation.mutate(data);
  };

  const handleDeleteConfirm = () => {
    deleteTeamMutation.mutate();
  };

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setIsEditDialogOpen(true);
  };

  const handleDeleteTeam = (team: Team) => {
    setSelectedTeam(team);
    setIsDeleteDialogOpen(true);
  };

  const handleViewTeamMembers = (team: Team) => {
    setSelectedTeam(team);
    setIsViewMembersDialogOpen(true);
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground">
            Manage teams and their members in your organization
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[475px]">
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>
                Set up a new team in your organization. Add team details below.
              </DialogDescription>
            </DialogHeader>
            <TeamForm
              team={null}
              onSubmit={handleCreateTeam}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        <TeamList
          onEditTeam={handleEditTeam}
          onViewTeam={handleViewTeamMembers}
          onDeleteTeam={handleDeleteTeam}
        />
        
        <Card>
          <CardHeader>
            <CardTitle>Team Hierarchy</CardTitle>
            <CardDescription>
              Organizational structure visualization showing team members and their roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TeamHierarchy />
          </CardContent>
        </Card>
      </div>

      {/* Edit Team Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[475px]">
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Update the details for {selectedTeam?.name}.
            </DialogDescription>
          </DialogHeader>
          {selectedTeam && (
            <TeamForm
              team={selectedTeam}
              onSubmit={handleUpdateTeam}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Team Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the team "{selectedTeam?.name}"?
              This action cannot be undone, and all team members will be removed
              from the team.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteTeamMutation.isPending}
            >
              {deleteTeamMutation.isPending ? "Deleting..." : "Delete Team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Team Members Dialog */}
      <Dialog
        open={isViewMembersDialogOpen}
        onOpenChange={setIsViewMembersDialogOpen}
      >
        <DialogContent className="sm:max-w-[850px]">
          {selectedTeam && (
            <TeamMembers
              team={selectedTeam}
              onClose={() => setIsViewMembersDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}