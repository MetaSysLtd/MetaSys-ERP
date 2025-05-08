import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Progress } from "@/components/ui/progress";

type ConversionRatiosProps = {
  data: any;
};

export function ConversionRatios({ data }: ConversionRatiosProps) {
  // Default colors
  const COLORS = ["#025E73", "#F2A71B", "#412754", "#011F26", "#d1d5db"];
  
  // Format data for pie chart
  const chartData = data?.ratios || [];
  
  const funnelStages = data?.funnelStages || [];
  
  return (
    <Card className="shadow hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-[#025E73] font-medium">
          Conversion Ratios
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value}%`, undefined]} 
                />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex flex-col justify-center space-y-6">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Conversion Funnel</h4>
            
            {funnelStages.map((stage: any, index: number) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{stage.name}</span>
                  <span className="text-sm font-medium">{stage.value}%</span>
                </div>
                <Progress value={stage.value} className="h-2" style={{ 
                  "--tw-progress-fill": COLORS[index % COLORS.length] 
                } as React.CSSProperties} />
              </div>
            ))}
            
            <div className="text-sm text-gray-500 italic mt-2">
              {data?.insight || ""}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}