import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MotionWrapper } from "@/components/ui/motion-wrapper";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Filter, 
  Users, 
  LayoutGrid, 
  List, 
  Loader2,
  AlertCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import NewLeadModal from "@/components/crm/NewLeadModal";
import { formatDate } from "@/lib/utils";
import { KanbanView } from "@/components/crm/KanbanView";

export default function LeadsPage() {
  const { toast } = useToast();
  const { user, role } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const queryClient = useQueryClient();
  const searchParams = new URLSearchParams(search);
  
  const [newLeadModalOpen, setNewLeadModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredLeads, setFilteredLeads] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  
  // Get leads from the API
  const { data: leads, isLoading, error, isError } = useQuery({
    queryKey: ["/api/leads"],
  });
  
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load leads data. Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  // Filter leads based on status and search query
  useEffect(() => {
    if (!leads) return;
    
    // Make sure leads is treated as an array
    let filtered = Array.isArray(leads) ? [...leads] : [];
    
    // Filter by status
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((lead) => lead.status === statusFilter);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          (lead.companyName ? lead.companyName.toLowerCase().includes(query) : false) ||
          (lead.contactName ? lead.contactName.toLowerCase().includes(query) : false) ||
          (lead.phoneNumber ? lead.phoneNumber.includes(query) : false) ||
          (lead.email ? lead.email.toLowerCase().includes(query) : false) ||
          (lead.mcNumber ? lead.mcNumber.toLowerCase().includes(query) : false) ||
          (lead.dotNumber ? lead.dotNumber.toLowerCase().includes(query) : false)
      );
    }
    
    setFilteredLeads(filtered);
  }, [leads, statusFilter, searchQuery]);
  
  // Determine user permissions
  const canCreateLead = 
    role?.department === "admin" || 
    role?.department === "sales" ||
    (role?.permissions && Array.isArray(role.permissions) ? role.permissions.includes("canCreateLeads") : false);

  // Format status for display
  const formatStatus = (status: string) => {
    return {
      "New": { label: "New", color: "text-blue-600 bg-blue-50 border-blue-200" },
      "Active": { label: "Active", color: "text-green-600 bg-green-50 border-green-200" },
      "FollowUp": { label: "Follow Up", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
      "Lost": { label: "Lost", color: "text-gray-600 bg-gray-50 border-gray-200" },
      "Pending": { label: "Pending", color: "text-purple-600 bg-purple-50 border-purple-200" },
      "Inactive": { label: "Inactive", color: "text-red-600 bg-red-50 border-red-200" },
    }[status] || { label: status, color: "text-gray-600 bg-gray-50 border-gray-200" };
  };

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

  // Render error state
  if (isError) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <AlertCircle className="mr-2 h-5 w-5" />
              Error Loading Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              {error instanceof Error ? error.message : "Failed to load leads data"}
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

  // Render leads page
  return (
    <div className="container mx-auto">
      {/* Page header */}
      <MotionWrapper animation="fade-down" delay={0.1}>
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="flex flex-col sm:flex-row items-start sm:items-center">
              <MotionWrapper animation="fade-right" delay={0.2}>
                <h1 className="text-2xl font-semibold text-gray-900 mb-2 sm:mb-0">
                  CRM Leads Management
                </h1>
              </MotionWrapper>
              <MotionWrapper animation="fade-left" delay={0.3}>
                <div className="flex flex-wrap space-x-2">
                  {canCreateLead && (
                    <Button
                      onClick={() => setNewLeadModalOpen(true)}
                      size="sm"
                      className="h-9"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      New Lead
                    </Button>
                  )}
                </div>
              </MotionWrapper>
            </div>
          </div>
        </div>
      </MotionWrapper>
      
      {/* Page content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <MotionWrapper animation="fade-up" delay={0.4}>
          <Card className="shadow mb-6">
            <CardHeader className="px-5 py-4 border-b border-gray-200">
              <CardTitle className="text-lg leading-6 font-medium text-gray-900">
                Lead Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-1/3">
                  <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value)}
                  >
                    <SelectTrigger id="status-filter" className="w-full">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="FollowUp">Follow Up</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-2/3">
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      id="search"
                      type="text"
                      placeholder="Search by name, email, phone, MC/DOT number..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'} found
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="flex gap-1 items-center"
                  >
                    <List className="h-4 w-4" />
                    <span className="hidden sm:inline">List</span>
                  </Button>
                  <Button
                    variant={viewMode === 'kanban' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('kanban')}
                    className="flex gap-1 items-center"
                  >
                    <LayoutGrid className="h-4 w-4" />
                    <span className="hidden sm:inline">Kanban</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </MotionWrapper>
        
        {/* Display leads in selected view mode */}
        {viewMode === 'kanban' ? (
          <MotionWrapper animation="fade-up" delay={0.5}>
            <KanbanView leads={filteredLeads} setLocation={setLocation} />
          </MotionWrapper>
        ) : (
          <MotionWrapper animation="fade-up" delay={0.5}>
            <Card className="shadow overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.companyName}</TableCell>
                        <TableCell>
                          <div>
                            <span className="font-medium">{lead.contactName}</span>
                            <div className="text-xs text-gray-500">{lead.phoneNumber}</div>
                            {lead.email && <div className="text-xs text-gray-500">{lead.email}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${formatStatus(lead.status).color}`}>
                            {formatStatus(lead.status).label}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">
                            {lead.equipmentType ? lead.equipmentType.replace("-", " ") : "N/A"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {formatDate(lead.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="link"
                            className="text-primary-600 hover:text-primary-900 p-0 h-auto"
                            onClick={() => setLocation(`/crm/${lead.id}`)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </MotionWrapper>
        )}
      </div>
      
      {/* New Lead Modal */}
      <NewLeadModal 
        open={newLeadModalOpen} 
        onOpenChange={setNewLeadModalOpen}
      />
    </div>
  );
}