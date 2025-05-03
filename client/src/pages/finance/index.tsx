import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  PieChart, 
  TrendingUp, 
  Receipt, 
  CreditCard, 
  FileText, 
  BarChart3, 
  ArrowUpRight, 
  ChevronDown,
  ArrowDownRight,
  FileSpreadsheet,
  FilePlus2
} from 'lucide-react';
import { MotionWrapper } from '@/components/ui/motion-wrapper';

export default function FinancePage() {
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-7xl">
      <PageHeader
        title="Finance"
        subtitle="Manage financial operations, reporting, and analysis"
        icon={<DollarSign className="h-6 w-6 text-[#F2A71B]" />}
      />

      <Tabs defaultValue="dashboard" className="mt-6">
        <TabsList className="mb-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="budgeting">Budgeting</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MotionWrapper animation="fade" delay={0.1}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <TrendingUp className="h-8 w-8 text-green-500" />
                    <Badge variant="outline" className="bg-green-50">May 2025</Badge>
                  </div>
                  <CardTitle className="text-xl mt-4">Revenue</CardTitle>
                  <CardDescription>Current month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">$246,500</div>
                  <div className="text-sm text-muted-foreground mt-1 flex items-center">
                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-500 font-medium">8.3%</span>
                    <span className="ml-1">vs last month</span>
                  </div>
                </CardContent>
              </Card>
            </MotionWrapper>

            <MotionWrapper animation="fade" delay={0.2}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CreditCard className="h-8 w-8 text-red-500" />
                    <Badge variant="outline" className="bg-red-50">May 2025</Badge>
                  </div>
                  <CardTitle className="text-xl mt-4">Expenses</CardTitle>
                  <CardDescription>Current month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">$184,720</div>
                  <div className="text-sm text-muted-foreground mt-1 flex items-center">
                    <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-red-500 font-medium">4.2%</span>
                    <span className="ml-1">vs last month</span>
                  </div>
                </CardContent>
              </Card>
            </MotionWrapper>

            <MotionWrapper animation="fade" delay={0.3}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Receipt className="h-8 w-8 text-blue-500" />
                    <Badge variant="outline" className="bg-blue-50">May 2025</Badge>
                  </div>
                  <CardTitle className="text-xl mt-4">Cash Flow</CardTitle>
                  <CardDescription>Net for current month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">$61,780</div>
                  <div className="text-sm text-muted-foreground mt-1 flex items-center">
                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-500 font-medium">12.1%</span>
                    <span className="ml-1">vs last month</span>
                  </div>
                </CardContent>
              </Card>
            </MotionWrapper>

            <MotionWrapper animation="fade" delay={0.4}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <FileText className="h-8 w-8 text-purple-500" />
                    <Badge variant="outline" className="bg-purple-50">Pending</Badge>
                  </div>
                  <CardTitle className="text-xl mt-4">Invoices</CardTitle>
                  <CardDescription>Unpaid invoices</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">$87,320</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    12 invoices pending payment
                  </div>
                </CardContent>
              </Card>
            </MotionWrapper>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Monthly Revenue vs Expenses</CardTitle>
                    <Button variant="outline" size="sm">
                      <PieChart className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-md border-gray-200 p-6 text-center">
                    <div>
                      <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-lg font-medium">Revenue vs Expenses Chart</p>
                      <p className="text-sm text-muted-foreground mb-4">Monthly comparison over the year</p>
                      <Button variant="outline" size="sm" asChild>
                        <a href="/reports">View Full Reports</a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Department Budget Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Sales Department</span>
                        <span className="font-medium">76%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200">
                        <div className="h-2 rounded-full bg-blue-500" style={{ width: '76%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Dispatch Operations</span>
                        <span className="font-medium">83%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200">
                        <div className="h-2 rounded-full bg-green-500" style={{ width: '83%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Marketing</span>
                        <span className="font-medium">52%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200">
                        <div className="h-2 rounded-full bg-purple-500" style={{ width: '52%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Human Resources</span>
                        <span className="font-medium">64%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200">
                        <div className="h-2 rounded-full bg-amber-500" style={{ width: '64%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>IT & Equipment</span>
                        <span className="font-medium">72%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200">
                        <div className="h-2 rounded-full bg-indigo-500" style={{ width: '72%' }}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Button variant="outline" className="w-full">
                      Budget Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Transactions</CardTitle>
                  <Button variant="outline" size="sm">View All</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">Fuel Payment</div>
                        <div className="text-sm text-gray-500">May 3, 2025</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-red-600">-$3,240.00</div>
                      <div className="text-sm text-gray-500">Expense</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <Receipt className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">Invoice #INV-2258</div>
                        <div className="text-sm text-gray-500">May 2, 2025</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">+$7,890.00</div>
                      <div className="text-sm text-gray-500">Income</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                        <CreditCard className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <div className="font-medium">Equipment Purchase</div>
                        <div className="text-sm text-gray-500">May 1, 2025</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-red-600">-$1,675.50</div>
                      <div className="text-sm text-gray-500">Expense</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <Receipt className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">Invoice #INV-2257</div>
                        <div className="text-sm text-gray-500">April 30, 2025</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">+$4,320.00</div>
                      <div className="text-sm text-gray-500">Income</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Financial Reports</CardTitle>
                  <Button variant="outline" size="sm">Generate</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center">
                      <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">Profit & Loss Statement</div>
                        <div className="text-sm text-gray-500">April 2025</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Download
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center">
                      <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                        <FileSpreadsheet className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium">Balance Sheet</div>
                        <div className="text-sm text-gray-500">Q1 2025</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Download
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center">
                      <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <FileSpreadsheet className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">Cash Flow Statement</div>
                        <div className="text-sm text-gray-500">Q1 2025</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Download
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                        <FilePlus2 className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <div className="font-medium">Create Custom Report</div>
                        <div className="text-sm text-gray-500">Choose parameters</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Create
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="income" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Income Module Coming Soon</CardTitle>
              <CardDescription>
                This feature is currently under development. Check back soon for enhanced income tracking capabilities!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                The Income module will include:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>Invoice management and tracking</li>
                <li>Revenue stream analysis</li>
                <li>Client payment history</li>
                <li>Recurring income tracking</li>
                <li>AR aging reports</li>
                <li>Income forecasting and projections</li>
                <li>Tax categorization for income</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline">View Documentation</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Expenses Module Coming Soon</CardTitle>
              <CardDescription>
                This feature is currently under development. Check back soon for enhanced expense tracking capabilities!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                The Expenses module will include:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>Expense categorization and tagging</li>
                <li>Receipt capture and storage</li>
                <li>Vendor management</li>
                <li>Recurring expense tracking</li>
                <li>Approval workflows for expenses</li>
                <li>Department budget allocation</li>
                <li>Tax deduction categorization</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline">View Documentation</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reports Module Coming Soon</CardTitle>
              <CardDescription>
                This feature is currently under development. Check back soon for enhanced financial reporting capabilities!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                The Reports module will include:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>Profit & Loss statements</li>
                <li>Balance sheets</li>
                <li>Cash flow analysis</li>
                <li>Budget vs. Actual comparisons</li>
                <li>Department expense breakdowns</li>
                <li>Financial trend analysis</li>
                <li>Custom report builder</li>
                <li>Export capabilities (PDF, Excel, CSV)</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline">View Documentation</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="budgeting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Budgeting Module Coming Soon</CardTitle>
              <CardDescription>
                This feature is currently under development. Check back soon for enhanced budgeting capabilities!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                The Budgeting module will include:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>Annual budget creation and management</li>
                <li>Department-level budget allocation</li>
                <li>Budget vs. actual tracking</li>
                <li>Forecasting tools</li>
                <li>Variance analysis</li>
                <li>Budget approval workflows</li>
                <li>Reforecast capabilities</li>
                <li>Budget scenario planning</li>
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