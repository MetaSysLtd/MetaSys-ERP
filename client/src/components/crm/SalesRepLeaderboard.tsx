import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";
import { 
  Trophy, 
  ArrowUp, 
  ArrowDown, 
  Minus, 
  AlertTriangle, 
  Award, 
  Zap, 
  TrendingUp 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

// Types
interface SalesRep {
  id: number;
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
  totalCommission: number;
  leads: number;
  clients: number;
  previousCommission?: number;
  growth?: number;
  target?: number;
  targetPercentage?: number;
  badges?: string[];
  isTopPerformer?: boolean;
  isNewcomer?: boolean;
  isUnderperforming?: boolean;
}

interface SalesRepLeaderboardProps {
  month: string;
  onSelectUser?: (userId: number) => void;
  selectedUserId?: number;
}

const getBadges = (rep: SalesRep): string[] => {
  const badges: string[] = [];
  
  if (rep.isTopPerformer) badges.push("top-performer");
  if (rep.isNewcomer) badges.push("newcomer");
  if (rep.isUnderperforming) badges.push("at-risk");
  
  // Add achievement badges based on metrics
  if (rep.leads > 10) badges.push("lead-converter");
  if (rep.clients > 3) badges.push("client-champion");
  if (rep.growth && rep.growth > 20) badges.push("fast-growth");
  if (rep.targetPercentage && rep.targetPercentage >= 100) badges.push("target-achiever");
  
  return badges;
};

const getBadgeComponent = (badge: string) => {
  switch (badge) {
    case "top-performer":
      return (
        <Badge className="bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-100">
          <Trophy className="h-3 w-3 mr-1" /> Top Performer
        </Badge>
      );
    case "newcomer":
      return (
        <Badge className="bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-100">
          <Zap className="h-3 w-3 mr-1" /> Newcomer
        </Badge>
      );
    case "at-risk":
      return (
        <Badge className="bg-red-100 text-red-800 border border-red-200 hover:bg-red-100">
          <AlertTriangle className="h-3 w-3 mr-1" /> Target Missed
        </Badge>
      );
    case "lead-converter":
      return (
        <Badge className="bg-green-100 text-green-800 border border-green-200 hover:bg-green-100">
          <Award className="h-3 w-3 mr-1" /> Lead Master
        </Badge>
      );
    case "client-champion":
      return (
        <Badge className="bg-indigo-100 text-indigo-800 border border-indigo-200 hover:bg-indigo-100">
          <Award className="h-3 w-3 mr-1" /> Client Champion
        </Badge>
      );
    case "fast-growth":
      return (
        <Badge className="bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-100">
          <TrendingUp className="h-3 w-3 mr-1" /> Rapid Growth
        </Badge>
      );
    case "target-achiever":
      return (
        <Badge className="bg-teal-100 text-teal-800 border border-teal-200 hover:bg-teal-100">
          <Award className="h-3 w-3 mr-1" /> Target Achieved
        </Badge>
      );
    default:
      return null;
  }
};

const SalesRepLeaderboard = ({ month, onSelectUser, selectedUserId }: SalesRepLeaderboardProps) => {
  const [sortField, setSortField] = useState<keyof SalesRep>("totalCommission");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch sales rep performance data
  const { data: salesReps, isLoading, error } = useQuery({
    queryKey: ["/api/commissions/sales-reps", month],
    queryFn: async () => {
      const response = await fetch(`/api/commissions/sales-reps?month=${month}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch sales rep data: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process data and add calculated fields
      return data.map((rep: any) => {
        // Calculate target percentage
        const targetPercentage = rep.target ? Math.min(Math.round((rep.totalCommission / rep.target) * 100), 100) : 0;
        
        // Determine performance badges based on metrics
        const isTopPerformer = rep.rank === 1;
        const isUnderperforming = targetPercentage < 70;
        const isNewcomer = rep.joinedDays < 90; // Less than 90 days on the job
        
        return {
          ...rep,
          targetPercentage,
          isTopPerformer,
          isNewcomer,
          isUnderperforming,
        };
      });
    },
    enabled: !!month
  });

  // Handle sorting
  const toggleSort = (field: keyof SalesRep) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Sort the data
  const sortedReps = salesReps ? [...salesReps].sort((a, b) => {
    const valueA = a[sortField];
    const valueB = b[sortField];
    
    if (valueA === undefined || valueB === undefined) return 0;
    
    // Handle string values
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return sortOrder === 'asc' 
        ? valueA.localeCompare(valueB) 
        : valueB.localeCompare(valueA);
    }
    
    // Handle numeric values
    return sortOrder === 'asc' 
      ? (valueA as number) - (valueB as number) 
      : (valueB as number) - (valueA as number);
  }) : [];

  // Define sort icon
  const getSortIcon = (field: keyof SalesRep) => {
    if (sortField !== field) return <Minus className="h-4 w-4 text-gray-300" />;
    return sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  // Get initials for avatar fallback
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Render loading skeleton
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Sales Rep Performance</CardTitle>
          <CardDescription>Loading leaderboard data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[160px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">Error Loading Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">
            {error instanceof Error ? error.message : "Failed to load sales rep data"}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Sales Rep Leaderboard</CardTitle>
        <CardDescription>
          Performance ranking for {month.split('-')[1]}/{month.split('-')[0]}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Sales Rep</TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => toggleSort("leads")}
                >
                  <div className="flex items-center">
                    Leads {getSortIcon("leads")}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => toggleSort("clients")}
                >
                  <div className="flex items-center">
                    Clients {getSortIcon("clients")}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => toggleSort("totalCommission")}
                >
                  <div className="flex items-center">
                    Commission {getSortIcon("totalCommission")}
                  </div>
                </TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Badges</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedReps.map((rep: SalesRep, index: number) => {
                // Get badges for this rep
                const badges = getBadges(rep);
                
                return (
                  <TableRow 
                    key={rep.userId} 
                    className={`${selectedUserId === rep.userId ? 'bg-blue-50' : ''} ${rep.isTopPerformer ? 'border-l-4 border-amber-400' : ''} hover:bg-gray-50 cursor-pointer`}
                    onClick={() => onSelectUser && onSelectUser(rep.userId)}
                  >
                    <TableCell className="font-medium">
                      {index === 0 ? (
                        <div className="rounded-full bg-amber-100 text-amber-800 h-8 w-8 flex items-center justify-center">
                          <Trophy className="h-4 w-4" />
                        </div>
                      ) : (
                        index + 1
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-2">
                          <AvatarImage src={rep.profileImageUrl || undefined} alt={`${rep.firstName} ${rep.lastName}`} />
                          <AvatarFallback>{getInitials(rep.firstName, rep.lastName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{rep.firstName} {rep.lastName}</div>
                          <div className="text-sm text-gray-500">{rep.username}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{rep.leads}</TableCell>
                    <TableCell>{rep.clients}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{formatCurrency(rep.totalCommission)}</div>
                        {rep.growth !== undefined && (
                          <div className={`text-xs flex items-center ${rep.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {rep.growth >= 0 ? (
                              <ArrowUp className="h-3 w-3 mr-1" />
                            ) : (
                              <ArrowDown className="h-3 w-3 mr-1" />
                            )}
                            {Math.abs(rep.growth)}% vs prev month
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-full">
                        <div className="flex justify-between mb-1 text-xs">
                          <span>{rep.targetPercentage}%</span>
                          <span>Target: {formatCurrency(rep.target || 0)}</span>
                        </div>
                        <Progress 
                          value={rep.targetPercentage || 0} 
                          className={rep.targetPercentage && rep.targetPercentage >= 100 ? "bg-green-200" : ""}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {badges.slice(0, 2).map(badge => (
                          <div key={badge}>
                            {getBadgeComponent(badge)}
                          </div>
                        ))}
                        {badges.length > 2 && (
                          <Badge className="bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-100">
                            +{badges.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {sortedReps.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                    No sales rep data available for this period
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesRepLeaderboard;