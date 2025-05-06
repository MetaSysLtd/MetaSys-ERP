import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Filter, 
  ChevronDown,
  ArrowUpDown
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface SalesRep {
  userId: number;
  firstName: string;
  lastName: string;
  username: string;
  profileImageUrl: string | null;
  totalCommission: number;
  leads: number;
  clients: number;
  growth: number;
  targetPercentage: number;
  rank: number;
}

interface SalesRepLeaderboardProps {
  salesReps: SalesRep[];
  month: string;
  onSelectRep?: (userId: number) => void;
}

export default function SalesRepLeaderboard({ 
  salesReps,
  month,
  onSelectRep
}: SalesRepLeaderboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"rank" | "commission" | "growth" | "leads" | "clients">("rank");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // Get initials for avatar fallback
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };
  
  // Format month for display
  const formatMonth = (monthString: string): string => {
    const [year, month] = monthString.split('-').map(Number);
    return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  
  // Handle sort click
  const handleSortClick = (column: typeof sortBy) => {
    if (column === sortBy) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };
  
  // Get badge color based on rank
  const getBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-amber-100 text-amber-800 border-amber-300";
    if (rank === 2) return "bg-slate-100 text-slate-800 border-slate-300";
    if (rank === 3) return "bg-orange-100 text-orange-800 border-orange-300";
    return "";
  };
  
  // Sort and filter sales reps
  const sortReps = (a: SalesRep, b: SalesRep) => {
    let valueA = null;
    let valueB = null;
    
    switch (sortBy) {
      case "rank":
        valueA = a.rank;
        valueB = b.rank;
        break;
      case "commission":
        valueA = a.totalCommission;
        valueB = b.totalCommission;
        break;
      case "growth":
        valueA = a.growth;
        valueB = b.growth;
        break;
      case "leads":
        valueA = a.leads;
        valueB = b.leads;
        break;
      case "clients":
        valueA = a.clients;
        valueB = b.clients;
        break;
      default:
        valueA = a.rank;
        valueB = b.rank;
    }
    
    if (sortDirection === "asc") {
      return (valueA || 0) - (valueB || 0);
    } else {
      return (valueB || 0) - (valueA || 0);
    }
  };
  
  // Filter sales reps based on search query
  const filteredReps = searchQuery
    ? salesReps.filter(rep => 
        `${rep.firstName} ${rep.lastName} ${rep.username}`.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : salesReps;
  
  const sortedReps = [...filteredReps].sort(sortReps);
  
  return (
    <div>
      <div className="mb-4 flex flex-col md:flex-row gap-4 justify-between">
        {/* Search Filter */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search team members..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Sort By */}
        <div className="flex items-center gap-2">
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as typeof sortBy)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rank">Rank</SelectItem>
              <SelectItem value="commission">Commission</SelectItem>
              <SelectItem value="growth">Growth</SelectItem>
              <SelectItem value="leads">Leads</SelectItem>
              <SelectItem value="clients">Clients</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">Rank</TableHead>
              <TableHead>Sales Rep</TableHead>
              <TableHead className="text-right">Commission</TableHead>
              <TableHead className="text-right">Growth</TableHead>
              <TableHead className="text-center">Leads</TableHead>
              <TableHead className="text-center">Clients</TableHead>
              <TableHead className="text-center">Target</TableHead>
              <TableHead className="w-16 text-center">Details</TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {sortedReps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                  No sales representatives found.
                </TableCell>
              </TableRow>
            ) : (
              sortedReps.map((rep) => (
                <TableRow key={rep.userId}>
                  {/* Rank */}
                  <TableCell className="text-center">
                    {rep.rank <= 3 ? (
                      <Badge 
                        variant="outline"
                        className={getBadgeColor(rep.rank)}
                      >
                        #{rep.rank}
                      </Badge>
                    ) : (
                      <span>#{rep.rank}</span>
                    )}
                  </TableCell>
                  
                  {/* Sales Rep Info */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={rep.profileImageUrl || undefined} alt={`${rep.firstName} ${rep.lastName}`} />
                        <AvatarFallback>
                          {getInitials(rep.firstName, rep.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <div className="font-medium">{rep.firstName} {rep.lastName}</div>
                        <div className="text-sm text-muted-foreground">{rep.username}</div>
                      </div>
                    </div>
                  </TableCell>
                  
                  {/* Commission */}
                  <TableCell className="text-right font-medium">
                    {formatCurrency(rep.totalCommission)}
                  </TableCell>
                  
                  {/* Growth */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end">
                      {rep.growth > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                      ) : rep.growth < 0 ? (
                        <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                      ) : null}
                      <span className={rep.growth > 0 ? "text-green-600" : rep.growth < 0 ? "text-red-600" : ""}>
                        {rep.growth > 0 ? "+" : ""}{rep.growth}%
                      </span>
                    </div>
                  </TableCell>
                  
                  {/* Leads */}
                  <TableCell className="text-center">
                    {rep.leads}
                  </TableCell>
                  
                  {/* Clients */}
                  <TableCell className="text-center">
                    {rep.clients}
                  </TableCell>
                  
                  {/* Target Progress */}
                  <TableCell>
                    <div className="flex flex-col items-center">
                      <Progress value={rep.targetPercentage} className="h-2 w-full" />
                      <span className="text-xs text-muted-foreground mt-1">
                        {rep.targetPercentage}%
                      </span>
                    </div>
                  </TableCell>
                  
                  {/* Action Button */}
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectRep && onSelectRep(rep.userId)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Optional legend/summary */}
      <div className="mt-4 text-sm text-muted-foreground flex items-center justify-between">
        <span>Showing {sortedReps.length} of {salesReps.length} sales representatives</span>
        <span>{formatMonth(month)} performance</span>
      </div>
    </div>
  );
}