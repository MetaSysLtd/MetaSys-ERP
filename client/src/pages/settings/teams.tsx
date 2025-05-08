import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  UserPlus, 
  Users, 
  Trash2, 
  Edit, 
  Building2, 
  User, 
  UserCheck, 
  ChevronDown, 
  ChevronRight, 
  Loader2, 
  AlertCircle 
} from "lucide-react";

// Schema validation for creating or updating a team
const teamSchema = z.object({
  name: z.string().min(2, { message: "Team name must be at least 2 characters" }),
  department: z.string().min(2, { message: "Department is required" }),
  teamLeadId: z.number().optional(),
});

// Schema validation for adding a user to a team
const teamMemberSchema = z.object({
  userId: z.number(),
  teamId: z.number(),
});

// Define Team type
interface Team {
  id: number;
  name: string;
  department: string;
  teamLeadId: number | null;
  orgId: number;
  createdAt: string;
  updatedAt: string;
}

// Define TeamMember type
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

// Define User type
interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: number;
  roleName: string;
}

// Define Department type
type Department = "sales" | "dispatch" | "admin" | "finance" | "hr" | "marketing";

const departments: Department[] = ["sales", "dispatch", "admin", "finance", "hr", "marketing"];

export default function TeamManagementPage() {
  const { toast } = useToast();
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [expandedTeams, setExpandedTeams] = useState<number[]>([]);

  // Check if user has sufficient permissions (System Admin or HR Manager+)
  const canManageTeams = role && (role.level >= 5 || (role.department === 'hr' && role.level >= 3));
  
  // Form for creating/editing teams
  const teamForm = useForm<z.infer<typeof teamSchema>>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      department: "sales",
      teamLeadId: undefined,
    },
  });

  // Form for adding team members
  const memberForm = useForm<z.infer<typeof teamMemberSchema>>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      userId: 0,
      teamId: 0,
    },
  });

  // Query teams
  const { 
    data: teams = [], 
    isLoading: isLoadingTeams, 
    isError: isTeamsError,
    error: teamsError
  } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/teams", null);
      return await response.json();
    }
  });

  // Query users without a team for adding to teams
  const { 
    data: availableUsers = [], 
    isLoading: isLoadingUsers 
  } = useQuery<User[]>({
    queryKey: ['/api/users/available'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users/available", null);
      return await response.json();
    }
  });

  // Query team members
  const getTeamMembers = async (teamId: number) => {
    const response = await apiRequest("GET", `/api/teams/${teamId}/members`, null);
    return await response.json();
  };

  // Query team members for each team
  const teamMembersQueries = teams.map(team => {
    return {
      teamId: team.id,
      query: useQuery<TeamMember[]>({
        queryKey: [`/api/teams/${team.id}/members`],
        queryFn: () => getTeamMembers(team.id),
        enabled: !!team.id && expandedTeams.includes(team.id)
      })
    };
  });

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (teamData: z.infer<typeof teamSchema>) => {
      const response = await apiRequest("POST", "/api/teams", teamData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Team created",
        description: "The team has been created successfully.",
      });
      setIsTeamDialogOpen(false);
      teamForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating team",
        description: error.message || "Failed to create team. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof teamSchema> }) => {
      const response = await apiRequest("PATCH", `/api/teams/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Team updated",
        description: "The team has been updated successfully.",
      });
      setIsTeamDialogOpen(false);
      setSelectedTeam(null);
      teamForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating team",
        description: error.message || "Failed to update team. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: number) => {
      const response = await apiRequest("DELETE", `/api/teams/${teamId}`, null);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Team deleted",
        description: "The team has been deleted successfully.",
      });
      setIsConfirmDeleteOpen(false);
      setTeamToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting team",
        description: error.message || "Failed to delete team. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add team member mutation
  const addTeamMemberMutation = useMutation({
    mutationFn: async (data: z.infer<typeof teamMemberSchema>) => {
      const response = await apiRequest("POST", "/api/teams/members", data);
      return await response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Team member added",
        description: "The user has been added to the team successfully.",
      });
      setIsMemberDialogOpen(false);
      memberForm.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${variables.teamId}/members`] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/available'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error adding team member",
        description: error.message || "Failed to add team member. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Remove team member mutation
  const removeTeamMemberMutation = useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: number; userId: number }) => {
      const response = await apiRequest("DELETE", `/api/teams/${teamId}/members/${userId}`, null);
      return await response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Team member removed",
        description: "The user has been removed from the team successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${variables.teamId}/members`] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/available'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error removing team member",
        description: error.message || "Failed to remove team member. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle team creation or update
  const onSubmitTeam = (values: z.infer<typeof teamSchema>) => {
    if (selectedTeam) {
      updateTeamMutation.mutate({ id: selectedTeam.id, data: values });
    } else {
      createTeamMutation.mutate(values);
    }
  };

  // Handle team member addition
  const onSubmitMember = (values: z.infer<typeof teamMemberSchema>) => {
    addTeamMemberMutation.mutate(values);
  };

  // Set up form for editing a team
  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    teamForm.reset({
      name: team.name,
      department: team.department,
      teamLeadId: team.teamLeadId || undefined,
    });
    setIsTeamDialogOpen(true);
  };

  // Set up for adding a team member
  const handleAddMember = (teamId: number) => {
    memberForm.reset({
      teamId,
      userId: availableUsers.length > 0 ? availableUsers[0].id : 0,
    });
    setIsMemberDialogOpen(true);
  };

  // Handle team deletion confirmation
  const handleDeleteTeam = (team: Team) => {
    setTeamToDelete(team);
    setIsConfirmDeleteOpen(true);
  };

  // Confirm team deletion
  const confirmDeleteTeam = () => {
    if (teamToDelete) {
      deleteTeamMutation.mutate(teamToDelete.id);
    }
  };

  // Toggle expanded state for a team to show/hide members
  const toggleExpandTeam = (teamId: number) => {
    if (expandedTeams.includes(teamId)) {
      setExpandedTeams(expandedTeams.filter(id => id !== teamId));
    } else {
      setExpandedTeams([...expandedTeams, teamId]);
    }
  };

  // Format department name for display
  const formatDepartment = (dept: string) => {
    return dept.charAt(0).toUpperCase() + dept.slice(1);
  };

  // Get department badge color
  const getDepartmentBadgeColor = (dept: string) => {
    switch (dept) {
      case 'sales':
        return "bg-blue-100 text-blue-800 border-blue-300";
      case 'dispatch':
        return "bg-green-100 text-green-800 border-green-300";
      case 'admin':
        return "bg-purple-100 text-purple-800 border-purple-300";
      case 'finance':
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case 'hr':
        return "bg-pink-100 text-pink-800 border-pink-300";
      case 'marketing':
        return "bg-orange-100 text-orange-800 border-orange-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!isTeamDialogOpen) {
      setSelectedTeam(null);
      teamForm.reset({
        name: "",
        department: "sales",
        teamLeadId: undefined,
      });
    }
  }, [isTeamDialogOpen, teamForm]);

  // Show error message if there's an issue with fetching teams
  if (isTeamsError) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Team Management</CardTitle>
          <CardDescription>Manage your team members and their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading teams
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    {(teamsError as Error)?.message || "Unable to load teams. Please try again."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Team Management</CardTitle>
          <CardDescription>Manage your team members and their permissions</CardDescription>
        </div>
        {canManageTeams && (
          <Button 
            onClick={() => setIsTeamDialogOpen(true)} 
            disabled={createTeamMutation.isPending}
          >
            {createTeamMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Users className="mr-2 h-4 w-4" />
                Create Team
              </>
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoadingTeams ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : teams.length === 0 ? (
          <div className="bg-muted/50 rounded-md p-8 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No teams found</h3>
            <p className="text-muted-foreground mb-4">
              There are no teams in your organization yet. Create your first team to start organizing your members.
            </p>
            {canManageTeams && (
              <Button onClick={() => setIsTeamDialogOpen(true)}>
                <Users className="mr-2 h-4 w-4" />
                Create First Team
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {teams.map((team) => {
              const isExpanded = expandedTeams.includes(team.id);
              const teamMembers = teamMembersQueries.find(q => q.teamId === team.id)?.query.data || [];
              const isLoadingMembers = teamMembersQueries.find(q => q.teamId === team.id)?.query.isLoading || false;
              
              return (
                <div key={team.id} className="border rounded-md overflow-hidden">
                  <div 
                    className="flex items-center justify-between px-4 py-3 bg-muted/30 cursor-pointer"
                    onClick={() => toggleExpandTeam(team.id)}
                  >
                    <div className="flex items-center space-x-3">
                      {isExpanded ? 
                        <ChevronDown className="h-5 w-5 text-muted-foreground" /> : 
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      }
                      <div>
                        <h3 className="font-medium flex items-center">
                          <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                          {team.name}
                        </h3>
                        <div className="flex items-center mt-1 space-x-2">
                          <Badge variant="outline" className={getDepartmentBadgeColor(team.department)}>
                            {formatDepartment(team.department)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {teamMembers.length > 0 ? `${teamMembers.length} members` : "No members"}
                          </span>
                        </div>
                      </div>
                    </div>
                    {canManageTeams && (
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTeam(team);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTeam(team);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {isExpanded && (
                    <div className="p-4 border-t">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Team Members</h4>
                        {canManageTeams && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddMember(team.id)}
                            disabled={availableUsers.length === 0}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Member
                          </Button>
                        )}
                      </div>
                      
                      {isLoadingMembers ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : teamMembers.length === 0 ? (
                        <div className="text-center py-6 bg-muted/20 rounded-md">
                          <User className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">No team members yet</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Status</TableHead>
                              {canManageTeams && <TableHead>Actions</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {teamMembers.map((member) => (
                              <TableRow key={member.userId}>
                                <TableCell className="font-medium">
                                  {member.firstName} {member.lastName}
                                  {team.teamLeadId === member.userId && (
                                    <Badge className="ml-2 bg-amber-100 text-amber-800 border-amber-300">
                                      Team Lead
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>{member.email}</TableCell>
                                <TableCell>{member.role?.name || "N/A"}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                                    Active
                                  </Badge>
                                </TableCell>
                                {canManageTeams && (
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeTeamMemberMutation.mutate({ teamId: team.id, userId: member.userId })}
                                      disabled={removeTeamMemberMutation.isPending}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                      <span className="sr-only">Remove</span>
                                    </Button>
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Create/Edit Team Dialog */}
        <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {selectedTeam ? "Edit Team" : "Create Team"}
              </DialogTitle>
              <DialogDescription>
                {selectedTeam
                  ? "Edit team details and define its department."
                  : "Create a new team and define its department."}
              </DialogDescription>
            </DialogHeader>
            <Form {...teamForm}>
              <form onSubmit={teamForm.handleSubmit(onSubmitTeam)} className="space-y-4 pt-4">
                <FormField
                  control={teamForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter team name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={teamForm.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {formatDepartment(dept)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the department this team belongs to
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <Button 
                    type="submit" 
                    disabled={
                      createTeamMutation.isPending || 
                      updateTeamMutation.isPending
                    }
                  >
                    {(createTeamMutation.isPending || updateTeamMutation.isPending) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {selectedTeam ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      selectedTeam ? "Update Team" : "Create Team"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Add Team Member Dialog */}
        <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>
                Add a user to this team.
              </DialogDescription>
            </DialogHeader>
            <Form {...memberForm}>
              <form onSubmit={memberForm.handleSubmit(onSubmitMember)} className="space-y-4 pt-4">
                <FormField
                  control={memberForm.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User</FormLabel>
                      <Select 
                        value={field.value.toString()} 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a user" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.firstName} {user.lastName} ({user.username})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {availableUsers.length === 0 && (
                        <FormDescription className="text-yellow-600">
                          No available users. All users are already assigned to teams.
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <Button 
                    type="submit" 
                    disabled={
                      addTeamMemberMutation.isPending || 
                      availableUsers.length === 0
                    }
                  >
                    {addTeamMemberMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add to Team"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Delete Team Confirmation Dialog */}
        <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Team</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the team "{teamToDelete?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="space-x-4 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsConfirmDeleteOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDeleteTeam}
                disabled={deleteTeamMutation.isPending}
              >
                {deleteTeamMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Team"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}