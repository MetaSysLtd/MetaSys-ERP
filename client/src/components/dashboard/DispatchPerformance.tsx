import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from "@/lib/utils";

interface DispatcherData {
  name: string;
  activeLeads: number;
  loadsBooked: number;
  invoiceGenerated: number;
  invoiceCleared: number;
  highestLoad: number;
}

interface DispatchPerformanceProps {
  data?: DispatcherData[];
  title?: string;
  className?: string;
}

export function DispatchPerformance({ 
  data = [], 
  title = "Dispatch Performance", 
  className = ""
}: DispatchPerformanceProps) {
  
  // If no data, show a placeholder/loading state
  if (!data || data.length === 0) {
    return (
      <Card className={`shadow rounded-lg ${className}`}>
        <CardHeader className="px-5 py-4 border-b border-gray-200">
          <CardTitle className="text-lg leading-6 font-medium text-gray-900">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 flex justify-center items-center h-64">
          <p className="text-gray-500">Loading dispatcher performance data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`shadow rounded-lg ${className}`}>
      <CardHeader className="px-5 py-4 border-b border-gray-200">
        <CardTitle className="text-lg leading-6 font-medium text-gray-900">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'invoiceGenerated' || name === 'invoiceCleared' || name === 'highestLoad') {
                    return [formatCurrency(value as number), name];
                  }
                  return [value, name];
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="activeLeads" name="Active Leads" fill="#8884d8" />
              <Bar yAxisId="left" dataKey="loadsBooked" name="Loads Booked" fill="#FF8042" />
              <Bar yAxisId="right" dataKey="invoiceGenerated" name="Invoice Generated ($)" fill="#82ca9d" />
              <Bar yAxisId="right" dataKey="invoiceCleared" name="Invoice Cleared ($)" fill="#4CB9A3" />
              <Bar yAxisId="right" dataKey="highestLoad" name="Highest Load ($)" fill="#607D8B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}