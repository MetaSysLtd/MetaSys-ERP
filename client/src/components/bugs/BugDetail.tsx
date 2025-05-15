import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Bug } from "@shared/schema";
import { formatDistanceToNow, format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CircleX, CheckCircle, ArrowRightCircle, AlertTriangle } from "lucide-react";
import { useState } from "react";
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
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface BugDetailProps {
  bug: Bug;
  onClose?: () => void;
  onUpdate?: () => void;
}

export function BugDetail({ bug, onClose, onUpdate }: BugDetailProps) {
  const [fixVersion, setFixVersion] = useState<string>("");
  const [assigneeId, setAssigneeId] = useState<string>(
    bug.assignedTo ? String(bug.assignedTo) : ""
  );
  const [statusDialogOpen, setStatusDialogOpen] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<string>(bug.status);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Get list of users for assignment
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    enabled: bug?.orgId !== undefined,
  });

  // Mutations for bug actions
  const assignBugMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/bugs/${bug.id}/assign`, {
        assigneeId: parseInt(assigneeId),
      });
    },
    onSuccess: () => {
      toast({
        title: "Bug assigned",
        description: "The bug has been assigned successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bugs"] });
      queryClient.invalidateQueries({ queryKey: [`/api/bugs/${bug.id}`] });
      if (onUpdate) onUpdate();
    },
    onError: (error: any) => {
      toast({
        title: "Assignment failed",
        description: error.message || "Failed to assign the bug",
        variant: "destructive",
      });
    },
  });

  const changeBugStatusMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/bugs/${bug.id}/status`, {
        status: newStatus,
      });
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: `The bug status has been updated to ${newStatus}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bugs"] });
      queryClient.invalidateQueries({ queryKey: [`/api/bugs/${bug.id}`] });
      setStatusDialogOpen(false);
      if (onUpdate) onUpdate();
    },
    onError: (error: any) => {
      toast({
        title: "Status update failed",
        description: error.message || "Failed to update the bug status",
        variant: "destructive",
      });
    },
  });

  const fixBugMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/bugs/${bug.id}/fix`, {
        fixVersion,
      });
    },
    onSuccess: () => {
      toast({
        title: "Bug fixed",
        description: `The bug has been marked as fixed in version ${fixVersion}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bugs"] });
      queryClient.invalidateQueries({ queryKey: [`/api/bugs/${bug.id}`] });
      setFixVersion("");
      if (onUpdate) onUpdate();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to mark as fixed",
        description: error.message || "Failed to mark the bug as fixed",
        variant: "destructive",
      });
    },
  });

  const closeBugMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/bugs/${bug.id}/close`, {});
    },
    onSuccess: () => {
      toast({
        title: "Bug closed",
        description: "The bug has been closed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bugs"] });
      queryClient.invalidateQueries({ queryKey: [`/api/bugs/${bug.id}`] });
      if (onUpdate) onUpdate();
    },
    onError: (error: any) => {
      toast({
        title: "Close failed",
        description: error.message || "Failed to close the bug",
        variant: "destructive",
      });
    },
  });

  const reopenBugMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/bugs/${bug.id}/reopen`, {});
    },
    onSuccess: () => {
      toast({
        title: "Bug reopened",
        description: "The bug has been reopened successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bugs"] });
      queryClient.invalidateQueries({ queryKey: [`/api/bugs/${bug.id}`] });
      if (onUpdate) onUpdate();
    },
    onError: (error: any) => {
      toast({
        title: "Reopen failed",
        description: error.message || "Failed to reopen the bug",
        variant: "destructive",
      });
    },
  });

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

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "New":
        return <AlertTriangle className="h-5 w-5" />;
      case "In Progress":
        return <ArrowRightCircle className="h-5 w-5" />;
      case "Fixed":
        return <CheckCircle className="h-5 w-5" />;
      case "Closed":
        return <CircleX className="h-5 w-5" />;
      case "Reopened":
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl mb-1">
              #{bug.id}: {bug.title}
            </CardTitle>
            <CardDescription>
              Reported{" "}
              {bug.createdAt
                ? formatDistanceToNow(new Date(bug.createdAt), {
                    addSuffix: true,
                  })
                : "Unknown"}{" "}
              by User #{bug.reportedBy} in{" "}
              <span className="capitalize">{bug.module}</span> module
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Badge className={getUrgencyColor(bug.urgency)}>{bug.urgency}</Badge>
            <Badge className={getStatusColor(bug.status)}>
              <span className="flex items-center">
                {getStatusIcon(bug.status)}
                <span className="ml-1">{bug.status}</span>
              </span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Description</h3>
          <p className="whitespace-pre-wrap">{bug.description}</p>
        </div>

        {bug.steps && (
          <div>
            <h3 className="text-lg font-medium mb-2">Steps to Reproduce</h3>
            <p className="whitespace-pre-wrap">{bug.steps}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bug.page && (
            <div>
              <h4 className="text-sm font-medium mb-1 text-muted-foreground">Page</h4>
              <p>{bug.page}</p>
            </div>
          )}
          
          {bug.browser && (
            <div>
              <h4 className="text-sm font-medium mb-1 text-muted-foreground">Browser</h4>
              <p>{bug.browser}</p>
            </div>
          )}
          
          {bug.device && (
            <div>
              <h4 className="text-sm font-medium mb-1 text-muted-foreground">Device</h4>
              <p>{bug.device}</p>
            </div>
          )}
          
          {bug.os && (
            <div>
              <h4 className="text-sm font-medium mb-1 text-muted-foreground">OS</h4>
              <p>{bug.os}</p>
            </div>
          )}
        </div>

        {bug.screenshotUrl && (
          <div>
            <h3 className="text-lg font-medium mb-2">Screenshot</h3>
            <img 
              src={bug.screenshotUrl} 
              alt="Bug screenshot" 
              className="max-w-full rounded-md border"
            />
          </div>
        )}

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Assignment section */}
          <div>
            <h3 className="text-lg font-medium mb-3">Assign Bug</h3>
            <div className="flex flex-col space-y-2">
              <Label htmlFor="assignee">Assign To</Label>
              <Select 
                value={assigneeId} 
                onValueChange={setAssigneeId}
              >
                <SelectTrigger id="assignee">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {users && users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={() => assignBugMutation.mutate()}
                disabled={
                  assignBugMutation.isPending || 
                  assigneeId === (bug.assignedTo ? String(bug.assignedTo) : "")
                }
                variant="outline"
                className="mt-2"
              >
                {assignBugMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  "Assign Bug"
                )}
              </Button>
            </div>
          </div>

          {/* Status change section */}
          <div>
            <h3 className="text-lg font-medium mb-3">Change Status</h3>
            
            <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline"
                  className="w-full"
                >
                  Change Status
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Bug Status</DialogTitle>
                  <DialogDescription>
                    Update the status of bug #{bug.id}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">New Status</Label>
                    <Select 
                      value={newStatus} 
                      onValueChange={setNewStatus}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Fixed">Fixed</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                        <SelectItem value="Reopened">Reopened</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setStatusDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => changeBugStatusMutation.mutate()}
                    disabled={changeBugStatusMutation.isPending || newStatus === bug.status}
                  >
                    {changeBugStatusMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Status"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Fix bug section - only show if status is not already Fixed or Closed */}
            {bug.status !== "Fixed" && bug.status !== "Closed" && (
              <div className="mt-4 space-y-2">
                <Label htmlFor="fixVersion">Fix Version</Label>
                <div className="flex space-x-2">
                  <Input
                    id="fixVersion"
                    placeholder="e.g. 1.2.3"
                    value={fixVersion}
                    onChange={(e) => setFixVersion(e.target.value)}
                  />
                  <Button
                    onClick={() => fixBugMutation.mutate()}
                    disabled={fixBugMutation.isPending || !fixVersion.trim()}
                  >
                    {fixBugMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Fix"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Close/Reopen actions */}
            <div className="flex space-x-2 mt-4">
              {bug.status !== "Closed" && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => closeBugMutation.mutate()}
                  disabled={closeBugMutation.isPending}
                >
                  {closeBugMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Close Bug"
                  )}
                </Button>
              )}
              
              {(bug.status === "Closed" || bug.status === "Fixed") && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => reopenBugMutation.mutate()}
                  disabled={reopenBugMutation.isPending}
                >
                  {reopenBugMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Reopen Bug"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        <div className="text-sm text-muted-foreground">
          {bug.fixedAt && (
            <p>
              Fixed:{" "}
              {format(new Date(bug.fixedAt), "PPP")}
              {bug.fixVersion && ` (Version ${bug.fixVersion})`}
            </p>
          )}
          {bug.closedAt && <p>Closed: {format(new Date(bug.closedAt), "PPP")}</p>}
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}