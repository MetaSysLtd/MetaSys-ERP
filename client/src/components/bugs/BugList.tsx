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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bug } from "@shared/schema";
import { Loader2, Bug as BugIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useOrganization } from "@/hooks/use-organization";
import { formatDistanceToNow } from "date-fns";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQueryErrorHandler } from "@/hooks/use-query-error-handler";

// Define filter options
const URGENCY_OPTIONS = [
  { value: "all", label: "All Urgencies" },
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "New", label: "New" },
  { value: "In Progress", label: "In Progress" },
  { value: "Fixed", label: "Fixed" },
  { value: "Closed", label: "Closed" },
  { value: "Reopened", label: "Reopened" },
];

const MODULE_OPTIONS = [
  { value: "all", label: "All Modules" },
  { value: "crm", label: "CRM" },
  { value: "dispatch", label: "Dispatch" },
  { value: "hr", label: "HR" },
  { value: "finance", label: "Finance" },
  { value: "marketing", label: "Marketing" },
  { value: "dashboard", label: "Dashboard" },
  { value: "admin", label: "Admin" },
  { value: "settings", label: "Settings" },
  { value: "auth", label: "Authentication" },
  { value: "notifications", label: "Notifications" },
  { value: "other", label: "Other" },
];

interface BugListProps {
  onBugSelect?: (bug: Bug) => void;
  statusFilter?: string;
  urgencyFilter?: string;
  moduleFilter?: string;
}

export function BugList({ 
  onBugSelect,
  statusFilter: initialStatusFilter,
  urgencyFilter: initialUrgencyFilter,
  moduleFilter: initialModuleFilter
}: BugListProps) {
  // Filters
  const [urgencyFilter, setUrgencyFilter] = useState<string>(initialUrgencyFilter || "all");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || "all");
  const [moduleFilter, setModuleFilter] = useState<string>(initialModuleFilter || "all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { organization } = useOrganization();
  const { handleError } = useQueryErrorHandler();

  // Fetch bugs data
  const {
    data: bugs,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/bugs"],
    enabled: Boolean(organization?.id),
    onError: handleError,
  });

  // Filter bugs based on selected filters and search term
  const filteredBugs = bugs
    ? bugs.filter((bug: Bug) => {
        // Apply filters
        const matchesUrgency = urgencyFilter === "all" || bug.urgency === urgencyFilter;
        const matchesStatus = statusFilter === "all" || bug.status === statusFilter;
        const matchesModule = moduleFilter === "all" || bug.module === moduleFilter;
        
        // Apply search
        const matchesSearch = searchTerm
          ? bug.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            bug.description.toLowerCase().includes(searchTerm.toLowerCase())
          : true;
        
        return matchesUrgency && matchesStatus && matchesModule && matchesSearch;
      })
    : [];

  // Get urgency badge color
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "Low":
        return "bg-gray-500";
      case "Medium":
        return "bg-yellow-500";
      case "High":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500";
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "New":
        return "bg-blue-500 text-white";
      case "In Progress":
        return "bg-amber-500";
      case "Fixed":
        return "bg-green-500 text-white";
      case "Closed":
        return "bg-gray-500";
      case "Reopened":
        return "bg-purple-500 text-white";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<BugIcon className="h-10 w-10 text-muted-foreground" />}
        title="Could not load bugs"
        description="There was an error loading the bug reports. Please try again later."
        action={
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        }
      />
    );
  }

  if (!bugs || bugs.length === 0) {
    return (
      <EmptyState
        icon={<BugIcon className="h-10 w-10 text-muted-foreground" />}
        title="No bugs reported"
        description="There are no bug reports in the system yet."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bug Reports</CardTitle>

        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 mt-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bugs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="flex space-x-2">
            <Select onValueChange={setUrgencyFilter} defaultValue={urgencyFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent>
                {URGENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={setStatusFilter} defaultValue={statusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={setModuleFilter} defaultValue={moduleFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                {MODULE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredBugs.length === 0 ? (
          <EmptyState
            icon={<Search className="h-10 w-10 text-muted-foreground" />}
            title="No matching bugs"
            description="Try adjusting your filters to find what you're looking for."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Reported By</TableHead>
                  <TableHead>Reported</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBugs.map((bug: Bug) => (
                  <TableRow 
                    key={bug.id}
                    onClick={() => onBugSelect && onBugSelect(bug)}
                    className={onBugSelect ? "cursor-pointer hover:bg-muted" : ""}
                  >
                    <TableCell className="font-medium">#{bug.id}</TableCell>
                    <TableCell className="max-w-xs truncate">{bug.title}</TableCell>
                    <TableCell className="capitalize">{bug.module}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(bug.status)}>
                        {bug.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getUrgencyColor(bug.urgency)}>
                        {bug.urgency}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {/* In a real app, use the User name instead of ID */}
                      User #{bug.reportedBy}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {bug.createdAt
                        ? formatDistanceToNow(new Date(bug.createdAt), { addSuffix: true })
                        : "Unknown"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}