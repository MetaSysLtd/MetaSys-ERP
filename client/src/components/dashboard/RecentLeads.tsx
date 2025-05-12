
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

// Original lead interface (from database)
interface DbLead {
  id: string;
  companyName: string;
  status: string;
  mcNumber: string;
  createdAt: string;
}

// New lead interface from API (dummy data)
interface DashboardLead {
  id: string;
  company: string;
  contact: string;
  status: string;
  value: number;
  assignee: string;
  lastActivity: string;
  lastUpdated: string;
}

// Combined type that accepts either format
type CombinedLead = DbLead | DashboardLead;

interface LeadsTableProps {
  leads?: CombinedLead[];
}

export function RecentLeads({ leads = [] }: LeadsTableProps) {
  const getStatusColor = (status: string) => {
    const colors = {
      qualified: "bg-green-100 text-green-800 border-green-200",
      unqualified: "bg-red-100 text-red-800 border-red-200",
      active: "bg-blue-100 text-blue-800 border-blue-200",
      lost: "bg-gray-100 text-gray-800 border-gray-200",
      "follow-up": "bg-yellow-100 text-yellow-800 border-yellow-200",
      new: "bg-orange-100 text-orange-800 border-orange-200",
      nurturing: "bg-yellow-100 text-yellow-800 border-yellow-200",
      won: "bg-purple-100 text-purple-800 border-purple-200"
    };
    return colors[status as keyof typeof colors] || "bg-blue-100 text-blue-800 border-blue-200";
  };

  // Get company name based on lead type
  const getCompanyName = (lead: CombinedLead): string => {
    if ('companyName' in lead) {
      return lead.companyName;
    } else {
      return lead.company;
    }
  };

  // Get status based on lead type
  const getStatus = (lead: CombinedLead): string => {
    return lead.status;
  };

  // Get date based on lead type
  const getDate = (lead: CombinedLead): string => {
    if ('createdAt' in lead) {
      return formatDate(lead.createdAt);
    } else {
      return formatDate(lead.lastUpdated);
    }
  };

  // Get additional info based on lead type
  const getAdditionalInfo = (lead: CombinedLead): string => {
    if ('mcNumber' in lead) {
      return lead.mcNumber;
    } else if ('value' in lead) {
      return formatCurrency(lead.value);
    }
    return '';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium">Recent Leads</CardTitle>
        <Link href="/leads" className="text-sm text-primary hover:text-primary/80">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!leads || leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 p-0">
                  <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                    <div className="w-14 h-14 mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-medium">No Leads Yet</h3>
                    <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
                      This table will display your most recent leads as they're added to the CRM system
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{getCompanyName(lead)}</TableCell>
                  <TableCell>{getAdditionalInfo(lead)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(getStatus(lead))}>
                      {getStatus(lead).charAt(0).toUpperCase() + getStatus(lead).slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{getDate(lead)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
