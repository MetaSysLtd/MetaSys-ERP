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
  Activity,
  AlertCircle,
  ArrowUpDown,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  Check,
  Clock,
  ListTodo,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Timer,
  UserRound,
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
import { Activity as ActivityType, Account, Lead } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Helper to get activity icon
const getActivityIcon = (action: string) => {
  switch (action) {
    case "call":
      return <Phone className="h-4 w-4" />;
    case "email":
      return <Mail className="h-4 w-4" />;
    case "note":
      return <MessageSquare className="h-4 w-4" />;
    case "reminder":
      return <CalendarClock className="h-4 w-4" />;
    case "meeting":
      return <CalendarDays className="h-4 w-4" />;
    case "task":
      return <ListTodo className="h-4 w-4" />;
    case "created":
      return <Plus className="h-4 w-4" />;
    case "updated":
      return <Activity className="h-4 w-4" />;
    case "status_changed":
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

// Types for our page
interface ExpandedActivity extends ActivityType {
  entityName?: string;
  userName?: string;
}

type ActivityAction = "call" | "email" | "note" | "meeting" | "task" | "reminder";

export default function ActivitiesPage() {
  const { toast } = useToast();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [activeTab, setActiveTab] = useState<ActivityAction>("call");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [remindAt, setRemindAt] = useState<Date | undefined>(new Date());

  // Query activities data
  const { data: activities = [], isLoading } = useQuery<ExpandedActivity[]>({
    queryKey: ["/api/activities"],
    queryFn: async () => {
      const response = await fetch("/api/activities");
      if (!response.ok) {
        throw new Error("Failed to fetch activities");
      }
      return response.json();
    },
  });

  // Query leads and accounts (for activity creation)
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

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
    queryFn: async () => {
      const response = await fetch("/api/accounts");
      if (!response.ok) {
        throw new Error("Failed to fetch accounts");
      }
      return response.json();
    },
  });

  // Define columns for the activities table
  const columns: ColumnDef<ExpandedActivity>[] = [
    {
      accessorKey: "action",
      header: "Type",
      cell: ({ row }) => {
        const action = row.getValue("action") as string;
        return (
          <div className="flex items-center gap-2">
            {getActivityIcon(action)}
            <span className="capitalize">{action.replace("_", " ")}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "details",
      header: "Details",
      cell: ({ row }) => {
        const details = row.getValue("details") as string;
        return details || "—";
      },
    },
    {
      accessorKey: "entityType",
      header: "Related To",
      cell: ({ row }) => {
        const entityType = row.getValue("entityType") as string;
        const entityName = row.original.entityName || `${entityType} #${row.original.entityId}`;
        
        return (
          <div className="flex items-center gap-2">
            {entityType === "lead" && <UserRound className="h-4 w-4 text-blue-500" />}
            {entityType === "account" && <Activity className="h-4 w-4 text-purple-500" />}
            <span>{entityName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "timestamp",
      header: ({ column }) => {
        return (
          <div
            className="flex items-center cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </div>
        );
      },
      cell: ({ row }) => {
        const timestamp = row.getValue("timestamp") as string;
        return format(new Date(timestamp), "MMM d, yyyy h:mm a");
      },
    },
    {
      accessorKey: "userId",
      header: "Created By",
      cell: ({ row }) => {
        // In real implementation, we would show the actual user name
        const userName = row.original.userName || `User #${row.getValue("userId")}`;
        return userName;
      },
    },
    {
      accessorKey: "reminderDate",
      header: "Reminder",
      cell: ({ row }) => {
        const reminderDate = row.original.reminderDate as string | null;
        const completed = row.original.reminderCompleted;
        
        if (!reminderDate) return "—";
        
        return (
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-amber-500" />
            <span>
              {format(new Date(reminderDate), "MMM d, yyyy h:mm a")}
              {completed && (
                <Badge variant="outline" className="ml-2 bg-green-50">
                  <Check className="h-3 w-3 mr-1" /> Completed
                </Badge>
              )}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const activity = row.original;
        const isReminder = activity.action === "reminder";
        const reminderCompleted = activity.reminderCompleted;
        
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
              
              {isReminder && !reminderCompleted && (
                <DropdownMenuItem>
                  <Check className="mr-2 h-4 w-4" />
                  Mark as Complete
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem>
                <MessageSquare className="mr-2 h-4 w-4" />
                Add Comment
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem className="text-red-600">
                <X className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Filter activities based on active tab
  const filteredActivities = activities.filter(activity => {
    if (activeTab === "call") return activity.action === "call";
    if (activeTab === "email") return activity.action === "email";
    if (activeTab === "note") return activity.action === "note";
    if (activeTab === "meeting") return activity.action === "meeting";
    if (activeTab === "task") return activity.action === "task";
    if (activeTab === "reminder") return activity.action === "reminder";
    return true;
  });

  // Table instance
  const table = useReactTable({
    data: filteredActivities,
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

  // Handle form submission for new activity
  const handleCreateActivity = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const entityType = formData.get("entityType") as string;
    const entityId = Number(formData.get("entityId"));
    const details = formData.get("details") as string;
    const isReminder = formData.get("isReminder") === "on";
    
    // Sample API call (would be implemented in a real app)
    toast({
      title: "Activity Logged",
      description: `${activeTab} activity logged for ${entityType} #${entityId}`,
    });
    
    setDialogOpen(false);
    
    // In a real implementation, you would do:
    // const response = await fetch("/api/activities", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     entityType,
    //     entityId,
    //     action: activeTab,
    //     details,
    //     reminderDate: isReminder ? remindAt?.toISOString() : null,
    //   }),
    // });
    // if (response.ok) {
    //   queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    //   setDialogOpen(false);
    // }
  };

  // Get the activity form title based on active tab
  const getActivityFormTitle = () => {
    switch (activeTab) {
      case "call": return "Log a Call";
      case "email": return "Log an Email";
      case "note": return "Add a Note";
      case "meeting": return "Schedule a Meeting";
      case "task": return "Create a Task";
      case "reminder": return "Set a Reminder";
      default: return "Log Activity";
    }
  };

  // Get activity form description
  const getActivityFormDescription = () => {
    switch (activeTab) {
      case "call": return "Record details about a call with a lead or client";
      case "email": return "Record details about an email sent to a lead or client";
      case "note": return "Add notes about a lead or client";
      case "meeting": return "Schedule a meeting with a lead or client";
      case "task": return "Create a task related to a lead or client";
      case "reminder": return "Set a reminder for a specific date and time";
      default: return "Record an activity";
    }
  };

  return (
    <PageLayout pageTitle="Activities">
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activities</h1>
          <p className="text-muted-foreground mt-1">
            Track all interactions with leads and clients
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1">
              <Plus className="h-4 w-4" />
              Log Activity
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{getActivityFormTitle()}</DialogTitle>
              <DialogDescription>
                {getActivityFormDescription()}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateActivity}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="entityType">Related To Type</Label>
                    <Select name="entityType" required defaultValue="lead">
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select entity type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="account">Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="entityId">Entity</Label>
                    <Select name="entityId" required>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select entity" />
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-[200px]">
                          <SelectItem value="" disabled>
                            Select a {formData?.get("entityType") || "lead/account"}
                          </SelectItem>
                          {formData?.get("entityType") === "account" ? (
                            accounts.map((account) => (
                              <SelectItem key={account.id} value={account.id.toString()}>
                                {account.name}
                              </SelectItem>
                            ))
                          ) : (
                            leads.map((lead) => (
                              <SelectItem key={lead.id} value={lead.id.toString()}>
                                {lead.companyName || `${lead.firstName} ${lead.lastName}`}
                              </SelectItem>
                            ))
                          )}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {(activeTab === "meeting" || activeTab === "task") && (
                  <div>
                    <Label>Date</Label>
                    <div className="flex gap-2 mt-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "justify-start text-left font-normal w-full",
                              !date && "text-muted-foreground"
                            )}
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="details">
                    {activeTab === "call" && "Call Notes"}
                    {activeTab === "email" && "Email Summary"}
                    {activeTab === "note" && "Notes"}
                    {activeTab === "meeting" && "Meeting Details"}
                    {activeTab === "task" && "Task Description"}
                    {activeTab === "reminder" && "Reminder Details"}
                  </Label>
                  <Textarea
                    id="details"
                    name="details"
                    required
                    placeholder={`Enter ${activeTab} details...`}
                    className="mt-1"
                    rows={4}
                  />
                </div>

                {activeTab !== "reminder" && (
                  <div className="flex items-center space-x-2 mt-2">
                    <input
                      type="checkbox"
                      id="isReminder"
                      name="isReminder"
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="isReminder" className="text-sm font-normal">
                      Set a reminder for this {activeTab}
                    </Label>
                  </div>
                )}

                {(activeTab === "reminder" || formData?.get("isReminder") === "on") && (
                  <div>
                    <Label>Remind me on</Label>
                    <div className="flex gap-2 mt-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "justify-start text-left font-normal w-full",
                              !remindAt && "text-muted-foreground"
                            )}
                          >
                            <CalendarClock className="mr-2 h-4 w-4" />
                            {remindAt ? format(remindAt, "PPP 'at' p") : "Select date & time"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={remindAt}
                            onSelect={setRemindAt}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="submit">
                  {activeTab === "call" && "Log Call"}
                  {activeTab === "email" && "Log Email"}
                  {activeTab === "note" && "Save Note"}
                  {activeTab === "meeting" && "Schedule Meeting"}
                  {activeTab === "task" && "Create Task"}
                  {activeTab === "reminder" && "Set Reminder"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="call" className="mb-6" onValueChange={(value) => setActiveTab(value as ActivityAction)}>
        <TabsList className="grid grid-cols-6 w-full md:w-[600px]">
          <TabsTrigger value="call" className="flex items-center gap-1">
            <Phone className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Calls</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-1">
            <Mail className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Emails</span>
          </TabsTrigger>
          <TabsTrigger value="note" className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Notes</span>
          </TabsTrigger>
          <TabsTrigger value="meeting" className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Meetings</span>
          </TabsTrigger>
          <TabsTrigger value="task" className="flex items-center gap-1">
            <ListTodo className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="reminder" className="flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Reminders</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>
              <div className="flex items-center gap-2">
                {getActivityIcon(activeTab)}
                <span className="capitalize">{activeTab}s</span>
              </div>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
                prefix={<Search className="h-4 w-4 text-muted-foreground" />}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="capitalize">Log {activeTab}</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-10">
              {getActivityIcon(activeTab)}
              <h3 className="mt-4 text-lg font-semibold">
                No {activeTab}s found
              </h3>
              <p className="mt-2 text-muted-foreground">
                Get started by logging a new {activeTab}
              </p>
              <Button 
                variant="outline" 
                onClick={() => setDialogOpen(true)} 
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="capitalize">Log {activeTab}</span>
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
            Showing {table.getRowModel().rows.length} of {filteredActivities.length} {activeTab}s
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