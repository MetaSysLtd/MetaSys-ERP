import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { Bookmark, Calendar, Phone, Mail, User, MoreHorizontal } from "lucide-react";

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
  setLocation: (path: string) => void;
}

export function KanbanView({ leads, setLocation }: KanbanViewProps) {
  // Group leads by status
  const statuses = ["New", "FollowUp", "Active", "Pending", "Inactive", "Lost"];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statuses.map((status) => {
        const statusLeads = leads.filter((lead) => lead.status === status);
        
        // Calculate color for status
        const statusColor = {
          "New": "bg-blue-50 border-blue-200 text-blue-700",
          "FollowUp": "bg-yellow-50 border-yellow-200 text-yellow-700",
          "Active": "bg-green-50 border-green-200 text-green-700",
          "Pending": "bg-purple-50 border-purple-200 text-purple-700",
          "Inactive": "bg-gray-50 border-gray-200 text-gray-600",
          "Lost": "bg-red-50 border-red-200 text-red-700",
        }[status] || "bg-gray-50 border-gray-200 text-gray-600";
        
        return (
          <Card key={status} className="shadow-sm">
            <CardHeader className={`pb-2 border-b ${statusColor}`}>
              <CardTitle className="flex justify-between items-center text-lg">
                <span>{status}</span>
                <Badge variant="outline" className={statusColor}>
                  {statusLeads.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 max-h-[400px] overflow-y-auto">
              {statusLeads.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No {status.toLowerCase()} leads
                </div>
              ) : (
                <>
                  {statusLeads.map((lead) => (
                    <MotionWrapper key={lead.id} animation="fade-up" delay={0.1}>
                      <div 
                        key={lead.id} 
                        className="p-3 mb-3 rounded-md border bg-white hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setLocation(`/crm/${lead.id}`)}
                      >
                        <div className="font-medium text-gray-900">
                          {lead.companyName}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {lead.contactName}
                        </div>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Phone className="h-3 w-3 mr-1" />
                          {lead.phoneNumber}
                        </div>
                        {lead.assignedToUser && (
                          <div className="flex items-center text-xs mt-2 pt-2 border-t border-gray-100">
                            <Avatar className="h-5 w-5 mr-1">
                              <AvatarFallback className="text-[10px]">
                                {lead.assignedToUser.firstName[0]}{lead.assignedToUser.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span>
                              {lead.assignedToUser.firstName} {lead.assignedToUser.lastName}
                            </span>
                          </div>
                        )}
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