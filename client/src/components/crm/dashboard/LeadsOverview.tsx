import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CRMLeadsOverview } from "@shared/schema";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface LeadsOverviewProps {
  data: CRMLeadsOverview;
  timeframe: "day" | "week" | "month";
}

const COLORS = ["#025E73", "#F2A71B", "#412754", "#A5D8DD", "#60495A", "#BF9C88"];
const STATUS_COLORS: Record<string, string> = {
  "New": "#025E73",
  "InProgress": "#F2A71B",
  "FollowUp": "#412754",
  "HandToDispatch": "#A5D8DD",
  "Active": "#60495A",
  "Lost": "#BF9C88"
};

export function LeadsOverview({ data, timeframe }: LeadsOverviewProps) {
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

  const timeframeLabel = timeframe === "day" ? "Today" : timeframe === "week" ? "This Week" : "This Month";

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-[#025E73]">Leads Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="trend">
          <TabsList className="mb-4">
            <TabsTrigger value="trend">Trend</TabsTrigger>
            <TabsTrigger value="status">By Status</TabsTrigger>
            <TabsTrigger value="source">By Source</TabsTrigger>
          </TabsList>
          
          <TabsContent value="trend" className="p-0">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.trend}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
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
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="qualified"
                    name="Qualified"
                    stroke="#F2A71B"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="converted"
                    name="Converted"
                    stroke="#412754"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Lead creation and qualification trend for {timeframeLabel.toLowerCase()}
            </p>
          </TabsContent>
          
          <TabsContent value="status" className="p-0">
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.byStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    fill="#8884d8"
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.byStatus.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} leads`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Distribution of leads by status for {timeframeLabel.toLowerCase()}
            </p>
          </TabsContent>
          
          <TabsContent value="source" className="p-0">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.bySource}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" />
                  <Tooltip />
                  <Bar dataKey="value" name="Leads" fill="#025E73" radius={[0, 4, 4, 0]}>
                    {data.bySource.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Lead acquisition sources for {timeframeLabel.toLowerCase()}
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}