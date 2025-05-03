import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { format } from "date-fns";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Truck,
  Plus,
  MapPin,
  Calendar,
  DollarSign,
  FileEdit,
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
  Clock,
  TruckIcon,
  User,
  FileSpreadsheet,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

// Client statuses with their labels and colors
const CLIENT_STATUSES = {
  active: {
    label: "Active",
    color: "bg-green-100 text-green-800 hover:bg-green-200",
  },
  pending_onboard: {
    label: "Pending Onboard",
    color: "bg-amber-100 text-amber-800 hover:bg-amber-200",
  },
  lost: {
    label: "Lost",
    color: "bg-red-100 text-red-800 hover:bg-red-200",
  },
};

// Function to get client status icon
function getStatusIcon(status: string) {
  switch (status) {
    case "active":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "pending_onboard":
      return <Clock className="h-4 w-4 text-amber-600" />;
    case "lost":
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
}

export default function DispatchClientsPage() {
  const { toast } = useToast();
  const { user, role } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  
  // Load dispatch clients from API
  const {
    data: clients,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["/api/dispatch/clients"],
  });
  
  // Status change mutation
  const updateClientStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/dispatch/clients/${id}`, {
        status,
      });
    },
    onSuccess: () => {
      toast({
        title: "Client updated",
        description: "Client status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dispatch/clients"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update client status.",
        variant: "destructive",
      });
    },
  });
  
  // Approve client mutation (transition from pending to active)
  const approveClientMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PATCH", `/api/dispatch/clients/${id}/approve`, {
        approvedBy: user?.id,
        onboardingDate: new Date().toISOString().split("T")[0],
        status: "active",
      });
    },
    onSuccess: () => {
      toast({
        title: "Client approved",
        description: "Client has been approved and is now active.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dispatch/clients"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve client.",
        variant: "destructive",
      });
    },
  });
  
  // Group clients by status
  const clientsByStatus = {
    all: clients || [],
    active: (clients || []).filter((client: any) => client.status === "active"),
    pending_onboard: (clients || []).filter(
      (client: any) => client.status === "pending_onboard"
    ),
    lost: (clients || []).filter((client: any) => client.status === "lost"),
  };
  
  // Handle client status update
  const handleStatusChange = (id: number, newStatus: string) => {
    updateClientStatusMutation.mutate({ id, status: newStatus });
  };
  
  // Handle client approval
  const handleApproveClient = (id: number) => {
    approveClientMutation.mutate(id);
  };
  
  // Handle new load creation for a client
  const handleCreateLoad = (clientId: number) => {
    setLocation(`/dispatch/loads/new?clientId=${clientId}`);
  };
  
  // Redirect if user doesn't have permission
  useEffect(() => {
    if (role && role.department !== "dispatch" && role.department !== "admin") {
      toast({
        title: "Access denied",
        description: "You don't have permission to view dispatch clients.",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [role, toast, setLocation]);
  
  // Render loading skeleton
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-12 w-full mb-6" />
        <div className="space-y-4">
          {Array(5)
            .fill(0)
            .map((_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-md" />
            ))}
        </div>
      </div>
    );
  }
  
  // Render error state
  if (isError) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <AlertCircle className="mr-2 h-5 w-5" />
              Error Loading Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              {error instanceof Error ? error.message : "Failed to load clients"}
            </p>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: ["/api/dispatch/clients"],
                })
              }
            >
              Retry
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <Users className="h-6 w-6 text-[#457B9D]" />
          Dispatch Clients
        </h1>
        <Button
          onClick={() => setLocation("/crm?createClient=true")}
          className="bg-[#457B9D] hover:bg-[#2EC4B6] text-white rounded-md transition-colors duration-200"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add New Client
        </Button>
      </div>
      
      <div className="stats-row grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-green-700 flex items-center">
              <CheckCircle className="mr-2 h-4 w-4" />
              Active Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">
              {clientsByStatus.active.length}
            </div>
            <p className="text-sm text-green-600 mt-1">Ready for load assignments</p>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-amber-700 flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Pending Onboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-800">
              {clientsByStatus.pending_onboard.length}
            </div>
            <p className="text-sm text-amber-600 mt-1">Awaiting document verification</p>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-blue-700 flex items-center">
              <TruckIcon className="mr-2 h-4 w-4" />
              Total Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">
              {clientsByStatus.all.length}
            </div>
            <p className="text-sm text-blue-600 mt-1">
              Across all statuses
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all" className="flex-1">
            All Clients ({clientsByStatus.all.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="flex-1">
            Active ({clientsByStatus.active.length})
          </TabsTrigger>
          <TabsTrigger value="pending_onboard" className="flex-1">
            Pending Onboard ({clientsByStatus.pending_onboard.length})
          </TabsTrigger>
          <TabsTrigger value="lost" className="flex-1">
            Lost ({clientsByStatus.lost.length})
          </TabsTrigger>
        </TabsList>
        
        {Object.entries(clientsByStatus).map(([status, clients]) => (
          <TabsContent key={status} value={status}>
            <Card>
              <CardHeader>
                <CardTitle>
                  {status === "all"
                    ? "All Dispatch Clients"
                    : status === "active"
                    ? "Active Clients"
                    : status === "pending_onboard"
                    ? "Pending Onboard Clients"
                    : "Lost Clients"}
                </CardTitle>
                <CardDescription>
                  {status === "all"
                    ? "Complete list of all dispatch clients in the system"
                    : status === "active"
                    ? "Clients with approved paperwork ready for load assignments"
                    : status === "pending_onboard"
                    ? "Clients in the onboarding process awaiting approval"
                    : "Former clients no longer working with the company"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clients.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <Users className="h-6 w-6 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      No clients found
                    </h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                      {status === "all"
                        ? "There are no dispatch clients in the system. Add your first client to get started."
                        : status === "active"
                        ? "There are no active clients. Approve pending clients to move them to active status."
                        : status === "pending_onboard"
                        ? "There are no clients pending onboarding."
                        : "There are no lost clients."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[300px]">Name</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Onboarded Date</TableHead>
                          <TableHead>Last Load</TableHead>
                          <TableHead>Value Booked</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clients.map((client: any) => (
                          <TableRow key={client.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 bg-[#025E73]/10">
                                  <AvatarFallback className="text-[#025E73]">
                                    {client.lead?.companyName
                                      ? client.lead.companyName
                                          .substring(0, 2)
                                          .toUpperCase()
                                      : "CL"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">
                                    {client.lead?.companyName || "Unknown Company"}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {client.lead?.contactName || "No contact"}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                <span>{client.location || client.lead?.location || "Unknown"}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {client.onboardingDate ? (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                  <span>{format(new Date(client.onboardingDate), "MMM d, yyyy")}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400 italic">Not onboarded</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {client.lastLoadDate ? (
                                format(new Date(client.lastLoadDate), "MMM d, yyyy")
                              ) : (
                                <span className="text-gray-400 italic">No loads yet</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-emerald-600 font-medium">
                                <DollarSign className="h-3.5 w-3.5" />
                                <span>${client.valueBooked?.toLocaleString() || "0"}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {client.status === "active" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCreateLoad(client.leadId)}
                                    className="flex items-center gap-1"
                                  >
                                    <Truck className="h-3.5 w-3.5" />
                                    <span>New Load</span>
                                  </Button>
                                )}
                                
                                {client.status === "pending_onboard" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleApproveClient(client.id)}
                                    className="flex items-center gap-1 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800"
                                  >
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    <span>Approve</span>
                                  </Button>
                                )}
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => setLocation(`/crm/${client.leadId}`)}
                                    >
                                      <User className="h-4 w-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    
                                    {client.status !== "active" && (
                                      <DropdownMenuItem
                                        onClick={() => handleStatusChange(client.id, "active")}
                                      >
                                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                        Mark as Active
                                      </DropdownMenuItem>
                                    )}
                                    
                                    {client.status !== "pending_onboard" && (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleStatusChange(client.id, "pending_onboard")
                                        }
                                      >
                                        <Clock className="h-4 w-4 mr-2 text-amber-600" />
                                        Mark as Pending
                                      </DropdownMenuItem>
                                    )}
                                    
                                    {client.status !== "lost" && (
                                      <DropdownMenuItem
                                        onClick={() => handleStatusChange(client.id, "lost")}
                                        className="text-red-600"
                                      >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Mark as Lost
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}