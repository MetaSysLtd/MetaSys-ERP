import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scorecard } from './Scorecard';
import { Achievement } from './Achievement';
import { Leaderboard } from './Leaderboard';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { PageHeader } from '@/components/ui/page-header';
import { 
  Trophy,
  ChevronRight,
  Filter,
  CalendarDays,
  Star,
  Medal,
  Award,
  CalendarClock
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const MOCK_ACHIEVEMENTS = [
  {
    title: "First Login",
    description: "Log in to the platform for the first time",
    type: "daily",
    category: "Account",
    tier: "bronze",
    progress: 100,
    unlocked: true,
    date: "April 15, 2025",
    points: 10
  },
  {
    title: "Rising Star",
    description: "Complete your first 5 tasks",
    type: "weekly",
    category: "Tasks",
    tier: "silver", 
    progress: 100,
    unlocked: true,
    date: "April 18, 2025",
    points: 50
  },
  {
    title: "Team Player",
    description: "Collaborate with 3 different team members on tasks",
    type: "weekly",
    category: "Collaboration",
    tier: "silver",
    progress: 67,
    unlocked: false,
    points: 75
  },
  {
    title: "Early Bird",
    description: "Log in before 8:00 AM for 5 consecutive days",
    type: "daily",
    category: "Attendance",
    tier: "gold",
    progress: 80,
    unlocked: false,
    points: 100
  },
  {
    title: "Sales Champion",
    description: "Close more than $50,000 in deals in a single month",
    type: "monthly",
    category: "Sales",
    tier: "platinum",
    progress: 35,
    unlocked: false,
    points: 250
  },
  {
    title: "Dispatch Guru",
    description: "Successfully manage 20 loads in a single week",
    type: "weekly",
    category: "Dispatch",
    tier: "gold",
    progress: 45,
    unlocked: false,
    points: 150
  },
  {
    title: "Client Whisperer",
    description: "Receive 5 positive client feedback ratings",
    type: "monthly",
    category: "Client Relations",
    tier: "gold",
    progress: 60,
    unlocked: false,
    points: 200
  },
  {
    title: "Perfect Attendance",
    description: "Complete a full month without any absences",
    type: "monthly",
    category: "Attendance",
    tier: "silver",
    progress: 90,
    unlocked: false,
    points: 100
  },
];

const MOCK_LEADERBOARD_USERS = [
  {
    id: 1,
    name: "Alex Johnson",
    score: 1250,
    position: 1,
    previousPosition: 1,
    department: "Sales",
    rank: "Expert",
    level: 12,
  },
  {
    id: 2,
    name: "Maria Rodriguez",
    score: 1150,
    position: 2,
    previousPosition: 4,
    department: "Dispatch",
    rank: "Advanced",
    level: 11,
  },
  {
    id: 3,
    name: "James Smith",
    score: 1050,
    position: 3,
    previousPosition: 2,
    department: "Sales",
    rank: "Pro",
    level: 10,
  },
  {
    id: 4,
    name: "Sarah Wilson",
    score: 950,
    position: 4,
    previousPosition: 3,
    department: "Admin",
    rank: "Advanced",
    level: 9,
    isCurrentUser: true,
  },
  {
    id: 5,
    name: "Robert Brown",
    score: 900,
    position: 5,
    previousPosition: 5,
    department: "Dispatch",
    rank: "Pro",
    level: 8,
  },
  {
    id: 6,
    name: "Emily Davis",
    score: 850,
    position: 6,
    previousPosition: 8,
    department: "HR",
    rank: "Rookie",
    level: 7,
  },
  {
    id: 7,
    name: "Michael Miller",
    score: 800,
    position: 7,
    previousPosition: 6,
    department: "Sales",
    rank: "Rookie",
    level: 7,
  },
  {
    id: 8,
    name: "Lisa Garcia",
    score: 750,
    position: 8,
    previousPosition: 7,
    department: "Finance",
    rank: "Rookie",
    level: 6,
  },
  {
    id: 9,
    name: "David Martinez",
    score: 700,
    position: 9,
    previousPosition: 10,
    department: "Sales",
    rank: "Beginner",
    level: 5,
  },
  {
    id: 10,
    name: "Jennifer Taylor",
    score: 650,
    position: 10,
    previousPosition: 9,
    department: "Marketing",
    rank: "Beginner",
    level: 4,
  },
];

export function GamificationDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [achievementFilter, setAchievementFilter] = useState<string>("all");
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<"daily" | "weekly" | "monthly" | "allTime">("weekly");
  
  const filteredAchievements = MOCK_ACHIEVEMENTS.filter(achievement => {
    if (achievementFilter === "all") return true;
    if (achievementFilter === "unlocked") return achievement.unlocked;
    if (achievementFilter === "locked") return !achievement.unlocked;
    return achievement.type === achievementFilter;
  });
  
  const periodIcons = {
    "daily": <CalendarDays className="h-4 w-4" />,
    "weekly": <CalendarClock className="h-4 w-4" />,
    "monthly": <Medal className="h-4 w-4" />,
    "allTime": <Award className="h-4 w-4" />,
  };
  
  const getPeriodName = () => {
    switch (leaderboardPeriod) {
      case "daily": return "Daily";
      case "weekly": return "Weekly";
      case "monthly": return "Monthly";
      case "allTime": return "All Time";
    }
  };
  
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-7xl">
      <PageHeader
        title="Gamification"
        subtitle="Track your performance, achievements, and compete with colleagues"
        icon={<Trophy className="h-6 w-6 text-[#F2A71B]" />}
      />
      
      <Tabs defaultValue="overview" className="mt-6" onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
            <TabsTrigger value="achievements" className="text-sm">Achievements</TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-sm">Leaderboard</TabsTrigger>
          </TabsList>
          
          {activeTab === "achievements" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setAchievementFilter("all")}>
                  All Achievements
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAchievementFilter("unlocked")}>
                  Unlocked Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAchievementFilter("locked")}>
                  Locked Only
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setAchievementFilter("daily")}>
                  Daily Achievements
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAchievementFilter("weekly")}>
                  Weekly Achievements
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAchievementFilter("monthly")}>
                  Monthly Achievements
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAchievementFilter("special")}>
                  Special Achievements
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {activeTab === "leaderboard" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto">
                  {periodIcons[leaderboardPeriod]}
                  <span className="mx-2">{getPeriodName()}</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Time Period</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLeaderboardPeriod("daily")}>
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Daily
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLeaderboardPeriod("weekly")}>
                  <CalendarClock className="h-4 w-4 mr-2" />
                  Weekly
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLeaderboardPeriod("monthly")}>
                  <Medal className="h-4 w-4 mr-2" />
                  Monthly
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLeaderboardPeriod("allTime")}>
                  <Award className="h-4 w-4 mr-2" />
                  All Time
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        <TabsContent value="overview" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Scorecard
                score={950}
                rank="Advanced"
                level={9}
                nextLevel={10}
                progress={75}
                streak={5}
                position={4}
                totalUsers={25}
                achievements={{
                  total: MOCK_ACHIEVEMENTS.length,
                  unlocked: MOCK_ACHIEVEMENTS.filter(a => a.unlocked).length
                }}
              />
              
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Star className="h-5 w-5 text-[#F2A71B] mr-2" />
                    Recent Achievements
                  </h3>
                  <Button variant="link" size="sm" className="text-[#025E73]" asChild>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab("achievements"); }}>
                      View All
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </a>
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                  {MOCK_ACHIEVEMENTS.filter(a => a.unlocked).slice(0, 2).map((achievement, index) => (
                    <Achievement
                      key={index}
                      title={achievement.title}
                      description={achievement.description}
                      type={achievement.type as any}
                      category={achievement.category}
                      tier={achievement.tier}
                      progress={achievement.progress}
                      unlocked={achievement.unlocked}
                      date={achievement.date}
                      points={achievement.points}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <Leaderboard
                users={MOCK_LEADERBOARD_USERS}
                period={leaderboardPeriod}
                title="Top Performers"
                showMore={() => setActiveTab("leaderboard")}
                limit={5}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="achievements" className="mt-0">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">All Achievements</h3>
              <p className="text-sm text-gray-500 mt-1">
                Complete tasks and unlock achievements to earn points
              </p>
            </div>
            
            <Badge variant="secondary" className="px-2.5 py-1">
              {filteredAchievements.length} achievements
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAchievements.map((achievement, index) => (
              <MotionWrapper key={index} animation="scale" delay={index * 0.05}>
                <Achievement
                  title={achievement.title}
                  description={achievement.description}
                  type={achievement.type as any}
                  category={achievement.category}
                  tier={achievement.tier}
                  progress={achievement.progress}
                  unlocked={achievement.unlocked}
                  date={achievement.date}
                  points={achievement.points}
                />
              </MotionWrapper>
            ))}
          </div>
          
          {filteredAchievements.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Trophy className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No achievements found</h3>
              <p className="text-sm text-gray-500 max-w-md">
                No achievements match your current filter. Try changing your filter settings.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => setAchievementFilter("all")}
              >
                Show All Achievements
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="leaderboard" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Leaderboard
                users={MOCK_LEADERBOARD_USERS}
                period={leaderboardPeriod}
                title="Organization Leaderboard"
                className="h-full"
              />
            </div>
            
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-[#025E73]/20 p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Trophy className="h-5 w-5 text-[#F2A71B] mr-2" />
                  Your Performance
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Current Rank</div>
                    <div className="text-lg font-medium text-[#025E73]">4th of 25</div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Total Points</div>
                    <div className="text-lg font-medium text-[#025E73]">950 pts</div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Points to Next Rank</div>
                    <div className="text-lg font-medium text-[#025E73]">100 pts</div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Weekly Change</div>
                    <div className="text-lg font-medium text-green-600 flex items-center">
                      <ArrowUp className="h-4 w-4 mr-1" />
                      +75 pts
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-[#025E73]/20 p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Star className="h-5 w-5 text-[#F2A71B] mr-2" />
                  Department Rankings
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-blue-100 rounded-full h-8 w-8 flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-blue-600">1</span>
                      </div>
                      <span className="text-sm font-medium">Sales</span>
                    </div>
                    <span className="text-sm text-gray-500">4,250 pts</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-blue-100 rounded-full h-8 w-8 flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-blue-600">2</span>
                      </div>
                      <span className="text-sm font-medium">Dispatch</span>
                    </div>
                    <span className="text-sm text-gray-500">3,850 pts</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-blue-100 rounded-full h-8 w-8 flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-blue-600">3</span>
                      </div>
                      <span className="text-sm font-medium">Admin</span>
                    </div>
                    <span className="text-sm text-gray-500">3,200 pts</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-blue-100 rounded-full h-8 w-8 flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-blue-600">4</span>
                      </div>
                      <span className="text-sm font-medium">Finance</span>
                    </div>
                    <span className="text-sm text-gray-500">2,950 pts</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-blue-100 rounded-full h-8 w-8 flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-blue-600">5</span>
                      </div>
                      <span className="text-sm font-medium">HR</span>
                    </div>
                    <span className="text-sm text-gray-500">2,750 pts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}