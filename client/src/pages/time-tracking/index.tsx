import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  format, 
  parseISO, 
  isToday, 
  isYesterday, 
  isSameWeek, 
  isSameMonth,
  subDays, 
  startOfWeek, 
  endOfWeek,
  startOfMonth,
  endOfMonth,
  differenceInMinutes,
  differenceInHours,
  eachDayOfInterval,
  addMonths,
  addWeeks
} from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar as CalendarIcon,
  Clock,
  UserCheck,
  History as HistoryIcon,
  TrendingUp,
  ListChecks,
  Coffee,
  Clock3,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarViewIcon,
  BarChart4,
  FileBarChart2,
  User
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ClockEvent {
  id: number;
  userId: number;
  type: "IN" | "OUT";
  timestamp: string;
  createdAt: string;
}

// Calculate the time durations based on clock events
function calculateTimeSummary(events: ClockEvent[]) {
  if (!events || events.length === 0) return {
    today: "0h 0m",
    thisWeek: "0h 0m",
    thisMonth: "0h 0m",
    todayHours: 0,
    weekHours: 0,
    monthHours: 0
  };

  const now = new Date();
  let todayMinutes = 0;
  let weekMinutes = 0;
  let monthMinutes = 0;

  // Sort events by timestamp
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Calculate work durations by pairing IN/OUT events
  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const currentEvent = sortedEvents[i];
    const nextEvent = sortedEvents[i + 1];
    
    if (currentEvent.type === "IN" && nextEvent.type === "OUT") {
      const startTime = new Date(currentEvent.timestamp);
      const endTime = new Date(nextEvent.timestamp);
      const durationMinutes = differenceInMinutes(endTime, startTime);
      
      if (isToday(startTime)) {
        todayMinutes += durationMinutes;
      }
      
      if (isSameWeek(startTime, now)) {
        weekMinutes += durationMinutes;
      }
      
      if (isSameMonth(startTime, now)) {
        monthMinutes += durationMinutes;
      }
      
      // Skip the OUT event in the next iteration
      i++;
    }
  }

  // If currently clocked in, add time until now
  const lastEvent = sortedEvents[sortedEvents.length - 1];
  if (lastEvent && lastEvent.type === "IN") {
    const startTime = new Date(lastEvent.timestamp);
    const durationMinutes = differenceInMinutes(now, startTime);
    
    if (isToday(startTime)) {
      todayMinutes += durationMinutes;
    }
    
    if (isSameWeek(startTime, now)) {
      weekMinutes += durationMinutes;
    }
    
    if (isSameMonth(startTime, now)) {
      monthMinutes += durationMinutes;
    }
  }

  // Format durations
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return {
    today: formatDuration(todayMinutes),
    thisWeek: formatDuration(weekMinutes),
    thisMonth: formatDuration(monthMinutes),
    todayHours: parseFloat((todayMinutes / 60).toFixed(1)),
    weekHours: parseFloat((weekMinutes / 60).toFixed(1)),
    monthHours: parseFloat((monthMinutes / 60).toFixed(1))
  };
}

function ClockControls() {
  const [currentStatus, setCurrentStatus] = useState<"IN" | "OUT" | null>(null);
  const [timeElapsed, setTimeElapsed] = useState<string>("00:00:00");
  const [clockedInTime, setClockedInTime] = useState<Date | null>(null);
  const [isOnBreak, setIsOnBreak] = useState<boolean>(false);
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
      
      // Show success toast
      toast({
        title: `Successfully clocked ${currentStatus === "IN" ? "out" : "in"}`,
        description: `${format(new Date(), "h:mm a")} on ${format(new Date(), "MMMM d, yyyy")}`,
      });
      
      // Reset break status when clocking out
      if (currentStatus === "IN") {
        setIsOnBreak(false);
      }
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

  const toggleBreak = () => {
    setIsOnBreak(prev => !prev);
    
    toast({
      title: isOnBreak ? "Break ended" : "Break started",
      description: `${format(new Date(), "h:mm a")}`,
    });
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
          className={`w-36 h-36 rounded-full flex items-center justify-center mb-6 border-4 ${
            isOnBreak 
              ? "border-yellow-500 bg-yellow-100 dark:bg-yellow-900/20" 
              : currentStatus === "IN" 
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
            {isOnBreak ? (
              <Coffee className="h-10 w-10 mx-auto text-yellow-600" />
            ) : (
              <Clock className={`h-10 w-10 mx-auto ${
                currentStatus === "IN" ? "text-green-600" : "text-amber-600"
              }`} />
            )}
            <span className="font-bold mt-2 block text-lg">
              {isOnBreak ? "ON BREAK" : currentStatus === "IN" ? "ACTIVE" : "INACTIVE"}
            </span>
            {currentStatus === "IN" && (
              <span className="text-sm block">{timeElapsed}</span>
            )}
          </div>
        </motion.div>

        {/* Clock In/Out and Break Buttons */}
        <div className="flex flex-col space-y-3 w-full max-w-xs">
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
          
          {currentStatus === "IN" && (
            <Button 
              variant="outline"
              size="lg"
              className={`border-2 ${
                isOnBreak 
                  ? "border-yellow-500 text-yellow-700" 
                  : "border-blue-500 text-blue-700"
              } font-medium px-8 py-4 h-auto`}
              onClick={toggleBreak}
            >
              <Coffee className="mr-2 h-5 w-5" />
              {isOnBreak ? "End Break" : "Start Break"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TimeSummary({ events }: { events: ClockEvent[] | undefined }) {
  const summary = useMemo(() => calculateTimeSummary(events || []), [events]);
  
  if (!events) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Time Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex flex-col items-center justify-center">
            <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" />
            <span className="text-sm text-gray-500">Today</span>
            <span className="text-xl font-bold">{summary.today}</span>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg flex flex-col items-center justify-center">
            <CalendarIcon className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-2" />
            <span className="text-sm text-gray-500">This Week</span>
            <span className="text-xl font-bold">{summary.thisWeek}</span>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg flex flex-col items-center justify-center">
            <ListChecks className="h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
            <span className="text-sm text-gray-500">This Month</span>
            <span className="text-xl font-bold">{summary.thisMonth}</span>
          </div>
        </div>
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

function AttendanceCalendar() {
  const [date, setDate] = useState<Date>(new Date());
  const [month, setMonth] = useState<Date>(new Date());
  
  // Get all clock events
  const { 
    data: allEvents,
    isLoading: eventsLoading,
  } = useQuery({
    queryKey: ["/api/time-tracking/events"],
    retry: false,
  });
  
  // Process events to determine attendance days
  const attendanceDays = useMemo(() => {
    if (!allEvents || allEvents.length === 0) return {};
    
    const daysMap: Record<string, { hours: number, status: 'present' | 'partial' | 'absent' }> = {};
    
    // Group events by day
    allEvents.forEach((event: ClockEvent) => {
      const eventDate = parseISO(event.timestamp);
      const dateKey = format(eventDate, "yyyy-MM-dd");
      
      if (!daysMap[dateKey]) {
        daysMap[dateKey] = {
          hours: 0,
          status: 'absent'
        };
      }
    });
    
    // Calculate hours for each day by pairing IN/OUT events
    const sortedEvents = [...allEvents].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const currentEvent = sortedEvents[i];
      const nextEvent = sortedEvents[i + 1];
      
      if (currentEvent.type === "IN" && nextEvent.type === "OUT") {
        const startTime = parseISO(currentEvent.timestamp);
        const endTime = parseISO(nextEvent.timestamp);
        const dateKey = format(startTime, "yyyy-MM-dd");
        
        // Calculate hours worked
        const hoursWorked = differenceInHours(endTime, startTime);
        daysMap[dateKey].hours += hoursWorked;
        
        // Skip the OUT event in the next iteration
        i++;
      }
    }
    
    // Set status based on hours
    Object.keys(daysMap).forEach(dateKey => {
      const { hours } = daysMap[dateKey];
      
      if (hours >= 7) {
        daysMap[dateKey].status = 'present';
      } else if (hours > 0) {
        daysMap[dateKey].status = 'partial';
      } else {
        daysMap[dateKey].status = 'absent';
      }
    });
    
    return daysMap;
  }, [allEvents]);
  
  // Generate calendar day elements
  const renderCalendarContent = () => {
    if (eventsLoading) {
      return <Skeleton className="h-64 w-full" />;
    }
    
    const startDate = startOfMonth(month);
    const endDate = endOfMonth(month);
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
        
        {/* Empty cells for days before the first day of month */}
        {Array.from({ length: startDate.getDay() }).map((_, i) => (
          <div key={`empty-start-${i}`} className="h-10 rounded-md"></div>
        ))}
        
        {/* Calendar days */}
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const attendance = attendanceDays[dateKey];
          
          let bgColor = "";
          if (attendance) {
            if (attendance.status === 'present') {
              bgColor = "bg-green-100 dark:bg-green-900/20";
            } else if (attendance.status === 'partial') {
              bgColor = "bg-yellow-100 dark:bg-yellow-900/20";
            }
          }
          
          const isToday = format(new Date(), "yyyy-MM-dd") === dateKey;
          
          return (
            <div 
              key={dateKey} 
              className={`h-10 flex items-center justify-center rounded-md text-sm 
                ${bgColor}
                ${isToday ? 'border-2 border-blue-500' : ''}
              `}
            >
              <div className="relative">
                {day.getDate()}
                {attendance && attendance.hours > 0 && (
                  <div className="absolute -bottom-3 left-0 right-0 text-[9px] text-gray-600 text-center">
                    {attendance.hours}h
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Empty cells for days after the last day of month */}
        {Array.from({ length: 6 - endDate.getDay() }).map((_, i) => (
          <div key={`empty-end-${i}`} className="h-10 rounded-md"></div>
        ))}
      </div>
    );
  };
  
  const handlePrevMonth = () => {
    setMonth(prevMonth => addMonths(prevMonth, -1));
  };
  
  const handleNextMonth = () => {
    setMonth(prevMonth => addMonths(prevMonth, 1));
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Attendance Calendar</CardTitle>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handlePrevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {format(month, "MMMM yyyy")}
          </span>
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {renderCalendarContent()}
        
        <div className="flex items-center justify-center space-x-4 mt-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-100 dark:bg-green-900/20 mr-1"></div>
            <span className="text-xs text-gray-500">Full Day (7h+)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-100 dark:bg-yellow-900/20 mr-1"></div>
            <span className="text-xs text-gray-500">Partial Day</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TimeAnalytics() {
  const [period, setPeriod] = useState<"week" | "month">("week");
  
  // Get all clock events
  const { 
    data: allEvents,
    isLoading: eventsLoading,
  } = useQuery({
    queryKey: ["/api/time-tracking/events"],
    retry: false,
  });
  
  // Process events into chart data
  const chartData = useMemo(() => {
    if (!allEvents || allEvents.length === 0) return [];
    
    const now = new Date();
    let startDate: Date;
    let dateFormat: string;
    
    if (period === "week") {
      startDate = startOfWeek(now);
      dateFormat = "EEE";
    } else {
      startDate = startOfMonth(now);
      dateFormat = "dd";
    }
    
    const days = eachDayOfInterval({ 
      start: startDate, 
      end: period === "week" ? endOfWeek(now) : endOfMonth(now) 
    });
    
    // Create data for each day with default 0 hours
    const dayData = days.map(day => ({
      date: format(day, dateFormat),
      fullDate: format(day, "yyyy-MM-dd"),
      hours: 0
    }));
    
    // Calculate hours for each day
    const sortedEvents = [...allEvents].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const currentEvent = sortedEvents[i];
      const nextEvent = sortedEvents[i + 1];
      
      if (currentEvent.type === "IN" && nextEvent.type === "OUT") {
        const startTime = parseISO(currentEvent.timestamp);
        const endTime = parseISO(nextEvent.timestamp);
        const dateKey = format(startTime, "yyyy-MM-dd");
        
        // Only include events in current period
        const dayItem = dayData.find(item => item.fullDate === dateKey);
        if (dayItem) {
          // Calculate hours worked
          const hoursWorked = differenceInHours(endTime, startTime) + 
            (differenceInMinutes(endTime, startTime) % 60) / 60;
          dayItem.hours += parseFloat(hoursWorked.toFixed(1));
        }
        
        // Skip the OUT event in the next iteration
        i++;
      }
    }
    
    return dayData;
  }, [allEvents, period]);
  
  if (eventsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Time Analytics</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <Skeleton className="w-full h-full" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Time Analytics</CardTitle>
        <Select
          value={period}
          onValueChange={(value) => setPeriod(value as "week" | "month")}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 0,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis 
                label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} 
                domain={[0, 'dataMax + 2']} // Add some space at the top
              />
              <Tooltip formatter={(value) => [`${value} hours`, 'Time Worked']} />
              <Bar dataKey="hours" name="Hours" fill="#2170dd" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamTimeTracking() {
  const { user } = useAuth();
  
  // Mocked team data - In a real app, you would fetch this from your API
  const teamData = [
    { id: 1, name: "John Smith", position: "Sales Rep", activeNow: true, hoursToday: 7.5 },
    { id: 2, name: "Emily Wilson", position: "Dispatcher", activeNow: true, hoursToday: 6.2 },
    { id: 3, name: "Michael Brown", position: "Accountant", activeNow: false, hoursToday: 4.0 },
    { id: 4, name: "Sarah Davis", position: "HR Manager", activeNow: false, hoursToday: 8.0 },
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Status</CardTitle>
        <CardDescription>
          Real-time status of your team members
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {teamData.map(member => (
              <div key={member.id} className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.position}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center">
                        <span className={`h-2 w-2 rounded-full mr-1 ${member.activeNow ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        <span className="text-sm">{member.activeNow ? 'Active' : 'Inactive'}</span>
                      </div>
                      <p className="text-sm text-gray-500">{member.hoursToday}h today</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default function TimeTrackingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Get all clock events
  const { 
    data: allEvents,
    isLoading: eventsLoading,
  } = useQuery({
    queryKey: ["/api/time-tracking/events"],
    retry: false,
  });
  
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Time Tracking</h1>
        <p className="text-gray-500">
          Manage your work hours and view your time records
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full border-b pb-0 justify-start">
          <TabsTrigger value="dashboard" className="flex items-center">
            <Clock3 className="mr-2 h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center">
            <HistoryIcon className="mr-2 h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center">
            <CalendarViewIcon className="mr-2 h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center">
            <BarChart4 className="mr-2 h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            Team
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col space-y-6">
              <ClockControls />
              <TimeSummary events={allEvents} />
            </div>
            <div className="flex flex-col space-y-6">
              <ClockHistory />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Work History</CardTitle>
                <CardDescription>
                  Your complete work history record
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Select defaultValue="all">
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="lastWeek">Last Week</SelectItem>
                          <SelectItem value="lastMonth">Last Month</SelectItem>
                          <SelectItem value="last3Months">Last 3 Months</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="flex items-center">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            Date Range
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="range"
                            selected={{
                              from: subDays(new Date(), 7),
                              to: new Date(),
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <Button variant="outline" size="sm">
                      <FileBarChart2 className="mr-2 h-4 w-4" />
                      Export Report
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-[500px]">
                    {eventsLoading ? (
                      Array(7).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full mb-2" />
                      ))
                    ) : (
                      <ClockHistory />
                    )}
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="calendar" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <AttendanceCalendar />
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <TimeAnalytics />
          </div>
        </TabsContent>
        
        <TabsContent value="team" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <TeamTimeTracking />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}