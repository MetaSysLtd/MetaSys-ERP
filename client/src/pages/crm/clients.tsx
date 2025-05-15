import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MotionWrapper } from "@/components/ui/motion-wrapper";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Search, 
  BarChart, 
  MapPin,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  Truck,
  FileText,
  Loader2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function ClientsPage() {
  const { toast } = useToast();
  const { user, role } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  
  // Get clients from the API - in reality this would be a separate endpoint
  // but for now we can use the leads endpoint and filter active leads
  const { data: allLeads = [], isLoading, error, isError } = useQuery<any[]>({
    queryKey: ["/api/leads"],
  });
  
  // Filter to only active leads (considered as clients)
  const clients = Array.isArray(allLeads) 
    ? allLeads.filter((lead: any) => lead.status === "Active") 
    : [];
  
  // Filter clients based on search query
  const filteredClients = searchQuery ? 
    clients.filter((client: any) => 
      (client.companyName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.contactName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.mcNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.dotNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
    ) : 
    clients;

  // Determine user permissions
  const canCreateClient = 
    role?.department === "admin" || 
    role?.department === "sales" ||
    (role?.permissions && typeof role.permissions === 'object' && 
     'canCreateLeads' in role.permissions && role.permissions.canCreateLeads);

  // Render loading skeleton
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-12 w-full mb-6" />
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    );
  }

  // Render error state with a clean fallback view
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
              {error instanceof Error ? error.message : "Failed to load client data"}
            </p>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/leads"] })}
            >
              Retry
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // If no clients are found, show empty state
  if (clients.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              CRM Clients
            </h1>
            {canCreateClient === true && (
              <Button onClick={() => setLocation("/crm/leads")}>
                <Plus className="h-4 w-4 mr-1" />
                Add New Lead
              </Button>
            )}
          </div>
        </div>
        
        <Card className="border-blue-200 bg-blue-50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-blue-700">No Active Clients Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-600">
              You don't have any active clients yet. Convert leads to clients by changing their status to "Active".
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setLocation("/crm/leads")}>
              Go to Leads
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      {/* Page header */}
      <MotionWrapper animation="fade-down" delay={0.1}>
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <MotionWrapper animation="fade-right" delay={0.2}>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2 sm:mb-0">
                CRM Clients
              </h1>
            </MotionWrapper>
            <MotionWrapper animation="fade-left" delay={0.3}>
              <div className="flex flex-wrap space-x-2">
                {/* "Add New Lead" button removed per requirements - leads should only be added via CRM > Leads */}
              </div>
            </MotionWrapper>
          </div>
        </div>
      </MotionWrapper>
      
      {/* Search bar */}
      <MotionWrapper animation="fade-up" delay={0.4}>
        <Card className="shadow mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search clients by name, MC number, DOT number..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </MotionWrapper>
      
      {/* Clients list */}
      <MotionWrapper animation="fade-up" delay={0.5}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredClients.map((client: any) => (
            <Card key={client.id} className="shadow hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <div className="flex items-start">
                    <Avatar className="h-12 w-12 mr-3">
                      <AvatarFallback className="bg-[#025E73] text-white">
                        {client.companyName ? client.companyName.substring(0, 2).toUpperCase() : 'CL'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl">{client.companyName || 'Unnamed Client'}</CardTitle>
                      <p className="text-gray-500 text-sm flex items-center mt-1">
                        <Truck className="h-3.5 w-3.5 mr-1 opacity-70" />
                        MC: {client.mcNumber || 'N/A'} {client.dotNumber && `• DOT: ${client.dotNumber}`}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Active Client
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm flex items-center text-gray-700">
                      <Phone className="h-3.5 w-3.5 mr-2 text-gray-500" />
                      {client.phoneNumber || 'No phone provided'}
                    </p>
                    {client.email && (
                      <p className="text-sm flex items-center text-gray-700 mt-1">
                        <Mail className="h-3.5 w-3.5 mr-2 text-gray-500" />
                        {client.email}
                      </p>
                    )}
                    <p className="text-sm flex items-center text-gray-700 mt-1">
                      <Calendar className="h-3.5 w-3.5 mr-2 text-gray-500" />
                      Client since {formatDate(client.firstContactAt || client.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm flex items-center text-gray-700">
                      <span className="font-medium mr-2">Equipment:</span> 
                      {client.equipmentType || 'Not specified'}
                    </p>
                    <p className="text-sm flex items-center text-gray-700 mt-1">
                      <span className="font-medium mr-2">Service Charge:</span>
                      {formatCurrency(client.serviceCharges || 0)}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4 space-x-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="text-[#025E73] border-[#025E73]/20 hover:bg-[#025E73]/10"
                    onClick={() => setLocation(`/crm/${client.id}`)}
                  >
                    View Details
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="text-[#025E73] border-[#025E73]/20 hover:bg-[#025E73]/10"
                    onClick={() => setLocation(`/dispatch/loads/new?leadId=${client.id}`)}
                  >
                    <Truck className="h-3.5 w-3.5 mr-1" />
                    Create Load
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </MotionWrapper>
      
      {/* Show "no results" if search has no matches */}
      {filteredClients.length === 0 && searchQuery && (
        <Card className="mt-6 border-amber-200 bg-amber-50 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center p-4">
              <AlertCircle className="h-8 w-8 text-amber-500 mb-2" />
              <h3 className="text-lg font-medium text-amber-800">No clients found</h3>
              <p className="text-amber-600 text-center mt-1">
                No clients match your search term "{searchQuery}". Try a different search.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}