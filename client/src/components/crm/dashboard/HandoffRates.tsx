import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CRMHandoffRates } from "@shared/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { CircleCheck, TrendingUp } from "lucide-react";

interface HandoffRatesProps {
  data?: CRMHandoffRates;
}

export function HandoffRates({ data }: HandoffRatesProps) {
  if (!data) {
    return (
      <Card className="shadow-md hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle>Handoff Success Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Colors for visualization
  const COLORS = ["#025E73", "#F2A71B", "#27AE60", "#E74C3C", "#412754"];

  // Formatter for percentages
  const formatPercent = (value: number) => `${value}%`;

  // Prepare data for visualization
  const handoffData = [
    { name: "Success Rate", value: data.overall },
    { name: "Failed", value: 100 - data.overall },
  ];

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-medium text-[#025E73]">
              Dispatch Handoff Rates
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Lead to dispatch conversion performance
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CircleCheck className="h-3 w-3 mr-1" />
            {data.overall}% Success
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Monthly Rate Trend */}
          <div className="h-64">
            <h4 className="text-sm font-medium mb-3 text-gray-600">Monthly Trend</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.byMonth}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={formatPercent} domain={[0, 100]} />
                <Tooltip 
                  formatter={(value) => [`${value}%`, "Success Rate"]}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#025E73"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Performance by Sales Rep */}
          <div className="h-64">
            <h4 className="text-sm font-medium mb-3 text-gray-600">By Sales Rep</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.byRep}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tickFormatter={formatPercent} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={60}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, "Success Rate"]}
                  labelFormatter={(label) => `Rep: ${label}`}
                />
                <Bar
                  dataKey="value"
                  radius={[0, 4, 4, 0]}
                >
                  {data.byRep.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Display overall rate as a visual indicator */}
        <div className="mt-4 border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">
                {data.overall >= 70 
                  ? "Excellent handoff performance"
                  : data.overall >= 50
                  ? "Good handoff performance" 
                  : "Handoff performance needs improvement"}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {data.byRep.length > 0 && 
                `Top performer: ${data.byRep[0].name} (${data.byRep[0].value}%)`}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div
              className="bg-green-600 h-2.5 rounded-full"
              style={{ width: `${data.overall}%` }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}