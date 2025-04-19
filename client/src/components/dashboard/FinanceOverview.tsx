import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";

interface FinanceData {
  revenue: {
    monthly: { month: string; amount: number }[];
    quarterly: { quarter: string; amount: number }[];
    annual: number;
    change: number;
  };
  expenses: {
    monthly: { month: string; amount: number }[];
    quarterly: { quarter: string; amount: number }[];
    annual: number;
    change: number;
    breakdown: { category: string; amount: number; color: string }[];
  };
  profit: {
    monthly: { month: string; amount: number }[];
    quarterly: { quarter: string; amount: number }[];
    annual: number;
    change: number;
    margin: number;
  };
  cashFlow: {
    current: number;
    previous: number;
    change: number;
    forecast: number;
  };
}

interface Props {
  data?: FinanceData;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function FinanceOverview({ data }: Props) {
  if (!data) return null;

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Finance Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="monthly">
          <TabsList className="mb-4">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="bg-white shadow-sm">
                <CardHeader className="py-3">
                  <CardTitle className="text-base font-medium">Revenue</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(data.revenue.annual)}
                  </div>
                  <div className={`text-sm ${data.revenue.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {data.revenue.change >= 0 ? "+" : ""}{data.revenue.change}% from previous year
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-sm">
                <CardHeader className="py-3">
                  <CardTitle className="text-base font-medium">Expenses</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(data.expenses.annual)}
                  </div>
                  <div className={`text-sm ${data.expenses.change <= 0 ? "text-green-600" : "text-red-600"}`}>
                    {data.expenses.change >= 0 ? "+" : ""}{data.expenses.change}% from previous year
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-sm">
                <CardHeader className="py-3">
                  <CardTitle className="text-base font-medium">Profit</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(data.profit.annual)}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className={`text-sm ${data.profit.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {data.profit.change >= 0 ? "+" : ""}{data.profit.change}% from previous year
                    </div>
                    <div className="text-sm text-gray-500">
                      Margin: {data.profit.margin}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={data.revenue.monthly.map((month, index) => ({
                        name: month.month,
                        revenue: month.amount,
                        expenses: data.expenses.monthly[index]?.amount || 0,
                        profit: data.profit.monthly[index]?.amount || 0
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#1D3557" name="Revenue" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="expenses" stroke="#e63946" name="Expenses" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="profit" stroke="#2EC4B6" name="Profit" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.expenses.breakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                        nameKey="category"
                        label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {data.expenses.breakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-2 text-sm font-medium">Expense Breakdown</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="quarterly" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="bg-white shadow-sm">
                <CardHeader className="py-3">
                  <CardTitle className="text-base font-medium">Revenue</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(data.revenue.annual)}
                  </div>
                  <div className={`text-sm ${data.revenue.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {data.revenue.change >= 0 ? "+" : ""}{data.revenue.change}% from previous year
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-sm">
                <CardHeader className="py-3">
                  <CardTitle className="text-base font-medium">Expenses</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(data.expenses.annual)}
                  </div>
                  <div className={`text-sm ${data.expenses.change <= 0 ? "text-green-600" : "text-red-600"}`}>
                    {data.expenses.change >= 0 ? "+" : ""}{data.expenses.change}% from previous year
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-sm">
                <CardHeader className="py-3">
                  <CardTitle className="text-base font-medium">Profit</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(data.profit.annual)}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className={`text-sm ${data.profit.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {data.profit.change >= 0 ? "+" : ""}{data.profit.change}% from previous year
                    </div>
                    <div className="text-sm text-gray-500">
                      Margin: {data.profit.margin}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.revenue.quarterly.map((quarter, index) => ({
                    name: quarter.quarter,
                    revenue: quarter.amount,
                    expenses: data.expenses.quarterly[index]?.amount || 0,
                    profit: data.profit.quarterly[index]?.amount || 0
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#1D3557" name="Revenue" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="expenses" stroke="#e63946" name="Expenses" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="profit" stroke="#2EC4B6" name="Profit" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}