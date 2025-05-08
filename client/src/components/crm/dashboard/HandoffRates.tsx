import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CRMHandoffRates } from "@shared/schema";
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

interface HandoffRatesProps {
  data: CRMHandoffRates;
}

export function HandoffRates({ data }: HandoffRatesProps) {
  if (!data || (!data.byMonth.length && !data.byRep.length)) {
    return (
      <Card className="shadow-md hover:shadow-lg transition-all duration-200 h-full">
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

  const COLORS = ["#025E73", "#F2A71B"];

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-[#025E73]">Handoff Success Rates</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Performance of lead transfers to dispatch
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center mb-4">
          <div className="w-32 h-32 relative rounded-full bg-gray-100 flex items-center justify-center">
            <div className="text-3xl font-bold text-[#025E73]">{data.overall}%</div>
            <div className="absolute inset-0">
              <svg width="100%" height="100%" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#025E73"
                  strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 45 * data.overall / 100} ${2 * Math.PI * 45 * (100 - data.overall) / 100}`}
                  strokeDashoffset={2 * Math.PI * 45 * 0.25}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Monthly Performance</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.byMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value) => [`${value}%`, 'Rate']} />
                <Legend />
                <Bar dataKey="success" fill="#025E73" name="Success Rate" />
                <Line
                  type="monotone"
                  dataKey="target"
                  name="Target"
                  stroke="#F2A71B"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">By Sales Rep</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byRep} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tickFormatter={(value) => `${value}`} />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="success" name="Successful" stackId="a" fill="#025E73" />
                <Bar dataKey="failed" name="Failed" stackId="a" fill="#F2A71B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}