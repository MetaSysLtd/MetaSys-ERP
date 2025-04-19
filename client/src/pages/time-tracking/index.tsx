import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO, isToday, isYesterday, isSameWeek, subDays, startOfWeek, endOfWeek } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar,
  Clock,
  UserCheck,
  History as HistoryIcon,
  TrendingUp,
  ListChecks
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";

interface ClockEvent {
  id: number;
  userId: number;
  type: "IN" | "OUT";
  timestamp: string;
  createdAt: string;
}

function ClockControls() {
  const [currentStatus, setCurrentStatus] = useState<"IN" | "OUT" | null>(null);
  const [timeElapsed, setTimeElapsed] = useState<string>("00:00:00");
  const [clockedInTime, setClockedInTime] = useState<Date | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Get current clock status
  const { 
    data: statusData,
    isLoading: statusLoading,
    refetch: refetchStatus
  } = useQuery({
    queryKey: ["/api/time-tracking/status"],
    retry: false,
  });

  // Get today's clock events
  const { 
    data: todayEvents,
    isLoading: eventsLoading,
    refetch: refetchEvents
  } = useQuery({
    queryKey: ["/api/time-tracking/events/day"],
    retry: false,
  });

  // Clock in/out mutation
  const clockMutation = useMutation({
    mutationFn: async (type: "IN" | "OUT") => {
      const res = await apiRequest("POST", "/api/time-tracking/clock", { type });
      return res.json();
    },
    onSuccess: () => {
      refetchStatus();
      refetchEvents();
      queryClient.invalidateQueries({ queryKey: ['/api/time-tracking/events'] });
    },
    onError: (error: any) => {
      toast({
        title: "Clock operation failed",
        description: error.message || "Unable to perform clock operation.",
        variant: "destructive",
      });
    },
  });

  // Determine current status and clocked in time
  useEffect(() => {
    if (statusData) {
      setCurrentStatus(statusData.status);
      
      // If user is clocked in, find the most recent IN event
      if (statusData.status === "IN" && todayEvents && todayEvents.length > 0) {
        const latestInEvent = [...todayEvents]
          .reverse()
          .find(event => event.type === "IN");
          
        if (latestInEvent) {
          setClockedInTime(new Date(latestInEvent.timestamp));
        }
      } else {
        setClockedInTime(null);
      }
    }
  }, [statusData, todayEvents]);

  // Update elapsed time counter
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (currentStatus === "IN" && clockedInTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = now.getTime() - clockedInTime.getTime();
        
        // Calculate hours, minutes, seconds
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        // Format as HH:MM:SS
        setTimeElapsed(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentStatus, clockedInTime]);

  const handleClockAction = () => {
    if (currentStatus === "IN") {
      clockMutation.mutate("OUT");
    } else {
      clockMutation.mutate("IN");
    }
  };

  if (statusLoading || eventsLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center">Time Clock</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center pt-6 pb-8">
          <Skeleton className="w-32 h-32 rounded-full mb-6" />
          <Skeleton className="w-40 h-10 mb-4" />
          <Skeleton className="w-24 h-10" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center">Time Clock</CardTitle>
        <CardDescription className="text-center">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center pt-6 pb-8">
        {/* Clock Status Circle */}
        <motion.div
          className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 border-4 ${
            currentStatus === "IN" 
            ? "border-green-500 bg-green-100 dark:bg-green-900/20" 
            : "border-amber-500 bg-amber-100 dark:bg-amber-900/20"
          }`}
          initial={{ scale: 0.9 }}
          animate={{ 
            scale: currentStatus === "IN" ? [1, 1.05, 1] : 1,
            transition: {
              repeat: currentStatus === "IN" ? Infinity : 0,
              duration: 2
            }
          }}
        >
          <div className="text-center">
            <Clock className={`h-8 w-8 mx-auto ${
              currentStatus === "IN" ? "text-green-600" : "text-amber-600"
            }`} />
            <span className="font-bold mt-1 block">
              {currentStatus === "IN" ? "ACTIVE" : "INACTIVE"}
            </span>
            {currentStatus === "IN" && (
              <span className="text-xs block">{timeElapsed}</span>
            )}
          </div>
        </motion.div>

        {/* Clock In/Out Button */}
        <Button 
          size="lg"
          className={`${
            currentStatus === "IN" 
            ? "bg-amber-500 hover:bg-amber-600" 
            : "bg-green-500 hover:bg-green-600"
          } text-white font-bold px-8 py-6 text-lg h-auto`}
          onClick={handleClockAction}
          disabled={clockMutation.isPending}
        >
          {clockMutation.isPending ? (
            <span className="flex items-center">
              <span className="animate-spin mr-2">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              Processing...
            </span>
          ) : currentStatus === "IN" ? (
            "Clock Out"
          ) : (
            "Clock In"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function ClockHistory() {
  const [activeTab, setActiveTab] = useState("today");
  const { toast } = useToast();
  
  // Get all clock events
  const { 
    data: allEvents,
    isLoading: eventsLoading,
  } = useQuery({
    queryKey: ["/api/time-tracking/events"],
    retry: false,
  });

  // Filter events based on active tab
  const filteredEvents = allEvents ? allEvents.filter((event: ClockEvent) => {
    const eventDate = parseISO(event.timestamp);
    switch (activeTab) {
      case "today":
        return isToday(eventDate);
      case "yesterday":
        return isYesterday(eventDate);
      case "week":
        return isSameWeek(eventDate, new Date());
      default:
        return true;
    }
  }) : [];

  // Group events by day
  const groupedEvents: Record<string, ClockEvent[]> = {};
  filteredEvents.forEach((event: ClockEvent) => {
    const dateKey = format(parseISO(event.timestamp), "yyyy-MM-dd");
    if (!groupedEvents[dateKey]) {
      groupedEvents[dateKey] = [];
    }
    groupedEvents[dateKey].push(event);
  });

  // Sort each day's events
  Object.keys(groupedEvents).forEach(day => {
    groupedEvents[day].sort((a, b) => 
      parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime()
    );
  });

  if (eventsLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Clock History</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-8 mb-4" />
          <Skeleton className="w-full h-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Clock History</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="today" onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="today" className="flex-1">Today</TabsTrigger>
            <TabsTrigger value="yesterday" className="flex-1">Yesterday</TabsTrigger>
            <TabsTrigger value="week" className="flex-1">This Week</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            <ScrollArea className="h-[400px]">
              {Object.keys(groupedEvents).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <HistoryIcon className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-gray-500">
                    No clock events found for this period
                  </p>
                </div>
              ) : (
                Object.keys(groupedEvents)
                  .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                  .map(day => (
                    <div key={day} className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-500 mb-2">
                        {format(parseISO(day), "EEEE, MMMM d, yyyy")}
                      </h3>
                      <div className="space-y-2">
                        {groupedEvents[day].map((event, index) => {
                          // Pair IN/OUT events to calculate duration
                          const nextEvent = groupedEvents[day][index + 1];
                          const isPair = event.type === "IN" && nextEvent?.type === "OUT";
                          let duration = null;
                          
                          if (isPair) {
                            const start = parseISO(event.timestamp);
                            const end = parseISO(nextEvent.timestamp);
                            const diffMs = end.getTime() - start.getTime();
                            const hours = Math.floor(diffMs / (1000 * 60 * 60));
                            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                            duration = `${hours}h ${minutes}m`;
                          }
                          
                          return (
                            <div key={event.id} className="flex items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 ${
                                event.type === "IN" 
                                  ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" 
                                  : "bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                              }`}>
                                {event.type === "IN" ? <UserCheck size={18} /> : <Clock size={18} />}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <span className="font-medium">
                                    {event.type === "IN" ? "Clocked In" : "Clocked Out"}
                                  </span>
                                  <span className="text-gray-500 text-sm">
                                    {format(parseISO(event.timestamp), "h:mm a")}
                                  </span>
                                </div>
                                {isPair && duration && (
                                  <span className="text-xs text-gray-500">Duration: {duration}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default function TimeTrackingPage() {
  const { user } = useAuth();
  
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Time Tracking</h1>
        <p className="text-gray-500">
          Manage your work hours and view your time records
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col space-y-6">
          <ClockControls />
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex flex-col items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" />
                  <span className="text-sm text-gray-500">Today</span>
                  <span className="text-xl font-bold">8h 25m</span>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg flex flex-col items-center justify-center">
                  <Calendar className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-2" />
                  <span className="text-sm text-gray-500">Week</span>
                  <span className="text-xl font-bold">32h 10m</span>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg flex flex-col items-center justify-center">
                  <ListChecks className="h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
                  <span className="text-sm text-gray-500">Month</span>
                  <span className="text-xl font-bold">142h 30m</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex flex-col space-y-6">
          <ClockHistory />
        </div>
      </div>
    </div>
  );
}