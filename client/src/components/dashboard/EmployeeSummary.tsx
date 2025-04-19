import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Employee {
  id: number;
  name: string;
  department: string;
  role: string;
  avatar?: string;
  status: 'active' | 'leave' | 'remote';
  productivity: number;
  tasks: {
    completed: number;
    total: number;
  };
}

interface EmployeeSummaryData {
  topPerformers: Employee[];
  departmentMetrics: {
    department: string;
    headcount: number;
    avgProductivity: number;
  }[];
  attendance: {
    present: number;
    remote: number;
    leave: number;
    total: number;
  };
}

interface EmployeeSummaryProps {
  data?: EmployeeSummaryData;
}

export function EmployeeSummary({ data }: EmployeeSummaryProps) {
  if (!data) {
    return (
      <Card className="shadow rounded-lg">
        <CardHeader className="px-5 py-4 border-b border-gray-200">
          <CardTitle className="text-lg leading-6 font-medium text-gray-900">
            Employee Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 flex justify-center items-center h-64">
          <p className="text-gray-500">No employee data available</p>
        </CardContent>
      </Card>
    );
  }

  const { topPerformers, departmentMetrics, attendance } = data;
  const attendancePercentage = Math.round((attendance.present / attendance.total) * 100);

  const getStatusColor = (status: string) => {
    const colors = {
      active: "bg-green-100 text-green-800 border-green-200",
      leave: "bg-red-100 text-red-800 border-red-200",
      remote: "bg-blue-100 text-blue-800 border-blue-200"
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  return (
    <Card className="shadow rounded-lg">
      <CardHeader className="px-5 py-4 border-b border-gray-200">
        <CardTitle className="text-lg leading-6 font-medium text-gray-900">
          Employee Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Attendance overview */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Attendance Overview</h3>
            <div className="flex justify-between mb-2">
              <div className="text-sm">Today's Attendance</div>
              <div className="text-sm font-medium">{attendancePercentage}%</div>
            </div>
            <Progress value={attendancePercentage} className="h-2 mb-4" />
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-medium text-green-600">{attendance.present}</div>
                <div className="text-xs text-gray-500">Present</div>
              </div>
              <div>
                <div className="text-lg font-medium text-blue-600">{attendance.remote}</div>
                <div className="text-xs text-gray-500">Remote</div>
              </div>
              <div>
                <div className="text-lg font-medium text-red-600">{attendance.leave}</div>
                <div className="text-xs text-gray-500">On Leave</div>
              </div>
            </div>
          </div>
          
          {/* Department Metrics */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Department Breakdown</h3>
            <div className="space-y-3">
              {departmentMetrics.map((dept, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-1">
                    <div className="text-sm">{dept.department}</div>
                    <div className="text-sm font-medium">{dept.headcount} employees</div>
                  </div>
                  <Progress value={dept.avgProductivity} className="h-2" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Top Performers */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Top Performers</h3>
            <div className="space-y-3">
              {topPerformers.map((employee) => (
                <div key={employee.id} className="flex items-center">
                  <Avatar className="h-8 w-8 mr-3">
                    {employee.avatar ? (
                      <AvatarImage src={employee.avatar} alt={employee.name} />
                    ) : (
                      <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{employee.name}</p>
                    <div className="flex items-center">
                      <Badge variant="outline" className={getStatusColor(employee.status)}>
                        {employee.status}
                      </Badge>
                      <span className="text-xs text-gray-500 ml-2">
                        {employee.tasks.completed}/{employee.tasks.total} tasks
                      </span>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-green-600">
                    {employee.productivity}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}