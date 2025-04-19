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
      <Card className="shadow rounded-lg">
        <CardHeader className="px-5 py-4 border-b border-gray-200">
          <CardTitle className="text-lg leading-6 font-medium text-gray-900">
            Finance Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 flex justify-center items-center h-64">
          <p className="text-gray-500">No financial data available</p>
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
    <Card className="shadow rounded-lg">
      <CardHeader className="px-5 py-4 border-b border-gray-200">
        <CardTitle className="text-lg leading-6 font-medium text-gray-900">
          Finance Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-sm text-gray-500">Total Revenue</div>
            <div className="text-lg font-medium">{formatCurrency(totalRevenue)}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-sm text-gray-500">Total Expenses</div>
            <div className="text-lg font-medium">{formatCurrency(totalExpenses)}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-sm text-gray-500">Profit</div>
            <div className="text-lg font-medium">{formatCurrency(profit)}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-sm text-gray-500">Profit Margin</div>
            <div className="text-lg font-medium">{profitMargin}%</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div>
            <h3 className="text-md font-medium mb-3">Revenue & Expenses</h3>
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
            <h3 className="text-md font-medium mb-3">Expense Breakdown</h3>
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