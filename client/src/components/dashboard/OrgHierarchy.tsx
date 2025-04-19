import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight, FolderTree, Plus, Users, Building } from 'lucide-react';
import { cn } from '@/lib/utils';

// Custom FileOrganize icon since it's not in lucide-react
function FileOrganizeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
      <path d="M8 9h1" />
    </svg>
  );
}

type OrgNode = {
  id: string;
  name: string;
  type: 'organization' | 'department' | 'team';
  children?: OrgNode[];
  level: number;
}

type OrgHierarchyProps = {
  data?: {
    orgTree?: OrgNode;
    departmentCount?: number;
    teamCount?: number;
    employeeCount?: number;
  };
  onAddNode?: (parentId: string, type: string) => void;
  onViewDetails?: (nodeId: string) => void;
}

export function OrgHierarchy({
  data = {
    departmentCount: 5,
    teamCount: 12,
    employeeCount: 48,
    orgTree: {
      id: 'org-1',
      name: 'MetaSys Ltd',
      type: 'organization',
      level: 0,
      children: [
        {
          id: 'dept-1',
          name: 'Sales',
          type: 'department',
          level: 1,
          children: [
            {
              id: 'team-1',
              name: 'Direct Sales',
              type: 'team',
              level: 2
            },
            {
              id: 'team-2',
              name: 'Inside Sales',
              type: 'team',
              level: 2
            }
          ]
        },
        {
          id: 'dept-2',
          name: 'Dispatch',
          type: 'department',
          level: 1,
          children: [
            {
              id: 'team-3',
              name: 'Load Management',
              type: 'team',
              level: 2
            },
            {
              id: 'team-4',
              name: 'Carrier Relations',
              type: 'team',
              level: 2
            }
          ]
        },
        {
          id: 'dept-3',
          name: 'Finance',
          type: 'department',
          level: 1,
          children: [
            {
              id: 'team-5',
              name: 'Accounting',
              type: 'team',
              level: 2
            }
          ]
        },
        {
          id: 'dept-4',
          name: 'Human Resources',
          type: 'department',
          level: 1,
          children: []
        },
        {
          id: 'dept-5',
          name: 'IT Support',
          type: 'department',
          level: 1,
          children: []
        }
      ]
    }
  },
  onAddNode = () => {},
  onViewDetails = () => {}
}: OrgHierarchyProps) {
  const [activeTab, setActiveTab] = useState('tree');
  
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'organization': return <Building className="h-4 w-4" />;
      case 'department': return <FileOrganizeIcon className="h-4 w-4" />;
      case 'team': return <Users className="h-4 w-4" />;
      default: return <FolderTree className="h-4 w-4" />;
    }
  };
  
  const renderTreeNode = (node: OrgNode) => {
    return (
      <div key={node.id} className="ml-4 mb-1">
        <div className={cn(
          "flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800",
          "border-l-2",
          node.type === 'organization' && "border-blue-500",
          node.type === 'department' && "border-purple-500",
          node.type === 'team' && "border-green-500"
        )}>
          <div className="shrink-0 flex items-center justify-center h-6 w-6">
            {getNodeIcon(node.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium">{node.name}</div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0"
              onClick={() => onAddNode(node.id, node.type)}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0"
              onClick={() => onViewDetails(node.id)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {node.children && node.children.length > 0 && (
          <div className="ml-2">
            {node.children.map(child => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Card className="shadow-md hover:shadow-lg transition-all">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold">Organization Structure</CardTitle>
        <CardDescription>Manage your company's organizational hierarchy</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="tree" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="tree">Hierarchy Tree</TabsTrigger>
            <TabsTrigger value="stats">Organization Stats</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tree" className="mt-0">
            <div className="border rounded-md p-2 max-h-[400px] overflow-y-auto">
              {data.orgTree && renderTreeNode(data.orgTree)}
            </div>
          </TabsContent>
          
          <TabsContent value="stats" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Building className="h-10 w-10 mx-auto mb-2 text-blue-500" />
                  <div className="text-3xl font-bold">{data.departmentCount}</div>
                  <div className="text-sm text-muted-foreground">Departments</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6 text-center">
                  <Users className="h-10 w-10 mx-auto mb-2 text-purple-500" />
                  <div className="text-3xl font-bold">{data.teamCount}</div>
                  <div className="text-sm text-muted-foreground">Teams</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6 text-center">
                  <Users className="h-10 w-10 mx-auto mb-2 text-green-500" />
                  <div className="text-3xl font-bold">{data.employeeCount}</div>
                  <div className="text-sm text-muted-foreground">Employees</div>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-4 text-center">
              <Button 
                onClick={() => setActiveTab('tree')} 
                variant="outline"
                className="mr-2"
              >
                <FolderTree className="mr-2 h-4 w-4" />
                View Hierarchy
              </Button>
              <Button 
                onClick={() => onAddNode('org-1', 'organization')}
                variant="default"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Department
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}