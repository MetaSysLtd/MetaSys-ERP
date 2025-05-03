import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, ChevronUp, ChevronDown, Minus } from 'lucide-react';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

export interface LeaderboardUser {
  id: number;
  name: string;
  score: number;
  rank: number;
  department: string;
  avatar?: string;
  trend: 'up' | 'down' | 'same';
  change?: number;
}

interface LeaderboardProps {
  title: string;
  description?: string;
  data: {
    daily: LeaderboardUser[];
    weekly: LeaderboardUser[];
    monthly: LeaderboardUser[];
  };
  className?: string;
}

const RankIcon: React.FC<{ rank: number }> = ({ rank }) => {
  if (rank === 1) {
    return <Trophy className="h-5 w-5 text-yellow-500" />;
  } else if (rank === 2) {
    return <Medal className="h-5 w-5 text-slate-400" />;
  } else if (rank === 3) {
    return <Award className="h-5 w-5 text-amber-700" />;
  }
  return <span className="h-5 w-5 flex items-center justify-center font-semibold text-muted-foreground">{rank}</span>;
};

const TrendIndicator: React.FC<{ trend: 'up' | 'down' | 'same', change?: number }> = ({ trend, change }) => {
  if (trend === 'up') {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-0.5">
        <ChevronUp className="h-3 w-3" />
        <span className="text-xs">{change || 1}</span>
      </Badge>
    );
  } else if (trend === 'down') {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-0.5">
        <ChevronDown className="h-3 w-3" />
        <span className="text-xs">{change || 1}</span>
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
      <Minus className="h-3 w-3" />
    </Badge>
  );
};

export const Leaderboard: React.FC<LeaderboardProps> = ({ title, description, data, className }) => {
  const [timespan, setTimespan] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const { user } = useAuth();
  
  return (
    <MotionWrapper animation="fade" delay={0.2}>
      <Card className={cn("shadow-sm", className)}>
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="mt-2">
            <Tabs defaultValue="weekly" onValueChange={(value) => setTimespan(value as any)}>
              <TabsList className="grid grid-cols-3 h-8">
                <TabsTrigger value="daily" className="text-xs">Today</TabsTrigger>
                <TabsTrigger value="weekly" className="text-xs">This Week</TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs">This Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <ScrollArea className="h-[340px] pr-4">
            {data[timespan].map((person, index) => (
              <div 
                key={person.id}
                className={cn(
                  "flex items-center justify-between py-2 px-2 rounded-md",
                  person.id === user?.id ? "bg-slate-100" : index % 2 === 0 ? "bg-slate-50" : "",
                  "mb-1 transition-colors hover:bg-slate-100"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 flex justify-center">
                    <RankIcon rank={person.rank} />
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={person.avatar} alt={person.name} />
                    <AvatarFallback>
                      {person.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-sm">
                      {person.name}
                      {person.id === user?.id && <span className="ml-1.5 text-xs text-muted-foreground">(You)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">{person.department}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-sm">{person.score.toLocaleString()}</div>
                  <TrendIndicator trend={person.trend} change={person.change} />
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </MotionWrapper>
  );
};