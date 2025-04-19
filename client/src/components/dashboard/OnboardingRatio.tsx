
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface OnboardingMetrics {
  total: number;
  completed: number;
  inProgress: number;
  ratio: number;
}

export function OnboardingRatio({ data }: { data?: OnboardingMetrics }) {
  const ratio = data?.ratio || 0;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Onboarding Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Completion Rate</span>
            <span className="text-sm font-medium">{ratio}%</span>
          </div>
          <Progress value={ratio} className="h-2" />
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{data?.total || 0}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{data?.completed || 0}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{data?.inProgress || 0}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
