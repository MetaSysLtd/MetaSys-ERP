
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

interface LeadsTableProps {
  leads?: Array<{
    id: string;
    companyName: string;
    status: string;
    mcNumber: string;
    createdAt: string;
  }>;
}

export function RecentLeads({ leads = [] }: LeadsTableProps) {
  const getStatusColor = (status: string) => {
    const colors = {
      qualified: "bg-green-100 text-green-800 border-green-200",
      unqualified: "bg-red-100 text-red-800 border-red-200",
      active: "bg-blue-100 text-blue-800 border-blue-200",
      lost: "bg-gray-100 text-gray-800 border-gray-200",
      "follow-up": "bg-yellow-100 text-yellow-800 border-yellow-200",
      won: "bg-purple-100 text-purple-800 border-purple-200"
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium">Recent Leads</CardTitle>
        <Link href="/leads" className="text-sm text-blue-600 hover:text-blue-800">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>MC Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                  No recent leads
                </TableCell>
              </TableRow>
            ) : (
              leads.slice(0, 5).map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.companyName}</TableCell>
                  <TableCell>{lead.mcNumber}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(lead.status)}>
                      {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(lead.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
