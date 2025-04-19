
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from "@/lib/utils";

interface RevenueData {
  name: string;
  value: number;
}

export function RevenueCard({ data }: { data?: RevenueData[] }) {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#2563eb" 
                strokeWidth={2} 
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
