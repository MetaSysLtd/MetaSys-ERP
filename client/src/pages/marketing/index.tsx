import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MegaphoneIcon,
  FileText,
  Users,
  BarChart,
  PieChart,
  ChevronRight,
  Plus,
  MessageSquareText
} from "lucide-react";
import { MotionWrapper } from "@/components/ui/motion-wrapper-fixed";

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState("campaigns");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <MotionWrapper animation="fade-in" delay={0.1}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Marketing Management</h1>
          <p className="text-gray-600">Manage campaigns, content, and leads for marketing initiatives</p>
        </div>
      </MotionWrapper>

      <MotionWrapper animation="fade-up" delay={0.2}>
        <Tabs
          defaultValue="campaigns"
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="mb-4 bg-background">
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MegaphoneIcon className="h-4 w-4 mr-2" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-4 w-4 mr-2" />
              Content
            </TabsTrigger>
            <TabsTrigger value="leads" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="h-4 w-4 mr-2" />
              Leads
            </TabsTrigger>
          </TabsList>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="mt-0">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Active Campaigns</CardTitle>
                  <CardDescription>Currently running marketing campaigns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Running Campaigns</span>
                      <span className="text-2xl font-bold">4</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      <ChevronRight className="ml-auto h-4 w-4" />
                      View All Campaigns
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Campaign Performance</CardTitle>
                  <CardDescription>Track campaign metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Top Campaign</span>
                      <span className="text-md font-medium">Q2 Email Series</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      <BarChart className="mr-2 h-4 w-4" />
                      View Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Create Campaign</CardTitle>
                  <CardDescription>Start a new marketing campaign</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Draft Campaigns</span>
                      <span className="text-2xl font-bold">2</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Campaign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="mt-0">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Content Library</CardTitle>
                  <CardDescription>Browse marketing content assets</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Assets</span>
                      <span className="text-2xl font-bold">78</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      <ChevronRight className="ml-auto h-4 w-4" />
                      Browse Library
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Content Calendar</CardTitle>
                  <CardDescription>View scheduled content</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Upcoming Posts</span>
                      <span className="text-2xl font-bold">12</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      <ChevronRight className="ml-auto h-4 w-4" />
                      View Calendar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Create Content</CardTitle>
                  <CardDescription>Add new marketing content</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Content Types</span>
                      <span className="text-md font-medium">6 Categories</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Content
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads" className="mt-0">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Lead Overview</CardTitle>
                  <CardDescription>Marketing lead statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Leads</span>
                      <span className="text-2xl font-bold">253</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      <ChevronRight className="ml-auto h-4 w-4" />
                      View All Leads
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Lead Sources</CardTitle>
                  <CardDescription>Where your leads come from</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Top Source</span>
                      <span className="text-md font-medium">Website (42%)</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      <PieChart className="mr-2 h-4 w-4" />
                      View Source Report
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Lead Nurturing</CardTitle>
                  <CardDescription>Automated marketing sequences</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Active Sequences</span>
                      <span className="text-2xl font-bold">3</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      <MessageSquareText className="mr-2 h-4 w-4" />
                      Manage Sequences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </MotionWrapper>
    </div>
  );
}