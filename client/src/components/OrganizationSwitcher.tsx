import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Organization {
  id: number;
  name: string;
  code: string;
  active: boolean;
}

export function OrganizationSwitcher() {
  const [open, setOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const { toast } = useToast();

  // Fetch organizations the user has access to
  const { data: organizations = [], isLoading } = useQuery<Organization[]>({
    queryKey: ['/api/auth/user-organizations'],
    staleTime: 60000 // 1 minute
  });

  // Fetch current organization
  const { data: currentOrg, isLoading: isLoadingCurrent } = useQuery<Organization>({
    queryKey: ['/api/organizations/current'],
    staleTime: 60000 // 1 minute
  });

  // Update selected org when current org is loaded
  useEffect(() => {
    if (currentOrg) {
      setSelectedOrg(currentOrg);
    }
  }, [currentOrg]);

  const switchOrganization = async (orgId: number) => {
    try {
      await apiRequest('GET', `/api/auth/switch?orgId=${orgId}`);
      
      // Invalidate queries that might have organization-specific data
      queryClient.invalidateQueries({ queryKey: ['/api/organizations/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/loads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      
      toast({
        title: "Organization switched",
        description: "Successfully switched to the selected organization",
      });
      
      // Close the popover
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error switching organization",
        description: "Failed to switch organization",
        variant: "destructive",
      });
    }
  };

  if (isLoading || isLoadingCurrent) {
    return (
      <Button variant="outline" className="w-full justify-between opacity-70" disabled>
        <span className="truncate">Loading...</span>
      </Button>
    );
  }

  if (!organizations || organizations.length === 0) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate">
            {selectedOrg ? selectedOrg.name : "Select organization"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput placeholder="Search organization..." />
          <CommandEmpty>No organization found.</CommandEmpty>
          <CommandGroup>
            {organizations.map((org) => (
              <CommandItem
                key={org.id}
                value={org.name}
                onSelect={() => {
                  setSelectedOrg(org);
                  switchOrganization(org.id);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedOrg?.id === org.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {org.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}