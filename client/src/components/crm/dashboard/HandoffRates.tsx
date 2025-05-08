import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { formatPercent } from "@/lib/formatters";

interface HandoffTrend {
  month: string;
  success: number;
  failed: number;
}

interface SalesRep {
  name: string;
  success: number;
  failed: number;
  total: number;
  rate: number;
}

interface HandoffRatesData {
  overall: {
    success: number;
    failed: number;
    total: number;
    rate: number;
  };
  trend: HandoffTrend[];
  bySalesRep: SalesRep[];
}

interface HandoffRatesProps {
  data: HandoffRatesData;
}

export function HandoffRates({ data }: HandoffRatesProps) {
  const [activeTab, setActiveTab] = useState<"trend" | "salesReps">("trend");

  // Transform the trend data for the chart
  const trendData = data.trend.map(item => ({
    month: item.month,
    success: item.success,
    failed: item.failed,
    total: item.success + item.failed,
    rate: item.success / (item.success + item.failed)
  }));
  
  // Prepare the sales rep data for the chart
  const salesRepData = [...data.bySalesRep]
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 5); // Get top 5 sales reps by rate
  
  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-[#025E73]">Handoff Rates</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Lead to dispatch conversion metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="flex flex-col items-center">
              <div className="text-lg font-semibold text-[#025E73]">
                {data.overall.success}
              </div>
              <div className="text-xs text-gray-600">Successful</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-lg font-semibold text-[#F2A71B]">
                {formatPercent(data.overall.rate)}
              </div>
              <div className="text-xs text-gray-600">Success Rate</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-lg font-semibold text-[#412754]">
                {data.overall.failed}
              </div>
              <div className="text-xs text-gray-600">Failed</div>
            </div>
          </div>
          
          <Tabs defaultValue={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="trend">Trend</TabsTrigger>
              <TabsTrigger value="salesReps">Sales Reps</TabsTrigger>
            </TabsList>
            
            <TabsContent value="trend" className="mt-0">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value * 100}%`} />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === "rate") return [formatPercent(value as number), name];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="success"
                      name="Successful"
                      stroke="#025E73"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="failed"
                      name="Failed"
                      stroke="#412754"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="rate"
                      name="Success Rate"
                      stroke="#F2A71B"
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="salesReps" className="mt-0">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={salesRepData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      tick={{ fontSize: 10 }} 
                      width={60}
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === "rate") return [formatPercent(value as number), name];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="success"
                      name="Successful"
                      stackId="a"
                      fill="#025E73"
                    />
                    <Bar
                      dataKey="failed"
                      name="Failed"
                      stackId="a"
                      fill="#412754"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}