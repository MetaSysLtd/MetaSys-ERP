import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CRMLeadsOverview } from "@shared/schema";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { formatDate } from "@/lib/formatters";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LeadsOverviewProps {
  data?: CRMLeadsOverview;
  timeframe: "day" | "week" | "month";
}

const COLORS = ["#025E73", "#F2A71B", "#412754", "#A5D8DD", "#F5CB5C", "#2E5266", "#6E8898"];

export function LeadsOverview({ data, timeframe }: LeadsOverviewProps) {
  const [activeTab, setActiveTab] = useState<"status" | "source" | "trend">("trend");

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

  // Transform data for charts if needed
  const trendData = data.trend.map(point => ({
    date: point.date,
    name: formatDate(new Date(point.date), "MMM D"),
    created: point.created,
    qualified: point.qualified,
    converted: point.converted
  }));

  const timeframeLabel = 
    timeframe === "day" ? "Today" : 
    timeframe === "week" ? "This Week" : 
    "This Month";
  
  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-[#025E73]">Leads Overview</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          {timeframeLabel} lead activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="trend">Trend</TabsTrigger>
            <TabsTrigger value="status">By Status</TabsTrigger>
            <TabsTrigger value="source">By Source</TabsTrigger>
          </TabsList>
          
          <TabsContent value="trend" className="mt-0">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value} leads`, ""]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="created"
                    name="Created"
                    stackId="1"
                    stroke="#025E73"
                    fill="#025E73"
                    fillOpacity={0.8}
                  />
                  <Area
                    type="monotone"
                    dataKey="qualified"
                    name="Qualified"
                    stackId="2"
                    stroke="#F2A71B"
                    fill="#F2A71B"
                    fillOpacity={0.7}
                  />
                  <Area
                    type="monotone"
                    dataKey="converted"
                    name="Converted"
                    stackId="3"
                    stroke="#412754"
                    fill="#412754"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="status" className="mt-0">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.byStatus}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 70, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value) => [`${value} leads`, ""]}
                    labelFormatter={(label) => `Status: ${label}`}
                  />
                  <Bar 
                    dataKey="value" 
                    name="Leads" 
                    fill="#025E73"
                    radius={[0, 4, 4, 0]}
                    label={{ 
                      position: 'right', 
                      formatter: (item: any) => `${item.value}`,
                      fill: '#666',
                      fontSize: 12
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="source" className="mt-0">
            <div className="h-72 flex items-center">
              <div className="w-2/3 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.bySource}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {data.bySource.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} leads`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="w-1/3">
                {data.bySource.map((item, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-xs text-gray-600 overflow-hidden truncate">{item.name}</span>
                    <span className="text-xs text-gray-600 ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}