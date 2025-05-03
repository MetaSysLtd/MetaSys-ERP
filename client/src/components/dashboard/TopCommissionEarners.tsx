import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrendingUpIcon, TrendingDownIcon, WifiIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSocket } from "@/hooks/use-socket";
import { useEffect } from "react";
import { useQueryClient } from '@tanstack/react-query';

interface TopCommissionEarnersProps {
  limit?: number;
  type?: 'sales' | 'dispatch' | 'hr' | 'finance' | 'marketing' | 'accounting' | 'admin' | 'all';
  className?: string;
}

interface CommissionEarner {
  id: number;
  userId: number;
  amount: number;
  username: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
  dept: string;
  month: string;
  previousAmount?: number;
}

export default function TopCommissionEarners({
  limit = 5,
  type = 'all',
  className = ''
}: TopCommissionEarnersProps) {
  const queryClient = useQueryClient();
  const { socket, connected } = useSocket();
  
  // Get current month
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  
  // Fetch top commission earners
  const { data: earners, isLoading } = useQuery({
    queryKey: ['/api/commissions-monthly/top-earners', type, currentMonth, limit],
    queryFn: async () => {
      try {
        // Use our newly created endpoint
        const typeParam = type !== 'all' ? `&type=${type}` : '';
        const response = await fetch(`/api/commissions-monthly/top-earners?month=${currentMonth}&limit=${limit}${typeParam}&previousMonth=true`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch top commission earners');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching top commission earners:', error);
        return [];
      }
    },
  });
  
  // Set up socket listeners for real-time updates
  useEffect(() => {
    if (!socket || !connected) return;
    
    // Event handler function and registration
    const handleCommissionUpdate = (data: any) => {
      console.log('Received admin commission update:', data);
      
      // Invalidate the queries to trigger a refetch
      queryClient.invalidateQueries({ 
        queryKey: ['/api/commissions-monthly/top-earners', type, currentMonth, limit]
      });
    };
    
    // Register event listener
    socket.on('commission_admin_update', handleCommissionUpdate);
    
    // Clean up listener on unmount
    return () => {
      socket.off('commission_admin_update', handleCommissionUpdate);
    };
  }, [socket, connected, queryClient, type, currentMonth, limit]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Top Commission Earners</CardTitle>
          <CardDescription>
            Highest commissions this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Top Commission Earners</CardTitle>
            <CardDescription>
              {type === 'all' 
                ? 'Overall' 
                : type.charAt(0).toUpperCase() + type.slice(1)} top performers 
            </CardDescription>
          </div>
          {connected && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center">
                    <WifiIcon className="h-4 w-4 text-green-500 mr-1" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Real-time updates active</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {earners && earners.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Member</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Commission</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {earners.map((earner: CommissionEarner) => (
                <TableRow key={earner.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={earner.profileImageUrl || ''} alt={`${earner.firstName} ${earner.lastName}`} />
                        <AvatarFallback>
                          {earner.firstName.charAt(0)}{earner.lastName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{earner.firstName} {earner.lastName}</p>
                        <p className="text-xs text-muted-foreground">@{earner.username}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        earner.dept === 'sales' ? 'default' : 
                        earner.dept === 'dispatch' ? 'secondary' :
                        earner.dept === 'hr' ? 'outline' :
                        earner.dept === 'finance' ? 'destructive' :
                        earner.dept === 'marketing' ? 'default' :
                        earner.dept === 'accounting' ? 'secondary' :
                        earner.dept === 'admin' ? 'outline' : 'secondary'
                      }
                      className={
                        earner.dept === 'marketing' ? 'bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-300' :
                        earner.dept === 'accounting' ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300' :
                        earner.dept === 'admin' ? 'border-blue-300 text-blue-700' : ''
                      }
                    >
                      {earner.dept.charAt(0).toUpperCase() + earner.dept.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end">
                      {earner.previousAmount !== undefined && earner.previousAmount > 0 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              {earner.amount >= earner.previousAmount ? (
                                <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                              ) : (
                                <TrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                              )}
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {earner.amount >= earner.previousAmount
                                  ? `Up from PKR ${earner.previousAmount.toLocaleString()}`
                                  : `Down from PKR ${earner.previousAmount.toLocaleString()}`}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <span>PKR {earner.amount.toLocaleString()}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <p>No commission data available for this month.</p>
            <p className="text-sm">Data will appear once commissions are calculated.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}