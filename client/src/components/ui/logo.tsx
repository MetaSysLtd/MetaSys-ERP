
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import metioLogo from "@/assets/metio-logo.svg";

export function Logo() {
  const { user } = useAuth();
  const dashboardPath = user?.role?.department === "admin" ? "/admin/dashboard" : "/dashboard";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={dashboardPath}>
            <img src={metioLogo} alt="Metio" className="h-9" />
          </Link>
        </TooltipTrigger>
        <TooltipContent>Go to Dashboard</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
