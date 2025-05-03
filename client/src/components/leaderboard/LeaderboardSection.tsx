import WeeklyLeaderboard from "./WeeklyLeaderboard";
import WeeklyComparison from "./WeeklyComparison";

export function LeaderboardSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Performance Tracking</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WeeklyLeaderboard />
        </div>
        <div>
          <WeeklyComparison />
        </div>
      </div>
    </div>
  );
}