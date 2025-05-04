import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  BarChart3,
  Check,
  ClipboardList,
  ExternalLink,
  Eye,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Star,
  X,
} from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Survey, Lead } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function SurveysPage() {
  const { toast } = useToast();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [activeTab, setActiveTab] = useState("pending");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Query surveys data
  const { data: surveys = [], isLoading } = useQuery<Survey[]>({
    queryKey: ["/api/surveys"],
    queryFn: async () => {
      const response = await fetch("/api/surveys");
      if (!response.ok) {
        throw new Error("Failed to fetch surveys");
      }
      return response.json();
    },
  });

  // Query leads (for selecting in the create survey form)
  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
    queryFn: async () => {
      const response = await fetch("/api/leads");
      if (!response.ok) {
        throw new Error("Failed to fetch leads");
      }
      return response.json();
    },
  });

  // Define the status badge component
  const SurveyStatusBadge = ({ status }: { status: string }) => {
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    let statusText = status.charAt(0).toUpperCase() + status.slice(1);
    
    switch (status) {
      case "pending":
        variant = "outline";
        break;
      case "sent":
        variant = "secondary";
        break;
      case "completed":
        variant = "default";
        break;
      default:
        variant = "outline";
    }
    
    return <Badge variant={variant}>{statusText}</Badge>;
  };

  // Define columns for the surveys table
  const columns: ColumnDef<Survey>[] = [
    {
      accessorKey: "token",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Survey ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        );
      },
      cell: ({ row }) => {
        const token = row.getValue("token") as string;
        return <span className="font-mono text-xs">{token.slice(0, 10)}...</span>;
      },
    },
    {
      accessorKey: "leadId",
      header: "Client",
      cell: ({ row }) => {
        // In a real implementation, we'd fetch the lead/client name
        return `Lead #${row.getValue("leadId")}`;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        return <SurveyStatusBadge status={row.getValue("status") as string} />;
      },
    },
    {
      accessorKey: "score",
      header: "Score",
      cell: ({ row }) => {
        const score = row.getValue("score") as number | null;
        if (score === null) return "—";
        
        // NPS categorization
        let scoreClass = "";
        if (score >= 9) scoreClass = "text-green-600 font-medium";
        else if (score >= 7) scoreClass = "text-amber-600 font-medium";
        else scoreClass = "text-red-600 font-medium";
        
        return (
          <div className="flex items-center">
            <span className={scoreClass}>{score}/10</span>
            {score >= 9 && <Star className="h-4 w-4 ml-1 text-yellow-500 fill-yellow-500" />}
          </div>
        );
      },
    },
    {
      accessorKey: "sentAt",
      header: "Sent Date",
      cell: ({ row }) => {
        const sentAt = row.getValue("sentAt") as string | null;
        if (!sentAt) return "Not sent";
        return new Date(sentAt).toLocaleDateString();
      },
    },
    {
      accessorKey: "completedAt",
      header: "Completion Date",
      cell: ({ row }) => {
        const completedAt = row.getValue("completedAt") as string | null;
        if (!completedAt) return "—";
        return new Date(completedAt).toLocaleDateString();
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const survey = row.original;
        const isSent = survey.status === "sent";
        const isCompleted = survey.status === "completed";
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              
              {isCompleted && (
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  View Response
                </DropdownMenuItem>
              )}
              
              {!isCompleted && (
                <DropdownMenuItem>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Survey
                </DropdownMenuItem>
              )}
              
              {!isSent && !isCompleted && (
                <DropdownMenuItem>
                  <Send className="mr-2 h-4 w-4" />
                  Send Survey
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem>
                <MessageSquare className="mr-2 h-4 w-4" />
                Add Comment
              </DropdownMenuItem>
              
              <DropdownMenuItem className="text-red-600">
                <X className="mr-2 h-4 w-4" />
                Delete Survey
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Filter surveys based on active tab
  const filteredSurveys = surveys.filter(survey => {
    if (activeTab === "all") return true;
    return survey.status === activeTab;
  });

  // Create table instance
  const table = useReactTable({
    data: filteredSurveys,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter: searchQuery,
    },
  });

  // Handle form submission for new survey
  const handleCreateSurvey = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const surveyData = {
      leadId: Number(formData.get("leadId")),
      instructions: formData.get("instructions") as string,
    };

    // Sample API call (would be implemented in a real app)
    toast({
      title: "Survey Created",
      description: `Created new survey for Lead #${surveyData.leadId}`,
    });
    
    setDialogOpen(false);
    
    // In a real implementation, you would do:
    // const response = await fetch("/api/surveys", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(surveyData),
    // });
    // if (response.ok) {
    //   queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
    //   setDialogOpen(false);
    // }
  };

  return (
    <PageLayout pageTitle="Surveys">
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Surveys</h1>
          <p className="text-muted-foreground mt-1">
            Collect feedback and measure client satisfaction with NPS surveys
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1">
              <Plus className="h-4 w-4" />
              New Survey
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Survey</DialogTitle>
              <DialogDescription>
                Create a satisfaction survey to send to a client
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSurvey}>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="leadId" className="text-right">
                    Client
                  </Label>
                  <Select name="leadId" required>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {leads.map((lead) => (
                        <SelectItem key={lead.id} value={lead.id.toString()}>
                          {lead.companyName || lead.firstName + " " + lead.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="instructions" className="text-right">
                    Custom Instructions (Optional)
                  </Label>
                  <Textarea
                    id="instructions"
                    name="instructions"
                    placeholder="Add custom instructions for this survey"
                    className="mt-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create Survey</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Surveys</span>
                <span className="font-medium">{surveys.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-medium">
                  {surveys.filter(s => s.status === "pending").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sent</span>
                <span className="font-medium">
                  {surveys.filter(s => s.status === "sent").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium">
                  {surveys.filter(s => s.status === "completed").length}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg. Score</span>
                <span className="font-medium">
                  {surveys.some(s => s.score !== null)
                    ? (
                        surveys
                          .filter(s => s.score !== null)
                          .reduce((acc, curr) => acc + (curr.score || 0), 0) /
                        surveys.filter(s => s.score !== null).length
                      ).toFixed(1)
                    : "—"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">NPS Summary</CardTitle>
            <CardDescription>
              Net Promoter Score breakdown based on completed surveys
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="bg-red-100 text-red-800 font-medium px-3 py-1 rounded-md text-sm">
                  Detractors (0-6)
                </div>
                <span className="font-medium">
                  {surveys.filter(s => s.score !== null && s.score <= 6).length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-amber-100 text-amber-800 font-medium px-3 py-1 rounded-md text-sm">
                  Passives (7-8)
                </div>
                <span className="font-medium">
                  {surveys.filter(s => s.score !== null && s.score >= 7 && s.score <= 8).length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-green-100 text-green-800 font-medium px-3 py-1 rounded-md text-sm">
                  Promoters (9-10)
                </div>
                <span className="font-medium">
                  {surveys.filter(s => s.score !== null && s.score >= 9).length}
                </span>
              </div>
            </div>
            
            <div className="relative h-7 bg-gray-100 rounded-full overflow-hidden">
              <div className="absolute inset-0 flex">
                {/* Detractors */}
                <div
                  className="h-full bg-red-500"
                  style={{
                    width: `${(surveys.filter(s => s.score !== null && s.score <= 6).length / (surveys.filter(s => s.score !== null).length || 1)) * 100}%`,
                  }}
                ></div>
                {/* Passives */}
                <div
                  className="h-full bg-amber-500"
                  style={{
                    width: `${(surveys.filter(s => s.score !== null && s.score >= 7 && s.score <= 8).length / (surveys.filter(s => s.score !== null).length || 1)) * 100}%`,
                  }}
                ></div>
                {/* Promoters */}
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: `${(surveys.filter(s => s.score !== null && s.score >= 9).length / (surveys.filter(s => s.score !== null).length || 1)) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-center text-muted-foreground">
              NPS Score: {' '}
              <span className="font-medium">
                {surveys.some(s => s.score !== null)
                  ? (
                      ((surveys.filter(s => s.score !== null && s.score >= 9).length / (surveys.filter(s => s.score !== null).length || 1)) -
                      (surveys.filter(s => s.score !== null && s.score <= 6).length / (surveys.filter(s => s.score !== null).length || 1))) * 100
                    ).toFixed(0)
                  : "—"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="mb-6" onValueChange={setActiveTab}>
        <TabsList className="grid w-[500px] grid-cols-4">
          <TabsTrigger value="pending">
            Pending
            <Badge variant="outline" className="ml-2">
              {surveys.filter(s => s.status === "pending").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="sent">
            Sent
            <Badge variant="outline" className="ml-2">
              {surveys.filter(s => s.status === "sent").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            <Badge variant="outline" className="ml-2">
              {surveys.filter(s => s.status === "completed").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="all">All Surveys</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>
              {activeTab === "pending" && "Pending Surveys"}
              {activeTab === "sent" && "Sent Surveys"}
              {activeTab === "completed" && "Completed Surveys"}
              {activeTab === "all" && "All Surveys"}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search surveys..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
                prefix={<Search className="h-4 w-4 text-muted-foreground" />}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredSurveys.length === 0 ? (
            <div className="text-center py-10">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-semibold">
                {activeTab === "all"
                  ? "No surveys found"
                  : `No ${activeTab} surveys found`}
              </h3>
              <p className="mt-2 text-muted-foreground">
                {activeTab === "pending" && "Create a new survey to get started"}
                {activeTab === "sent" && "Send out your pending surveys to clients"}
                {activeTab === "completed" && "Wait for clients to complete their surveys"}
                {activeTab === "all" && "Get started by creating a new survey"}
              </p>
              <Button 
                variant="outline" 
                onClick={() => setDialogOpen(true)} 
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Survey
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No results found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {table.getRowModel().rows.length} of {filteredSurveys.length} surveys
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>
    </PageLayout>
  );
}