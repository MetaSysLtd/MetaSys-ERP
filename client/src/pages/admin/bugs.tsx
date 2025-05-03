import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BugList } from "@/components/bugs/BugList";
import { BugDetail } from "@/components/bugs/BugDetail"; 
import { BugReportDialog } from "@/components/bugs/BugReportDialog";
import { PageHeader } from "@/components/ui/page-header";
import { Bug } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, BugIcon, ClipboardList } from "lucide-react";
import { useQueryErrorHandler } from "@/hooks/use-query-error-handler";
import { EmptyState } from "@/components/ui/empty-state";

export default function BugsPage() {
  const [selectedBug, setSelectedBug] = useState<Bug | null>(null);
  const [tab, setTab] = useState("all");
  const { handleError } = useQueryErrorHandler();

  // Fetch counts for each bug category
  const {
    data: bugCounts,
    isLoading: isCountsLoading,
  } = useQuery({
    queryKey: ["/api/bugs/counts"],
    onError: handleError,
  });

  // Handle bug selection for detail view
  const handleBugSelect = (bug: Bug) => {
    setSelectedBug(bug);
  };

  // Close detail view
  const handleCloseDetail = () => {
    setSelectedBug(null);
  };

  // Handle bug update
  const handleBugUpdate = () => {
    // Refetch bug data if needed
  };

  if (isCountsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Default counts if the API doesn't provide them yet
  const counts = bugCounts || {
    all: 0,
    new: 0,
    inProgress: 0,
    fixed: 0,
    closed: 0,
    reopened: 0,
    high: 0,
  };

  return (
    <div className="container py-6 space-y-6">
      <PageHeader
        title="Bug Management"
        description="View and manage all bug reports across the platform"
        actions={
          <BugReportDialog buttonVariant="default" />
        }
      />

      {selectedBug ? (
        <>
          <div className="mb-4">
            <Button variant="outline" onClick={handleCloseDetail}>
              Back to List
            </Button>
          </div>
          <BugDetail 
            bug={selectedBug} 
            onClose={handleCloseDetail}
            onUpdate={handleBugUpdate}
          />
        </>
      ) : (
        <>
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Total</h3>
                  <p className="text-2xl font-bold">{counts.all}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">New</h3>
                  <p className="text-2xl font-bold text-blue-500">{counts.new}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">In Progress</h3>
                  <p className="text-2xl font-bold text-amber-500">{counts.inProgress}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Fixed</h3>
                  <p className="text-2xl font-bold text-green-500">{counts.fixed}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Closed</h3>
                  <p className="text-2xl font-bold text-gray-500">{counts.closed}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">High Urgency</h3>
                  <p className="text-2xl font-bold text-red-500">{counts.high}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="all" onValueChange={setTab}>
            <TabsList className="grid grid-cols-6 mb-4 w-full sm:w-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="new">New</TabsTrigger>
              <TabsTrigger value="inProgress">In Progress</TabsTrigger>
              <TabsTrigger value="fixed">Fixed</TabsTrigger>
              <TabsTrigger value="closed">Closed</TabsTrigger>
              <TabsTrigger value="reopened">Reopened</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <BugList onBugSelect={handleBugSelect} />
            </TabsContent>
            
            <TabsContent value="new">
              <BugList onBugSelect={handleBugSelect} statusFilter="New" />
            </TabsContent>
            
            <TabsContent value="inProgress">
              <BugList onBugSelect={handleBugSelect} statusFilter="In Progress" />
            </TabsContent>
            
            <TabsContent value="fixed">
              <BugList onBugSelect={handleBugSelect} statusFilter="Fixed" />
            </TabsContent>
            
            <TabsContent value="closed">
              <BugList onBugSelect={handleBugSelect} statusFilter="Closed" />
            </TabsContent>
            
            <TabsContent value="reopened">
              <BugList onBugSelect={handleBugSelect} statusFilter="Reopened" />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}