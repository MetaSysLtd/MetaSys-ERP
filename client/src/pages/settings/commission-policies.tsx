import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableHeader, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  FileEdit, 
  Trash, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  ArrowUpDown,
  Eye,
  Settings,
  PieChart
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { CommissionPolicyEditor } from "@/components/settings";
import { apiRequest } from "@/lib/queryClient";

interface CommissionPolicy {
  id: number;
  type: string;
  activeLeadTable: Array<{activeleads: number; amount: number}>;
  inboundFactor: number;
  starterSplit: number;
  closerSplit: number;
  penaltyThreshold: number;
  penaltyFactor: number;
  teamLeadBonusAmount: number;
  isActive: boolean;
  orgId: number;
  updatedBy: number;
  updatedAt: string;
  createdAt: string;
}

export default function CommissionPoliciesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<CommissionPolicy | null>(null);
  const [policyType, setPolicyType] = useState<string | null>(null);

  // Fetch commission policies
  const {
    data: policies = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/commissions/policy'],
    queryFn: async () => {
      const res = await fetch('/api/commissions/policy');
      if (!res.ok) throw new Error('Failed to fetch commission policies');
      return res.json();
    },
  });

  // Delete policy mutation
  const deletePolicyMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/commissions/policy/${id}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete policy');
      }
      return id;
    },
    onSuccess: (id) => {
      toast({
        title: 'Policy deleted',
        description: 'Commission policy has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/commissions/policy'] });
      setShowDeleteDialog(false);
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete policy',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Activate policy mutation
  const activatePolicyMutation = useMutation({
    mutationFn: async ({ id, type }: { id: number; type: string }) => {
      const res = await apiRequest('PATCH', `/api/commissions/policy/${id}/activate`, { type });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to activate policy');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Policy activated',
        description: 'Commission policy has been activated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/commissions/policy'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to activate policy',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleViewPolicy = (policy: CommissionPolicy) => {
    setSelectedPolicy(policy);
    setShowViewDialog(true);
  };

  const handleEditPolicy = (policy: CommissionPolicy) => {
    setSelectedPolicy(policy);
    setShowEditDialog(true);
  };

  const handleDeletePolicy = (policy: CommissionPolicy) => {
    setSelectedPolicy(policy);
    setShowDeleteDialog(true);
  };

  const confirmDeletePolicy = () => {
    if (selectedPolicy) {
      deletePolicyMutation.mutate(selectedPolicy.id);
    }
  };

  const handleActivatePolicy = (policy: CommissionPolicy) => {
    activatePolicyMutation.mutate({
      id: policy.id,
      type: policy.type,
    });
  };

  const handleCreatePolicy = () => {
    setSelectedPolicy(null);
    setShowCreateDialog(true);
  };

  const filterByType = (type: string | null) => {
    setPolicyType(type);
  };

  // Filter policies by type if a type is selected
  const filteredPolicies = policyType
    ? policies.filter((policy: CommissionPolicy) => policy.type === policyType)
    : policies;

  return (
    <>
      <Helmet>
        <title>Commission Policies | MetaSys ERP</title>
      </Helmet>

      <div className="container mx-auto p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Commission Policies</h1>
            <p className="text-muted-foreground">
              Manage calculation rules for sales and dispatch commissions
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => filterByType(null)} 
              className={!policyType ? "bg-secondary/50" : ""}>
              All
            </Button>
            <Button variant="outline" onClick={() => filterByType("sales")} 
              className={policyType === "sales" ? "bg-secondary/50" : ""}>
              Sales
            </Button>
            <Button variant="outline" onClick={() => filterByType("dispatch")} 
              className={policyType === "dispatch" ? "bg-secondary/50" : ""}>
              Dispatch
            </Button>
            <Button onClick={handleCreatePolicy}>
              <Plus className="mr-2 h-4 w-4" /> Create Policy
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Commission Policy Management</CardTitle>
            <CardDescription>
              View and manage commission calculation policies for the organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="flex justify-center items-center py-8 text-red-500">
                <AlertTriangle className="h-6 w-6 mr-2" />
                <span>Failed to load commission policies</span>
              </div>
            ) : filteredPolicies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <PieChart className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-1">No Commission Policies Found</h3>
                <p className="mb-4">
                  {policyType 
                    ? `No ${policyType} policies have been created yet.` 
                    : "No commission policies have been created yet."}
                </p>
                <Button onClick={handleCreatePolicy}>
                  <Plus className="mr-2 h-4 w-4" /> Create Your First Policy
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          Base Amount
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>Split Ratio</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPolicies.map((policy: CommissionPolicy) => (
                      <TableRow key={policy.id}>
                        <TableCell className="font-medium">{policy.id}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            policy.type === "sales" 
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" 
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          }>
                            {policy.type.charAt(0).toUpperCase() + policy.type.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {policy.activeLeadTable && policy.activeLeadTable.length > 0 
                            ? `PKR ${policy.activeLeadTable[0].amount?.toLocaleString() || 0}+`
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {policy.type === "sales" 
                            ? `${Math.round(policy.starterSplit * 100)}/${Math.round(policy.closerSplit * 100)}`
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {policy.isActive ? (
                            <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(policy.updatedAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleViewPolicy(policy)}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEditPolicy(policy)}>
                              <FileEdit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            {!policy.isActive && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleActivatePolicy(policy)}
                                disabled={activatePolicyMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="sr-only">Activate</span>
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeletePolicy(policy)}
                              disabled={policy.isActive}
                            >
                              <Trash className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Policy Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create Commission Policy</DialogTitle>
            <DialogDescription>
              Set up a new commission policy for your organization
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <CommissionPolicyEditor />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Policy Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Commission Policy</DialogTitle>
            <DialogDescription>
              Modify the existing commission policy
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedPolicy && <CommissionPolicyEditor policyId={selectedPolicy.id} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* View Policy Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Commission Policy Details</DialogTitle>
            <DialogDescription>
              Detailed view of the commission policy
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedPolicy && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium mb-1">{selectedPolicy.type.charAt(0).toUpperCase() + selectedPolicy.type.slice(1)} Commission Policy</h3>
                    <Badge variant={selectedPolicy.isActive ? "default" : "outline"} className={
                      selectedPolicy.isActive 
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
                    }>
                      {selectedPolicy.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Last updated: {formatDate(selectedPolicy.updatedAt)}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Active Lead Tiers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedPolicy.activeLeadTable?.map((tier, index) => (
                          <div key={index} className="flex justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded">
                            <span>≥ {tier.activeleads} active leads</span>
                            <span className="font-medium">PKR {tier.amount?.toLocaleString() || 0}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Split Ratios</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded">
                          <span>Starter Split</span>
                          <span className="font-medium">{Math.round(selectedPolicy.starterSplit * 100)}%</span>
                        </div>
                        <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded">
                          <span>Closer Split</span>
                          <span className="font-medium">{Math.round(selectedPolicy.closerSplit * 100)}%</span>
                        </div>
                        <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded">
                          <span>Inbound Factor</span>
                          <span className="font-medium">{Math.round(selectedPolicy.inboundFactor * 100)}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="md:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Additional Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded">
                          <div className="text-sm text-muted-foreground mb-1">Penalty Threshold</div>
                          <div className="font-medium">{selectedPolicy.penaltyThreshold} call attempts</div>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded">
                          <div className="text-sm text-muted-foreground mb-1">Penalty Factor</div>
                          <div className="font-medium">{Math.round(selectedPolicy.penaltyFactor * 100)}% reduction</div>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded">
                          <div className="text-sm text-muted-foreground mb-1">Team Lead Bonus</div>
                          <div className="font-medium">PKR {selectedPolicy.teamLeadBonusAmount?.toLocaleString() || 0}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-row justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
            <Button onClick={() => {
              setShowViewDialog(false);
              if (selectedPolicy) handleEditPolicy(selectedPolicy);
            }}>Edit Policy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the commission policy. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeletePolicy}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deletePolicyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>Delete</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}