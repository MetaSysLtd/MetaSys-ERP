import { useEffect } from 'react';
import { useTitle } from '@/hooks/use-title';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { LeaderboardSection } from '@/components/leaderboard/LeaderboardSection';
import { Trophy, Download, RefreshCw } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export default function LeaderboardPage() {
  useTitle('Weekly Leaderboard');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Set up real-time updates if socket is available
  useEffect(() => {
    const setupLeaderboardUpdates = () => {
      // This is a placeholder for real-time updates
      // In a real implementation, we would subscribe to events like
      // 'leaderboard:updated', 'lead:created', 'load:created', etc.
      console.log('Setting up leaderboard real-time updates');
      
      return () => {
        console.log('Cleaning up leaderboard real-time updates');
      };
    };
    
    const cleanup = setupLeaderboardUpdates();
    return cleanup;
  }, []);
  
  const refreshLeaderboard = () => {
    // Invalidate all leaderboard queries to force a refresh
    queryClient.invalidateQueries({ queryKey: ['/api/leaderboard'] });
    
    toast({
      title: "Refreshed",
      description: "Leaderboard data has been refreshed.",
    });
  };
  
  // Optional: Export leaderboard data as CSV
  const exportLeaderboard = () => {
    // This is a placeholder for the export functionality
    toast({
      title: "Coming Soon",
      description: "Leaderboard export functionality will be available soon.",
    });
  };

  return (
    <div className="container max-w-7xl mx-auto py-6">
      <PageHeader
        title="Weekly Leaderboard"
        description="Track top performers by leads closed, loads booked, and overall contribution."
        icon={<Trophy className="h-6 w-6" />}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Leaderboard' }
        ]}
        actions={
          <>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshLeaderboard}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportLeaderboard}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </>
        }
      />
      
      <LeaderboardSection />
    </div>
  );
}