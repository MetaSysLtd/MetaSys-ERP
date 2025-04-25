
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import metaSysLogo from "@/assets/logos/MetaSys Logo-Light.png";
import { useTheme } from "@/hooks/use-theme";

export function Logo() {
  // Simplified logo component without dependencies on user role
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/">
            <img src={metaSysLogo} alt="MetaSys" className="h-10" />
          </Link>
        </TooltipTrigger>
        <TooltipContent>Go to Dashboard</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
