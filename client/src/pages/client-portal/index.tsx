import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Building2, Users, Truck, FileText, MessageSquare, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { PageLayout } from "@/components/layout/PageLayout";

export default function ClientPortalPage() {
  const clientFeatures = [
    {
      title: 'Client Management',
      description: 'Manage client information, contacts, and relationship history',
      icon: Users,
      href: '/client-portal/clients',
      color: 'text-blue-500'
    },
    {
      title: 'Load Tracking',
      description: 'Real-time tracking of shipments and delivery status',
      icon: Truck,
      href: '/client-portal/tracking',
      color: 'text-green-500'
    },
    {
      title: 'Invoice History',
      description: 'View and download past invoices and payment history',
      icon: FileText,
      href: '/client-portal/invoices',
      color: 'text-purple-500'
    },
    {
      title: 'Communication Center',
      description: 'Secure messaging with your dedicated account manager',
      icon: MessageSquare,
      href: '/client-portal/messages',
      color: 'text-amber-500'
    },
  ];

  return (
    <PageLayout title="Client Portal">
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Client Portal Dashboard</h2>
        <div className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {clientFeatures.map((feature, index) => (
              <MotionWrapper key={index} animation="fade" delay={index * 0.1}>
                <Card className="overflow-hidden border border-[#025E73]/20">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <feature.icon className={`h-8 w-8 ${feature.color}`} />
                      <div className="bg-[#F2A71B]/10 h-8 w-8 rounded-full flex items-center justify-center">
                        <ArrowRight className="h-4 w-4 text-[#F2A71B]" />
                      </div>
                    </div>
                    <CardTitle className="text-xl mt-4">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-gray-600">
                      Enable clients to access their data and communicate securely with your team.
                    </p>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={feature.href}>
                        Configure {feature.title.split(' ')[0]}
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </MotionWrapper>
            ))}
          </div>
        </div>

        <div className="mt-12 bg-white rounded-lg border border-[#025E73]/20 p-6">
          <h2 className="text-2xl font-semibold text-[#025E73] mb-4">Portal Configuration</h2>
          <p className="text-gray-600 mb-6">
            Configure client portal settings, including branding, permissions, and feature availability.
          </p>

          <div className="bg-[#F2A71B]/10 rounded-lg p-5 mb-6">
            <h3 className="font-medium text-[#412754] mb-2">Client Portal Status</h3>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-green-700 font-medium">Active</span>
              <span className="text-gray-500 text-sm ml-2">• Last updated: May 03, 2025</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border border-[#025E73]/20 p-4">
              <h3 className="font-medium text-gray-900 mb-2">Client Accounts</h3>
              <p className="text-sm text-gray-600 mb-4">Manage client access and permissions</p>
              <Button variant="outline" size="sm">Manage Accounts</Button>
            </div>

            <div className="bg-white rounded-lg border border-[#025E73]/20 p-4">
              <h3 className="font-medium text-gray-900 mb-2">Branding Settings</h3>
              <p className="text-sm text-gray-600 mb-4">Customize the portal appearance</p>
              <Button variant="outline" size="sm">Configure Branding</Button>
            </div>

            <div className="bg-white rounded-lg border border-[#025E73]/20 p-4">
              <h3 className="font-medium text-gray-900 mb-2">Feature Access</h3>
              <p className="text-sm text-gray-600 mb-4">Control which features clients can use</p>
              <Button variant="outline" size="sm">Modify Features</Button>
            </div>
          </div>
        </div>
      </Card>
    </PageLayout>
  );
}