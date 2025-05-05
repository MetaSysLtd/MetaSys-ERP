import { Link } from "wouter";
import { PageLayout } from "@/components/layout/PageLayout";

export default function NotFound() {
  return (
    <PageLayout title="404 - Page Not Found">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl mb-8">Page not found</p>
        <Link href="/">
          <a className="text-primary hover:underline">
            Return to Dashboard
          </a>
        </Link>
      </div>
    </PageLayout>
  );
}