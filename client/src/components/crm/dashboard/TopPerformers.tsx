import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/formatters";
import { calculateTrendChange } from "@/lib/calculations";

interface SalesRep {
  name: string;
  revenue: number;
  leads: number;
  conversions: number;
}

interface TopPerformersData {
  topRevenue: SalesRep[];
  topLeads: SalesRep[];
  topConversion: SalesRep[];
  period: "week" | "month" | "quarter" | "year";
}

interface TopPerformersProps {
  data: TopPerformersData;
}

export function TopPerformers({ data }: TopPerformersProps) {
  // Get the title based on the time period
  const getPeriodTitle = () => {
    switch (data.period) {
      case "week": return "This Week";
      case "month": return "This Month";
      case "quarter": return "This Quarter";
      case "year": return "This Year";
      default: return "Current Period";
    }
  };
  
  // Format the data for the chart
  // Considering we're showing top revenue performers
  const chartData = data.topRevenue
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((rep) => ({
      name: rep.name.split(' ')[0], // First name only for the chart
      revenue: rep.revenue,
      leads: rep.leads,
      conversions: rep.conversions
    }));
  
  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-[#025E73]">Top Performers</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          {getPeriodTitle()} sales leaders
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === "revenue") return [formatCurrency(value as number), "Revenue"];
                  if (name === "leads") return [formatNumber(value as number), "Leads"];
                  if (name === "conversions") return [formatPercent(value as number), "Conversion Rate"];
                  return [value, name];
                }}
              />
              <Bar 
                dataKey="revenue" 
                name="Revenue" 
                fill="#025E73"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Top Performance Categories</h4>
          <div className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Revenue Leader</span>
              <span className="text-[#025E73] font-medium">
                {data.topRevenue[0]?.name || 'N/A'} ({formatCurrency(data.topRevenue[0]?.revenue || 0)})
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Most Leads</span>
              <span className="text-[#F2A71B] font-medium">
                {data.topLeads[0]?.name || 'N/A'} ({data.topLeads[0]?.leads || 0})
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Best Conversion</span>
              <span className="text-[#412754] font-medium">
                {data.topConversion[0]?.name || 'N/A'} ({formatPercent(data.topConversion[0]?.conversions || 0)})
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}