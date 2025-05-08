import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  FunnelItem,
  LabelList,
} from "recharts";
import { AlertCircle } from "lucide-react";

type ConversionRatiosProps = {
  data: any;
};

export function ConversionRatios({ data }: ConversionRatiosProps) {
  if (!data) {
    data = {
      ratios: [],
      funnelStages: [],
      insight: ""
    };
  }
  
  return (
    <Card className="shadow hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-[#025E73] font-medium">
          Conversion Ratios
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6">
          {/* Conversion stage percentages */}
          <div>
            <h4 className="text-sm font-medium mb-3">Conversion by Stage</h4>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.ratios}
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <YAxis type="category" dataKey="name" width={120} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Success Rate']} />
                  <Bar 
                    dataKey="value" 
                    name="Success Rate" 
                    fill="#025E73" 
                    radius={[0, 4, 4, 0]}
                    label={{ 
                      position: 'right', 
                      formatter: (value: number) => `${value}%`,
                      fill: '#000',
                      fontSize: 12
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Sales funnel */}
          <div>
            <h4 className="text-sm font-medium mb-3">Lead Qualification Funnel</h4>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip formatter={(value) => [`${value}%`, undefined]} />
                  <Funnel
                    dataKey="value"
                    data={data.funnelStages}
                    isAnimationActive
                  >
                    <LabelList
                      position="right"
                      fill="#000"
                      stroke="none"
                      dataKey="name"
                    />
                    <LabelList
                      position="center"
                      fill="#fff"
                      stroke="none"
                      dataKey="value"
                      formatter={(value: number) => `${value}%`}
                    />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Insight callout */}
          {data.insight && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-start mt-1">
              <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0 mr-2" />
              <div>
                <h5 className="text-sm font-medium text-blue-800">Insight</h5>
                <p className="text-sm text-blue-700">{data.insight}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}