import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  CreditCard,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  FilePlus,
  ChevronRight,
  Plus
} from "lucide-react";
import { MotionWrapper } from "@/components/ui/motion-wrapper-fixed";

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState("revenue");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <MotionWrapper animation="fade-in" delay={0.1}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Finance Management</h1>
          <p className="text-gray-600">Track revenue, expenses, and analyze profit & loss statements</p>
        </div>
      </MotionWrapper>

      <MotionWrapper animation="fade-up" delay={0.2}>
        <Tabs
          defaultValue="revenue"
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="mb-4 bg-background">
            <TabsTrigger value="revenue" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <DollarSign className="h-4 w-4 mr-2" />
              Revenue
            </TabsTrigger>
            <TabsTrigger value="expenses" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <CreditCard className="h-4 w-4 mr-2" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="pl" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <LineChart className="h-4 w-4 mr-2" />
              Profit & Loss
            </TabsTrigger>
          </TabsList>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="mt-0">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Revenue Overview</CardTitle>
                  <CardDescription>Summary of current month revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Month-to-Date</span>
                      <div className="flex items-center">
                        <span className="text-2xl font-bold">$128,540</span>
                        <div className="ml-2 flex items-center text-green-500 text-sm">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          <span>8.2%</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      <ChevronRight className="ml-auto h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Outstanding Invoices</CardTitle>
                  <CardDescription>Unpaid customer invoices</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Outstanding</span>
                      <span className="text-2xl font-bold">$42,150</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      <ChevronRight className="ml-auto h-4 w-4" />
                      View All Invoices
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Revenue Sources</CardTitle>
                  <CardDescription>Revenue breakdown by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Top Source</span>
                      <span className="text-md font-medium">Carrier Services</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Revenue Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="mt-0">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Expense Summary</CardTitle>
                  <CardDescription>Current month expenses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Month-to-Date</span>
                      <div className="flex items-center">
                        <span className="text-2xl font-bold">$75,230</span>
                        <div className="ml-2 flex items-center text-red-500 text-sm">
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                          <span>3.4%</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      <ChevronRight className="ml-auto h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Add Expense</CardTitle>
                  <CardDescription>Record a new expense</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Recent Expenses</span>
                      <span className="text-md font-medium">12 this week</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Expense
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Expense Categories</CardTitle>
                  <CardDescription>Top spending categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Top Category</span>
                      <span className="text-md font-medium">Payroll (58%)</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Expense Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Profit & Loss Tab */}
          <TabsContent value="pl" className="mt-0">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Current P&L</CardTitle>
                  <CardDescription>Monthly profit & loss summary</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Net Profit</span>
                      <div className="flex items-center">
                        <span className="text-2xl font-bold">$53,310</span>
                        <div className="ml-2 flex items-center text-green-500 text-sm">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          <span>12.5%</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      <ChevronRight className="ml-auto h-4 w-4" />
                      View Full Statement
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>P&L Reports</CardTitle>
                  <CardDescription>Generate P&L reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Available Periods</span>
                      <span className="text-md font-medium">12</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      <FilePlus className="mr-2 h-4 w-4" />
                      Generate New Report
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Trend Analysis</CardTitle>
                  <CardDescription>P&L performance trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">YoY Growth</span>
                      <span className="text-md font-medium text-green-500">+15.3%</span>
                    </div>
                    <Button variant="outline" className="w-full">
                      <LineChart className="mr-2 h-4 w-4" />
                      View Trends
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