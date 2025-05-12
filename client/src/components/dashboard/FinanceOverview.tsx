import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { getCardClass, typography, placeholderChartStyles } from "@/lib/style-utils";
import { BarChart2, LineChart } from "lucide-react";

interface FinanceSummary {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  profitMargin: number;
  revenueByMonth: {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
  expenseCategories: {
    category: string;
    amount: number;
    percentage: number;
  }[];
}

interface FinanceOverviewProps {
  data?: FinanceSummary;
}

export function FinanceOverview({ data }: FinanceOverviewProps) {
  if (!data) {
    return (
      <Card className={getCardClass({ minHeight: true, shadowSize: "lg" })}>
        <CardHeader className="px-5 py-4 border-b border-gray-200">
          <CardTitle className={typography.cardTitle}>
            Finance Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <EmptyState
            iconType="finance"
            iconSize={28}
            title="No Financial Data Yet"
            message="Financial data will appear here once revenue and expense information is recorded in the system."
            description="This overview will show revenue trends, expense breakdown, and profitability metrics."
            placeholderData={
              <div className="space-y-4 mt-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                    <div className={typography.small + " text-gray-500"}>Total Revenue</div>
                    <div className={typography.value + " text-gray-400"}>$0</div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                    <div className={typography.small + " text-gray-500"}>Total Expenses</div>
                    <div className={typography.value + " text-gray-400"}>$0</div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                    <div className={typography.small + " text-gray-500"}>Profit</div>
                    <div className={typography.value + " text-gray-400"}>$0</div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                    <div className={typography.small + " text-gray-500"}>Profit Margin</div>
                    <div className={typography.value + " text-gray-400"}>0%</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Placeholder Revenue Chart */}
                  <div>
                    <h3 className={typography.h5 + " mb-3"}>Revenue & Expenses</h3>
                    <div className={placeholderChartStyles.base + " " + placeholderChartStyles.height}>
                      <LineChart className="h-12 w-12 text-gray-300 mb-2" />
                      <div className={placeholderChartStyles.text}>No revenue data yet</div>
                      <div className={placeholderChartStyles.subtext}>Revenue charts will appear once financial data is recorded</div>
                    </div>
                  </div>
                  
                  {/* Placeholder Expense Chart */}
                  <div>
                    <h3 className={typography.h5 + " mb-3"}>Expense Breakdown</h3>
                    <div className={placeholderChartStyles.base + " " + placeholderChartStyles.height}>
                      <BarChart2 className="h-12 w-12 text-gray-300 mb-2" />
                      <div className={placeholderChartStyles.text}>No expense data yet</div>
                      <div className={placeholderChartStyles.subtext}>Expense breakdown will appear once expenses are recorded</div>
                    </div>
                  </div>
                </div>
              </div>
            }
          />
        </CardContent>
      </Card>
    );
  }

  const { 
    totalRevenue, 
    totalExpenses, 
    profit, 
    profitMargin, 
    revenueByMonth, 
    expenseCategories 
  } = data;

  return (
    <Card className={getCardClass({ minHeight: true, shadowSize: "lg" })}>
      <CardHeader className="px-5 py-4 border-b border-gray-200">
        <CardTitle className={typography.cardTitle}>
          Finance Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-md">
            <div className={typography.small + " text-gray-500"}>Total Revenue</div>
            <div className={typography.value}>{formatCurrency(totalRevenue)}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className={typography.small + " text-gray-500"}>Total Expenses</div>
            <div className={typography.value}>{formatCurrency(totalExpenses)}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className={typography.small + " text-gray-500"}>Profit</div>
            <div className={typography.value}>{formatCurrency(profit)}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className={typography.small + " text-gray-500"}>Profit Margin</div>
            <div className={typography.value}>{profitMargin}%</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div>
            <h3 className={typography.h5 + " mb-3"}>Revenue & Expenses</h3>
            <div className="h-64 bg-gray-50 rounded-lg">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueByMonth}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2EC4B6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#2EC4B6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E76F51" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#E76F51" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1D3557" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#1D3557" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    width={60}
                    tickFormatter={(value) => `$${value/1000}k`}
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#2EC4B6" 
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="Revenue"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#E76F51" 
                    fillOpacity={1}
                    fill="url(#colorExpenses)"
                    name="Expenses"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#1D3557" 
                    fillOpacity={1}
                    fill="url(#colorProfit)"
                    name="Profit"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Expense Categories */}
          <div>
            <h3 className={typography.h5 + " mb-3"}>Expense Breakdown</h3>
            <div className="h-64 bg-gray-50 rounded-lg">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={expenseCategories}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis tickFormatter={(value) => `${value}%`} />
                  <Tooltip formatter={(value: number, name: string, props: any) => {
                    const category = expenseCategories.find(cat => cat.category === props.payload.category);
                    return [
                      [`${formatCurrency(category?.amount || 0)} (${value}%)`], 
                      'Amount'
                    ];
                  }} />
                  <Bar dataKey="percentage" fill="#1D3557" name="% of Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}