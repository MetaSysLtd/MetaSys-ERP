import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CRMHandoffRates } from "@shared/schema";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Tooltip,
  LineChart,
  Line,
  ReferenceLine,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Recycle, User, BadgeCheck, AlertCircle } from "lucide-react";

interface HandoffRatesProps {
  data: CRMHandoffRates;
}

export function HandoffRates({ data }: HandoffRatesProps) {
  if (!data) {
    return (
      <Card className="shadow-md hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle>Handoff Rates</CardTitle>
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
  const successColor = "#025E73";
  const targetColor = "#F2A71B";
  const failedColor = "#F88171";

  // Custom tooltip for monthly chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 shadow-md rounded-md border border-gray-100">
          <p className="font-medium text-sm">{label}</p>
          <p className="text-xs text-gray-700">
            Success: <span className="font-medium">{payload[0].value}%</span>
          </p>
          {payload[1] && (
            <p className="text-xs text-gray-700">
              Target: <span className="font-medium">{payload[1].value}%</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Format the overall handoff rate number for display
  const overallRate = Math.round(data.overall);

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-[#025E73]">Handoff Rates</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Lead to Dispatch transition success
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-50 rounded-full mr-3">
                <Recycle className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Overall Success Rate</p>
                <p className="text-2xl font-bold text-[#025E73]">{overallRate}%</p>
              </div>
            </div>
            
            <h4 className="text-sm font-medium text-gray-700 mb-2">Monthly Trends</h4>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.byMonth} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <ReferenceLine y={80} stroke="#412754" strokeDasharray="3 3" label={{ position: 'right', value: 'Min Threshold', fill: '#412754', fontSize: 10 }} />
                  <Line
                    type="monotone"
                    dataKey="success"
                    name="Success Rate"
                    stroke={successColor}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    name="Target"
                    stroke={targetColor}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Success by Sales Rep</h4>
            <div className="h-[265px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.byRep}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36} />
                  <Bar
                    dataKey="success"
                    name="Successful"
                    stackId="a"
                    fill={successColor}
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar
                    dataKey="failed"
                    name="Failed"
                    stackId="a"
                    fill={failedColor}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="mt-4 border-t border-gray-100 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Key Insights</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="bg-gray-50 rounded-md p-2 flex items-center">
              <BadgeCheck className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-xs text-gray-600">
                Top performer: {data.byRep.length > 0 ? data.byRep[0].name : 'N/A'}
              </span>
            </div>
            <div className="bg-gray-50 rounded-md p-2 flex items-center">
              <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
              <span className="text-xs text-gray-600">
                {overallRate < 80 ? 'Below target threshold' : 'Meeting target threshold'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}