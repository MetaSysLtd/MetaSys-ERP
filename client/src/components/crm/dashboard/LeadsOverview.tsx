import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type LeadsOverviewProps = {
  data: any;
  timeframe: "day" | "week" | "month";
};

const COLORS = ['#025E73', '#F2A71B', '#412754', '#76B39D', '#EF8354', '#52528C', '#9DA2AB'];

export function LeadsOverview({ data, timeframe }: LeadsOverviewProps) {
  if (!data) {
    data = {
      byStatus: [],
      bySource: [],
      trend: []
    };
  }
  
  return (
    <Card className="shadow hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-[#025E73] font-medium">
          Leads Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="trend" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="trend">Trend</TabsTrigger>
            <TabsTrigger value="status">By Status</TabsTrigger>
            <TabsTrigger value="source">By Source</TabsTrigger>
          </TabsList>
          
          <TabsContent value="trend" className="w-full">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.trend}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
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
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="qualified"
                    name="Qualified"
                    stroke="#F2A71B"
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="converted"
                    name="Converted"
                    stroke="#412754"
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs text-center text-gray-500 mt-2">
              Lead activity over the past {timeframe === "day" ? "24 hours" : timeframe === "week" ? "7 days" : "month"}
            </div>
          </TabsContent>
          
          <TabsContent value="status" className="w-full">
            <div className="h-[320px] flex">
              <ResponsiveContainer width="60%" height="100%">
                <PieChart>
                  <Pie
                    data={data.byStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.byStatus.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} leads`, name]} />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="w-[40%] flex flex-col justify-center">
                <h4 className="text-sm font-medium mb-2">Lead Status Distribution</h4>
                <div className="space-y-2">
                  {data.byStatus.map((status: any, index: number) => (
                    <div key={index} className="flex items-center text-sm">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div className="flex justify-between w-full">
                        <span>{status.name}</span>
                        <span className="font-medium">{status.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="source" className="w-full">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.bySource}
                  margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Lead Count" fill="#025E73" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs text-center text-gray-500 mt-2">
              Distribution of leads by source
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}