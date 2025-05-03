import { useEffect } from "react";
import { useTitle } from "@/hooks/use-title";
import { LeaderboardSection } from "@/components/leaderboard/LeaderboardSection";
import { PageHeader } from "@/components/ui/page-header";
import { Clipboard, UsersRound, LineChart } from "lucide-react";

export default function LeaderboardPage() {
  // Set the page title
  useTitle("Weekly Leaderboards | MetaSys ERP");
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <PageHeader 
        title="Weekly Leaderboards" 
        description="Track performance across Sales and Dispatch departments"
        icon={<LineChart className="h-8 w-8 text-primary" />}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <UsersRound className="h-4 w-4" />
            <span>Compare team performance</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clipboard className="h-4 w-4" />
            <span>Based on leads closed and loads booked</span>
          </div>
        </div>
      </PageHeader>
      
      <LeaderboardSection />
    </div>
  );
}