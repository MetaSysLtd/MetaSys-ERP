import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { getStatusColor, formatDate, formatPhone } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { MotionWrapper, MotionList } from "@/components/ui/motion-wrapper-fixed";
import { useSocket } from "@/hooks/use-socket";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MoreHorizontal, 
  Phone, 
  Mail, 
  MapPin,
  Truck,
  Calendar,
  Users,
  Tag,
} from "lucide-react";

interface Lead {
  id: number;
  companyName: string;
  mcNumber: string;
  email: string | null;
  phoneNumber: string;
  status: string;
  equipmentType: string;
  createdAt: string;
  notes?: string;
  assignedTo?: number;
  assignedToUser?: {
    id: number;
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
  };
  [key: string]: any;
}

interface KanbanProps {
  leads: Lead[];
  isLoading: boolean;
  showFilter?: string | null;
}

export function KanbanView({ leads, isLoading, showFilter }: KanbanProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { socket, connected } = useSocket();
  
  const [statusColumns, setStatusColumns] = useState<{[key: string]: Lead[]}>({
    qualified: [],
    nurture: [],
    "follow-up": [],
    active: [],
    unqualified: [],
    lost: [],
    won: []
  });
  
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  
  // Filter and sort leads into columns
  useEffect(() => {
    if (!leads) return;
    
    const columns: {[key: string]: Lead[]} = {
      qualified: [],
      nurture: [],
      "follow-up": [],
      active: [],
      unqualified: [],
      lost: [],
      won: []
    };
    
    leads.forEach(lead => {
      if (columns[lead.status]) {
        columns[lead.status].push(lead);
      }
    });
    
    // Sort each column by createdAt date, newest first
    Object.keys(columns).forEach(status => {
      columns[status].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
    
    setStatusColumns(columns);
  }, [leads]);
  
  // Subscribe to lead updates
  useEffect(() => {
    if (!connected || !socket) return;
    
    // Event handler function
    const handleLeadUpdate = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
    };
    
    // Register event listener
    socket.on('lead_updated', handleLeadUpdate);
    
    // Clean up listener on unmount
    return () => {
      socket.off('lead_updated', handleLeadUpdate);
    };
  }, [connected, socket, queryClient]);
  
  // Mutation to update lead status
  const updateLeadStatusMutation = useMutation({
    mutationFn: async ({ leadId, newStatus }: { leadId: number, newStatus: string }) => {
      const response = await apiRequest('PATCH', `/api/leads/${leadId}`, { status: newStatus });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      toast({
        title: "Status updated",
        description: "Lead has been moved to a new status.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: "There was an error updating the lead status. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Handle drag start
  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead);
  };
  
  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  // Handle drop
  const handleDrop = (targetStatus: string) => {
    if (draggedLead && draggedLead.status !== targetStatus) {
      updateLeadStatusMutation.mutate({
        leadId: draggedLead.id,
        newStatus: targetStatus
      });
    }
    
    setDraggedLead(null);
  };
  
  // Filter columns based on the showFilter prop
  const visibleColumns = showFilter 
    ? {[showFilter]: statusColumns[showFilter]} 
    : statusColumns;
  
  // Column display names and colors
  type StatusKey = 'qualified' | 'nurture' | 'follow-up' | 'active' | 'unqualified' | 'lost' | 'won';
  
  interface ColumnConfig {
    title: string;
    subtitle: string;
    color: string;
    textColor: string;
    borderColor: string;
    accentColor: string;
  }
  
  // Using brand colors from design specifications
  const columnConfig: Record<StatusKey, ColumnConfig> = {
    qualified: { 
      title: "SQL", 
      subtitle: "Sales Qualified",
      color: "bg-[rgba(242,167,27,0.1)]", // Yellow bg at 10% opacity
      textColor: "text-brand-navy",
      borderColor: "border-brand-teal",
      accentColor: "bg-brand-teal" // #025E73
    },
    nurture: { 
      title: "MQL", 
      subtitle: "Marketing Qualified",
      color: "bg-[rgba(242,167,27,0.1)]", // Yellow bg at 10% opacity
      textColor: "text-brand-navy",
      borderColor: "border-brand-teal",
      accentColor: "bg-brand-teal" // #025E73
    },
    "follow-up": { 
      title: "Follow-Up", 
      subtitle: "Needs Follow-Up",
      color: "bg-[rgba(242,167,27,0.1)]", // Yellow bg at 10% opacity
      textColor: "text-brand-navy",
      borderColor: "border-brand-yellow",
      accentColor: "bg-brand-yellow" // #F2A71B
    },
    active: { 
      title: "Active Clients", 
      subtitle: "Current Customers",
      color: "bg-[rgba(242,167,27,0.1)]", // Yellow bg at 10% opacity
      textColor: "text-brand-navy",
      borderColor: "border-brand-plum",
      accentColor: "bg-brand-plum" // #412754
    },
    unqualified: { 
      title: "Unqualified", 
      subtitle: "Not Ready",
      color: "bg-[rgba(242,167,27,0.1)]", // Yellow bg at 10% opacity
      textColor: "text-brand-navy",
      borderColor: "border-gray-300",
      accentColor: "bg-gray-400"
    },
    lost: { 
      title: "Lost", 
      subtitle: "Not Converted",
      color: "bg-[rgba(242,167,27,0.1)]", // Yellow bg at 10% opacity
      textColor: "text-brand-navy",
      borderColor: "border-red-300",
      accentColor: "bg-red-500"
    },
    won: { 
      title: "Won", 
      subtitle: "Converted",
      color: "bg-[rgba(242,167,27,0.1)]", // Yellow bg at 10% opacity
      textColor: "text-brand-navy",
      borderColor: "border-emerald-300",
      accentColor: "bg-emerald-500"
    }
  };
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} className="flex flex-col">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-24 mb-1" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-4 flex-grow">
              {Array.from({ length: 3 }, (_, j) => (
                <div key={j} className="border rounded-md p-3 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
      {Object.entries(visibleColumns).map(([status, statusLeads]) => {
        const config = columnConfig[status as StatusKey];
        
        return (
          <Card 
            key={status}
            className="flex flex-col shadow hover:shadow-md transition-shadow duration-200"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(status)}
          >
            <CardHeader className={`${config.color} ${config.textColor} rounded-t-lg pb-2`}>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-semibold">{config.title}</CardTitle>
                  <p className="text-xs opacity-80">{config.subtitle}</p>
                </div>
                <Badge variant="outline" className={`${config.accentColor} bg-opacity-20 ${config.textColor} border-opacity-30 ${config.borderColor}`}>
                  {statusLeads.length}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="pt-4 space-y-3 flex-grow overflow-y-auto" style={{ maxHeight: '70vh' }}>
              {statusLeads.length === 0 ? (
                <div className="text-center text-gray-500 py-6">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No leads in this stage</p>
                </div>
              ) : (
                <>
                  {statusLeads.map((lead) => (
                    <MotionWrapper key={lead.id} animation="fade-up" delay={0.1}>
                      <div 
                        className={`relative bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow 
                          transition-all duration-200 p-3 pl-4 mb-3 cursor-pointer overflow-hidden
                          hover:translate-y-[-2px] group`}
                        onClick={() => setLocation(`/crm/${lead.id}`)}
                        draggable
                        onDragStart={() => handleDragStart(lead)}
                        style={{
                          // For browsers that support it, we'll add a pseudo-element with the accent color
                          // This ensures the design works even if the browser doesn't support this feature
                          borderLeftWidth: '4px',
                          borderLeftColor: 'transparent'
                        }}
                      >
                        {/* Left accent bar */}
                        <div 
                          className={`absolute left-0 top-0 bottom-0 w-1 ${config.accentColor}`}
                          aria-hidden="true"
                        ></div>
                        
                        {/* Drag animation effect - applied when dragging */}
                        <div className={`
                          absolute inset-0 opacity-0 bg-white border border-gray-300 rounded-lg shadow-md 
                          group-active:opacity-100 transition-all duration-100 
                          ${draggedLead?.id === lead.id ? 'opacity-100 rotate-[-2deg] scale-[0.98] shadow-xl' : ''}
                        `}></div>
                        
                        {/* Card content */}
                        <div className="relative z-10"> {/* Ensure content is above the animation overlay */}
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium truncate text-brand-navy">{lead.companyName}</h3>
                            <Badge 
                              variant="outline" 
                              className={`bg-opacity-10 px-2 ${config.accentColor} bg-opacity-10 text-brand-navy border-gray-200`}
                            >
                              {lead.mcNumber}
                            </Badge>
                          </div>
                          
                          <div className="text-xs text-gray-500 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3 w-3 text-brand-teal" />
                              <span>{lead.email || 'No email'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3 text-brand-teal" />
                              <span>{formatPhone(lead.phoneNumber)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Truck className="h-3 w-3 text-brand-teal" />
                              <span className="capitalize">{lead.equipmentType.replace('-', ' ')}</span>
                            </div>
                          </div>
                          
                          {lead.assignedToUser && (
                            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100 text-xs text-gray-500">
                              <Avatar className="h-5 w-5">
                                <AvatarImage 
                                  src={lead.assignedToUser.profileImageUrl || ''} 
                                  alt={`${lead.assignedToUser.firstName} ${lead.assignedToUser.lastName}`} 
                                />
                                <AvatarFallback className="text-[10px] bg-brand-teal/10 text-brand-teal">
                                  {lead.assignedToUser.firstName[0]}{lead.assignedToUser.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span>
                                {lead.assignedToUser.firstName} {lead.assignedToUser.lastName}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </MotionWrapper>
                  ))}
                </>
              )}
            </CardContent>
            
            <CardFooter className="pt-0 pb-3 flex justify-center">
              {statusLeads.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-xs text-gray-500"
                  onClick={() => setLocation(`/crm?status=${status}`)}
                >
                  View all {statusLeads.length}
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}