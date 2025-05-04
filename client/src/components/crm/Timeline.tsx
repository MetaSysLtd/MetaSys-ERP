import React from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  FileText, 
  CheckCircle2, 
  ArrowRightCircle,
  CalendarClock,
  Clock,
  AlertTriangle,
  FileCheck2,
  User,
  Truck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ActivityType = 
  | 'call' 
  | 'email' 
  | 'note' 
  | 'form_sent'
  | 'form_completed'
  | 'status_change'
  | 'qualification_updated'
  | 'lead_created'
  | 'dispatch_handoff'
  | 'dispatch_rejection';

interface Activity {
  id?: number;
  type: ActivityType;
  userId: number;
  username?: string;
  timestamp: string;
  payload: Record<string, any>;
}

interface TimelineProps {
  activities: Activity[];
  emptyMessage?: string;
  className?: string;
  maxItems?: number;
  showUserDetails?: boolean;
}

const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case 'call':
      return <Phone className="h-4 w-4 text-blue-500" />;
    case 'email':
      return <Mail className="h-4 w-4 text-indigo-500" />;
    case 'note':
      return <MessageSquare className="h-4 w-4 text-gray-500" />;
    case 'form_sent':
      return <FileText className="h-4 w-4 text-orange-500" />;
    case 'form_completed':
      return <FileCheck2 className="h-4 w-4 text-green-500" />;
    case 'status_change':
      return <ArrowRightCircle className="h-4 w-4 text-purple-500" />;
    case 'qualification_updated':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case 'lead_created':
      return <User className="h-4 w-4 text-teal-500" />;
    case 'dispatch_handoff':
      return <Truck className="h-4 w-4 text-amber-500" />;
    case 'dispatch_rejection':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getActivityLabel = (activity: Activity) => {
  const { type, payload } = activity;
  
  switch (type) {
    case 'call':
      return `Call ${payload.outcome || ''} (${payload.duration ? formatCallDuration(payload.duration) : 'N/A'})`;
    case 'email':
      return `Email ${payload.subject ? `"${payload.subject}"` : 'sent'}`;
    case 'note':
      return 'Note added';
    case 'form_sent':
      return `Form sent: ${payload.formName || 'Document'}`;
    case 'form_completed':
      return `Form completed: ${payload.formName || 'Document'}`;
    case 'status_change':
      return `Status changed to "${payload.newStatus}"`;
    case 'qualification_updated':
      return `Qualification score: ${payload.qualificationScore || 'Updated'}`;
    case 'lead_created':
      return `Lead created (${payload.source || 'Manual'})`;
    case 'dispatch_handoff':
      return 'Handed off to dispatch';
    case 'dispatch_rejection':
      return `Dispatch rejected: ${payload.reason || 'No reason provided'}`;
    default:
      return 'Activity recorded';
  }
};

const getActivityBadgeVariant = (type: ActivityType): "default" | "secondary" | "destructive" | "outline" => {
  switch (type) {
    case 'call':
      return 'secondary';
    case 'status_change':
      return 'default';
    case 'dispatch_rejection':
      return 'destructive';
    default:
      return 'outline';
  }
};

const formatCallDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return 'Invalid date';
  }
};

const Timeline: React.FC<TimelineProps> = ({ 
  activities, 
  emptyMessage = "No activity recorded yet", 
  className = "", 
  maxItems = 50,
  showUserDetails = true
}) => {
  // Sort activities by timestamp (most recent first) and limit to maxItems
  const sortedActivities = [...activities]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, maxItems);
  
  if (activities.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <Clock className="mx-auto h-8 w-8 text-gray-300 mb-2" />
        <p>{emptyMessage}</p>
      </div>
    );
  }
  
  return (
    <div className={`space-y-3 ${className}`}>
      {sortedActivities.map((activity, index) => (
        <Card key={activity.id || index} className="border-l-4 border-l-blue-400 shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium text-sm text-gray-900">
                    {getActivityLabel(activity)}
                  </h4>
                  <Badge variant={getActivityBadgeVariant(activity.type)}>
                    {activity.type.replace('_', ' ')}
                  </Badge>
                </div>
                
                {activity.payload.notes && (
                  <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">
                    {activity.payload.notes}
                  </p>
                )}
                
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="cursor-default">
                        <span className="flex items-center gap-1">
                          <CalendarClock className="h-3 w-3" />
                          {formatTimestamp(activity.timestamp)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {format(new Date(activity.timestamp), 'PPpp')}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  {showUserDetails && activity.username && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {activity.username}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Timeline;