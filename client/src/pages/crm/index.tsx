import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, useSearch } from "wouter";
import { formatDate, getStatusColor, formatPhone } from "@/lib/utils";
import { NewContactModal } from "@/components/modals/NewContactModal";
import { MotionWrapper, MotionList } from "@/components/ui/motion-wrapper-fixed";
import { ViewToggle } from "@/components/crm/ViewToggle";
import { KanbanView } from "@/components/crm/KanbanView";
import { useSocket } from "@/hooks/use-socket";
import { useLeadEvents } from "@/hooks/use-socket";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Plus, Search, Filter, RefreshCcw, ArrowDownUp, Clock, Star, Tag } from "lucide-react";

export default function CRMPage() {
  const { toast } = useToast();
  const { user, role } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  
  const [newContactModalOpen, setNewContactModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredLeads, setFilteredLeads] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [activeTab, setActiveTab] = useState<string>(searchParams.get("tab") || "all");
  const [sortOption, setSortOption] = useState<string>("recent");
  
  // Socket event handlers for real-time updates
  const handleLeadCreated = useCallback((data: any) => {
    console.log('Lead created event received:', data);
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    // Show toast notification
    toast({
      title: "New Lead Created",
      description: `Lead ${data.companyName || '#' + data.id} has been created successfully.`,
      variant: "default",
    });
  }, [queryClient, toast]);
  
  const handleLeadUpdated = useCallback((data: any) => {
    console.log('Lead updated event received:', data);
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
  }, [queryClient]);
  
  const handleLeadStatusChanged = useCallback((data: any) => {
    console.log('Lead status changed event received:', data);
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    // Show toast notification
    toast({
      title: "Lead Status Changed",
      description: `Lead ${data.companyName || '#' + data.id} status changed to ${data.status}.`,
      variant: "default",
    });
  }, [queryClient, toast]);
  
  // Register socket event listeners
  useEffect(() => {
    if (!socket) return;
    
    // Subscribe to lead events
    socket.on('lead:created', handleLeadCreated);
    socket.on('lead:updated', handleLeadUpdated);
    socket.on('lead:status_changed', handleLeadStatusChanged);
    
    // Cleanup
    return () => {
      socket.off('lead:created', handleLeadCreated);
      socket.off('lead:updated', handleLeadUpdated);
      socket.off('lead:status_changed', handleLeadStatusChanged);
    };
  }, [socket, handleLeadCreated, handleLeadUpdated, handleLeadStatusChanged]);
  
  // Get leads from the API
  const { data: leads, isLoading, error } = useQuery({
    queryKey: ["/api/leads"],
  });

  // Get activities from the API to enrich the leads with recent activities
  const { data: activities } = useQuery({
    queryKey: ["/api/activities"],
    enabled: !!leads,
    // Handle potential 404 errors as the endpoint is still being implemented
    retry: (failureCount, error: any) => {
      // Don't retry on 404s
      if (error?.response?.status === 404) return false;
      return failureCount < 3;
    },
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
  
  // Filter leads based on status, tab and search query
  useEffect(() => {
    if (!leads) return;
    
    // Make sure leads is treated as an array
    let filtered = Array.isArray(leads) ? [...leads] : [];
    
    // Filter by pipeline tab first
    if (activeTab === "sql") {
      filtered = filtered.filter(lead => (lead.source === "SQL" || lead.status === "qualified"));
    } else if (activeTab === "mql") {
      filtered = filtered.filter(lead => (lead.source === "MQL" || lead.status === "nurture"));
    }
    
    // Then apply status filter
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((lead) => lead.status === statusFilter);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (lead) => {
          const companyName = lead.companyName || '';
          const mcNumber = lead.mcNumber || '';
          const email = lead.email || '';
          const phoneNumber = lead.phoneNumber || '';
          const contactName = lead.contactName || '';
          
          return (
            companyName.toLowerCase().includes(query) ||
            mcNumber.toLowerCase().includes(query) ||
            email.toLowerCase().includes(query) ||
            phoneNumber.includes(query) ||
            contactName.toLowerCase().includes(query)
          );
        }
      );
    }
    
    // Sort the leads
    if (sortOption === "recent") {
      filtered.sort((a, b) => {
        const aDate = new Date(a.updatedAt || a.createdAt).getTime();
        const bDate = new Date(b.updatedAt || b.createdAt).getTime();
        return bDate - aDate;
      });
    } else if (sortOption === "oldest") {
      filtered.sort((a, b) => {
        const aDate = new Date(a.createdAt).getTime();
        const bDate = new Date(b.createdAt).getTime();
        return aDate - bDate;
      });
    } else if (sortOption === "company") {
      filtered.sort((a, b) => (a.companyName || '').localeCompare(b.companyName || ''));
    } else if (sortOption === "score") {
      filtered.sort((a, b) => {
        const aScore = a.score ? (typeof a.score === 'number' ? a.score : 0) : 0;
        const bScore = b.score ? (typeof b.score === 'number' ? b.score : 0) : 0;
        return bScore - aScore;
      });
    }
    
    // Enrich leads with activity counts if activities are available
    if (activities && Array.isArray(activities)) {
      filtered = filtered.map(lead => {
        const leadActivities = activities.filter(
          (activity: any) => activity.entityType === 'lead' && activity.entityId === lead.id
        );
        const reminderActivities = leadActivities.filter(
          (activity: any) => activity.action === 'reminder' && !activity.reminderCompleted
        );
        
        return {
          ...lead,
          activityCount: leadActivities.length,
          pendingReminders: reminderActivities.length,
          lastActivity: leadActivities.length > 0 
            ? leadActivities.sort((a: any, b: any) => 
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              )[0].timestamp
            : null
        };
      });
    }
    
    setFilteredLeads(filtered);
  }, [leads, statusFilter, searchQuery, activities, activeTab, sortOption]);
  
  // Update URL when status filter or tab changes
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
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update URL
    const params = new URLSearchParams(search);
    if (value === "all") {
      params.delete("tab");
    } else {
      params.set("tab", value);
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
          <h3 className="text-lg font-medium text-gray-900">Loading CRM data...</h3>
          <p className="mt-1 text-sm text-gray-500">Please wait while we fetch your leads and activities.</p>
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
                <h1 className="text-2xl font-semibold text-[#025E73] mb-2 sm:mb-0">
                  CRM Pipeline
                </h1>
              </MotionWrapper>
              <MotionWrapper animation="fade-left" delay={0.3}>
                <div className="flex flex-wrap space-x-3 items-center">
                  <ViewToggle view={viewMode} onChange={setViewMode} />
                  
                  {/* New Lead button removed per requirements */}
                </div>
              </MotionWrapper>
            </div>
          </div>
        </div>
      </MotionWrapper>
      
      {/* Pipeline Tabs */}
      <MotionWrapper animation="fade-down" delay={0.2}>
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <Tabs 
            defaultValue={activeTab} 
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 mb-2">
              <TabsTrigger value="all" className="text-sm font-medium">All Leads</TabsTrigger>
              <TabsTrigger value="sql" className="text-sm font-medium">SQL Pipeline</TabsTrigger>
              <TabsTrigger value="mql" className="text-sm font-medium">MQL Pipeline</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </MotionWrapper>
      
      {/* Page content */}
      <div className="px-4 sm:px-6 lg:px-8 py-2">
        <MotionWrapper animation="fade-up" delay={0.4}>
          <Card className="shadow mb-6">
            <CardHeader className="px-5 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg leading-6 font-medium text-gray-900">
                  Lead Filters
                </CardTitle>
                <div className="flex space-x-2">
                  <Select value={sortOption} onValueChange={setSortOption}>
                    <SelectTrigger className="w-[180px] h-8">
                      <div className="flex items-center text-sm">
                        <ArrowDownUp className="h-3.5 w-3.5 mr-2" />
                        <span>Sort by: {sortOption}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="company">Company Name</SelectItem>
                      <SelectItem value="score">Lead Score</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                      setSortOption("recent");
                    }}
                    className="h-8"
                  >
                    <RefreshCcw className="h-3.5 w-3.5 mr-2" />
                    <span className="text-sm">Reset</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    <Filter className="h-4 w-4 inline mr-1" />
                    Status
                  </label>
                  <Select value={statusFilter} onValueChange={handleStatusChange}>
                    <SelectTrigger id="status-filter" className="w-full">
                      <SelectValue placeholder="All Leads" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="InProgress">In Progress</SelectItem>
                      <SelectItem value="FollowUp">Follow-Up</SelectItem>
                      <SelectItem value="HandToDispatch">Ready for Dispatch</SelectItem>
                      <SelectItem value="Active">Active Client</SelectItem>
                      <SelectItem value="Lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="search-crm" className="block text-sm font-medium text-gray-700 mb-1">
                    <Search className="h-4 w-4 inline mr-1" />
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
                        placeholder="Search by company name, contact, MC number, email or phone..."
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
        
        {/* Lead count summary */}
        <MotionWrapper animation="fade-up" delay={0.5}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-500">
              <span className="font-medium text-[#025E73]">{filteredLeads.length}</span> leads found matching your filters
            </div>
            
            <div className="flex space-x-6">
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 text-blue-500 mr-1.5" />
                <span>
                  <span className="font-medium">
                    {filteredLeads.filter(lead => 
                      lead.pendingReminders && lead.pendingReminders > 0
                    ).length}
                  </span> with reminders
                </span>
              </div>
              
              <div className="flex items-center text-sm">
                <Star className="h-4 w-4 text-yellow-500 mr-1.5" />
                <span>
                  <span className="font-medium">
                    {filteredLeads.filter(lead => 
                      (lead.score === 'High' || lead.score === 'Very High')
                    ).length}
                  </span> high-scoring
                </span>
              </div>
              
              <div className="flex items-center text-sm">
                <Tag className="h-4 w-4 text-green-500 mr-1.5" />
                <span>
                  <span className="font-medium">
                    {filteredLeads.filter(lead => 
                      lead.status === 'Active'
                    ).length}
                  </span> active clients
                </span>
              </div>
            </div>
          </div>
        </MotionWrapper>
        
        {viewMode === 'kanban' ? (
          <MotionWrapper animation="fade-up" delay={0.6}>
            <KanbanView 
              leads={filteredLeads} 
              isLoading={isLoading} 
              showFilter={statusFilter !== "all" ? statusFilter : null} 
            />
          </MotionWrapper>
        ) : (
          <MotionWrapper animation="fade-up" delay={0.6}>
            <Card className="shadow overflow-hidden">
              <CardHeader className="px-5 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg leading-6 font-medium text-gray-900">
                    {activeTab === "sql" ? "Sales Qualified Leads" : 
                     activeTab === "mql" ? "Marketing Qualified Leads" : 
                     "All Leads"}
                  </CardTitle>
                  <span className="text-sm text-gray-500">
                    Showing {filteredLeads.length} leads
                  </span>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>MC Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Activities</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <Users className="h-12 w-12 mb-2" />
                            <h3 className="text-lg font-medium">No leads found</h3>
                            <p className="text-sm max-w-md mt-1">
                              {statusFilter !== "all"
                                ? `No leads match the "${statusFilter}" status filter. Try changing your filters or create a new lead.`
                                : searchQuery
                                ? "No leads match your search criteria. Try a different search term."
                                : "No leads have been created yet. Start by creating a new lead."}
                            </p>
                            {canCreateContact && (
                              <Button
                                onClick={() => setNewContactModalOpen(true)}
                                className="mt-4 bg-[#025E73] hover:bg-[#025E73]/90"
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
                        
                        // Define score color options
                        const scoreColorMap = {
                          'Low': 'bg-gray-100 text-gray-800 border-gray-200',
                          'Medium': 'bg-blue-100 text-blue-800 border-blue-200',
                          'High': 'bg-yellow-100 text-yellow-800 border-yellow-200',
                          'Very High': 'bg-green-100 text-green-800 border-green-200',
                        };
                        
                        // Safely get the score color
                        const scoreKey = (lead.score && typeof lead.score === 'string') ? lead.score : 'Low';
                        const scoreColor = scoreColorMap[scoreKey as keyof typeof scoreColorMap] || scoreColorMap.Low;
                        
                        return (
                          <TableRow key={lead.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">
                              {lead.companyName}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{lead.contactName || 'N/A'}</div>
                              <div className="text-xs text-gray-500">
                                {lead.email && (
                                  <div className="truncate max-w-[180px]">
                                    {lead.email}
                                  </div>
                                )}
                                {lead.phoneNumber && (
                                  <div>
                                    {formatPhone(lead.phoneNumber)}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{lead.mcNumber || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline"
                                className={`${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} px-2 inline-flex text-xs leading-5 font-semibold rounded-full`}
                              >
                                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`${scoreColor} px-2 inline-flex text-xs leading-5 font-semibold rounded-full`}>
                                {lead.score || 'Low'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-center">
                                <span className="text-sm font-medium">{lead.activityCount || 0}</span>
                                {lead.pendingReminders > 0 && (
                                  <Badge variant="outline" className="ml-2 bg-red-100 text-red-800 border-red-200 text-xs">
                                    {lead.pendingReminders} reminder{lead.pendingReminders > 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {lead.lastActivity ? formatDate(lead.lastActivity) : formatDate(lead.updatedAt || lead.createdAt)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="link"
                                className="text-[#025E73] hover:text-[#025E73]/80 p-0 h-auto"
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