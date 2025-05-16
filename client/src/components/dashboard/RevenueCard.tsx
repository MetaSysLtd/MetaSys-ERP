import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface RevenueData {
  total: number;
  byMonth: {
    month: string;
    revenue: number;
    target: number;
  }[];
}

interface RevenueCardProps {
  data?: RevenueData;
}

export function RevenueCard({ data }: RevenueCardProps) {
  // Return placeholder UI if no data is provided
  if (!data) {
    return (
      <Card className="shadow rounded-lg">
        <CardHeader className="px-5 py-4 border-b border-gray-200">
          <CardTitle className="text-lg leading-6 font-medium text-gray-900">
            Revenue Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <EmptyState
            iconType="finance"
            iconSize={28}
            title="No Revenue Data Yet"
            message="Revenue data will appear here once sales activities begin."
            description="This chart will show actual revenue against targets over time."
            placeholderData={
              <div className="space-y-4 mt-3">
                <div className="text-center mb-4">
                  <div className="text-2xl font-semibold text-gray-400">{formatCurrency(0)}</div>
                  <div className="text-sm text-gray-500">Total Revenue</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg h-40 flex items-center justify-center">
                  <div className="text-sm text-gray-400">Revenue chart will appear here</div>
                </div>
                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto text-center">
                  <div>
                    <div className="text-sm font-medium text-gray-400">{formatCurrency(0)}</div>
                    <div className="text-xs text-gray-500">This Month</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-400">{formatCurrency(0)}</div>
                    <div className="text-xs text-gray-500">Last Month</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-400">0%</div>
                    <div className="text-xs text-gray-500">Growth</div>
                  </div>
                </div>
              </div>
            }
          />
        </CardContent>
      </Card>
    );
  }

  const { total, byMonth } = data;

  return (
    <Card className="shadow rounded-lg">
      <CardHeader className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
        <CardTitle className="text-lg leading-6 font-medium text-gray-900">
          Revenue Overview
        </CardTitle>
        <div className="text-lg font-semibold">
          {formatCurrency(total)}
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={byMonth}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis 
                tickFormatter={(value) => `$${value/1000}k`}
              />
              <Tooltip 
                formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#2EC4B6"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Actual Revenue"
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="#1D3557"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4 }}
                name="Target Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}