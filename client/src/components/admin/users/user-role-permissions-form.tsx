import { useState } from "react";
import { User, Role } from "@shared/schema";
import { useUserManagement } from "@/hooks/use-user-management";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
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
} from "@/components/ui/card";

type UserRolePermissionsFormProps = {
  user: User;
  roles: Role[];
  onClose: () => void;
};

export function UserRolePermissionsForm({
  user,
  roles,
  onClose,
}: UserRolePermissionsFormProps) {
  const { updateUserMutation } = useUserManagement();
  const [selectedRoleId, setSelectedRoleId] = useState<number>(user.roleId);
  const [permissions, setPermissions] = useState({
    canViewCRM: user.canViewCRM || false,
    canEditLeads: user.canEditLeads || false,
    canViewInvoices: user.canViewInvoices || false,
    canApprovePayroll: user.canApprovePayroll || false,
    canManageUsers: user.canManageUsers || false,
  });

  const handleRoleChange = (roleId: string) => {
    setSelectedRoleId(parseInt(roleId));
  };

  const handlePermissionChange = (permission: keyof typeof permissions, value: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [permission]: value,
    }));
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

  const permissionDescriptions = {
    canViewCRM: "Access to view customer relationship management data including leads and contacts",
    canEditLeads: "Ability to create, edit, and manage leads in the system",
    canViewInvoices: "Access to view invoices and billing information",
    canApprovePayroll: "Authority to approve payroll and commissions",
    canManageUsers: "Administrative privileges to manage users and their access",
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
              <div className="text-sm font-medium">Permissions:</div>
              <div className="flex flex-wrap gap-1">
                {selectedRole.permissions.map((permission, index) => (
                  <div
                    key={index}
                    className="px-2 py-1 bg-brandYellow/10 text-brandNavy rounded-md text-xs"
                  >
                    {permission}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="pt-6">
        <div className="text-lg font-semibold mb-4 text-brandNavy">Additional Permissions</div>
        
        <div className="space-y-4">
          {Object.entries(permissions).map(([key, value]) => (
            <div
              key={key}
              className="flex flex-row items-center justify-between rounded-lg border p-4"
            >
              <div className="space-y-0.5">
                <Label className="text-base">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Label>
                <div className="text-sm text-muted-foreground">
                  {permissionDescriptions[key as keyof typeof permissions]}
                </div>
              </div>
              <Switch
                checked={value}
                onCheckedChange={(checked) =>
                  handlePermissionChange(key as keyof typeof permissions, checked)
                }
              />
            </div>
          ))}
        </div>
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