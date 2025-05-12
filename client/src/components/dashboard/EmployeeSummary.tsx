import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Original interface for database records
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

// New interface for API data
interface ApiEmployeeData {
  total: number;
  active: number;
  onLeave: number;
  byDepartment: {
    department: string;
    count: number;
  }[];
  attendance: {
    present: number;
    absent: number;
    late: number;
  };
  newHires: number;
  topPerformers: {
    name: string;
    department: string;
    achievement: string;
  }[];
}

interface EmployeeSummaryProps {
  data?: EmployeeSummaryData | ApiEmployeeData;
  employeeData?: ApiEmployeeData;
}

export function EmployeeSummary({ data, employeeData }: EmployeeSummaryProps) {
  // Use either data provided directly or from employeeData prop
  const apiData = employeeData || (data && 'total' in data ? data as ApiEmployeeData : undefined);

  // If we have no data at all, show empty state
  if (!data && !apiData) {
    return (
      <Card className="shadow rounded-lg">
        <CardHeader className="px-5 py-4 border-b border-gray-200">
          <CardTitle className="text-lg leading-6 font-medium text-gray-900">
            Employee Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="flex flex-col items-center justify-center text-center h-64">
            <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium">No Employee Data Yet</h3>
            <p className="text-gray-500 mt-2 max-w-md">
              Employee data will appear here once staff information is added to the system.
              This section will display attendance statistics, department breakdowns, and top performers.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle API data format
  if (apiData) {
    const attendancePercentage = Math.round((apiData.attendance.present / apiData.total) * 100);
    
    const getStatusColor = (department: string) => {
      const colors = {
        "Sales": "bg-blue-100 text-blue-800 border-blue-200",
        "Dispatch": "bg-green-100 text-green-800 border-green-200",
        "Finance": "bg-purple-100 text-purple-800 border-purple-200",
        "HR": "bg-amber-100 text-amber-800 border-amber-200",
        "Admin": "bg-indigo-100 text-indigo-800 border-indigo-200",
      };
      return colors[department as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200";
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
                  <div className="text-lg font-medium text-green-600">{apiData.attendance.present}</div>
                  <div className="text-xs text-gray-500">Present</div>
                </div>
                <div>
                  <div className="text-lg font-medium text-yellow-600">{apiData.attendance.late}</div>
                  <div className="text-xs text-gray-500">Late</div>
                </div>
                <div>
                  <div className="text-lg font-medium text-red-600">{apiData.attendance.absent}</div>
                  <div className="text-xs text-gray-500">Absent</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-lg font-medium text-blue-600">{apiData.newHires}</div>
                  <div className="text-xs text-gray-500">New Hires This Month</div>
                </div>
              </div>
            </div>
            
            {/* Department Metrics */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Department Breakdown</h3>
              <div className="space-y-3">
                {apiData.byDepartment.map((dept, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between mb-1">
                      <div className="text-sm">{dept.department}</div>
                      <div className="text-sm font-medium">{dept.count} employees</div>
                    </div>
                    <Progress 
                      value={Math.round((dept.count / apiData.total) * 100)} 
                      className="h-2" 
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between">
                  <div className="text-sm font-medium">Total Employees</div>
                  <div className="text-sm font-medium">{apiData.total}</div>
                </div>
                <div className="flex justify-between mt-1">
                  <div className="text-sm">Active</div>
                  <div className="text-sm">{apiData.active}</div>
                </div>
                <div className="flex justify-between mt-1">
                  <div className="text-sm">On Leave</div>
                  <div className="text-sm">{apiData.onLeave}</div>
                </div>
              </div>
            </div>
            
            {/* Top Performers */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Top Performers</h3>
              <div className="space-y-4">
                {apiData.topPerformers.map((employee, idx) => (
                  <div key={idx} className="flex items-center">
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{employee.name}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <Badge variant="outline" className={getStatusColor(employee.department)}>
                          {employee.department}
                        </Badge>
                        <span className="text-xs text-gray-500 mt-1 sm:mt-0 sm:ml-2">
                          {employee.achievement}
                        </span>
                      </div>
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

  // Original code for database format data
  const { topPerformers, departmentMetrics, attendance } = data as EmployeeSummaryData;
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