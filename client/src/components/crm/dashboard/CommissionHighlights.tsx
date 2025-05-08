import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeDollarSign, ChevronDown, ChevronUp, DollarSign, CreditCard, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface CommissionData {
  total: number;
  average: number;
  target: number;
  lastMonth: number;
  change: number;
  nextPayout: {
    amount: number;
    date: string;
  };
}

interface CommissionHighlightsProps {
  data: CommissionData;
}

export function CommissionHighlights({ data }: CommissionHighlightsProps) {
  if (!data) {
    return (
      <Card className="shadow-md hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-[#025E73] flex items-center">
            <BadgeDollarSign className="mr-2 h-5 w-5" />
            Commission Highlights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground">No commission data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const percentChange = ((data.total - data.lastMonth) / data.lastMonth) * 100;
  const progress = (data.total / data.target) * 100;

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-[#025E73] flex items-center">
          <BadgeDollarSign className="mr-2 h-5 w-5" />
          Commission Highlights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Commission</p>
              <p className="text-3xl font-bold">{formatCurrency(data.total)}</p>
              <div className="flex items-center mt-1">
                {percentChange >= 0 ? (
                  <div className="text-green-500 text-xs font-medium flex items-center">
                    <ChevronUp className="h-4 w-4" />
                    {Math.abs(percentChange).toFixed(1)}%
                  </div>
                ) : (
                  <div className="text-red-500 text-xs font-medium flex items-center">
                    <ChevronDown className="h-4 w-4" />
                    {Math.abs(percentChange).toFixed(1)}%
                  </div>
                )}
                <span className="text-xs text-muted-foreground ml-2">vs last month</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Target</p>
              <p className="text-xl font-bold">{formatCurrency(data.target)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {progress.toFixed(0)}% complete
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-gray-50 p-4 rounded-lg flex items-center">
              <div className="mr-3 bg-[#025E73]/10 p-2 rounded-full">
                <DollarSign className="h-5 w-5 text-[#025E73]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Deal</p>
                <p className="text-lg font-bold">{formatCurrency(data.average)}</p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg flex items-center">
              <div className="mr-3 bg-[#025E73]/10 p-2 rounded-full">
                <Wallet className="h-5 w-5 text-[#025E73]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Payout</p>
                <p className="text-lg font-bold">{formatCurrency(data.nextPayout.amount)}</p>
                <p className="text-xs text-muted-foreground">{data.nextPayout.date}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}