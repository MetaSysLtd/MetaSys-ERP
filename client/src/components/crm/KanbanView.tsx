import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
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
  MoveUp 
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
      transition={{ duration: 0.5, delay }}
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

export function KanbanView({ leads, isLoading, showFilter }: KanbanViewProps) {
  const { toast } = useToast();
  const [localLeads, setLocalLeads] = useState<any[]>([]);
  
  // Define the CRM statuses
  const statuses = ["New", "InProgress", "FollowUp", "HandToDispatch", "Active", "Lost"];
  
  // Sync local leads when the prop changes
  useEffect(() => {
    setLocalLeads(leads);
  }, [leads]);
  
  // Mutation for updating lead status
  const updateLeadStatusMutation = useMutation({
    mutationFn: async ({ leadId, newStatus }: { leadId: number, newStatus: string }) => {
      const response = await apiRequest("PATCH", `/api/crm/leads/${leadId}/status`, {
        status: newStatus
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update lead status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Lead Status Updated",
        description: "The lead status has been successfully updated.",
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
    
    // Perform the API update
    updateLeadStatusMutation.mutate({ leadId, newStatus });
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
          
          // Calculate color for status
          const statusColor = {
            "New": "bg-blue-50 border-blue-200 text-blue-700",
            "InProgress": "bg-purple-50 border-purple-200 text-purple-700",
            "FollowUp": "bg-yellow-50 border-yellow-200 text-yellow-700",
            "HandToDispatch": "bg-indigo-50 border-indigo-200 text-indigo-700",
            "Active": "bg-green-50 border-green-200 text-green-700",
            "Lost": "bg-red-50 border-red-200 text-red-700",
          }[status] || "bg-gray-50 border-gray-200 text-gray-600";
          
          // Format status name for display
          const statusDisplay = {
            "InProgress": "In Progress",
            "FollowUp": "Follow Up",
            "HandToDispatch": "Ready for Dispatch",
          }[status] || status;
          
          return (
            <MotionWrapper key={status} animation="fade-up" delay={0.1}>
              <Card className="shadow-sm h-full flex flex-col">
                <CardHeader className={`pb-2 border-b ${statusColor}`}>
                  <CardTitle className="flex justify-between items-center text-sm lg:text-base">
                    <span>{statusDisplay}</span>
                    <Badge variant="outline" className={`${statusColor} whitespace-nowrap`}>
                      {statusLeads.length}
                    </Badge>
                  </CardTitle>
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
                                  className={`p-3 mb-2 rounded-md border bg-white hover:shadow-md transition-shadow 
                                    ${snapshot.isDragging ? 'shadow-lg border-blue-300' : 'border-gray-200'}
                                  `}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="font-medium text-gray-900 truncate max-w-[80%]">
                                      {lead.companyName}
                                    </div>
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
                                  
                                  {lead.contactName && (
                                    <div className="text-sm text-gray-600 mt-1 flex items-center">
                                      <User className="h-3 w-3 mr-1 text-gray-400" />
                                      {lead.contactName}
                                    </div>
                                  )}
                                  
                                  {lead.phoneNumber && (
                                    <div className="flex items-center text-xs text-gray-500 mt-1">
                                      <Phone className="h-3 w-3 mr-1 text-gray-400" />
                                      {lead.phoneNumber}
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-gray-100">
                                    <div className="flex space-x-2">
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