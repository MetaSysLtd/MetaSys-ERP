import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import { useLocation } from "wouter";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, Plus, Search, Users } from "lucide-react";

export default function DispatchClientsPage() {
  const { toast } = useToast();
  const { user, role } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending-onboard");
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  
  // Get dispatch clients from the API
  const { data: clients, isLoading, error } = useQuery({
    queryKey: ["/api/dispatch/clients"],
  });
  
  // Update filtered clients based on search and tab
  useEffect(() => {
    if (!clients) return;
    
    let filtered = [...clients];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((client) => {
        const companyName = client.companyName || client.lead?.companyName || "";
        const notes = client.notes || "";
        return (
          companyName.toLowerCase().includes(query) ||
          notes.toLowerCase().includes(query)
        );
      });
    }
    
    setFilteredClients(filtered);
  }, [clients, searchQuery]);
  
  // Show error toast if clients fetch fails
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load client data. Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending_onboard":
      case "pending onboard":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 px-2">
            Pending Onboard
          </Badge>
        );
      case "active":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-2">
            Active
          </Badge>
        );
      case "lost":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 px-2">
            Lost
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 px-2">
            Inactive
          </Badge>
        );
      case "suspended":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 px-2">
            Suspended
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 px-2">
            {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
          </Badge>
        );
    }
  };
  
  // Check if user can manage clients
  const canManageClients = role && (role.department === "dispatch" || role.department === "admin");
  
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Loading client data...</h3>
          <p className="mt-1 text-sm text-gray-500">Please wait while we fetch your data.</p>
        </div>
      </div>
    );
  }
  
  // Filter clients based on active tab
  const pendingClients = filteredClients.filter(client => 
    client.status.toLowerCase() === "pending_onboard" || client.status.toLowerCase() === "pending onboard"
  );
  const activeClients = filteredClients.filter(client => 
    client.status.toLowerCase() === "active"
  );
  const lostClients = filteredClients.filter(client => 
    client.status.toLowerCase() === "lost" || 
    client.status.toLowerCase() === "inactive" || 
    client.status.toLowerCase() === "suspended"
  );
  
  return (
    <div>
      {/* Page header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2 sm:mb-0">
              Dispatch Clients
            </h1>
            <div className="flex flex-wrap items-center space-x-2">
              <form onSubmit={(e) => e.preventDefault()} className="relative mr-2">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  placeholder="Search clients..."
                  className="pl-10 h-9 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
              {canManageClients && (
                <Button
                  size="sm"
                  className="h-9 bg-[#457B9D] hover:bg-[#2EC4B6] text-white rounded-md transition-colors duration-200"
                  onClick={() => setLocation("/crm?status=active")}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  View Active Leads
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Page content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending-onboard">
              Pending Onboard
              <Badge variant="secondary" className="ml-2">
                {pendingClients.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="active">
              Active
              <Badge variant="secondary" className="ml-2">
                {activeClients.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="lost">
              Lost
              <Badge variant="secondary" className="ml-2">
                {lostClients.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending-onboard">
            <Card className="shadow overflow-hidden">
              <CardHeader className="px-5 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg leading-6 font-medium text-gray-900">
                    Pending Onboard Clients
                  </CardTitle>
                  <span className="text-sm text-gray-500">
                    Showing {pendingClients.length} clients
                  </span>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact Info</TableHead>
                      <TableHead>MC Number</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <Users className="h-12 w-12 mb-2" />
                            <h3 className="text-lg font-medium">No pending clients found</h3>
                            <p className="text-sm max-w-md mt-1">
                              There are no clients pending onboarding at this time.
                            </p>
                            {canManageClients && (
                              <Button
                                className="mt-4 bg-[#457B9D] hover:bg-[#2EC4B6] text-white rounded-md transition-colors duration-200"
                                onClick={() => setLocation("/crm?status=active")}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                View Active Leads
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingClients.map((client) => {
                        const lead = client.lead || {};
                        const companyName = client.companyName || lead.companyName || "Unknown";
                        const email = lead.email || "No email";
                        const phoneNumber = lead.phoneNumber || "No phone";
                        const mcNumber = lead.mcNumber || "N/A";
                        const contactName = lead.contactName || "N/A";
                        
                        return (
                          <TableRow key={client.id}>
                            <TableCell className="font-medium">
                              {companyName}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-500">{contactName}</div>
                              <div className="text-sm text-gray-500">{email}</div>
                              <div className="text-sm text-gray-500">{phoneNumber}</div>
                            </TableCell>
                            <TableCell>{mcNumber}</TableCell>
                            <TableCell>{formatDate(client.createdAt)}</TableCell>
                            <TableCell>{getStatusBadge(client.status)}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="link"
                                  className="text-primary-600 hover:text-primary-900 p-0 h-auto"
                                  onClick={() => setLocation(`/dispatch/clients/${client.id}`)}
                                >
                                  View
                                </Button>
                                <Button
                                  variant="link"
                                  className="text-green-600 hover:text-green-900 p-0 h-auto"
                                  onClick={() => {
                                    // Activate client
                                    // Will implement in the next step
                                    toast({
                                      title: "Activate client",
                                      description: "Client activation feature is coming soon.",
                                    });
                                  }}
                                >
                                  Activate
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="active">
            <Card className="shadow overflow-hidden">
              <CardHeader className="px-5 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg leading-6 font-medium text-gray-900">
                    Active Clients
                  </CardTitle>
                  <span className="text-sm text-gray-500">
                    Showing {activeClients.length} clients
                  </span>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact Info</TableHead>
                      <TableHead>MC Number</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <Users className="h-12 w-12 mb-2" />
                            <h3 className="text-lg font-medium">No active clients found</h3>
                            <p className="text-sm max-w-md mt-1">
                              There are no active clients at this time.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      activeClients.map((client) => {
                        const lead = client.lead || {};
                        const companyName = client.companyName || lead.companyName || "Unknown";
                        const email = lead.email || "No email";
                        const phoneNumber = lead.phoneNumber || "No phone";
                        const mcNumber = lead.mcNumber || "N/A";
                        const contactName = lead.contactName || "N/A";
                        
                        return (
                          <TableRow key={client.id}>
                            <TableCell className="font-medium">
                              {companyName}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-500">{contactName}</div>
                              <div className="text-sm text-gray-500">{email}</div>
                              <div className="text-sm text-gray-500">{phoneNumber}</div>
                            </TableCell>
                            <TableCell>{mcNumber}</TableCell>
                            <TableCell>{formatDate(client.createdAt)}</TableCell>
                            <TableCell>{getStatusBadge(client.status)}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="link"
                                  className="text-primary-600 hover:text-primary-900 p-0 h-auto"
                                  onClick={() => setLocation(`/dispatch/clients/${client.id}`)}
                                >
                                  View
                                </Button>
                                <Button
                                  variant="link"
                                  className="text-blue-600 hover:text-blue-900 p-0 h-auto"
                                  onClick={() => {
                                    // Create load
                                    setLocation(`/dispatch/loads/new?clientId=${client.id}`);
                                  }}
                                >
                                  Add Load
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="lost">
            <Card className="shadow overflow-hidden">
              <CardHeader className="px-5 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg leading-6 font-medium text-gray-900">
                    Lost Clients
                  </CardTitle>
                  <span className="text-sm text-gray-500">
                    Showing {lostClients.length} clients
                  </span>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact Info</TableHead>
                      <TableHead>MC Number</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lostClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <Users className="h-12 w-12 mb-2" />
                            <h3 className="text-lg font-medium">No lost clients found</h3>
                            <p className="text-sm max-w-md mt-1">
                              There are no lost clients at this time.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      lostClients.map((client) => {
                        const lead = client.lead || {};
                        const companyName = client.companyName || lead.companyName || "Unknown";
                        const email = lead.email || "No email";
                        const phoneNumber = lead.phoneNumber || "No phone";
                        const mcNumber = lead.mcNumber || "N/A";
                        const contactName = lead.contactName || "N/A";
                        
                        return (
                          <TableRow key={client.id}>
                            <TableCell className="font-medium">
                              {companyName}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-500">{contactName}</div>
                              <div className="text-sm text-gray-500">{email}</div>
                              <div className="text-sm text-gray-500">{phoneNumber}</div>
                            </TableCell>
                            <TableCell>{mcNumber}</TableCell>
                            <TableCell>{formatDate(client.createdAt)}</TableCell>
                            <TableCell>{getStatusBadge(client.status)}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="link"
                                  className="text-primary-600 hover:text-primary-900 p-0 h-auto"
                                  onClick={() => setLocation(`/dispatch/clients/${client.id}`)}
                                >
                                  View
                                </Button>
                                <Button
                                  variant="link"
                                  className="text-green-600 hover:text-green-900 p-0 h-auto"
                                  onClick={() => {
                                    // Reactivate client
                                    // Will implement in the next step
                                    toast({
                                      title: "Reactivate client",
                                      description: "Client reactivation feature is coming soon.",
                                    });
                                  }}
                                >
                                  Reactivate
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}