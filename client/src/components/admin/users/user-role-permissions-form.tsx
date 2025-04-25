import { useState, useEffect } from "react";
import { User, Role } from "@shared/schema";
import { useUserManagement } from "@/hooks/use-user-management";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ShieldAlert, Shield, Users, FileSpreadsheet, ClipboardList, CreditCard, Settings } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

type UserRolePermissionsFormProps = {
  user: User;
  roles: Role[];
  onClose: () => void;
};

// Enhanced permissions interface
interface EnhancedPermissions {
  // Base permissions
  canViewCRM: boolean;
  canEditLeads: boolean;
  canViewInvoices: boolean;
  canApprovePayroll: boolean;
  canManageUsers: boolean;
  
  // System administration
  isSystemAdmin: boolean;
  canManageRoles: boolean;
  canAccessAllOrgs: boolean;
  canManageSettings: boolean;
  canViewAuditLog: boolean;
  
  // CRM permissions
  canManageLeadAssignments: boolean;
  canDeleteLeads: boolean;
  canExportLeads: boolean;
  
  // Finance permissions
  canCreateInvoices: boolean;
  canApproveInvoices: boolean;
  canManageAccounting: boolean;
  
  // Dispatch permissions
  canManageLoads: boolean;
  canManageCarriers: boolean;
  canApproveDispatchReports: boolean;
}

export function UserRolePermissionsForm({
  user,
  roles,
  onClose,
}: UserRolePermissionsFormProps) {
  const { updateUserMutation } = useUserManagement();
  const [selectedRoleId, setSelectedRoleId] = useState<number>(user.roleId);
  const [activeTab, setActiveTab] = useState("general");
  
  // Enhanced permissions state
  const [permissions, setPermissions] = useState<EnhancedPermissions>({
    // Base permissions
    canViewCRM: user.canViewCRM || false,
    canEditLeads: user.canEditLeads || false,
    canViewInvoices: user.canViewInvoices || false,
    canApprovePayroll: user.canApprovePayroll || false,
    canManageUsers: user.canManageUsers || false,
    
    // System administration
    isSystemAdmin: user.isSystemAdmin || false,
    canManageRoles: user.canManageRoles || false,
    canAccessAllOrgs: user.canAccessAllOrgs || false,
    canManageSettings: user.canManageSettings || false,
    canViewAuditLog: user.canViewAuditLog || false,
    
    // CRM permissions
    canManageLeadAssignments: user.canManageLeadAssignments || false,
    canDeleteLeads: user.canDeleteLeads || false,
    canExportLeads: user.canExportLeads || false,
    
    // Finance permissions
    canCreateInvoices: user.canCreateInvoices || false,
    canApproveInvoices: user.canApproveInvoices || false,
    canManageAccounting: user.canManageAccounting || false,
    
    // Dispatch permissions
    canManageLoads: user.canManageLoads || false,
    canManageCarriers: user.canManageCarriers || false,
    canApproveDispatchReports: user.canApproveDispatchReports || false,
  });

  const handleRoleChange = (roleId: string) => {
    setSelectedRoleId(parseInt(roleId));
    
    // Auto-set system admin to true if administrator role is selected
    const role = roles.find(r => r.id === parseInt(roleId));
    if (role && role.name.toLowerCase() === "administrator") {
      setPermissions(prev => ({
        ...prev,
        isSystemAdmin: true,
        canManageRoles: true,
        canAccessAllOrgs: true,
        canManageSettings: true,
        canViewAuditLog: true,
      }));
    }
  };

  const handlePermissionChange = (permission: keyof EnhancedPermissions, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: value,
    }));
    
    // Auto-enable/disable related permissions
    if (permission === 'isSystemAdmin' && value === true) {
      setPermissions(prev => ({
        ...prev,
        canManageRoles: true,
        canAccessAllOrgs: true,
        canManageSettings: true,
        canViewAuditLog: true,
        canManageUsers: true,
      }));
    } else if (permission === 'isSystemAdmin' && value === false) {
      setPermissions(prev => ({
        ...prev,
        canManageRoles: false,
        canAccessAllOrgs: false,
        canManageSettings: false,
      }));
    }
  };

  const handleSave = async () => {
    await updateUserMutation.mutateAsync({
      id: user.id,
      userData: {
        roleId: selectedRoleId,
        ...permissions,
      },
    });
    onClose();
  };

  const selectedRole = roles.find((role) => role.id === selectedRoleId);

  // Permission descriptions by category
  const permissionDescriptions = {
    // General
    canViewCRM: "Access to view customer relationship management data including leads and contacts",
    canEditLeads: "Ability to create, edit, and manage leads in the system",
    canViewInvoices: "Access to view invoices and billing information",
    canApprovePayroll: "Authority to approve payroll and commissions",
    canManageUsers: "Administrative privileges to manage users and their access",
    
    // System Administration
    isSystemAdmin: "Grants super-admin privileges with full system access and configuration control",
    canManageRoles: "Ability to create, modify, and assign roles throughout the system",
    canAccessAllOrgs: "Access to view and manage data across all organizations in the system",
    canManageSettings: "Authority to modify system configuration and global settings",
    canViewAuditLog: "Access to view the system audit log of all user actions",
    
    // CRM
    canManageLeadAssignments: "Ability to assign and reassign leads between team members",
    canDeleteLeads: "Authority to permanently delete lead records from the system",
    canExportLeads: "Permission to export lead data for external use",
    
    // Finance
    canCreateInvoices: "Ability to generate new invoices for clients",
    canApproveInvoices: "Authority to review and approve invoices before sending",
    canManageAccounting: "Full access to accounting features and financial reporting",
    
    // Dispatch
    canManageLoads: "Authority to create, modify, and assign delivery loads",
    canManageCarriers: "Ability to add, modify, and manage carrier relationships",
    canApproveDispatchReports: "Permission to review and approve dispatch reports"
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="role-select">User Role</Label>
        <Select
          value={selectedRoleId.toString()}
          onValueChange={handleRoleChange}
        >
          <SelectTrigger id="role-select">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id.toString()}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedRole && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-brandTeal">Role Details</CardTitle>
            <CardDescription>
              {selectedRole.name} (Level {selectedRole.level}) - {selectedRole.department} department
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-sm font-medium">Role Permissions:</div>
              <div className="flex flex-wrap gap-1">
                {selectedRole.permissions.map((permission, index) => (
                  <Badge 
                    key={index}
                    variant="outline"
                    className="bg-brandYellow/10 border-brandYellow/30 text-xs">
                    {permission}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="general" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-1">
              <ShieldAlert className="h-4 w-4" />
              <span className="hidden sm:inline">System Admin</span>
            </TabsTrigger>
            <TabsTrigger value="crm" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">CRM</span>
            </TabsTrigger>
            <TabsTrigger value="finance" className="flex items-center gap-1">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Finance</span>
            </TabsTrigger>
            <TabsTrigger value="dispatch" className="flex items-center gap-1">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Dispatch</span>
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[400px] pr-4">
            <TabsContent value="general" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-brandTeal text-xl flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    General Permissions
                  </CardTitle>
                  <CardDescription>
                    Basic permissions for system access
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries({
                      canViewCRM: permissions.canViewCRM,
                      canEditLeads: permissions.canEditLeads,
                      canViewInvoices: permissions.canViewInvoices,
                      canApprovePayroll: permissions.canApprovePayroll,
                      canManageUsers: permissions.canManageUsers
                    }).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex flex-row items-center justify-between rounded-lg border p-4"
                      >
                        <div className="space-y-0.5">
                          <Label className="text-base">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </Label>
                          <div className="text-sm text-muted-foreground">
                            {permissionDescriptions[key as keyof typeof permissionDescriptions]}
                          </div>
                        </div>
                        <Switch
                          checked={value}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(key as keyof EnhancedPermissions, checked)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-brandPlum text-xl flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5" />
                    System Administration
                  </CardTitle>
                  <CardDescription>
                    Advanced permissions for system configuration and management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries({
                      isSystemAdmin: permissions.isSystemAdmin,
                      canManageRoles: permissions.canManageRoles,
                      canAccessAllOrgs: permissions.canAccessAllOrgs,
                      canManageSettings: permissions.canManageSettings,
                      canViewAuditLog: permissions.canViewAuditLog
                    }).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex flex-row items-center justify-between rounded-lg border p-4"
                      >
                        <div className="space-y-0.5">
                          <Label className="text-base">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            {key === 'isSystemAdmin' && (
                              <Badge className="ml-2 bg-brandPlum text-white">
                                Super Admin
                              </Badge>
                            )}
                          </Label>
                          <div className="text-sm text-muted-foreground">
                            {permissionDescriptions[key as keyof typeof permissionDescriptions]}
                          </div>
                        </div>
                        <Switch
                          checked={value}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(key as keyof EnhancedPermissions, checked)
                          }
                          className={key === 'isSystemAdmin' ? 'data-[state=checked]:bg-brandPlum border-brandPlum' : ''}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="crm" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-brandTeal text-xl flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    CRM Permissions
                  </CardTitle>
                  <CardDescription>
                    Permissions for customer relationship management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries({
                      canManageLeadAssignments: permissions.canManageLeadAssignments,
                      canDeleteLeads: permissions.canDeleteLeads,
                      canExportLeads: permissions.canExportLeads
                    }).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex flex-row items-center justify-between rounded-lg border p-4"
                      >
                        <div className="space-y-0.5">
                          <Label className="text-base">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </Label>
                          <div className="text-sm text-muted-foreground">
                            {permissionDescriptions[key as keyof typeof permissionDescriptions]}
                          </div>
                        </div>
                        <Switch
                          checked={value}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(key as keyof EnhancedPermissions, checked)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="finance" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-brandTeal text-xl flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Finance Permissions
                  </CardTitle>
                  <CardDescription>
                    Permissions for financial management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries({
                      canCreateInvoices: permissions.canCreateInvoices,
                      canApproveInvoices: permissions.canApproveInvoices,
                      canManageAccounting: permissions.canManageAccounting
                    }).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex flex-row items-center justify-between rounded-lg border p-4"
                      >
                        <div className="space-y-0.5">
                          <Label className="text-base">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </Label>
                          <div className="text-sm text-muted-foreground">
                            {permissionDescriptions[key as keyof typeof permissionDescriptions]}
                          </div>
                        </div>
                        <Switch
                          checked={value}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(key as keyof EnhancedPermissions, checked)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dispatch" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-brandTeal text-xl flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Dispatch Permissions
                  </CardTitle>
                  <CardDescription>
                    Permissions for dispatch management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries({
                      canManageLoads: permissions.canManageLoads,
                      canManageCarriers: permissions.canManageCarriers,
                      canApproveDispatchReports: permissions.canApproveDispatchReports
                    }).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex flex-row items-center justify-between rounded-lg border p-4"
                      >
                        <div className="space-y-0.5">
                          <Label className="text-base">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </Label>
                          <div className="text-sm text-muted-foreground">
                            {permissionDescriptions[key as keyof typeof permissionDescriptions]}
                          </div>
                        </div>
                        <Switch
                          checked={value}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(key as keyof EnhancedPermissions, checked)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={updateUserMutation.isPending}
          className="bg-brandTeal hover:bg-brandTeal/90"
        >
          {updateUserMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}