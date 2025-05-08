import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CRMConversionRatios } from "@shared/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";
import { InfoIcon } from "lucide-react";

interface ConversionRatiosProps {
  data: CRMConversionRatios;
}

export function ConversionRatios({ data }: ConversionRatiosProps) {
  if (!data || !data.ratios || !data.funnelStages) {
    return (
      <Card className="shadow-md hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle>Conversion Ratios</CardTitle>
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
  const COLORS = ["#025E73", "#F2A71B", "#412754", "#A5D8DD"];
  
  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-[#025E73]">Conversion Funnel</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Lead to contract conversion journey
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div>
          {/* Conversion Ratios */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {data.ratios.map((ratio, index) => (
              <div key={index} className="bg-gray-50 rounded-md p-3">
                <p className="text-xs text-gray-500">{ratio.name}</p>
                <p className="text-2xl font-bold" style={{ color: COLORS[index % COLORS.length] }}>
                  {ratio.value}%
                </p>
              </div>
            ))}
          </div>
          
          {/* Funnel Visualization */}
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={data.funnelStages}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => [`${value} leads`, ""]}
                  labelFormatter={() => ""}
                />
                <Bar 
                  dataKey="value" 
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
          
          {/* Insight */}
          {data.insight && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <div className="flex items-start space-x-2">
                <InfoIcon className="h-4 w-4 text-[#025E73] mt-0.5" />
                <p className="text-xs text-gray-500">{data.insight}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}