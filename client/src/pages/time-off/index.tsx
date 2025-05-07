import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Calendar, CalendarDays, FileCheck, Ban } from 'lucide-react';
import { format } from 'date-fns';
import PageLayout from '@/components/layout/PageLayout';

type LeaveRequest = {
  id: number;
  userId: number;
  orgId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  createdAt: string;
  approvedBy?: number;
  approvedAt?: string;
  rejectedBy?: number;
  rejectedAt?: string;
  rejectionReason?: string;
};

type LeaveBalance = {
  id: number;
  userId: number;
  orgId: number;
  year: number;
  casualLeaveUsed: number;
  casualLeaveBalance: number;
  medicalLeaveUsed: number;
  medicalLeaveBalance: number;
  annualLeaveUsed: number;
  annualLeaveBalance: number;
  carryForwardUsed: number;
  carryForwardBalance: number;
  policyId?: number;
  lastUpdated?: string;
};

type LeavePolicy = {
  id: number;
  orgId: number;
  name: string;
  description: string;
  policyLevel: 'Organization' | 'Department' | 'Team' | 'Employee';
  targetId: number;
  casualLeaveQuota: number;
  medicalLeaveQuota: number;
  annualLeaveQuota: number;
  carryForwardEnabled: boolean;
  maxCarryForward: number;
  active: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt?: string;
};

function LeaveStatusBadge({ status }: { status: LeaveRequest['status'] }) {
  let variant: 'default' | 'destructive' | 'outline' | 'secondary' | null = null;
  
  switch (status) {
    case 'Approved':
      variant = 'default';
      break;
    case 'Rejected':
      variant = 'destructive';
      break;
    case 'Cancelled':
      variant = 'secondary';
      break;
    case 'Pending':
    default:
      variant = 'outline';
      break;
  }
  
  return <Badge variant={variant}>{status}</Badge>;
}

function NewLeaveRequestForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createLeaveRequestMutation = useMutation({
    mutationFn: async (formData: any) => {
      const response = await apiRequest('POST', '/api/time-off/requests', formData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create leave request');
      }
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitting(false);
      setIsDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Leave request submitted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/time-off/requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/time-off/balances'] });
    },
    onError: (error: Error) => {
      setIsSubmitting(false);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      leaveType: formData.get('leaveType'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      reason: formData.get('reason'),
    };
    
    createLeaveRequestMutation.mutate(data);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="mb-4">
          <Calendar className="mr-2 h-4 w-4" />
          Request Time Off
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Time Off Request</DialogTitle>
          <DialogDescription>
            Fill out the form below to submit a new time off request.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="leaveType" className="text-right">
                Leave Type
              </Label>
              <Select name="leaveType" required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Casual">Casual Leave</SelectItem>
                  <SelectItem value="Medical">Medical Leave</SelectItem>
                  <SelectItem value="Annual">Annual Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Start Date
              </Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                End Date
              </Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">
                Reason
              </Label>
              <Textarea
                id="reason"
                name="reason"
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LeaveRequestsTable() {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [action, setAction] = useState<'approve' | 'reject' | 'cancel' | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: leaveRequests, isLoading, error } = useQuery<LeaveRequest[]>({
    queryKey: ['/api/time-off/requests'],
    queryFn: async () => {
      const response = await fetch('/api/time-off/requests');
      if (!response.ok) {
        throw new Error('Failed to fetch leave requests');
      }
      return response.json();
    },
  });

  const approveRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await apiRequest('PATCH', `/api/time-off/requests/${requestId}`, { status: 'Approved' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve leave request');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Leave request approved successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/time-off/requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/time-off/balances'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: number, reason: string }) => {
      const response = await apiRequest('PATCH', `/api/time-off/requests/${requestId}`, { 
        status: 'Rejected',
        rejectionReason: reason 
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject leave request');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Leave request rejected',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/time-off/requests'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const cancelRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await apiRequest('POST', `/api/time-off/requests/${requestId}/cancel`, {});
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel leave request');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Leave request cancelled',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/time-off/requests'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAction = (leaveRequest: LeaveRequest, actionType: 'approve' | 'reject' | 'cancel') => {
    setSelectedRequest(leaveRequest);
    setAction(actionType);
    setIsAlertOpen(true);
  };

  const handleConfirmAction = () => {
    if (!selectedRequest || !action) return;
    
    if (action === 'approve') {
      approveRequestMutation.mutate(selectedRequest.id);
    } else if (action === 'reject') {
      rejectRequestMutation.mutate({ 
        requestId: selectedRequest.id, 
        reason: rejectionReason 
      });
    } else if (action === 'cancel') {
      cancelRequestMutation.mutate(selectedRequest.id);
    }
    
    setIsAlertOpen(false);
    setSelectedRequest(null);
    setAction(null);
    setRejectionReason("");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 border border-red-200 rounded">
        Error: {(error as Error).message}
      </div>
    );
  }

  if (!leaveRequests || leaveRequests.length === 0) {
    return (
      <div className="text-center p-8 border border-dashed rounded-md">
        <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">No time off requests found</h3>
        <p className="text-muted-foreground">Submit a new request using the button above.</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Leave Type</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Days</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaveRequests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>{request.leaveType}</TableCell>
              <TableCell>{format(new Date(request.startDate), 'MMM dd, yyyy')}</TableCell>
              <TableCell>{format(new Date(request.endDate), 'MMM dd, yyyy')}</TableCell>
              <TableCell>{request.totalDays}</TableCell>
              <TableCell>
                <LeaveStatusBadge status={request.status} />
              </TableCell>
              <TableCell>{request.reason}</TableCell>
              <TableCell>
                {request.status === 'Pending' && (
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleAction(request, 'approve')}
                    >
                      <FileCheck className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleAction(request, 'reject')}
                    >
                      <Ban className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action === 'approve' && 'Approve Leave Request'}
              {action === 'reject' && 'Reject Leave Request'}
              {action === 'cancel' && 'Cancel Leave Request'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {action === 'approve' && 
                'Are you sure you want to approve this leave request?'}
              {action === 'reject' && 
                'Please provide a reason for rejecting this leave request.'}
              {action === 'cancel' && 
                'Are you sure you want to cancel this leave request?'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {action === 'reject' && (
            <div className="py-4">
              <Textarea
                placeholder="Reason for rejection"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full"
                required
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmAction}
              disabled={action === 'reject' && !rejectionReason.trim()}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function LeaveBalanceCard() {
  const { data: leaveBalance, isLoading, error } = useQuery<LeaveBalance>({
    queryKey: ['/api/time-off/balances'],
    queryFn: async () => {
      const response = await fetch('/api/time-off/balances');
      if (!response.ok) {
        throw new Error('Failed to fetch leave balance');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Balance...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Failed to load leave balance</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{(error as Error).message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!leaveBalance) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Data</CardTitle>
          <CardDescription>No leave balance information found</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const currentYear = new Date().getFullYear();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Balance ({leaveBalance.year || currentYear})</CardTitle>
        <CardDescription>Your current leave balance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Casual Leave</h3>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Used</span>
              <span>{leaveBalance.casualLeaveUsed} days</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground">Balance</span>
              <span className="font-bold">{leaveBalance.casualLeaveBalance} days</span>
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Medical Leave</h3>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Used</span>
              <span>{leaveBalance.medicalLeaveUsed} days</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground">Balance</span>
              <span className="font-bold">{leaveBalance.medicalLeaveBalance} days</span>
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Annual Leave</h3>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Used</span>
              <span>{leaveBalance.annualLeaveUsed} days</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground">Balance</span>
              <span className="font-bold">{leaveBalance.annualLeaveBalance} days</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        {leaveBalance.lastUpdated && (
          <p>Last updated: {format(new Date(leaveBalance.lastUpdated), 'MMM dd, yyyy')}</p>
        )}
      </CardFooter>
    </Card>
  );
}

function LeaveCalendar() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Calendar</CardTitle>
        <CardDescription>View upcoming time off across the team</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center p-12">
          <CalendarDays className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Calendar Coming Soon</h3>
          <p className="text-muted-foreground">This feature is currently under development.</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TimeOffPage() {
  return (
    <PageLayout
      title="Time Off Management"
      description="Submit and manage time off requests"
    >
      <div className="space-y-6">
        <LeaveBalanceCard />
        
        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="requests">My Requests</TabsTrigger>
            <TabsTrigger value="calendar">Team Calendar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="requests" className="mt-6">
            <div className="flex justify-end">
              <NewLeaveRequestForm />
            </div>
            <LeaveRequestsTable />
          </TabsContent>
          
          <TabsContent value="calendar" className="mt-6">
            <LeaveCalendar />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}