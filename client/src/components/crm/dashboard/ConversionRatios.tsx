import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import { formatPercent } from "@/lib/formatters";

interface ConversionData {
  qualification: number;
  handoff: number;
  closing: number;
}

interface ConversionRatiosProps {
  data: ConversionData;
}

const COLORS = ["#025E73", "#F2A71B", "#412754"];

export function ConversionRatios({ data }: ConversionRatiosProps) {
  // Transform data for the chart
  const chartData = [
    { name: "Qualification Rate", value: data.qualification },
    { name: "Handoff Rate", value: data.handoff },
    { name: "Closing Rate", value: data.closing }
  ];

  // Calculate the average conversion rate
  const averageRate = 
    (data.qualification + data.handoff + data.closing) / 3;
  
  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-[#025E73]">Conversion Ratios</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Lead conversion performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex justify-center items-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#025E73]">
                {formatPercent(averageRate)}
              </div>
              <div className="text-sm text-gray-500">Average Conversion</div>
            </div>
          </div>
          
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${formatPercent(value as number)}`, ""]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {chartData.map((item, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="text-lg font-semibold">
                  {formatPercent(item.value)}
                </div>
                <div 
                  className="text-xs text-center text-gray-600 truncate w-full"
                  title={item.name}
                >
                  {item.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}