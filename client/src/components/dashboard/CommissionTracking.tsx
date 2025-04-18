import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Bar, 
  BarChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, calculatePercentage } from "@/lib/utils";

interface CommissionBreakdownItem {
  category: string;
  amount: number;
}

interface CommissionMonthData {
  name: string; // Month name
  amount: number;
}

interface CommissionBreakdownProps {
  data: {
    currentMonth: string;
    earned: number;
    target: number;
    progress: number;
    status: string;
    breakdown: CommissionBreakdownItem[];
    monthlyData: CommissionMonthData[];
    comparison: {
      lastMonth: number;
      lastMonthChange: number;
      ytd: number;
      ytdChange: number;
      forecast: number;
    };
  };
}

export function CommissionTracking({ data }: CommissionBreakdownProps) {
  const { 
    currentMonth, 
    earned, 
    target, 
    progress, 
    status,
    breakdown, 
    monthlyData, 
    comparison 
  } = data;

  return (
    <Card className="shadow rounded-lg overflow-hidden">
      <CardHeader className="px-5 py-4 border-b border-gray-200">
        <CardTitle className="text-lg leading-6 font-medium text-gray-900">
          Commission Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-1/3 mb-6 lg:mb-0 lg:pr-6">
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-base font-semibold text-gray-900">Current Month</h4>
                  <p className="text-sm text-gray-500">{currentMonth}</p>
                </div>
                <Badge className={status === "On Track" ? "bg-primary-100 text-primary-800" : "bg-yellow-100 text-yellow-800"}>
                  {status}
                </Badge>
              </div>
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div
                  className="bg-primary-500 h-2 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Earned</span>
                  <span className="font-medium text-gray-900">{formatCurrency(earned)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Monthly Target</span>
                  <span className="font-medium text-gray-900">{formatCurrency(target)}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-base font-semibold text-gray-900 mb-3">Commission Breakdown</h4>
              <ul className="space-y-2">
                {breakdown.map((item, index) => (
                  <li key={index} className="flex justify-between">
                    <span className="text-sm text-gray-500">{item.category}</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                  </li>
                ))}
                <li className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                  <span className="text-sm font-medium text-gray-700">Total</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(earned)}</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="lg:w-2/3 lg:pl-6">
            <div className="h-72 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    formatter={(value) => [`$${value}`, "Commission"]}
                  />
                  <Legend />
                  <ReferenceLine y={target} stroke="#FF5722" strokeDasharray="3 3" />
                  <Bar 
                    dataKey="amount" 
                    fill="#1976D2" 
                    name="Monthly Commission"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="text-sm text-gray-500">Last Month</div>
                <div className="text-xl font-medium">{formatCurrency(comparison.lastMonth)}</div>
                <div className={`text-xs flex items-center ${
                  comparison.lastMonthChange > 0 ? "text-green-600" : "text-red-600"
                }`}>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-3 w-3" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d={comparison.lastMonthChange > 0 ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} 
                    />
                  </svg>
                  <span className="ml-1">{comparison.lastMonthChange}% from previous</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="text-sm text-gray-500">YTD Commission</div>
                <div className="text-xl font-medium">{formatCurrency(comparison.ytd)}</div>
                <div className={`text-xs flex items-center ${
                  comparison.ytdChange > 0 ? "text-green-600" : "text-red-600"
                }`}>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-3 w-3" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d={comparison.ytdChange > 0 ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} 
                    />
                  </svg>
                  <span className="ml-1">{comparison.ytdChange}% from last year</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="text-sm text-gray-500">Annual Forecast</div>
                <div className="text-xl font-medium">{formatCurrency(comparison.forecast)}</div>
                <div className="text-xs text-gray-500">
                  Based on current performance
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
