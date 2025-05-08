import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingDown, TrendingUp, ExternalLink, ArrowLeftRight } from "lucide-react";

interface RatioData {
  name: string;
  value: number;
  change: number;
  target: number;
}

interface ConversionRatiosProps {
  data: RatioData[];
}

export function ConversionRatios({ data }: ConversionRatiosProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="shadow-md hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-[#025E73] flex items-center">
            <ArrowLeftRight className="mr-2 h-5 w-5" />
            Conversion Ratios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground">No conversion data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-[#025E73] flex items-center">
          <ArrowLeftRight className="mr-2 h-5 w-5" />
          Conversion Ratios
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((ratio, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">{ratio.name}</span>
                  {ratio.change > 0 ? (
                    <div className="flex items-center text-green-500 text-xs font-medium">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {ratio.change.toFixed(1)}%
                    </div>
                  ) : (
                    <div className="flex items-center text-red-500 text-xs font-medium">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      {Math.abs(ratio.change).toFixed(1)}%
                    </div>
                  )}
                </div>
                <span className="text-sm font-bold">{(ratio.value * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center space-x-2">
                <Progress 
                  value={ratio.value * 100} 
                  max={ratio.target * 100}
                  className="h-2"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  Target: {(ratio.target * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <a 
            href="#" 
            className="text-sm text-[#025E73] flex items-center hover:underline"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View detailed conversion report
          </a>
        </div>
      </CardContent>
    </Card>
  );
}