import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStatusColor, formatDate } from "@/lib/utils";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface Lead {
  id: number;
  companyName: string;
  mcNumber: string;
  contactInfo: {
    email: string;
    phone: string;
  };
  status: string;
  assignedTo: {
    id: number;
    name: string;
  };
  createdAt: string;
}

interface LeadsTableProps {
  leads: Lead[];
  onStatusChange?: (status: string) => void;
}

export function LeadsTable({ leads, onStatusChange }: LeadsTableProps) {
  const [statusFilter, setStatusFilter] = useState("all");
  
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    if (onStatusChange) {
      onStatusChange(value);
    }
  };
  
  return (
    <Card className="shadow rounded-lg overflow-hidden mb-6">
      <CardHeader className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
        <CardTitle className="text-lg leading-6 font-medium text-gray-900">
          Recent Leads
        </CardTitle>
        <div className="flex items-center">
          <div className="mr-4">
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[130px] h-8 text-sm">
                <SelectValue placeholder="All Leads" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leads</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="unqualified">Unqualified</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="follow-up">Follow-Up</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Link href="/leads">
            <Button variant="link" className="text-sm text-gray-500 hover:text-gray-700">
              See all
            </Button>
          </Link>
        </div>
      </CardHeader>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                MC Number
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact Info
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned To
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </TableHead>
              <TableHead className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white divide-y divide-gray-200">
            {leads.map((lead) => {
              const statusStyle = getStatusColor(lead.status);
              
              return (
                <TableRow key={lead.id}>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{lead.companyName}</div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{lead.mcNumber}</div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{lead.contactInfo.email}</div>
                    <div className="text-sm text-gray-500">{lead.contactInfo.phone}</div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <Badge 
                      variant="outline"
                      className={`${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} px-2 inline-flex text-xs leading-5 font-semibold rounded-full`}
                    >
                      {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{lead.assignedTo.name}</div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(lead.createdAt)}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/leads/${lead.id}`}>
                      <Button variant="link" className="text-primary-600 hover:text-primary-900">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <CardFooter className="bg-gray-50 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-sm text-gray-700">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{leads.length}</span> of <span className="font-medium">42</span> results
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            className="h-8 px-3 text-xs border-gray-300" 
            disabled
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="h-8 px-3 text-xs border-gray-300"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
