import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, RadialBarChart, RadialBar, Legend } from "recharts";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { calculatePercentageChange } from "@/lib/calculations";
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CommissionData {
  total: number;
  achieved: number;
  target: number;
  projection: number;
  categories: {
    name: string;
    amount: number;
    percentage: number;
  }[];
  previous: {
    total: number;
  };
}

interface CommissionHighlightsProps {
  data: CommissionData;
}

export function CommissionHighlights({ data }: CommissionHighlightsProps) {
  const [activeTab, setActiveTab] = useState<"breakdown" | "progress">("progress");
  
  // Calculate percentage of achievement toward target
  const achievementPercent = data.target > 0 ? data.achieved / data.target : 0;
  
  // Calculate change percentage from previous period
  const changePercent = calculatePercentageChange(data.total, data.previous.total);
  const changeDirection = 
    changePercent > 2 ? 'up' : 
    changePercent < -2 ? 'down' : 'stable';

  // Format the data for the pie chart
  const pieChartData = data.categories.map(category => ({
    name: category.name,
    value: category.amount,
    percentage: category.percentage
  }));
  
  // Format the data for the radial bar chart
  const radialBarData = [
    {
      name: "Achieved",
      value: achievementPercent,
      fill: "#025E73"
    }
  ];
  
  const COLORS = ["#025E73", "#F2A71B", "#412754", "#1ca979", "#e74c3c", "#3498db"];
  
  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-[#025E73]">Commission Highlights</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Current commission earnings and targets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-2xl font-bold text-[#025E73]">
                {formatCurrency(data.total)}
              </div>
              <div className="text-sm text-gray-500">
                Total commissions
              </div>
            </div>
            
            <div className="flex items-center">
              {changeDirection === 'up' && (
                <ArrowUpIcon className="w-4 h-4 text-green-500 mr-1" />
              )}
              {changeDirection === 'down' && (
                <ArrowDownIcon className="w-4 h-4 text-red-500 mr-1" />
              )}
              {changeDirection === 'stable' && (
                <MinusIcon className="w-4 h-4 text-gray-500 mr-1" />
              )}
              <span className={
                changeDirection === 'up' ? 'text-green-500' :
                changeDirection === 'down' ? 'text-red-500' : 'text-gray-500'
              }>
                {formatPercent(Math.abs(changePercent) / 100)}
              </span>
            </div>
          </div>
          
          <Tabs defaultValue={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            </TabsList>
            
            <TabsContent value="progress" className="mt-0">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart 
                    cx="50%" 
                    cy="50%" 
                    innerRadius="60%" 
                    outerRadius="80%" 
                    barSize={20} 
                    data={radialBarData}
                    startAngle={180}
                    endAngle={0}
                  >
                    <RadialBar
                      background
                      dataKey="value"
                      label={{ 
                        position: 'center', 
                        fill: '#666', 
                        fontSize: 16,
                        formatter: () => `${(achievementPercent * 100).toFixed(1)}%` 
                      }}
                    />
                    <Tooltip
                      formatter={(value: any) => [`${(value * 100).toFixed(1)}%`, "Target Achieved"]}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                <div>
                  <div className="text-sm text-gray-500">Target</div>
                  <div className="font-semibold">{formatCurrency(data.target)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Projection</div>
                  <div className="font-semibold">{formatCurrency(data.projection)}</div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="breakdown" className="mt-0">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [formatCurrency(value as number), "Amount"]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-2 text-xs text-gray-500 text-center">
                Commission distribution by category
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}