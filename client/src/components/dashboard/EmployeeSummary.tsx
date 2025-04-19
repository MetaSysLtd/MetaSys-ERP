import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Bar,
  Tooltip,
  Legend
} from "recharts";
import { getInitials } from "@/lib/utils";

type EmployeeStatus = "Active" | "Training" | "OnLeave" | "Terminated";

interface Department {
  id: number;
  name: string;
  employeeCount: number;
  color: string;
}

interface Employee {
  id: number;
  name: string;
  role: string;
  department: string;
  departmentId: number;
  status: EmployeeStatus;
  tenure: string;
  performanceScore: number;
  profileImage?: string;
}

interface AttendanceData {
  present: number;
  absent: number;
  leave: number;
  remote: number;
}

interface PerformanceDistribution {
  range: string;
  count: number;
}

interface EmployeeSummaryData {
  totalCount: number;
  newHires: number;
  attrition: number;
  openPositions: number;
  departments: Department[];
  topPerformers: Employee[];
  recentHires: Employee[];
  attendance: AttendanceData;
  performanceDistribution: PerformanceDistribution[];
}

interface Props {
  data?: EmployeeSummaryData;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

function getStatusColor(status: EmployeeStatus) {
  switch(status) {
    case "Active": return "bg-green-100 text-green-800";
    case "Training": return "bg-blue-100 text-blue-800";
    case "OnLeave": return "bg-yellow-100 text-yellow-800";
    case "Terminated": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

function getPerformanceColor(score: number) {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  return "bg-red-500";
}

export function EmployeeSummary({ data }: Props) {
  if (!data) return null;

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Employee Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500">Total Employees</div>
                  <div className="text-2xl font-bold">{data.totalCount}</div>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500">New Hires (30d)</div>
                  <div className="text-2xl font-bold text-green-600">{data.newHires}</div>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500">Attrition Rate</div>
                  <div className="text-2xl font-bold text-red-600">{data.attrition}%</div>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500">Open Positions</div>
                  <div className="text-2xl font-bold text-blue-600">{data.openPositions}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-3">Department Distribution</h3>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.departments}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="employeeCount"
                        nameKey="name"
                      >
                        {data.departments.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Recent Hires</h3>
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recentHires.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                {employee.profileImage && (
                                  <AvatarImage src={employee.profileImage} alt={employee.name} />
                                )}
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {getInitials(employee.name, "")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{employee.name}</div>
                                <div className="text-xs text-gray-500">{employee.role}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{employee.department}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(employee.status)}>
                              {employee.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-3">Performance Distribution</h3>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.performanceDistribution}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#1D3557" name="Employees" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Top Performers</h3>
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Performance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.topPerformers.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                {employee.profileImage && (
                                  <AvatarImage src={employee.profileImage} alt={employee.name} />
                                )}
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {getInitials(employee.name, "")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{employee.name}</div>
                                <div className="text-xs text-gray-500">{employee.role}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{employee.department}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-full">
                                <Progress 
                                  value={employee.performanceScore} 
                                  className={`h-2 ${getPerformanceColor(employee.performanceScore)}`} 
                                />
                              </div>
                              <span className="text-xs font-medium">{employee.performanceScore}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500">Present Today</div>
                  <div className="text-2xl font-bold text-green-600">{data.attendance.present}</div>
                  <div className="text-xs text-gray-500">
                    {((data.attendance.present / data.totalCount) * 100).toFixed(1)}% of total
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500">Absent</div>
                  <div className="text-2xl font-bold text-red-600">{data.attendance.absent}</div>
                  <div className="text-xs text-gray-500">
                    {((data.attendance.absent / data.totalCount) * 100).toFixed(1)}% of total
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500">On Leave</div>
                  <div className="text-2xl font-bold text-yellow-600">{data.attendance.leave}</div>
                  <div className="text-xs text-gray-500">
                    {((data.attendance.leave / data.totalCount) * 100).toFixed(1)}% of total
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500">Remote Work</div>
                  <div className="text-2xl font-bold text-blue-600">{data.attendance.remote}</div>
                  <div className="text-xs text-gray-500">
                    {((data.attendance.remote / data.totalCount) * 100).toFixed(1)}% of total
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Present', value: data.attendance.present, color: '#10b981' },
                      { name: 'Absent', value: data.attendance.absent, color: '#ef4444' },
                      { name: 'On Leave', value: data.attendance.leave, color: '#f59e0b' },
                      { name: 'Remote', value: data.attendance.remote, color: '#3b82f6' },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'Present', value: data.attendance.present, color: '#10b981' },
                      { name: 'Absent', value: data.attendance.absent, color: '#ef4444' },
                      { name: 'On Leave', value: data.attendance.leave, color: '#f59e0b' },
                      { name: 'Remote', value: data.attendance.remote, color: '#3b82f6' },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}