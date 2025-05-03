import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown, Medal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  getSalesLeaderboard, 
  getDispatchLeaderboard, 
  getCombinedLeaderboard,
  LeaderboardEntry 
} from "@/services/leaderboard-service";

// Helper function to get initials from name
const getInitials = (firstName: string, lastName: string) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`;
};

// Component to render a single leaderboard entry
const LeaderboardRow = ({ entry, index }: { entry: LeaderboardEntry; index: number }) => {
  // Determine medal color based on rank
  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1: return "text-yellow-500";
      case 2: return "text-gray-400";
      case 3: return "text-amber-700";
      default: return "text-gray-300";
    }
  };
  
  return (
    <div className="flex items-center justify-between py-3 border-b border-border">
      <div className="flex items-center gap-3">
        <div className="w-8 text-center font-semibold">
          {index <= 3 ? (
            <Medal className={`h-5 w-5 ${getMedalColor(index)}`} />
          ) : (
            <span>{index}</span>
          )}
        </div>
        
        <Avatar className="h-8 w-8">
          <AvatarImage src={entry.avatar} alt={`${entry.firstName} ${entry.lastName}`} />
          <AvatarFallback>{getInitials(entry.firstName, entry.lastName)}</AvatarFallback>
        </Avatar>
        
        <div>
          <p className="text-sm font-medium">{entry.firstName} {entry.lastName}</p>
          <p className="text-xs text-muted-foreground capitalize">{entry.department}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold">{entry.metric}</p>
          <p className="text-xs text-muted-foreground">
            {entry.department === 'sales' ? 'Leads Closed' : 'Loads Booked'}
          </p>
        </div>
        
        <div className="w-6 flex justify-center">
          {entry.change > 0 ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : entry.change < 0 ? (
            <TrendingDown className="h-4 w-4 text-red-500" />
          ) : (
            <div className="h-4 w-4 flex items-center justify-center text-xs">-</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function WeeklyLeaderboard() {
  const [date, setDate] = useState<Date>(new Date());
  
  // Fetch data for the three types of leaderboards
  const { 
    data: salesData,
    isLoading: salesLoading 
  } = useQuery({
    queryKey: ['/api/leaderboard/sales', date.toISOString()],
    queryFn: () => getSalesLeaderboard(date),
  });
  
  const { 
    data: dispatchData,
    isLoading: dispatchLoading 
  } = useQuery({
    queryKey: ['/api/leaderboard/dispatch', date.toISOString()],
    queryFn: () => getDispatchLeaderboard(date),
  });
  
  const { 
    data: combinedData,
    isLoading: combinedLoading 
  } = useQuery({
    queryKey: ['/api/leaderboard/combined', date.toISOString()],
    queryFn: () => getCombinedLeaderboard(date),
  });
  
  // Function to handle date change
  const handleDateChange = (offset: number) => {
    setDate(prevDate => {
      // Calculate new date by adding/subtracting weeks
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + (offset * 7));
      return newDate;
    });
  };
  
  // Format date range for display (e.g., "May 1 - May 7, 2025")
  const getDateRangeLabel = (date: Date) => {
    // Get the start of the week (Sunday)
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    // Get the end of the week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return `${format(startOfWeek, 'MMM d')} - ${format(endOfWeek, 'MMM d, yyyy')}`;
  };
  
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">Weekly Leaderboard</CardTitle>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleDateChange(-1)}
              className="px-3 py-1 text-xs rounded border border-border hover:bg-muted transition-colors"
              disabled={date <= subDays(new Date(), 90)}
            >
              Previous
            </button>
            
            <span className="text-sm">{getDateRangeLabel(date)}</span>
            
            <button 
              onClick={() => handleDateChange(1)}
              className="px-3 py-1 text-xs rounded border border-border hover:bg-muted transition-colors"
              disabled={date >= new Date()}
            >
              Next
            </button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="sales" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="sales">Sales Team</TabsTrigger>
            <TabsTrigger value="dispatch">Dispatch Team</TabsTrigger>
            <TabsTrigger value="combined">Combined</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sales" className="mt-0">
            {salesLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : salesData && salesData.length > 0 ? (
              <div className="space-y-1">
                {salesData.map((entry, index) => (
                  <LeaderboardRow key={entry.userId} entry={entry} index={index + 1} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No data available for this week
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="dispatch" className="mt-0">
            {dispatchLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : dispatchData && dispatchData.length > 0 ? (
              <div className="space-y-1">
                {dispatchData.map((entry, index) => (
                  <LeaderboardRow key={entry.userId} entry={entry} index={index + 1} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No data available for this week
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="combined" className="mt-0">
            {combinedLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : combinedData && combinedData.length > 0 ? (
              <div className="space-y-1">
                {combinedData.map((entry, index) => (
                  <LeaderboardRow key={entry.userId} entry={entry} index={index + 1} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No data available for this week
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}