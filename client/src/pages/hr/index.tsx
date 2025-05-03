import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  CalendarDays, 
  Briefcase, 
  GraduationCap, 
  Clock, 
  FileCheck, 
  HeartHandshake, 
  UserPlus, 
  Calendar,
  BadgeCheck,
  BarChart3,
  ClipboardList
} from 'lucide-react';
import { MotionWrapper } from '@/components/ui/motion-wrapper';

export default function HRPage() {
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-7xl">
      <PageHeader
        title="Human Resources"
        subtitle="Manage employees, onboarding, time tracking, and performance reviews"
        icon={<Users className="h-6 w-6 text-[#F2A71B]" />}
      />

      <Tabs defaultValue="dashboard" className="mt-6">
        <TabsList className="mb-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="timetracking">Time Tracking</TabsTrigger>
          <TabsTrigger value="hiring">Hiring & Onboarding</TabsTrigger>
          <TabsTrigger value="leave">Leave Management</TabsTrigger>
          <TabsTrigger value="performance">Performance Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MotionWrapper animation="fade" delay={0.1}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Users className="h-8 w-8 text-blue-500" />
                    <Badge variant="outline" className="bg-blue-50">Active</Badge>
                  </div>
                  <CardTitle className="text-xl mt-4">Employees</CardTitle>
                  <CardDescription>Total active team members</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">24</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <span className="text-green-500">+2</span> this month
                  </div>
                </CardContent>
              </Card>
            </MotionWrapper>

            <MotionWrapper animation="fade" delay={0.2}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CalendarDays className="h-8 w-8 text-purple-500" />
                    <Badge variant="outline" className="bg-purple-50">Today</Badge>
                  </div>
                  <CardTitle className="text-xl mt-4">Time Off</CardTitle>
                  <CardDescription>Employees on leave today</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">3</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    2 planned, 1 sick leave
                  </div>
                </CardContent>
              </Card>
            </MotionWrapper>

            <MotionWrapper animation="fade" delay={0.3}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Briefcase className="h-8 w-8 text-green-500" />
                    <Badge variant="outline" className="bg-green-50">Active</Badge>
                  </div>
                  <CardTitle className="text-xl mt-4">Open Positions</CardTitle>
                  <CardDescription>Current job openings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">5</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    3 new this week
                  </div>
                </CardContent>
              </Card>
            </MotionWrapper>

            <MotionWrapper animation="fade" delay={0.4}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <GraduationCap className="h-8 w-8 text-amber-500" />
                    <Badge variant="outline" className="bg-amber-50">Upcoming</Badge>
                  </div>
                  <CardTitle className="text-xl mt-4">Training</CardTitle>
                  <CardDescription>Training sessions this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">7</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    2 mandatory, 5 optional
                  </div>
                </CardContent>
              </Card>
            </MotionWrapper>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Activities</CardTitle>
                    <Button variant="outline" size="sm">View All</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                        <UserPlus className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">New Employee Onboarded</div>
                        <div className="text-sm text-muted-foreground">Sarah Johnson joined as Dispatch Coordinator</div>
                        <div className="text-xs text-gray-500 mt-1">Today, 9:32 AM</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">Leave Request Approved</div>
                        <div className="text-sm text-muted-foreground">Michael Chen's vacation request (May 15-22) was approved</div>
                        <div className="text-xs text-gray-500 mt-1">Yesterday, 3:45 PM</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center">
                        <BadgeCheck className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium">Performance Review Completed</div>
                        <div className="text-sm text-muted-foreground">Quarterly review for Sales Team completed</div>
                        <div className="text-xs text-gray-500 mt-1">May 1, 2025</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center">
                        <Briefcase className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <div className="font-medium">Job Position Created</div>
                        <div className="text-sm text-muted-foreground">New position: Senior Dispatcher with 3+ years experience</div>
                        <div className="text-xs text-gray-500 mt-1">Apr 28, 2025</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Department Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Dispatch</span>
                        <span className="font-medium">9 employees</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200">
                        <div className="h-2 rounded-full bg-green-500" style={{ width: '37%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Sales</span>
                        <span className="font-medium">7 employees</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200">
                        <div className="h-2 rounded-full bg-blue-500" style={{ width: '29%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Admin</span>
                        <span className="font-medium">4 employees</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200">
                        <div className="h-2 rounded-full bg-purple-500" style={{ width: '17%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Finance</span>
                        <span className="font-medium">2 employees</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200">
                        <div className="h-2 rounded-full bg-amber-500" style={{ width: '8%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Marketing</span>
                        <span className="font-medium">2 employees</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200">
                        <div className="h-2 rounded-full bg-indigo-500" style={{ width: '8%' }}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Button variant="outline" className="w-full" asChild>
                      <a href="/admin/users">
                        View All Employees
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timetracking" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold mb-1">Time Tracking</h2>
              <p className="text-muted-foreground">Track employee hours, breaks, and attendance</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Reports
              </Button>
              <Button>
                <ClipboardList className="h-4 w-4 mr-2" />
                Log Time
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
                <CardTitle className="text-xl mt-4">Today's Hours</CardTitle>
                <CardDescription>Tracked time for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">87.5 hrs</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Team total (24 employees)
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <FileCheck className="h-8 w-8 text-green-500" />
                </div>
                <CardTitle className="text-xl mt-4">Current Week</CardTitle>
                <CardDescription>Weekly progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">418.5 hrs</div>
                <div className="text-sm text-muted-foreground mt-1">
                  87% of expected hours
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <HeartHandshake className="h-8 w-8 text-amber-500" />
                </div>
                <CardTitle className="text-xl mt-4">Overtime</CardTitle>
                <CardDescription>This week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">23.5 hrs</div>
                <div className="text-sm text-muted-foreground mt-1">
                  7 employees with overtime
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
                <CardTitle className="text-xl mt-4">Attendance</CardTitle>
                <CardDescription>Today's check-ins</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">21/24</div>
                <div className="text-sm text-muted-foreground mt-1">
                  3 on approved leave
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Time Tracking Coming Soon</CardTitle>
              <CardDescription>
                This feature is currently under development. Check back soon for enhanced time tracking capabilities!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                The full Time Tracking module will include:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>Automated time tracking with clock in/out functionality</li>
                <li>Break management and overtime calculations</li>
                <li>Attendance reports and analytics</li>
                <li>Time-off request management</li>
                <li>Shift scheduling and rotation management</li>
                <li>Integration with payroll systems</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline">View Documentation</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="hiring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hiring & Onboarding Module Coming Soon</CardTitle>
              <CardDescription>
                This feature is currently under development. Check back soon for enhanced hiring and onboarding capabilities!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                The full Hiring & Onboarding module will include:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>Job requisition and posting management</li>
                <li>Applicant tracking system</li>
                <li>Interview scheduling and feedback collection</li>
                <li>Automated onboarding workflows</li>
                <li>Document collection and verification</li>
                <li>Training assignment and tracking</li>
                <li>Equipment and access provisioning</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline">View Documentation</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="leave" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Leave Management Module Coming Soon</CardTitle>
              <CardDescription>
                This feature is currently under development. Check back soon for enhanced leave management capabilities!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                The full Leave Management module will include:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>Leave request submission and approval workflows</li>
                <li>Different leave types (vacation, sick, personal, etc.)</li>
                <li>Accrual tracking and balance management</li>
                <li>Team calendar with leave visibility</li>
                <li>Reporting and analytics</li>
                <li>Policy enforcement and compliance</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline">View Documentation</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Reviews Module Coming Soon</CardTitle>
              <CardDescription>
                This feature is currently under development. Check back soon for enhanced performance management capabilities!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                The full Performance Reviews module will include:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>Customizable review templates and schedules</li>
                <li>Self-assessments and manager evaluations</li>
                <li>360-degree feedback collection</li>
                <li>Goal setting and tracking</li>
                <li>Performance improvement plans</li>
                <li>Integration with compensation planning</li>
                <li>Historical performance data and trends</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline">View Documentation</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}