import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CRMConversionRatios } from "@shared/schema";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  FunnelChart,
  Funnel,
  LabelList,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface ConversionRatiosProps {
  data: CRMConversionRatios;
}

export function ConversionRatios({ data }: ConversionRatiosProps) {
  if (!data || (!data.ratios.length && !data.funnelStages.length)) {
    return (
      <Card className="shadow-md hover:shadow-lg transition-all duration-200 h-full">
        <CardHeader>
          <CardTitle>Conversion Ratios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const COLORS = ["#025E73", "#0A7A9B", "#1297C3", "#1AB5EB", "#A5D8DD"];

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-[#025E73]">Conversion Ratios</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Performance across the sales funnel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Funnel Stages</h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip formatter={(value) => [`${value} leads`, 'Count']} />
                <Funnel
                  dataKey="value"
                  nameKey="name"
                  data={data.funnelStages}
                  isAnimationActive
                >
                  <LabelList
                    position="right"
                    fill="#000"
                    stroke="none"
                    formatter={(value: number, entry: any) => `${entry.name}: ${value}`}
                  />
                  {data.funnelStages.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Conversion Rates</h4>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.ratios} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tickFormatter={(value) => `${value}%`} />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip formatter={(value) => [`${value}%`, 'Rate']} />
                <Bar dataKey="value" fill="#025E73" radius={[0, 4, 4, 0]}>
                  {data.ratios.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  <LabelList dataKey="value" position="right" formatter={(value: number) => `${value}%`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {data.insight && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Insight</h4>
            <p className="text-xs text-gray-500">{data.insight}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}