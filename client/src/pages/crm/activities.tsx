import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, Activity, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { generateQueryKey } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { ErrorState } from '@/components/ui/error-state';
import PageLayout from '@/components/layout/PageLayout';

export default function ActivitiesPage() {
  const { data: activities, isLoading, error, refetch } = useQuery({
    queryKey: generateQueryKey('/api/crm/activities'),
    retry: 2
  });

  const handleCreateActivity = () => {
    // TODO: Implement activity creation
  };

  if (isLoading) {
    return (
      <PageLayout 
        title="Activities" 
        description="Track all interactions with clients"
        actionLabel="Add Activity"
        onAction={handleCreateActivity}
      >
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout 
        title="Activities" 
        description="Track all interactions with clients"
        actionLabel="Add Activity"
        onAction={handleCreateActivity}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4"
        >
          <ErrorState 
            title="Error Loading Activities"
            message="There was a problem loading your activities. Please try again."
            onRetry={refetch}
            error={error}
          />
        </motion.div>
      </PageLayout>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <PageLayout 
        title="Activities" 
        description="Track all interactions with clients"
        actionLabel="Add Activity"
        onAction={handleCreateActivity}
      >
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="text-xl mb-2">No Activities Yet</CardTitle>
            <p className="text-muted-foreground mb-6">
              Start tracking your client interactions by creating your first activity.
            </p>
            <Button 
              onClick={handleCreateActivity}
              className="bg-[#025E73] hover:bg-[#025E73]/90 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create First Activity
            </Button>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Activities" 
      description="Track all interactions with clients"
      actionLabel="Add Activity"
      onAction={handleCreateActivity}
    >
      <div className="space-y-4">
        {activities.map((activity) => (
          <Card key={activity.id}>
            <CardHeader>
              <CardTitle>{activity.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Activity content rendering */}
            </CardContent>
          </Card>
        ))}
      </div>
    </PageLayout>
  );
}