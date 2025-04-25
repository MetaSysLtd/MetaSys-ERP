
import { Link } from "wouter";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { useAuth } from "@/hooks/use-auth";
import metaSysLogoDark from "@/assets/logos/logo-dark.png";

export function Logo() {
  const { user } = useAuth();
  
  // Determine correct dashboard path based on user role
  const getDashboardPath = () => {
    // Access role via the auth context using role object directly
    if (user && user.roleId >= 3) {
      return "/admin/dashboard";
    }
    return "/dashboard";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={getDashboardPath()}>
            <img src={metaSysLogoDark} alt="MetaSys" className="h-10" />
          </Link>
        </TooltipTrigger>
        <TooltipContent className="bg-[#F2A71B] text-white border-[#F2A71B]">
          Go to Dashboard
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
