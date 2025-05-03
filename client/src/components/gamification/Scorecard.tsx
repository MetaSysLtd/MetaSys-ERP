import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { BarChart2, CheckCircle, Star, Target, Trophy } from 'lucide-react';
import { MotionWrapper } from '@/components/ui/motion-wrapper';

export interface ScoreCardProps {
  type: 'sales' | 'dispatch' | 'hr' | 'marketing' | 'finance';
  data: {
    current: number;
    target: number;
    unit: string;
    period: 'daily' | 'weekly' | 'monthly';
    label: string;
    complete?: boolean;
  };
  className?: string;
}

const DEPARTMENT_COLORS = {
  sales: 'bg-gradient-to-br from-[#412754] to-[#025E73]',
  dispatch: 'bg-gradient-to-br from-[#025E73] to-[#412754]',
  hr: 'bg-gradient-to-br from-[#025E73] to-[#F2A71B]',
  marketing: 'bg-gradient-to-br from-[#F2A71B] to-[#025E73]',
  finance: 'bg-gradient-to-br from-[#025E73] to-[#011F26]'
};

export const ScoreCard: React.FC<ScoreCardProps> = ({ type, data, className }) => {
  const { role } = useAuth();
  const progress = Math.min(Math.round((data.current / data.target) * 100), 100);
  const isPeriodEnding = data.period === 'weekly' && new Date().getDay() === 5; // Friday
  
  return (
    <MotionWrapper animation="fade" delay={0.1}>
      <Card className={`overflow-hidden border shadow-md ${className}`}>
        <div className={`h-2 ${DEPARTMENT_COLORS[type]}`} />
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              {type === 'sales' ? <Star className="h-5 w-5 text-[#F2A71B]" /> : 
               type === 'dispatch' ? <Target className="h-5 w-5 text-[#025E73]" /> : 
               type === 'marketing' ? <BarChart2 className="h-5 w-5 text-[#F2A71B]" /> :
               <Trophy className="h-5 w-5 text-[#025E73]" />}
              {data.label}
            </CardTitle>
            <Badge variant={data.complete ? "success" : isPeriodEnding ? "destructive" : "outline"} className="ml-2">
              {data.period === 'daily' ? 'Today' : 
               data.period === 'weekly' ? 'This Week' : 'This Month'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-1 items-center">
            <div className="text-lg font-semibold flex items-center gap-1">
              <span className={data.current >= data.target ? "text-green-600" : ""}>{data.current}</span>
              <span className="text-sm text-muted-foreground">/ {data.target} {data.unit}</span>
            </div>
            {data.complete && (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
          </div>
          
          <div className="relative pt-1">
            <Progress value={progress} className="h-2" indicatorClassName={
              progress >= 100 ? "bg-green-500" : 
              progress >= 75 ? "bg-blue-500" : 
              progress >= 50 ? "bg-amber-500" : 
              "bg-red-500"
            } />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0</span>
              <span>{Math.floor(data.target / 2)}</span>
              <span>{data.target}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </MotionWrapper>
  );
};