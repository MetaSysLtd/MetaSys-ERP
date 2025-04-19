import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  UserRound, 
  BriefcaseBusiness, 
  CalendarClock, 
  ChevronRight, 
  Plus 
} from "lucide-react";
import { MotionWrapper } from "@/components/ui/motion-wrapper-fixed";

export default function HRPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("talent-acquisition");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <MotionWrapper animation="fade-in" delay={0.1}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Human Resources Management</h1>
          <p className="text-gray-600">Manage talent acquisition, onboarding, and leave management</p>
        </div>
      </MotionWrapper>

      <MotionWrapper animation="fade-up" delay={0.2}>
        <Tabs
          defaultValue="talent-acquisition"
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="mb-4 bg-background">
            <TabsTrigger value="talent-acquisition" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <UserRound className="h-4 w-4 mr-2" />
              Talent Acquisition
            </TabsTrigger>
            <TabsTrigger value="onboarding" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BriefcaseBusiness className="h-4 w-4 mr-2" />
              Onboarding
            </TabsTrigger>
            <TabsTrigger value="leave" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <CalendarClock className="h-4 w-4 mr-2" />
              Leave Management
            </TabsTrigger>
          </TabsList>

          {/* Talent Acquisition Tab */}
          <TabsContent value="talent-acquisition" className="mt-0">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Open Positions</CardTitle>
                  <CardDescription>View and manage open positions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Open Positions</span>
                      <span className="text-2xl font-bold">5</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Position
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Active Candidates</CardTitle>
                  <CardDescription>View active recruitment candidates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Active Candidates</span>
                      <span className="text-2xl font-bold">12</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      <ChevronRight className="ml-auto h-4 w-4" />
                      View All Candidates
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Interviews</CardTitle>
                  <CardDescription>Scheduled interviews this week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Upcoming Interviews</span>
                      <span className="text-2xl font-bold">3</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      <ChevronRight className="ml-auto h-4 w-4" />
                      View Interview Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Onboarding Tab */}
          <TabsContent value="onboarding" className="mt-0">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>New Employees</CardTitle>
                  <CardDescription>Employees in onboarding process</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">In Onboarding</span>
                      <span className="text-2xl font-bold">3</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      <ChevronRight className="ml-auto h-4 w-4" />
                      View Onboarding Status
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Onboarding Tasks</CardTitle>
                  <CardDescription>Track onboarding task completion</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Pending Tasks</span>
                      <span className="text-2xl font-bold">8</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      <ChevronRight className="ml-auto h-4 w-4" />
                      View All Tasks
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Training Sessions</CardTitle>
                  <CardDescription>Upcoming training sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Scheduled Sessions</span>
                      <span className="text-2xl font-bold">4</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      <ChevronRight className="ml-auto h-4 w-4" />
                      View Training Calendar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Leave Management Tab */}
          <TabsContent value="leave" className="mt-0">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Leave Requests</CardTitle>
                  <CardDescription>Pending leave approval requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Pending Approvals</span>
                      <span className="text-2xl font-bold">5</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      <ChevronRight className="ml-auto h-4 w-4" />
                      Review Requests
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Time Off Calendar</CardTitle>
                  <CardDescription>Team availability calendar</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Staff on Leave Today</span>
                      <span className="text-2xl font-bold">2</span>
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
                  <CardTitle>Leave Policies</CardTitle>
                  <CardDescription>Company leave policy documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Policy Documents</span>
                      <span className="text-2xl font-bold">4</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      <ChevronRight className="ml-auto h-4 w-4" />
                      View Policies
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