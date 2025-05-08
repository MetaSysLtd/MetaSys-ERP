import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CRMLeadsOverview } from "@shared/schema";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Tooltip,
  LineChart,
  Line,
} from "recharts";

interface LeadsOverviewProps {
  data: CRMLeadsOverview;
}

export function LeadsOverview({ data }: LeadsOverviewProps) {
  if (!data) {
    return (
      <Card className="shadow-md hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle>Leads Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Colors for pie chart
  const COLORS = ["#025E73", "#F2A71B", "#412754", "#A5D8DD"];

  // Format for pie chart data
  const pieChartData = [
    { name: "Qualified", value: data.qualified },
    { name: "Unqualified", value: data.unqualified },
  ];

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-[#025E73]">Leads Overview</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          {data.periodLabel}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Lead Stats</h4>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-xs text-gray-500">Total Leads</p>
                <p className="text-2xl font-bold text-[#025E73]">{data.total}</p>
              </div>
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-xs text-gray-500">Qualification Rate</p>
                <p className="text-2xl font-bold text-[#F2A71B]">{data.qualificationRate}%</p>
              </div>
            </div>
            
            <div className="aspect-square w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value} leads`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Leads by Source</h4>
            <div className="h-40 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.bySource}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" name="Leads" fill="#025E73" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <h4 className="text-sm font-medium text-gray-700 mb-2">Leads Trend</h4>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="new"
                    name="New Leads"
                    stroke="#025E73"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="qualified"
                    name="Qualified"
                    stroke="#F2A71B"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {data.insight && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Insight</h4>
            <p className="text-xs text-gray-500">{data.insight}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}