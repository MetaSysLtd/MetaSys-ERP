import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScoreCard } from './Scorecard';
import { Achievement } from './Achievement';
import { Leaderboard, type LeaderboardUser } from './Leaderboard';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Star, Target, Check, Users } from 'lucide-react';
import { MotionWrapper } from '@/components/ui/motion-wrapper';

export const GamificationDashboard: React.FC = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Mock data - in real implementation, we would fetch from API
  const { data: gamificationData, isLoading } = useQuery({
    queryKey: ['/api/gamification/dashboard'],
    queryFn: async () => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now return mock data - replace with actual API call
      return {
        metrics: {
          points: 1250,
          level: 4,
          rank: 5,
          achievements: 12,
          completedTasks: 28,
          streak: 5
        },
        scoreCards: [
          {
            type: 'sales',
            data: { 
              current: 8, 
              target: 10, 
              unit: 'leads', 
              period: 'daily',
              label: 'Lead Conversions',
              complete: false
            }
          },
          {
            type: 'dispatch',
            data: { 
              current: 15, 
              target: 15, 
              unit: 'loads', 
              period: 'weekly',
              label: 'Loads Delivered',
              complete: true
            }
          },
          {
            type: role?.department === 'finance' ? 'finance' : 'marketing',
            data: { 
              current: 4, 
              target: 5, 
              unit: 'reports', 
              period: 'weekly',
              label: 'Reports Submitted',
              complete: false
            }
          }
        ],
        achievements: [
          {
            title: 'First Blood',
            description: 'Close your first deal',
            type: 'special',
            category: 'sales',
            tier: 'bronze',
            progress: 100,
            unlocked: true,
            date: '2025-04-15',
            points: 100
          },
          {
            title: 'Road Warrior',
            description: 'Successfully dispatch 50 loads',
            type: 'monthly',
            category: 'dispatch',
            tier: 'silver',
            progress: 78,
            unlocked: false,
            points: 250
          },
          {
            title: 'Team Player',
            description: 'Collaborate on 10 projects',
            type: 'monthly',
            category: 'company',
            tier: 'gold',
            progress: 90,
            unlocked: false,
            points: 500
          },
          {
            title: 'Perfect Attendance',
            description: 'Log in every weekday for a month',
            type: 'monthly',
            category: 'personal',
            tier: 'platinum',
            progress: 100,
            unlocked: true,
            date: '2025-04-30',
            points: 1000
          }
        ],
        leaderboard: {
          daily: generateLeaderboardData(10, user?.id || 0),
          weekly: generateLeaderboardData(10, user?.id || 0),
          monthly: generateLeaderboardData(10, user?.id || 0)
        }
      };
    }
  });

  // Helper function to generate mock leaderboard data
  function generateLeaderboardData(count: number, userId: number): LeaderboardUser[] {
    const departments = ['sales', 'dispatch', 'hr', 'marketing', 'finance', 'admin'];
    const trends = ['up', 'down', 'same'] as const;
    
    const users: LeaderboardUser[] = Array.from({ length: count }).map((_, i) => {
      const isCurrentUser = (i === 2); // Placing current user at rank 3 for this example
      return {
        id: isCurrentUser ? userId : i + 100,
        name: isCurrentUser ? `${user?.firstName} ${user?.lastName}` : `Team Member ${i + 1}`,
        score: 1000 - i * 75 + Math.floor(Math.random() * 30),
        rank: i + 1,
        department: departments[i % departments.length],
        avatar: undefined,
        trend: trends[Math.floor(Math.random() * trends.length)],
        change: Math.floor(Math.random() * 3) + 1
      };
    });
    
    // Sort by score
    return users.sort((a, b) => b.score - a.score).map((user, i) => ({
      ...user,
      rank: i + 1
    }));
  }

  // If data is loading, show skeleton UI
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Skeleton className="h-[400px] w-full" />
          </div>
          <div>
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!gamificationData) {
    return <div>Failed to load gamification data</div>;
  }

  const { metrics, scoreCards, achievements, leaderboard } = gamificationData;

  return (
    <div className="space-y-4">
      <MotionWrapper animation="fade" delay={0.1}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Trophy className="h-6 w-6 text-[#F2A71B]" />
              {role?.department === 'sales' ? 'Sales Gamification' : 
               role?.department === 'dispatch' ? 'Dispatch Gamification' : 
               'Performance Dashboard'}
            </CardTitle>
            <CardDescription>
              Track your performance metrics, achievements, and rankings to unlock rewards and recognition.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
                <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-[#025E73]/5">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Level</CardTitle>
                        <Star className="h-5 w-5 text-[#F2A71B]" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{metrics.level}</div>
                      <p className="text-sm text-muted-foreground">
                        {metrics.points} points total
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-[#412754]/5">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Rank</CardTitle>
                        <Medal className="h-5 w-5 text-[#F2A71B]" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">#{metrics.rank}</div>
                      <p className="text-sm text-muted-foreground">
                        Among all {role?.department} users
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-[#F2A71B]/5">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Streak</CardTitle>
                        <Target className="h-5 w-5 text-[#025E73]" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{metrics.streak} days</div>
                      <p className="text-sm text-muted-foreground">
                        Keep it going!
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {scoreCards.map((scoreCard, index) => (
                        <ScoreCard 
                          key={index}
                          type={scoreCard.type as any} 
                          data={scoreCard.data}
                        />
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {achievements.slice(0, 2).map((achievement, index) => (
                        <Achievement 
                          key={index}
                          {...achievement}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Leaderboard
                      title="Top Performers"
                      data={leaderboard}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="metrics">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scoreCards.map((scoreCard, index) => (
                    <ScoreCard 
                      key={index}
                      type={scoreCard.type as any} 
                      data={scoreCard.data}
                    />
                  ))}
                  
                  <Card className="bg-[#025E73]/5">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Tasks Completed</CardTitle>
                        <Check className="h-5 w-5 text-green-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{metrics.completedTasks}</div>
                      <p className="text-sm text-muted-foreground">
                        This month
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-[#412754]/5">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Achievements</CardTitle>
                        <Trophy className="h-5 w-5 text-[#F2A71B]" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{metrics.achievements}</div>
                      <p className="text-sm text-muted-foreground">
                        Unlocked so far
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-[#F2A71B]/5">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Team Contributions</CardTitle>
                        <Users className="h-5 w-5 text-[#025E73]" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">15</div>
                      <p className="text-sm text-muted-foreground">
                        Cross-functional assists
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="achievements">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((achievement, index) => (
                    <Achievement 
                      key={index}
                      {...achievement}
                    />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="leaderboard">
                <Leaderboard
                  title="Performance Rankings"
                  description="See how you stack up against your peers across different timeframes."
                  data={leaderboard}
                  className="max-w-4xl mx-auto"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </MotionWrapper>
    </div>
  );
};