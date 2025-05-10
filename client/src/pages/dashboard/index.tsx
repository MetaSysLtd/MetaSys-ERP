import FixedDashboard from './fixed-dashboard';

export default function Dashboard() {
  try {
    return <FixedDashboard />;
  } catch (error) {
    console.error("Dashboard error:", error);
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-8">
          <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">
            Dashboard Error
          </h2>
          <p className="text-red-600 dark:text-red-300">
            There was an error loading the dashboard. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }
}