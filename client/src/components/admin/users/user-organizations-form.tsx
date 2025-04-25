import { useState, useEffect } from "react";
import { User, Organization } from "@shared/schema";
import { useUserManagement } from "@/hooks/use-user-management";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type UserOrganizationsFormProps = {
  user: User;
  organizations: Organization[];
  onClose: () => void;
};

export function UserOrganizationsForm({
  user,
  organizations,
  onClose,
}: UserOrganizationsFormProps) {
  const { getUserOrganizations, updateUserOrganizationsMutation } = useUserManagement();
  const { data: userOrganizations, isLoading } = getUserOrganizations(user.id);
  const [selectedOrgIds, setSelectedOrgIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (userOrganizations) {
      setSelectedOrgIds(userOrganizations.map((org) => org.id));
    }
  }, [userOrganizations]);

  const filteredOrganizations = organizations.filter((org) => 
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggle = (orgId: number) => {
    setSelectedOrgIds((prev) =>
      prev.includes(orgId)
        ? prev.filter((id) => id !== orgId)
        : [...prev, orgId]
    );
  };

  const handleSave = async () => {
    await updateUserOrganizationsMutation.mutateAsync({
      userId: user.id,
      organizationIds: selectedOrgIds,
    });
    onClose();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 text-brandTeal animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Search className="w-4 h-4 text-gray-500" />
        <Input
          placeholder="Search organizations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
      </div>

      <div className="text-sm text-gray-500 mb-2">
        Select the organizations this user can access:
      </div>

      <ScrollArea className="h-60 border rounded-md p-4">
        <div className="space-y-2">
          {filteredOrganizations.map((org) => (
            <div
              key={org.id}
              className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
            >
              <Checkbox
                id={`org-${org.id}`}
                checked={selectedOrgIds.includes(org.id)}
                onCheckedChange={() => handleToggle(org.id)}
              />
              <Label
                htmlFor={`org-${org.id}`}
                className="flex-1 flex justify-between cursor-pointer"
              >
                <span className="font-medium">{org.name}</span>
                <span className="text-xs text-gray-500">{org.code}</span>
              </Label>
            </div>
          ))}

          {filteredOrganizations.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No organizations found matching your search
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex justify-between items-center pt-4">
        <div className="text-sm">
          <span className="font-medium">
            {selectedOrgIds.length} of {organizations.length}
          </span>{" "}
          organizations selected
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() => setSelectedOrgIds(organizations.map((org) => org.id))}
            type="button"
            size="sm"
          >
            Select All
          </Button>
          <Button
            variant="outline"
            onClick={() => setSelectedOrgIds([])}
            type="button"
            size="sm"
          >
            Clear All
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={updateUserOrganizationsMutation.isPending}
          className="bg-brandTeal hover:bg-brandTeal/90"
        >
          {updateUserOrganizationsMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}