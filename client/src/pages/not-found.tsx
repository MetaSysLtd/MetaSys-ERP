
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <PageLayout title="404 - Page Not Found">
      <div className="min-h-[60vh] w-full flex items-center justify-center">
        <div className="text-center space-y-6 px-4">
          <h1 className="text-6xl font-bold text-primary">404</h1>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">Page not found</h2>
            <p className="text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
          </div>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate(-1)} variant="outline">
              Go Back
            </Button>
            <Button onClick={() => navigate('/')} variant="default">
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
