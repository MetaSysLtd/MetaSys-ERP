import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, useSearch } from "wouter";
import { formatDate, getStatusColor, formatPhone } from "@/lib/utils";
import { NewContactModal } from "@/components/modals/NewContactModal";
import { MotionWrapper, MotionList } from "@/components/ui/motion-wrapper-fixed";
import { ViewToggle } from "@/components/crm/ViewToggle";
import { KanbanView } from "@/components/crm/KanbanView";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus, Search } from "lucide-react";

export default function CRMPage() {
  const { toast } = useToast();
  const { user, role } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  
  const [newContactModalOpen, setNewContactModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredLeads, setFilteredLeads] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  
  // Get leads from the API
  const { data: leads, isLoading, error } = useQuery({
    queryKey: ["/api/leads"],
  });
  
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load contacts data. Please refresh the page.",
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
          lead.companyName.toLowerCase().includes(query) ||
          lead.mcNumber.toLowerCase().includes(query) ||
          (lead.email && lead.email.toLowerCase().includes(query)) ||
          lead.phoneNumber.includes(query)
      );
    }
    
    setFilteredLeads(filtered);
  }, [leads, statusFilter, searchQuery]);
  
  // Update URL when status filter changes
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    
    // Update URL
    const params = new URLSearchParams(search);
    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    
    const newSearch = params.toString();
    setLocation(newSearch ? `?${newSearch}` : "/crm", { replace: true });
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by the useEffect above
  };
  
  const canCreateContact = role && (role.department === "sales" || role.department === "admin");
  
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Loading contacts...</h3>
          <p className="mt-1 text-sm text-gray-500">Please wait while we fetch your data.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      {/* Page header */}
      <MotionWrapper animation="fade-in" delay={0.1}>
        <div className="bg-white shadow">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap items-center justify-between">
              <MotionWrapper animation="fade-right" delay={0.2}>
                <h1 className="text-2xl font-semibold text-gray-900 mb-2 sm:mb-0">
                  {statusFilter === "qualified" ? "SQL - Sales Qualified Leads" : 
                   statusFilter === "nurture" ? "MQL - Marketing Qualified Leads" : 
                   statusFilter === "active" ? "Clients" : "All Leads"}
                </h1>
              </MotionWrapper>
              <MotionWrapper animation="fade-left" delay={0.3}>
                <div className="flex flex-wrap space-x-3 items-center">
                  <ViewToggle view={viewMode} onChange={setViewMode} />
                  
                  {canCreateContact && (
                    <Button
                      onClick={() => setNewContactModalOpen(true)}
                      size="sm"
                      className="h-9 ml-2"
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
                CRM Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-1/3">
                  <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <Select value={statusFilter} onValueChange={handleStatusChange}>
                    <SelectTrigger id="status-filter" className="w-full">
                      <SelectValue placeholder="All Contacts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Leads</SelectItem>
                      <SelectItem value="qualified">SQL (Qualified)</SelectItem>
                      <SelectItem value="nurture">MQL (Nurture)</SelectItem>
                      <SelectItem value="active">Clients (Active)</SelectItem>
                      <SelectItem value="unqualified">Unqualified</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                      <SelectItem value="won">Won</SelectItem>
                      <SelectItem value="follow-up">Follow-Up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-full sm:w-2/3">
                  <label htmlFor="search-crm" className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <form onSubmit={handleSearch}>
                    <div className="relative text-gray-400 focus-within:text-gray-600">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5" />
                      </div>
                      <Input
                        id="search-crm"
                        className="pl-10"
                        placeholder="Search by company, MC number, email or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>
        </MotionWrapper>
        
        {viewMode === 'kanban' ? (
          <MotionWrapper animation="fade-up" delay={0.5}>
            <KanbanView 
              leads={filteredLeads} 
              isLoading={isLoading} 
              showFilter={statusFilter !== "all" ? statusFilter : null} 
            />
          </MotionWrapper>
        ) : (
          <MotionWrapper animation="fade-up" delay={0.5}>
            <Card className="shadow overflow-hidden">
              <CardHeader className="px-5 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg leading-6 font-medium text-gray-900">
                    Contacts
                  </CardTitle>
                  <span className="text-sm text-gray-500">
                    Showing {filteredLeads.length} contacts
                  </span>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>MC Number</TableHead>
                      <TableHead>Contact Info</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <Users className="h-12 w-12 mb-2" />
                            <h3 className="text-lg font-medium">No contacts found</h3>
                            <p className="text-sm max-w-md mt-1">
                              {statusFilter !== "all"
                                ? `No contacts match the "${statusFilter}" status filter. Try changing your filters or create a new contact.`
                                : searchQuery
                                ? "No contacts match your search criteria. Try a different search term."
                                : "No contacts have been created yet. Start by creating a new contact."}
                            </p>
                            {canCreateContact && (
                              <Button
                                onClick={() => setNewContactModalOpen(true)}
                                className="mt-4"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Create New Lead
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLeads.map((lead) => {
                        const statusStyle = getStatusColor(lead.status);
                        
                        return (
                          <TableRow key={lead.id}>
                            <TableCell className="font-medium">
                              {lead.companyName}
                            </TableCell>
                            <TableCell>{lead.mcNumber}</TableCell>
                            <TableCell>
                              {lead.email && (
                                <div className="text-sm text-gray-500">
                                  {lead.email}
                                </div>
                              )}
                              <div className="text-sm text-gray-500">
                                {formatPhone(lead.phoneNumber)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline"
                                className={`${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} px-2 inline-flex text-xs leading-5 font-semibold rounded-full`}
                              >
                                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="capitalize">
                                {lead.equipmentType.replace("-", " ")}
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
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </MotionWrapper>
        )}
      </div>
      
      {/* New Contact Modal */}
      <NewContactModal 
        open={newContactModalOpen} 
        onOpenChange={setNewContactModalOpen}
      />
    </div>
  );
}