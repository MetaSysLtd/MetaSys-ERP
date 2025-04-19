import { ReactNode } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Link } from "wouter";
import { TrendingDown, TrendingUp, ArrowRight, PieChart, BarChart4, ShoppingCart, CreditCard } from "lucide-react";

export interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  href?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  description,
  trend = 'neutral',
  icon,
  iconBgColor = "bg-blue-50",
  iconColor = "text-blue-600",
  href,
  className = ""
}: MetricCardProps) {
  // Default icons based on title if not provided
  const getDefaultIcon = () => {
    if (title.toLowerCase().includes('revenue') || title.toLowerCase().includes('profit')) {
      return <CreditCard />;
    } else if (title.toLowerCase().includes('leads')) {
      return <ShoppingCart />;
    } else if (title.toLowerCase().includes('loads') || title.toLowerCase().includes('dispatch')) {
      return <BarChart4 />;
    } else {
      return <PieChart />;
    }
  };

  // Trend styles and icon
  const getTrendStyles = () => {
    if (trend === 'up') {
      return {
        icon: <TrendingUp className="h-4 w-4" />,
        textColor: "text-green-600"
      };
    } else if (trend === 'down') {
      return {
        icon: <TrendingDown className="h-4 w-4" />,
        textColor: "text-red-600"
      };
    } else {
      return {
        icon: <ArrowRight className="h-4 w-4" />,
        textColor: "text-gray-600"
      };
    }
  };

  const trendStyles = getTrendStyles();
  const displayIcon = icon || getDefaultIcon();

  return (
    <Card className={`bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow ${className}`}>
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${iconBgColor} rounded-md p-3`}>
            <div className={`h-6 w-6 ${iconColor}`}>{displayIcon}</div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
                {description && (
                  <div className={`flex items-center text-sm ${trendStyles.textColor}`}>
                    {trendStyles.icon}
                    <span className="ml-1">{description}</span>
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </CardContent>
      {href && (
        <CardFooter className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <Link href={href}>
              <span className="font-medium text-blue-600 hover:text-blue-900 flex items-center cursor-pointer">
                View details
                <ArrowRight className="ml-1 h-4 w-4" />
              </span>
            </Link>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

// CommissionBreakdown component exported separately 
export function CommissionBreakdown({ data }: { data?: any }) {
  if (!data) {
    return (
      <Card className="shadow rounded-lg">
        <CardContent className="p-5 flex justify-center items-center h-32">
          <p className="text-gray-500">No commission data available</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow rounded-lg">
      <CardContent className="p-5">
        <h3 className="text-lg font-medium mb-4">Commission Breakdown</h3>
        {/* Commission data would be rendered here */}
        <p>Commission data visualization would go here</p>
      </CardContent>
    </Card>
  );
}