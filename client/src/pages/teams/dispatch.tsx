import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, TruckIcon, DollarSign, Award } from 'lucide-react';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  profileImageUrl: string | null;
}

interface TeamMember extends User {
  roleName: string;
  loadCount: number;
}

interface DispatchPerformance {
  id: number;
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
  loadCount: number;
  grossRevenue: number;
  directGrossRevenue: number;
  bonusAmount: number;
  totalCommission: number;
}

export default function DispatchTeamPage() {
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)); // Format: YYYY-MM
  
  // Get all team members
  const { 
    data: teamMembers, 
    isLoading: isLoadingTeam,
    error: teamError
  } = useQuery({
    queryKey: ['/api/teams/dispatch'],
    staleTime: 60000, // 1 minute
  });

  // Get performance data
  const { 
    data: performanceData, 
    isLoading: isLoadingPerformance,
    error: performanceError,
    refetch: refetchPerformance
  } = useQuery({
    queryKey: ['/api/teams/dispatch/performance', selectedMonth],
    staleTime: 60000, // 1 minute
  });

  // Handle month change
  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
  };

  // Generate months for dropdown (12 months back from current)
  const getMonthOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = date.toISOString().substring(0, 7);
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    
    return options;
  };

  // Format currency values
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Get badge color based on number of loads
  const getLoadCountBadge = (count: number) => {
    if (count >= 20) return <Badge className="bg-green-500 hover:bg-green-600">{count}</Badge>;
    if (count >= 10) return <Badge className="bg-blue-500 hover:bg-blue-600">{count}</Badge>;
    if (count >= 5) return <Badge className="bg-yellow-500 hover:bg-yellow-600">{count}</Badge>;
    return <Badge variant="destructive">{count}</Badge>;
  };

  // Get badge color based on revenue amount
  const getRevenueBadge = (amount: number) => {
    if (amount >= 10000) return <Badge className="bg-green-500 hover:bg-green-600">{formatCurrency(amount)}</Badge>;
    if (amount >= 5000) return <Badge className="bg-blue-500 hover:bg-blue-600">{formatCurrency(amount)}</Badge>;
    if (amount >= 1000) return <Badge className="bg-yellow-500 hover:bg-yellow-600">{formatCurrency(amount)}</Badge>;
    return <Badge variant="destructive">{formatCurrency(amount)}</Badge>;
  };
  
  // Get badge color based on commission amount
  const getCommissionBadge = (amount: number) => {
    if (amount >= 5000) return <Badge className="bg-green-500 hover:bg-green-600">{formatCurrency(amount)}</Badge>;
    if (amount >= 2000) return <Badge className="bg-blue-500 hover:bg-blue-600">{formatCurrency(amount)}</Badge>;
    if (amount >= 500) return <Badge className="bg-yellow-500 hover:bg-yellow-600">{formatCurrency(amount)}</Badge>;
    return <Badge variant="destructive">{formatCurrency(amount)}</Badge>;
  };
  
  if (isLoadingTeam || isLoadingPerformance) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (teamError || performanceError) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Error Loading Team Data</h1>
        <p className="text-destructive">
          {(teamError as Error)?.message || (performanceError as Error)?.message || 'Failed to load team data'}
        </p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dispatch Team</h1>
          <p className="text-muted-foreground">Performance metrics and KPIs for the dispatch department</p>
        </div>
        
        <div className="mt-4 md:mt-0 w-full md:w-auto">
          <Select
            value={selectedMonth}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {getMonthOptions().map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="mr-2 h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{teamMembers?.length || 0}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Loads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TruckIcon className="mr-2 h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {performanceData?.reduce((sum, item) => sum + (item.loadCount || 0), 0) || 0}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gross Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {formatCurrency(performanceData?.reduce((sum, item) => sum + (item.grossRevenue || 0), 0) || 0)}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Commissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Award className="mr-2 h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {formatCurrency(performanceData?.reduce((sum, item) => sum + (item.totalCommission || 0), 0) || 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="roster">Team Roster</TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Dispatch Performance</CardTitle>
              <CardDescription>
                Performance metrics for {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Loads Booked</TableHead>
                    <TableHead>Gross Revenue</TableHead>
                    <TableHead>Direct Revenue</TableHead>
                    <TableHead>Bonus Amount</TableHead>
                    <TableHead>Total Commission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performanceData?.length ? (
                    performanceData.map((member) => (
                      <TableRow key={member.userId}>
                        <TableCell className="font-medium">
                          {member.firstName} {member.lastName}
                        </TableCell>
                        <TableCell>{getLoadCountBadge(member.loadCount || 0)}</TableCell>
                        <TableCell>{getRevenueBadge(member.grossRevenue || 0)}</TableCell>
                        <TableCell>{getRevenueBadge(member.directGrossRevenue || 0)}</TableCell>
                        <TableCell>{formatCurrency(member.bonusAmount || 0)}</TableCell>
                        <TableCell>{getCommissionBadge(member.totalCommission || 0)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No performance data available for this month
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="roster">
          <Card>
            <CardHeader>
              <CardTitle>Team Roster</CardTitle>
              <CardDescription>
                All members of the dispatch department
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Active Loads</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers?.length ? (
                    teamMembers.map((member: TeamMember) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.firstName} {member.lastName}
                        </TableCell>
                        <TableCell>{member.username}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>{member.roleName}</TableCell>
                        <TableCell>{getLoadCountBadge(member.loadCount || 0)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No team members found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}