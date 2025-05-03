import { createContext, ReactNode, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "../lib/queryClient";

interface Organization {
  id: number;
  name: string;
  code: string;
  active: boolean;
  address?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  logoUrl?: string | null;
  enabledModules?: string[] | null;
  createdAt: string;
  updatedAt: string;
}

interface OrganizationContextType {
  organization: Organization | null;
  isLoading: boolean;
  error: Error | null;
}

export const OrganizationContext = createContext<OrganizationContextType | null>(null);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const {
    data: organization,
    error,
    isLoading,
  } = useQuery<Organization, Error>({
    queryKey: ["/api/organization/current"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  return (
    <OrganizationContext.Provider
      value={{
        organization: organization || null,
        isLoading,
        error,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
}