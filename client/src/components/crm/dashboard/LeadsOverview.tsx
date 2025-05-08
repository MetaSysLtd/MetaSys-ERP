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
import { InfoIcon } from "lucide-react";

interface LeadsOverviewProps {
  data: CRMLeadsOverview;
  timeframe?: string;
}

export function LeadsOverview({ data, timeframe = "week" }: LeadsOverviewProps) {
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

  // Colors for charts
  const COLORS = ["#025E73", "#F2A71B", "#412754", "#A5D8DD"];

  // Calculate qualification stats
  const qualifiedCount = data.byStatus.find(item => item.name === "Qualified")?.value || 0;
  const unqualifiedCount = data.byStatus.find(item => item.name === "Unqualified")?.value || 0;
  const totalLeads = qualifiedCount + unqualifiedCount;
  const qualificationRate = totalLeads > 0 ? Math.round((qualifiedCount / totalLeads) * 100) : 0;

  // Format for pie chart data
  const pieChartData = [
    { name: "Qualified", value: qualifiedCount },
    { name: "Unqualified", value: unqualifiedCount },
  ];

  // Get the period label based on the timeframe
  const periodLabelMap = {
    day: "Today's Overview",
    week: "This Week's Overview",
    month: "This Month's Overview",
    custom: "Custom Period Overview"
  };
  const periodLabel = periodLabelMap[timeframe as keyof typeof periodLabelMap] || "Overview";

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-[#025E73]">Leads Overview</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          {periodLabel}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Lead Stats</h4>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-xs text-gray-500">Total Leads</p>
                <p className="text-2xl font-bold text-[#025E73]">{totalLeads}</p>
              </div>
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-xs text-gray-500">Qualification Rate</p>
                <p className="text-2xl font-bold text-[#F2A71B]">{qualificationRate}%</p>
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
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="created"
                    name="Created"
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
                  <Line
                    type="monotone"
                    dataKey="converted"
                    name="Converted"
                    stroke="#412754"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="mt-4 border-t border-gray-100 pt-4">
          <div className="flex items-start space-x-2">
            <InfoIcon className="h-4 w-4 text-[#025E73] mt-0.5" />
            <p className="text-xs text-gray-500">
              Analysis shows most qualified leads come from Website and Partner sources. 
              Converting leads from Cold Calls needs improvement.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}