import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CRMTopPerformers } from "@shared/schema";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, ArrowDownRight, Award, TrendingUp } from "lucide-react";

interface TopPerformersProps {
  data?: CRMTopPerformers;
}

export function TopPerformers({ data }: TopPerformersProps) {
  if (!data || !data.salesReps || data.salesReps.length === 0) {
    return (
      <Card className="shadow-md hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by descending value/count
  const sortedReps = [...data.salesReps].sort((a, b) => {
    const aScore = a.value || a.count || 0;
    const bScore = b.value || b.count || 0;
    return bScore - aScore;
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-[#025E73]">
          Top Performers
        </CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Sales representatives leaderboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="conversions">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="conversions">Conversions</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="growth">Growth</TabsTrigger>
          </TabsList>
          
          <TabsContent value="conversions">
            <div className="space-y-4">
              {sortedReps
                .filter(rep => rep.metric === "conversions")
                .map((rep, index) => (
                  <div
                    key={index}
                    className="flex items-center p-2 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="flex-shrink-0 mr-4">
                      <Avatar className="h-10 w-10 border-2 border-[#025E73]">
                        {rep.avatarUrl ? (
                          <AvatarImage src={rep.avatarUrl} alt={rep.name} />
                        ) : (
                          <AvatarFallback>{getInitials(rep.name)}</AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{rep.name}</p>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant="outline"
                              className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                            >
                              <Award className="h-3 w-3 mr-1" />
                              {rep.achievement}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#025E73]">
                            {formatNumber(rep.count || 0)}
                          </p>
                          <div
                            className={`text-xs flex items-center ${
                              (rep.percentage || 0) >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {(rep.percentage || 0) >= 0 ? (
                              <ArrowUpRight className="h-3 w-3 mr-1" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3 mr-1" />
                            )}
                            {(rep.percentage || 0) >= 0 ? "+" : ""}
                            {rep.percentage || 0}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>
          
          <TabsContent value="revenue">
            <div className="space-y-4">
              {sortedReps
                .filter(rep => rep.metric === "revenue")
                .map((rep, index) => (
                  <div
                    key={index}
                    className="flex items-center p-2 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="flex-shrink-0 mr-4">
                      <Avatar className="h-10 w-10 border-2 border-[#025E73]">
                        {rep.avatarUrl ? (
                          <AvatarImage src={rep.avatarUrl} alt={rep.name} />
                        ) : (
                          <AvatarFallback>{getInitials(rep.name)}</AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{rep.name}</p>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant="outline"
                              className="text-xs bg-green-50 text-green-700 border-green-200"
                            >
                              <Award className="h-3 w-3 mr-1" />
                              {rep.achievement}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#025E73]">
                            {formatCurrency(rep.value || 0)}
                          </p>
                          <div
                            className={`text-xs flex items-center ${
                              (rep.percentage || 0) >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {(rep.percentage || 0) >= 0 ? (
                              <ArrowUpRight className="h-3 w-3 mr-1" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3 mr-1" />
                            )}
                            {(rep.percentage || 0) >= 0 ? "+" : ""}
                            {rep.percentage || 0}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>
          
          <TabsContent value="growth">
            <div className="space-y-4">
              {sortedReps
                .filter(rep => rep.metric === "growth")
                .map((rep, index) => (
                  <div
                    key={index}
                    className="flex items-center p-2 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="flex-shrink-0 mr-4">
                      <Avatar className="h-10 w-10 border-2 border-[#025E73]">
                        {rep.avatarUrl ? (
                          <AvatarImage src={rep.avatarUrl} alt={rep.name} />
                        ) : (
                          <AvatarFallback>{getInitials(rep.name)}</AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{rep.name}</p>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant="outline"
                              className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                            >
                              <TrendingUp className="h-3 w-3 mr-1" />
                              {rep.achievement}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#025E73]">
                            {(rep.percentage || 0) >= 0 ? "+" : ""}
                            {rep.percentage || 0}%
                          </p>
                          <div className="text-xs text-gray-500">
                            {formatNumber(rep.count || 0)} conversions / ${formatNumber(rep.value || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}