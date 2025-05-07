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
import { Switch } from '@/components/ui/switch';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, CalendarClock, Clock, FileText, UserCog } from 'lucide-react';
import { format } from 'date-fns';
import PageLayout from '@/components/layout/PageLayout';

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

type TimeTrackingPolicy = {
  id: number;
  orgId: number;
  name: string;
  description: string;
  policyLevel: 'Organization' | 'Department' | 'Team' | 'Employee';
  targetId: number;
  workHoursPerDay: number;
  workDaysPerWeek: number;
  flexibleHours: boolean;
  overtimeAllowed: boolean;
  maxOvertimeHours: number;
  active: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt?: string;
};

function PolicyStatusBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? 'default' : 'secondary'}>
      {active ? 'Active' : 'Inactive'}
    </Badge>
  );
}

function LeavePoliciesTable() {
  const { data: policies, isLoading, error } = useQuery<LeavePolicy[]>({
    queryKey: ['/api/hr/policies/leave'],
    queryFn: async () => {
      const response = await fetch('/api/hr/policies/leave');
      if (!response.ok) {
        throw new Error('Failed to fetch leave policies');
      }
      return response.json();
    },
  });

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

  if (!policies || policies.length === 0) {
    return (
      <div className="text-center p-8 border border-dashed rounded-md">
        <CalendarClock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">No leave policies found</h3>
        <p className="text-muted-foreground">Create a new policy using the button above.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Policy Name</TableHead>
          <TableHead>Level</TableHead>
          <TableHead>Casual Leave</TableHead>
          <TableHead>Medical Leave</TableHead>
          <TableHead>Annual Leave</TableHead>
          <TableHead>Carry Forward</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {policies.map((policy) => (
          <TableRow key={policy.id}>
            <TableCell className="font-medium">{policy.name}</TableCell>
            <TableCell>{policy.policyLevel}</TableCell>
            <TableCell>{policy.casualLeaveQuota} days</TableCell>
            <TableCell>{policy.medicalLeaveQuota} days</TableCell>
            <TableCell>{policy.annualLeaveQuota} days</TableCell>
            <TableCell>
              {policy.carryForwardEnabled ? 
                `Up to ${policy.maxCarryForward} days` : 
                'Not Allowed'}
            </TableCell>
            <TableCell>
              <PolicyStatusBadge active={policy.active} />
            </TableCell>
            <TableCell>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function NewLeavePolicyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [carryForwardEnabled, setCarryForwardEnabled] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPolicyMutation = useMutation({
    mutationFn: async (formData: any) => {
      const response = await apiRequest('POST', '/api/hr/policies/leave', formData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create leave policy');
      }
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitting(false);
      setIsDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Leave policy created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/hr/policies/leave'] });
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
      name: formData.get('name'),
      description: formData.get('description'),
      policyLevel: formData.get('policyLevel'),
      targetId: Number(formData.get('targetId')) || 0,
      casualLeaveQuota: Number(formData.get('casualLeaveQuota')),
      medicalLeaveQuota: Number(formData.get('medicalLeaveQuota')),
      annualLeaveQuota: Number(formData.get('annualLeaveQuota')),
      carryForwardEnabled,
      maxCarryForward: Number(formData.get('maxCarryForward')) || 0,
      active: true
    };
    
    createPolicyMutation.mutate(data);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="mb-4">
          <FileText className="mr-2 h-4 w-4" />
          Create Leave Policy
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Leave Policy</DialogTitle>
          <DialogDescription>
            Create a new leave policy for your organization.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Policy Name
              </Label>
              <Input
                id="name"
                name="name"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="policyLevel" className="text-right">
                Level
              </Label>
              <Select name="policyLevel" required defaultValue="Organization">
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select policy level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Organization">Organization</SelectItem>
                  <SelectItem value="Department">Department</SelectItem>
                  <SelectItem value="Team">Team</SelectItem>
                  <SelectItem value="Employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="targetId" className="text-right">
                Target ID
              </Label>
              <Input
                id="targetId"
                name="targetId"
                type="number"
                min="0"
                className="col-span-3"
                placeholder="0 for organization-wide"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="casualLeaveQuota" className="text-right">
                Casual Leave
              </Label>
              <div className="flex items-center gap-2 col-span-3">
                <Input
                  id="casualLeaveQuota"
                  name="casualLeaveQuota"
                  type="number"
                  min="0"
                  defaultValue="10"
                  required
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="medicalLeaveQuota" className="text-right">
                Medical Leave
              </Label>
              <div className="flex items-center gap-2 col-span-3">
                <Input
                  id="medicalLeaveQuota"
                  name="medicalLeaveQuota"
                  type="number"
                  min="0"
                  defaultValue="7"
                  required
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="annualLeaveQuota" className="text-right">
                Annual Leave
              </Label>
              <div className="flex items-center gap-2 col-span-3">
                <Input
                  id="annualLeaveQuota"
                  name="annualLeaveQuota"
                  type="number"
                  min="0"
                  defaultValue="15"
                  required
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="carryForwardEnabled" className="text-right">
                Carry Forward
              </Label>
              <div className="flex items-center gap-2 col-span-3">
                <Switch
                  id="carryForwardEnabled"
                  checked={carryForwardEnabled}
                  onCheckedChange={setCarryForwardEnabled}
                />
                <span className="text-sm text-muted-foreground">
                  Allow carrying forward unused leaves
                </span>
              </div>
            </div>
            
            {carryForwardEnabled && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="maxCarryForward" className="text-right">
                  Max Carry Forward
                </Label>
                <div className="flex items-center gap-2 col-span-3">
                  <Input
                    id="maxCarryForward"
                    name="maxCarryForward"
                    type="number"
                    min="0"
                    defaultValue="5"
                    required={carryForwardEnabled}
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Policy
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TimeTrackingPoliciesTable() {
  const { data: policies, isLoading, error } = useQuery<TimeTrackingPolicy[]>({
    queryKey: ['/api/hr/policies/time-tracking'],
    queryFn: async () => {
      const response = await fetch('/api/hr/policies/time-tracking');
      if (!response.ok) {
        throw new Error('Failed to fetch time tracking policies');
      }
      return response.json();
    },
  });

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

  if (!policies || policies.length === 0) {
    return (
      <div className="text-center p-8 border border-dashed rounded-md">
        <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">No time tracking policies found</h3>
        <p className="text-muted-foreground">Create a new policy using the button above.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Policy Name</TableHead>
          <TableHead>Level</TableHead>
          <TableHead>Work Hours</TableHead>
          <TableHead>Days Per Week</TableHead>
          <TableHead>Flexible Hours</TableHead>
          <TableHead>Overtime</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {policies.map((policy) => (
          <TableRow key={policy.id}>
            <TableCell className="font-medium">{policy.name}</TableCell>
            <TableCell>{policy.policyLevel}</TableCell>
            <TableCell>{policy.workHoursPerDay} hours</TableCell>
            <TableCell>{policy.workDaysPerWeek} days</TableCell>
            <TableCell>{policy.flexibleHours ? 'Yes' : 'No'}</TableCell>
            <TableCell>
              {policy.overtimeAllowed ? 
                `Up to ${policy.maxOvertimeHours} hours` : 
                'Not Allowed'}
            </TableCell>
            <TableCell>
              <PolicyStatusBadge active={policy.active} />
            </TableCell>
            <TableCell>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function NewTimeTrackingPolicyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [overtimeAllowed, setOvertimeAllowed] = useState(false);
  const [flexibleHours, setFlexibleHours] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPolicyMutation = useMutation({
    mutationFn: async (formData: any) => {
      const response = await apiRequest('POST', '/api/hr/policies/time-tracking', formData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create time tracking policy');
      }
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitting(false);
      setIsDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Time tracking policy created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/hr/policies/time-tracking'] });
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
      name: formData.get('name'),
      description: formData.get('description'),
      policyLevel: formData.get('policyLevel'),
      targetId: Number(formData.get('targetId')) || 0,
      workHoursPerDay: Number(formData.get('workHoursPerDay')),
      workDaysPerWeek: Number(formData.get('workDaysPerWeek')),
      flexibleHours,
      overtimeAllowed,
      maxOvertimeHours: Number(formData.get('maxOvertimeHours')) || 0,
      active: true
    };
    
    createPolicyMutation.mutate(data);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="mb-4">
          <Clock className="mr-2 h-4 w-4" />
          Create Time Tracking Policy
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Time Tracking Policy</DialogTitle>
          <DialogDescription>
            Create a new time tracking policy for your organization.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Policy Name
              </Label>
              <Input
                id="name"
                name="name"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="policyLevel" className="text-right">
                Level
              </Label>
              <Select name="policyLevel" required defaultValue="Organization">
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select policy level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Organization">Organization</SelectItem>
                  <SelectItem value="Department">Department</SelectItem>
                  <SelectItem value="Team">Team</SelectItem>
                  <SelectItem value="Employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="targetId" className="text-right">
                Target ID
              </Label>
              <Input
                id="targetId"
                name="targetId"
                type="number"
                min="0"
                className="col-span-3"
                placeholder="0 for organization-wide"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="workHoursPerDay" className="text-right">
                Work Hours
              </Label>
              <div className="flex items-center gap-2 col-span-3">
                <Input
                  id="workHoursPerDay"
                  name="workHoursPerDay"
                  type="number"
                  min="1"
                  max="24"
                  defaultValue="8"
                  required
                />
                <span className="text-sm text-muted-foreground">hours per day</span>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="workDaysPerWeek" className="text-right">
                Work Days
              </Label>
              <div className="flex items-center gap-2 col-span-3">
                <Input
                  id="workDaysPerWeek"
                  name="workDaysPerWeek"
                  type="number"
                  min="1"
                  max="7"
                  defaultValue="5"
                  required
                />
                <span className="text-sm text-muted-foreground">days per week</span>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="flexibleHours" className="text-right">
                Flexible Hours
              </Label>
              <div className="flex items-center gap-2 col-span-3">
                <Switch
                  id="flexibleHours"
                  checked={flexibleHours}
                  onCheckedChange={setFlexibleHours}
                />
                <span className="text-sm text-muted-foreground">
                  Allow flexible working hours
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="overtimeAllowed" className="text-right">
                Overtime
              </Label>
              <div className="flex items-center gap-2 col-span-3">
                <Switch
                  id="overtimeAllowed"
                  checked={overtimeAllowed}
                  onCheckedChange={setOvertimeAllowed}
                />
                <span className="text-sm text-muted-foreground">
                  Allow overtime hours
                </span>
              </div>
            </div>
            
            {overtimeAllowed && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="maxOvertimeHours" className="text-right">
                  Max Overtime
                </Label>
                <div className="flex items-center gap-2 col-span-3">
                  <Input
                    id="maxOvertimeHours"
                    name="maxOvertimeHours"
                    type="number"
                    min="0"
                    defaultValue="10"
                    required={overtimeAllowed}
                  />
                  <span className="text-sm text-muted-foreground">hours per week</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Policy
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AssignPolicyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const assignPolicyMutation = useMutation({
    mutationFn: async (formData: any) => {
      const response = await apiRequest('POST', '/api/hr/policies/assign', formData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign policy');
      }
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitting(false);
      setIsDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Policy assigned successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/hr/policies/assignments'] });
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
      policyId: Number(formData.get('policyId')),
      targetType: formData.get('targetType'),
      targetId: Number(formData.get('targetId')),
    };
    
    assignPolicyMutation.mutate(data);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="mb-4" variant="outline">
          <UserCog className="mr-2 h-4 w-4" />
          Assign Policy
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Policy</DialogTitle>
          <DialogDescription>
            Assign a policy to a department, team, or employee.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="policyId" className="text-right">
                Policy
              </Label>
              <Input
                id="policyId"
                name="policyId"
                type="number"
                min="1"
                className="col-span-3"
                required
                placeholder="Enter policy ID"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="targetType" className="text-right">
                Target Type
              </Label>
              <Select name="targetType" required defaultValue="Employee">
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select target type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Department">Department</SelectItem>
                  <SelectItem value="Team">Team</SelectItem>
                  <SelectItem value="Employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="targetId" className="text-right">
                Target ID
              </Label>
              <Input
                id="targetId"
                name="targetId"
                type="number"
                min="1"
                className="col-span-3"
                required
                placeholder="Enter ID of department/team/employee"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign Policy
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function HRPoliciesPage() {
  return (
    <PageLayout
      title="HR Policies"
      description="Manage leave and time tracking policies"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Policy Management</CardTitle>
            <CardDescription>
              Create and manage policies for leave and time tracking. Assign policies to departments, teams, or individual employees.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-6">
              Policies define the rules for leave entitlements and time tracking requirements.
              Organization-level policies apply to everyone, while more specific policies override
              organization-wide settings for the targeted department, team, or employee.
            </p>
            
            <div className="flex justify-end space-x-4 mb-4">
              <AssignPolicyForm />
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="leave" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="leave">Leave Policies</TabsTrigger>
            <TabsTrigger value="timetracking">Time Tracking Policies</TabsTrigger>
          </TabsList>
          
          <TabsContent value="leave" className="mt-6">
            <div className="flex justify-end">
              <NewLeavePolicyForm />
            </div>
            <LeavePoliciesTable />
          </TabsContent>
          
          <TabsContent value="timetracking" className="mt-6">
            <div className="flex justify-end">
              <NewTimeTrackingPolicyForm />
            </div>
            <TimeTrackingPoliciesTable />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}