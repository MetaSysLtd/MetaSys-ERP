import { ReactNode } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Link } from "wouter";
import { TrendingDown, TrendingUp, ArrowRight, PieChart, BarChart4, ShoppingCart, CreditCard, Users, Calendar, Info, DollarSign, BarChart3, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  getCardClass,
  typography,
  metricCardStyles,
  buttonStyles,
  brandColors
} from "@/lib/style-utils";

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
  timeframe?: string;
  tooltip?: string;
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
  isEmptyState = value === 0 || value === "0",
  timeframe,
  tooltip
}: MetricCardProps) {
  // Default icons based on title if not provided
  const getDefaultIcon = () => {
    if (title.toLowerCase().includes('revenue') || title.toLowerCase().includes('profit') || title.toLowerCase().includes('invoice')) {
      return <CreditCard />;
    } else if (title.toLowerCase().includes('lead')) {
      return <ShoppingCart />;
    } else if (title.toLowerCase().includes('load') || title.toLowerCase().includes('dispatch')) {
      return <BarChart4 />;
    } else if (title.toLowerCase().includes('client') || title.toLowerCase().includes('employee')) {
      return <Users />;
    } else if (title.toLowerCase().includes('date') || title.toLowerCase().includes('schedule')) {
      return <Calendar />;
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
      className={`${getCardClass({ 
        withAccent: true,
        minHeight: true,
        withBorder: true 
      })} overflow-hidden group ${className}`}
    >
      <CardContent className="p-5">
        <div className="flex items-center h-full">
          <div className={`${metricCardStyles.iconContainer} ${iconBgColor} transition-colors group-hover:bg-[#F2A71B]/10`}>
            <div className={`h-6 w-6 ${iconColor} transition-colors group-hover:text-[#F2A71B]`}>{displayIcon}</div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="flex items-center">
                <span className={metricCardStyles.title}>{title}</span>
                {tooltip && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex ml-1 text-gray-400 hover:text-gray-600 cursor-help">
                          <Info size={14} />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className={typography.tiny}>{tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {timeframe && (
                  <span className={`${typography.tiny} ml-2 text-gray-500 font-normal`}>
                    {timeframe}
                  </span>
                )}
              </dt>
              <dd>
                <div className={metricCardStyles.value}>{value}</div>
                {isEmptyState && emptyStateMessage ? (
                  <div className={`${typography.tiny} text-amber-600 mt-1`}>
                    {emptyStateMessage}
                  </div>
                ) : description && (
                  <div className={`${metricCardStyles.description} ${trendStyles.textColor}`}>
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
        <CardFooter className="bg-gray-50 dark:bg-gray-800 px-5 py-3">
          <div className="text-sm w-full">
            <Link href={href}>
              <span className={`${typography.small} font-medium text-primary hover:text-primary/80 flex items-center justify-between w-full cursor-pointer transition-colors`}>
                <span>View {title.toLowerCase()} details</span>
                <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
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
      <Card accent={true} accentPosition="top" className={getCardClass({ 
        withHover: false, 
        minHeight: true,
        accentPosition: "top" 
      })}>
        <CardContent className="p-5">
          <h3 className={typography.cardTitle}>Commission Breakdown</h3>
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
                  <div className={`${typography.small} text-gray-400`}>PKR 0</div>
                  <div className={`${typography.tiny} text-gray-500`}>Total</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-center">
                  <div className={`${typography.small} text-gray-400`}>PKR 0</div>
                  <div className={`${typography.tiny} text-gray-500`}>Base</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-center">
                  <div className={`${typography.small} text-gray-400`}>PKR 0</div>
                  <div className={`${typography.tiny} text-gray-500`}>Bonus</div>
                </div>
              </div>
            }
          />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card accent={true} accentPosition="top" className={getCardClass({
      minHeight: true,
      accentPosition: "top"
    })}>
      <CardContent className="p-5">
        <h3 className={`${typography.cardTitle} mb-4 group-hover:text-[${brandColors.navy}] transition-colors`}>Commission Breakdown</h3>
        {/* Commission data would be rendered here */}
        <p className={typography.body}>Commission data visualization would go here</p>
      </CardContent>
    </Card>
  );
}