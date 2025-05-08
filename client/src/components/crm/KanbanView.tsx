import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useRealTime } from "@/hooks/use-real-time";
import socketService, { RealTimeEvents } from "@/services/socket-service";
import { 
  Bookmark, 
  Calendar, 
  Phone, 
  Mail, 
  User, 
  MoreHorizontal, 
  Clock,
  AlertCircle,
  Star,
  MoveUp,
  Truck,
  Info,
  ArrowRightLeft,
  Building,
  DollarSign,
  BarChart2
} from "lucide-react";
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from "@hello-pangea/dnd";

// Motion wrapper for animations
const MotionWrapper = ({ children, animation, delay = 0 }: {
  children: React.ReactNode;
  animation: "fade-up" | "fade-down" | "fade-left" | "fade-right";
  delay?: number;
}) => {
  // Animation variants
  const variants = {
    "fade-up": {
      hidden: { opacity: 0, y: 30 },
      visible: { opacity: 1, y: 0 }
    },
    "fade-down": {
      hidden: { opacity: 0, y: -30 },
      visible: { opacity: 1, y: 0 }
    },
    "fade-left": {
      hidden: { opacity: 0, x: 30 },
      visible: { opacity: 1, x: 0 }
    },
    "fade-right": {
      hidden: { opacity: 0, x: -30 },
      visible: { opacity: 1, x: 0 }
    }
  };
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants[animation]}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 20, 
        delay: delay * 0.15 
      }}
      whileHover={{ scale: 1.01 }}
    >
      {children}
    </motion.div>
  );
};

interface KanbanViewProps {
  leads: any[];
  isLoading?: boolean;
  showFilter: string | null;
  setLocation?: (path: string) => void;
}

// Helper function for status descriptions
function getStatusDescription(status: string): string {
  switch (status) {
    case "New":
      return "Newly added leads that need initial contact";
    case "Contacted":
      return "Leads that have been reached out to";
    case "FollowUp":
      return "Leads requiring additional follow-up";
    case "Qualifying":
      return "Leads being evaluated for qualification";
    case "Active":
      return "Qualified leads actively being worked";
    case "Lost":
      return "Leads that were not converted";
    default:
      return "";
  }
}

export function KanbanView({ leads, isLoading, showFilter, setLocation }: KanbanViewProps) {
  const { toast } = useToast();
  const [localLeads, setLocalLeads] = useState<any[]>([]);
  const { subscribe, subscribeToEntity } = useRealTime();
  
  // Define the CRM statuses (updated with more modern naming)
  const statuses = ["New", "Contacted", "FollowUp", "Qualifying", "Active", "Lost"];
  
  // Set up hover state for lead cards
  const [hoveredLeadId, setHoveredLeadId] = useState<number | null>(null);
  
  // Sync local leads when the prop changes
  useEffect(() => {
    setLocalLeads(leads);
  }, [leads]);
  
  // Subscribe to real-time lead updates
  useEffect(() => {
    // Subscribe to lead creation events
    const unsubscribeLeadCreated = subscribe(RealTimeEvents.LEAD_CREATED, (data) => {
      if (data && data.data) {
        // If we have a new lead, add it to our local state
        setLocalLeads(prevLeads => [...prevLeads, data.data]);
        
        // Show toast notification for new lead
        toast({
          title: "New Lead Created",
          description: `${data.data.companyName || 'New lead'} has been added to the system`,
          variant: "default",
        });
        
        // Subscribe to this new lead's updates
        subscribeToEntity('lead', data.data.id);
      }
    });
    
    // Subscribe to general lead events
    const unsubscribeLeadUpdated = subscribe(RealTimeEvents.LEAD_UPDATED, (data) => {
      if (data && data.data) {
        // Update the local leads state when we receive a real-time update
        setLocalLeads(prevLeads => 
          prevLeads.map(lead => 
            lead.id === data.data.id ? { ...lead, ...data.data } : lead
          )
        );
        
        // Show toast notification for status changes
        if (data.data.status) {
          toast({
            title: "Lead Status Changed",
            description: `Lead ${data.data.name || data.data.companyName || '#' + data.data.id} status changed to ${data.data.status}`,
          });
        }
      }
    });
    
    // Subscribe to lead status change events
    const unsubscribeStatusChange = subscribe('lead-status:updated', (data) => {
      if (data && data.data) {
        const { leadId, newStatus } = data.data;
        // Update the specific lead status in our local state
        setLocalLeads(prevLeads => 
          prevLeads.map(lead => 
            lead.id === leadId ? { ...lead, status: newStatus } : lead
          )
        );
      }
    });
    
    // Subscribe to lead qualification events
    const unsubscribeQualification = subscribe('lead-qualification:updated', (data) => {
      if (data && data.data) {
        const { leadId, newScore } = data.data;
        // Update the specific lead qualification in our local state
        setLocalLeads(prevLeads => 
          prevLeads.map(lead => 
            lead.id === leadId ? { ...lead, qualificationScore: newScore } : lead
          )
        );
      }
    });
    
    // Subscribe to each lead's individual updates
    leads.forEach(lead => {
      subscribeToEntity('lead', lead.id);
    });
    
    return () => {
      unsubscribeLeadCreated();
      unsubscribeLeadUpdated();
      unsubscribeStatusChange();
      unsubscribeQualification();
      
      // Unsubscribe from individual lead updates
      leads.forEach(lead => {
        if (lead && lead.id) {
          try {
            // It's okay if this fails, it's just cleanup
            const entityType = 'lead';
            const entityId = lead.id;
            socketService.unsubscribeFromEntity(entityType, entityId);
          } catch (err) {
            console.error('Error unsubscribing from lead:', err);
          }
        }
      });
    };
  }, [leads, subscribe, subscribeToEntity, toast]);
  
  // Mutation for updating lead status
  const updateLeadStatusMutation = useMutation({
    mutationFn: async ({ leadId, newStatus }: { leadId: number, newStatus: string }) => {
      const response = await apiRequest("PATCH", `/api/leads/${leadId}/status`, {
        status: newStatus
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update lead status');
      }
      
      return response.json();
    },
    onSuccess: (updatedLead) => {
      // Invalidate lead queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      
      // Also invalidate activity queries to refresh the activity feed
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      
      // Activity specific to this lead
      queryClient.invalidateQueries({ 
        queryKey: ["/api/activities/entity/lead", updatedLead.id] 
      });
      
      toast({
        title: "Lead Status Updated",
        description: `Lead status updated to ${updatedLead.status}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Status Update Failed",
        description: error.message,
        variant: "destructive",
      });
      
      // Revert the local state on error
      setLocalLeads(leads);
    },
  });
  
  // Handle drag end
  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    
    // Return if dropped outside a valid droppable or same position
    if (!destination || 
        (source.droppableId === destination.droppableId && 
         source.index === destination.index)) {
      return;
    }
    
    // Extract lead ID and convert to number
    const leadId = parseInt(draggableId.replace('lead-', ''));
    
    // Extract the new status from the destination droppable ID
    const newStatus = destination.droppableId.replace('status-', '');
    
    // Optimistically update the local state
    const updatedLeads = localLeads.map(lead => {
      if (lead.id === leadId) {
        return { ...lead, status: newStatus };
      }
      return lead;
    });
    
    setLocalLeads(updatedLeads);
    
    // Also create an activity entry for this status change
    const logActivity = async () => {
      try {
        // Get the previous status by finding the lead in the original leads array
        const lead = leads.find(l => l.id === leadId);
        const previousStatus = lead?.status || 'Unknown';
        
        // Create activity for this status change
        await apiRequest('POST', '/api/activities', {
          action: 'note',
          entityType: 'lead',
          entityId: leadId,
          details: `Status changed from ${previousStatus} to ${newStatus}`,
        });
      } catch (error) {
        console.error('Failed to log status change activity:', error);
      }
    };
    
    // Perform the API update
    updateLeadStatusMutation.mutate({ leadId, newStatus });
    
    // Log the activity
    logActivity();
  };
  
  // Calculate the column layout based on screen size and filter status
  const columnClass = showFilter 
    ? "grid-cols-1" 
    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6";
  
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className={`grid ${columnClass} gap-4`}>
        {statuses.map((status) => {
          // Skip this column if a specific filter is applied and this isn't it
          if (showFilter && showFilter !== status) {
            return null;
          }
          
          const statusLeads = localLeads.filter((lead) => lead.status === status);
          
          // Calculate color for status - using MetaSys brand colors
          const statusColor = {
            // Using brand colors from the documentation (teal, navy, yellow, plum)
            "New": "bg-blue-50 border-blue-200 text-blue-700",           // Light blue theme
            "Contacted": "bg-teal-50 border-teal-200 text-teal-700",     // Teal for contacted - brand color
            "FollowUp": "bg-amber-50 border-amber-200 text-amber-700",   // Yellow/amber for follow-ups - brand color
            "Qualifying": "bg-purple-50 border-purple-200 text-purple-700", // Purple for qualifying leads - brand color
            "Active": "bg-emerald-50 border-emerald-200 text-emerald-700", // Green for active leads
            "Lost": "bg-red-50 border-red-200 text-red-700",             // Red for lost leads
          }[status] || "bg-gray-50 border-gray-200 text-gray-600";
          
          // Format status name for display
          const statusDisplay = {
            "FollowUp": "Follow Up",
          }[status] || status;
          
          // Status icons
          const statusIcon = {
            "New": <Info className="h-4 w-4 mr-1.5" />,
            "Contacted": <Phone className="h-4 w-4 mr-1.5" />,
            "FollowUp": <Calendar className="h-4 w-4 mr-1.5" />,
            "Qualifying": <BarChart2 className="h-4 w-4 mr-1.5" />,
            "Active": <DollarSign className="h-4 w-4 mr-1.5" />,
            "Lost": <AlertCircle className="h-4 w-4 mr-1.5" />,
          }[status] || <Info className="h-4 w-4 mr-1.5" />;
          
          return (
            <MotionWrapper key={status} animation="fade-up" delay={0.1}>
              <Card className="shadow-md h-full flex flex-col border-t-2" style={{ borderTopColor: statusColor.split(' ')[0].replace('bg-', 'rgb(var(--')  + ')' }}>
                <CardHeader className={`pb-2 ${statusColor}`}>
                  <CardTitle className="flex items-center text-sm lg:text-base">
                    {statusIcon}
                    <span>{statusDisplay}</span>
                    <Badge className={`ml-auto ${statusColor}`}>
                      {statusLeads.length}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {getStatusDescription(status)}
                  </CardDescription>
                </CardHeader>
                
                <Droppable droppableId={`status-${status}`} type="LEAD">
                  {(provided, snapshot) => (
                    <CardContent 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-2 overflow-y-auto flex-1 min-h-[300px] transition-colors ${
                        snapshot.isDraggingOver ? 'bg-blue-50' : ''
                      }`}
                    >
                      {statusLeads.length === 0 ? (
                        <div className="text-center py-4 text-gray-500 text-xs">
                          <div className="border border-dashed border-gray-300 rounded-md p-4">
                            {snapshot.isDraggingOver ? (
                              <div className="text-blue-500 font-medium">Drop lead here</div>
                            ) : (
                              <div>No {status.toLowerCase()} leads</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          {statusLeads.map((lead, index) => (
                            <Draggable 
                              key={`lead-${lead.id}`}
                              draggableId={`lead-${lead.id}`}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{
                                    ...provided.draggableProps.style,
                                    opacity: snapshot.isDragging ? 0.8 : 1,
                                  }}
                                  className={`p-3 mb-2 rounded-md border bg-white hover:shadow-md transition-all 
                                    ${snapshot.isDragging ? 'shadow-lg border-blue-300' : 'border-gray-200'}
                                    ${hoveredLeadId === lead.id ? 'scale-[1.02] border-blue-200' : ''}
                                  `}
                                  onMouseEnter={() => setHoveredLeadId(lead.id)}
                                  onMouseLeave={() => setHoveredLeadId(null)}
                                  onClick={() => {
                                    if (setLocation) {
                                      setLocation(`/crm/leads/${lead.id}`);
                                    } else {
                                      window.location.href = `/crm/leads/${lead.id}`;
                                    }
                                  }}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="font-medium text-gray-900 truncate max-w-[75%]">
                                      {lead.companyName || 'Unnamed Lead'}
                                    </div>
                                    <div className="flex items-center space-x-1.5">
                                      {lead.priority && (
                                        <Badge className={`text-[10px] px-1.5 ${
                                          lead.priority === 'High' ? 'bg-red-100 text-red-800' :
                                          lead.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-green-100 text-green-800'
                                        }`}>
                                          {lead.priority}
                                        </Badge>
                                      )}
                                      {lead.score && (
                                        <div className="flex items-center">
                                          <Star className={`h-3.5 w-3.5 ${
                                            lead.score === 'High' || lead.score === 'Very High' 
                                              ? 'text-yellow-500' 
                                              : 'text-gray-400'
                                          }`} />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {lead.contactName && (
                                    <div className="text-sm text-gray-600 mt-1.5 flex items-center">
                                      <User className="h-3 w-3 mr-1.5 text-gray-500" />
                                      <span className="truncate">{lead.contactName}</span>
                                    </div>
                                  )}
                                  
                                  <div className="flex flex-col space-y-1 mt-1.5">
                                    {lead.phoneNumber && (
                                      <div className="flex items-center text-xs text-gray-500">
                                        <Phone className="h-3 w-3 mr-1.5 text-gray-500" />
                                        {lead.phoneNumber}
                                      </div>
                                    )}
                                    
                                    {lead.email && (
                                      <div className="flex items-center text-xs text-gray-500">
                                        <Mail className="h-3 w-3 mr-1.5 text-gray-500" />
                                        <span className="truncate max-w-[180px]">{lead.email}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                                    <div className="flex flex-wrap gap-1.5">
                                      {lead.category && (
                                        <Badge variant="outline" className="text-[10px] px-1.5 border-gray-200 bg-gray-50">
                                          {lead.category}
                                        </Badge>
                                      )}
                                      
                                      {lead.mcNumber && (
                                        <Badge variant="outline" className="text-[10px] px-1.5 border-gray-200 bg-gray-50">
                                          MC: {lead.mcNumber}
                                        </Badge>
                                      )}
                                      
                                      {lead.pendingReminders > 0 && (
                                        <Badge variant="outline" className="text-[10px] px-1.5 border-red-200 bg-red-50 text-red-700">
                                          <Clock className="h-2.5 w-2.5 mr-0.5" />
                                          {lead.pendingReminders}
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    <div className="text-gray-400 cursor-move">
                                      <MoveUp className="h-3 w-3" />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </>
                      )}
                    </CardContent>
                  )}
                </Droppable>
                
                <CardFooter className="py-2 px-3 flex justify-between border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    {statusLeads.length > 0 ? `${statusLeads.length} lead${statusLeads.length > 1 ? 's' : ''}` : 'No leads'}
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-7 text-xs text-gray-500 px-2"
                    onClick={() => window.location.href = `/crm?status=${status}`}
                  >
                    View all
                  </Button>
                </CardFooter>
              </Card>
            </MotionWrapper>
          );
        })}
      </div>
    </DragDropContext>
  );
}