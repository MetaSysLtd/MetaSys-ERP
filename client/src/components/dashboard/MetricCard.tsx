import { ReactNode } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Link } from "wouter";
import { TrendingDown, TrendingUp, ArrowRight, PieChart, BarChart4, ShoppingCart, CreditCard } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { getCardClass } from "@/lib/style-utils";

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
  emptyStateMessage?: string | null;
  isEmptyState?: boolean;
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
  className = "",
  emptyStateMessage,
  isEmptyState = value === 0 || value === "0"
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
    <Card 
      accent={true} 
      accentPosition="left" 
      className={`${getCardClass({ withAccent: true })} overflow-hidden group ${className}`}
    >
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${iconBgColor} rounded-md p-3 transition-colors group-hover:bg-[#F2A71B]/10`}>
            <div className={`h-6 w-6 ${iconColor} transition-colors group-hover:text-[#F2A71B]`}>{displayIcon}</div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 whitespace-normal break-words">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
                {isEmptyState && emptyStateMessage ? (
                  <div className="text-xs text-amber-600 mt-1">
                    {emptyStateMessage}
                  </div>
                ) : description && (
                  <div className={`flex items-center text-sm ${trendStyles.textColor}`}>
                    {trendStyles.icon}
                    <span className="ml-1 whitespace-normal break-words">{description}</span>
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
              <span className="font-medium text-[#025E73] hover:text-[#F2A71B] flex items-center cursor-pointer transition-colors">
                View details
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
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
      <Card accent={true} accentPosition="top" className={getCardClass({ withHover: false })}>
        <CardContent className="p-5">
          <h3 className="text-lg font-medium mb-2 text-[#025E73]">Commission Breakdown</h3>
          <EmptyState
            iconType="finance"
            iconSize={24}
            title="No Commission Data"
            message="No commission data available for the current period."
            description="Commission data will appear once sales and dispatch activities are completed."
            minimal={true}
            align="left"
            placeholderData={
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-center">
                  <div className="text-sm text-gray-400">PKR 0</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-center">
                  <div className="text-sm text-gray-400">PKR 0</div>
                  <div className="text-xs text-gray-500">Base</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-center">
                  <div className="text-sm text-gray-400">PKR 0</div>
                  <div className="text-xs text-gray-500">Bonus</div>
                </div>
              </div>
            }
          />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card accent={true} accentPosition="top" className={getCardClass()}>
      <CardContent className="p-5">
        <h3 className="text-lg font-medium mb-4 text-[#025E73] group-hover:text-[#011F26] transition-colors">Commission Breakdown</h3>
        {/* Commission data would be rendered here */}
        <p>Commission data visualization would go here</p>
      </CardContent>
    </Card>
  );
}