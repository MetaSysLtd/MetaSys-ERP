import { ReactNode } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Link } from "wouter";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  link?: {
    text: string;
    href: string;
  };
}

export function MetricCard({
  title,
  value,
  icon,
  iconBgColor = "bg-primary-100",
  iconColor = "text-primary-600",
  link
}: MetricCardProps) {
  return (
    <Card className="bg-white overflow-hidden shadow rounded-lg">
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${iconBgColor} rounded-md p-3`}>
            <div className={`h-6 w-6 ${iconColor}`}>{icon}</div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </CardContent>
      {link && (
        <CardFooter className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <Link href={link.href}>
              <a className="font-medium text-primary-600 hover:text-primary-900">
                {link.text}
              </a>
            </Link>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
