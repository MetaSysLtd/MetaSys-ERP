import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { User } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Users, TruckIcon, Trophy } from "lucide-react";
import { format } from "date-fns";

// Function to determine badge color based on percentile
const getBadgeColor = (metric: number, avg: number) => {
  if (metric >= avg * 1.5) return "bg-green-500";
  if (metric >= avg * 1.2) return "bg-emerald-500";
  if (metric >= avg) return "bg-blue-500";
  if (metric >= avg * 0.8) return "bg-orange-500";
  return "bg-red-500";
};

interface TeamMember extends User {
  roleName: string;
  loadCount: number;
}

export default function DispatchTeamPage() {
  const currentDate = new Date();
  const currentMonth = format(currentDate, "yyyy-MM");
  
  // Fetch Dispatch team members
  const { 
    data: teamMembers, 
    isLoading: isLoadingTeam 
  } = useQuery<TeamMember[]>({
    queryKey: ["/api/teams/dispatch/members"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Calculate average metrics for comparison
  const [avgLoads, setAvgLoads] = useState(0);
  
  useEffect(() => {
    if (teamMembers && teamMembers.length > 0) {
      const total = teamMembers.reduce((sum, member) => sum + (member.loadCount || 0), 0);
      setAvgLoads(total / teamMembers.length);
    }
  }, [teamMembers]);
  
  return (
    <div className="p-6 space-y-6">
      <Helmet>
        <title>Dispatch Team | Metio ERP</title>
      </Helmet>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dispatch Team</h1>
          <p className="text-muted-foreground mt-1">
            Monitor dispatch team performance and load bookings
          </p>
        </div>
        
        <div className="flex items-center bg-muted p-2 rounded-md">
          <CalendarDays className="mr-2 h-5 w-5 text-muted-foreground" />
          <span>
            Reporting for: <strong>{format(currentDate, "MMMM yyyy")}</strong>
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Team Members</CardTitle>
            <CardDescription>Total active dispatch personnel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-8 w-8 text-primary mr-3" />
              <div className="text-3xl font-bold">
                {isLoadingTeam ? (
                  <Skeleton className="h-9 w-16" />
                ) : (
                  teamMembers?.length || 0
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Booked Loads</CardTitle>
            <CardDescription>Total loads booked this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TruckIcon className="h-8 w-8 text-primary mr-3" />
              <div className="text-3xl font-bold">
                {isLoadingTeam ? (
                  <Skeleton className="h-9 w-16" />
                ) : (
                  teamMembers?.reduce((sum, member) => sum + (member.loadCount || 0), 0) || 0
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Top Performer</CardTitle>
            <CardDescription>Highest loads booked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Trophy className="h-8 w-8 text-primary mr-3" />
              <div className="text-3xl font-bold">
                {isLoadingTeam ? (
                  <Skeleton className="h-9 w-16" />
                ) : (
                  teamMembers && teamMembers.length > 0 ? 
                    teamMembers.sort((a, b) => (b.loadCount || 0) - (a.loadCount || 0))[0]?.firstName || "N/A" 
                    : "N/A"
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Team Member Performance</CardTitle>
          <CardDescription>
            Loads booked and performance metrics for the dispatch team in {format(currentDate, "MMMM yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Member</TableHead>
                <TableHead>Position</TableHead>
                <TableHead className="text-right">Loads Booked</TableHead>
                <TableHead className="text-right">Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingTeam ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-6 w-12 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : teamMembers && teamMembers.length > 0 ? (
                teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.firstName} {member.lastName}
                    </TableCell>
                    <TableCell>{member.roleName}</TableCell>
                    <TableCell className="text-right">{member.loadCount || 0}</TableCell>
                    <TableCell className="text-right">
                      <Badge className={getBadgeColor(member.loadCount || 0, avgLoads)}>
                        {member.loadCount >= avgLoads * 1.2
                          ? "Excellent"
                          : member.loadCount >= avgLoads
                          ? "Good"
                          : member.loadCount >= avgLoads * 0.8
                          ? "Average"
                          : "Needs Improvement"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No team members found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}