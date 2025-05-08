import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartIcon, FileSpreadsheet, PieChart as PieChartIcon, TrendingUp } from "lucide-react";

interface LeadsOverviewProps {
  data: {
    totalLeads: number;
    newLeads: number;
    qualifiedLeads: number;
    conversion: number;
    trend: Array<{
      month: string;
      created: number;
      qualified: number;
      converted: number;
    }>;
    byStatus: Array<{
      name: string;
      value: number;
    }>;
    bySource: Array<{
      name: string;
      value: number;
    }>;
  };
}

const COLORS = ["#025E73", "#F2A71B", "#412754", "#2B9EB3", "#F49E4C", "#7E5A9B"];

export function LeadsOverview({ data }: LeadsOverviewProps) {
  if (!data) {
    return (
      <Card className="shadow-md hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-[#025E73]">
            Leads Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-[#025E73] flex items-center">
          <FileSpreadsheet className="mr-2 h-5 w-5" />
          Leads Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Leads</p>
            <h3 className="text-2xl font-bold">{data.totalLeads}</h3>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">New Leads</p>
            <h3 className="text-2xl font-bold">{data.newLeads}</h3>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Lead Conversion</p>
            <h3 className="text-2xl font-bold">{(data.conversion * 100).toFixed(1)}%</h3>
          </div>
        </div>
        
        <Tabs defaultValue="trend">
          <TabsList className="mb-4">
            <TabsTrigger value="trend" className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              Trend
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center">
              <ChartIcon className="h-4 w-4 mr-1" />
              By Status
            </TabsTrigger>
            <TabsTrigger value="source" className="flex items-center">
              <PieChartIcon className="h-4 w-4 mr-1" />
              By Source
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="trend">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.trend} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="created" stackId="a" fill="#025E73" name="Created" />
                  <Bar dataKey="qualified" stackId="a" fill="#F2A71B" name="Qualified" />
                  <Bar dataKey="converted" stackId="a" fill="#412754" name="Converted" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="status">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.byStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.byStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="source">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.bySource}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.bySource.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ 
  cx, 
  cy, 
  midAngle, 
  innerRadius, 
  outerRadius, 
  percent 
}: { 
  cx: number; 
  cy: number; 
  midAngle: number; 
  innerRadius: number; 
  outerRadius: number; 
  percent: number;
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};