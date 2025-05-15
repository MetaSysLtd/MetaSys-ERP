import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Truck, 
  Plus, 
  Search, 
  FileSpreadsheet, 
  ArrowUpDown, 
  MapPin,
  CalendarDays,
  DollarSign,
  AlertCircle,
  Filter,
  LayoutGrid,
  List,
  MoreHorizontal,
  FileText,
  Printer,
  Copy,
  Trash2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { MotionWrapper } from "@/components/ui/motion-wrapper";

export default function DispatchLoadsPage() {
  const { toast } = useToast();
  const { user, role } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const queryClient = useQueryClient();
  const searchParams = new URLSearchParams(search);
  
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredLoads, setFilteredLoads] = useState<any[]>([]);
  const [viewTab, setViewTab] = useState<string>("all");
  
  // Get loads from the API
  const { data: loads, isLoading, error, isError } = useQuery({
    queryKey: ["/api/dispatch/loads"],
  });
  
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load dispatch data. Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  // Export functions are defined below with the enhanced dynamic options
  
  // Define PDF template styles
  const pdfTemplates = {
    standard: {
      name: "Standard",
      style: `
        body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 20px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #025E73; padding-bottom: 10px; }
        .logo { font-size: 24px; font-weight: bold; color: #025E73; }
        .title { font-size: 22px; font-weight: bold; text-align: center; margin: 20px 0; color: #025E73; }
        .date { text-align: right; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #f1f5f9; text-align: left; padding: 10px; border-bottom: 2px solid #025E73; font-weight: bold; }
        td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 10px; }
        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
        .status-pending { background-color: #fff7ed; color: #c2410c; }
        .status-assigned { background-color: #eff6ff; color: #1d4ed8; }
        .status-in-transit { background-color: #f5f3ff; color: #6d28d9; }
        .status-delivered { background-color: #ecfdf5; color: #047857; }
        .status-cancelled { background-color: #fef2f2; color: #b91c1c; }
        .status-issue { background-color: #fef2f2; color: #b91c1c; }
      `
    },
    professional: {
      name: "Professional",
      style: `
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2d3748; margin: 0; padding: 30px; background-color: #f7fafc; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
        .logo { font-size: 28px; font-weight: 600; color: #025E73; letter-spacing: -0.5px; }
        .title { font-size: 26px; font-weight: 600; text-align: center; margin: 30px 0; color: #025E73; letter-spacing: -0.5px; position: relative; }
        .title:after { content: ''; position: absolute; width: 60px; height: 3px; background: #025E73; bottom: -10px; left: 50%; transform: translateX(-50%); }
        .date { text-align: right; font-size: 14px; color: #718096; }
        .meta-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .meta-info div { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); flex: 1; margin: 0 10px; }
        .meta-info div:first-child { margin-left: 0; }
        .meta-info div:last-child { margin-right: 0; }
        .meta-info h3 { margin: 0 0 5px 0; font-size: 14px; color: #718096; font-weight: normal; }
        .meta-info p { margin: 0; font-size: 18px; font-weight: 600; color: #2d3748; }
        table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 25px; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        th { background-color: #025E73; color: white; text-align: left; padding: 15px; font-weight: 500; }
        td { padding: 13px 15px; border-bottom: 1px solid #e2e8f0; }
        tr:last-child td { border-bottom: none; }
        .footer { margin-top: 40px; text-align: center; font-size: 13px; color: #718096; }
        .status-badge { padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; display: inline-block; }
        .status-pending { background-color: #feecdc; color: #9a3412; }
        .status-assigned { background-color: #dbeafe; color: #1e40af; }
        .status-in-transit { background-color: #ede9fe; color: #5b21b6; }
        .status-delivered { background-color: #d1fae5; color: #065f46; }
        .status-cancelled { background-color: #fee2e2; color: #991b1b; }
        .status-issue { background-color: #fee2e2; color: #991b1b; }
      `
    },
    executive: {
      name: "Executive",
      style: `
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a202c; margin: 0; padding: 40px; }
        .header { position: relative; padding-bottom: 15px; margin-bottom: 30px; }
        .header:after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, #025E73 0%, #412754 100%); }
        .logo { font-size: 32px; font-weight: 700; background: linear-gradient(90deg, #025E73 0%, #412754 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .title { font-size: 24px; font-weight: 700; text-align: center; margin: 30px 0; color: #1a202c; }
        .date { text-align: right; font-size: 14px; color: #718096; margin-top: -50px; }
        .summary { background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 30px; display: flex; justify-content: space-around; }
        .summary-item { text-align: center; }
        .summary-item h3 { margin: 0 0 5px 0; font-size: 14px; color: #718096; font-weight: 500; }
        .summary-item p { margin: 0; font-size: 22px; font-weight: 700; color: #025E73; }
        table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 15px; }
        th { text-align: left; padding: 15px; font-weight: 600; color: #4a5568; border-bottom: 2px solid #e2e8f0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
        td { padding: 15px; border-bottom: 1px solid #edf2f7; }
        tr:hover td { background-color: #f9fafb; }
        .footer { margin-top: 40px; text-align: center; font-size: 13px; color: #718096; }
        .status-badge { padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; display: inline-block; }
        .status-pending { background-color: #fff1db; color: #b45309; }
        .status-assigned { background-color: #e0f2fe; color: #0369a1; }
        .status-in-transit { background-color: #f3e8ff; color: #6b21a8; }
        .status-delivered { background-color: #dcfce7; color: #15803d; }
        .status-cancelled { background-color: #fee2e2; color: #b91c1c; }
        .status-issue { background-color: #fee2e2; color: #b91c1c; }
      `
    }
  };

  // CSV Export options
  const csvExportOptions = {
    basic: {
      name: "Basic",
      headers: [
        'Load #',
        'Origin',
        'Destination',
        'Client',
        'Pickup Date',
        'Delivery Date',
        'Status',
        'Rate'
      ],
      getData: (load: any) => [
        load.loadNumber || '',
        load.origin || '',
        load.destination || '',
        load.client?.name || '',
        formatDate(load.pickupDate) || '',
        formatDate(load.deliveryDate) || '',
        formatStatus(load.status).label || '',
        `$${load.rate?.toFixed(2) || '0.00'}`
      ]
    },
    detailed: {
      name: "Detailed",
      headers: [
        'Load #',
        'Origin',
        'Destination',
        'Client',
        'Pickup Date',
        'Delivery Date',
        'Status',
        'Rate',
        'Driver',
        'Equipment',
        'Miles',
        'Weight',
        'Notes'
      ],
      getData: (load: any) => [
        load.loadNumber || '',
        load.origin || '',
        load.destination || '',
        load.client?.name || '',
        formatDate(load.pickupDate) || '',
        formatDate(load.deliveryDate) || '',
        formatStatus(load.status).label || '',
        `$${load.rate?.toFixed(2) || '0.00'}`,
        load.driver || '',
        load.equipment || '',
        load.miles?.toString() || '',
        load.weight || '',
        load.notes || ''
      ]
    }
  };

  // Export loads to CSV
  const exportLoadsToCSV = (option = 'detailed') => {
    if (!filteredLoads || filteredLoads.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no loads matching your current filters to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get the selected CSV option
      const csvOption = csvExportOptions[option as keyof typeof csvExportOptions] || csvExportOptions.detailed;
      
      // Define the CSV header
      const headers = csvOption.headers;

      // Convert data to CSV rows
      const rows = filteredLoads.map(load => csvOption.getData(load));

      // Combine header and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell?.toString().replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // Create a blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `loads-export-${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Your loads have been exported to CSV (${csvOption.name})`,
        variant: "default",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting your data.",
        variant: "destructive",
      });
    }
  };
  
  // Export loads to PDF
  const exportLoadsToPDF = (template = 'standard') => {
    if (!filteredLoads || filteredLoads.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no loads matching your current filters to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Generating PDF",
        description: "Your PDF is being prepared for download",
      });
      
      // Get the selected template
      const selectedTemplate = pdfTemplates[template as keyof typeof pdfTemplates] || pdfTemplates.standard;
      
      // Create HTML content for PDF
      const companyLogo = "MetaSys ERP";
      const today = new Date().toLocaleDateString();
      const reportTitle = viewTab !== 'all' 
        ? `${viewTab.charAt(0).toUpperCase() + viewTab.slice(1)} Loads Report` 
        : 'Dispatch Loads Report';
      
      // Create summary data for Executive template
      const summaryData = {
        totalLoads: filteredLoads.length,
        totalValue: filteredLoads.reduce((sum, load) => sum + (load.rate || 0), 0),
        avgRate: filteredLoads.length 
          ? (filteredLoads.reduce((sum, load) => sum + (load.rate || 0), 0) / filteredLoads.length).toFixed(2)
          : '0.00',
        upcomingLoads: filteredLoads.filter(load => 
          new Date(load.pickupDate) > new Date() && 
          load.status && ["pending", "assigned"].includes(load.status)).length
      };
      
      // Create PDF template based on the selected style
      let pdfContent = `
        <html>
          <head>
            <style>
              ${selectedTemplate.style}
            </style>
          </head>
          <body>
      `;
      
      // Add header based on template
      if (template === 'executive') {
        pdfContent += `
          <div class="header">
            <div class="logo">${companyLogo}</div>
            <div class="date">Generated: ${today}</div>
          </div>
          
          <div class="title">${reportTitle}</div>
          
          <div class="summary">
            <div class="summary-item">
              <h3>TOTAL LOADS</h3>
              <p>${summaryData.totalLoads}</p>
            </div>
            <div class="summary-item">
              <h3>TOTAL VALUE</h3>
              <p>$${summaryData.totalValue.toLocaleString()}</p>
            </div>
            <div class="summary-item">
              <h3>AVG RATE</h3>
              <p>$${summaryData.avgRate}</p>
            </div>
            <div class="summary-item">
              <h3>UPCOMING</h3>
              <p>${summaryData.upcomingLoads}</p>
            </div>
          </div>
        `;
      } else if (template === 'professional') {
        pdfContent += `
          <div class="header">
            <div class="logo">${companyLogo}</div>
            <div class="date">Generated: ${today}</div>
          </div>
          
          <div class="title">${reportTitle}</div>
          
          <div class="meta-info">
            <div>
              <h3>Total Loads</h3>
              <p>${summaryData.totalLoads}</p>
            </div>
            <div>
              <h3>Total Value</h3>
              <p>$${summaryData.totalValue.toLocaleString()}</p>
            </div>
            <div>
              <h3>Status</h3>
              <p>${viewTab !== 'all' ? viewTab.replace('_', ' ').toUpperCase() : 'ALL'}</p>
            </div>
          </div>
        `;
      } else {
        // Standard template
        pdfContent += `
          <div class="header">
            <div class="logo">${companyLogo}</div>
            <div class="date">Generated: ${today}</div>
          </div>
          
          <div class="title">${reportTitle}</div>
        `;
      }
      
      // Add the table with load data
      pdfContent += `
        <table>
          <thead>
            <tr>
              <th>Load #</th>
              <th>Origin</th>
              <th>Destination</th>
              <th>Client</th>
              <th>Pickup</th>
              <th>Delivery</th>
              <th>Status</th>
              <th>Rate</th>
            </tr>
          </thead>
          <tbody>
            ${filteredLoads.map(load => {
              const status = formatStatus(load.status);
              const statusClass = `status-${load.status.replace('_', '-')}`;
              return `
                <tr>
                  <td>${load.loadNumber || ''}</td>
                  <td>${load.origin || ''}</td>
                  <td>${load.destination || ''}</td>
                  <td>${load.client?.name || ''}</td>
                  <td>${formatDate(load.pickupDate) || ''}</td>
                  <td>${formatDate(load.deliveryDate) || ''}</td>
                  <td><span class="status-badge ${statusClass}">${status.label}</span></td>
                  <td>$${load.rate?.toFixed(2) || '0.00'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>MetaSys ERP - Dispatch Management System | This report contains ${filteredLoads.length} loads</p>
        </div>
      </body>
    </html>
  `;
      
      // Convert HTML to PDF
      const blob = new Blob([pdfContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary iframe to print the content
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.top = '0';
      printFrame.style.left = '0';
      printFrame.style.width = '100%';
      printFrame.style.height = '100%';
      printFrame.style.zIndex = '-9999';
      document.body.appendChild(printFrame);
      
      printFrame.onload = () => {
        printFrame.contentWindow?.document.open();
        printFrame.contentWindow?.document.write(pdfContent);
        printFrame.contentWindow?.document.close();
        
        // Use setTimeout to ensure content is loaded
        setTimeout(() => {
          printFrame.contentWindow?.print();
          // Remove the iframe after printing
          setTimeout(() => {
            document.body.removeChild(printFrame);
          }, 1000);
          
          toast({
            title: "Export Successful",
            description: `Your loads have been exported to PDF (${selectedTemplate.name})`,
            variant: "default",
          });
        }, 500);
      };
      
      printFrame.src = url;
      
    } catch (error) {
      console.error("PDF export error:", error);
      toast({
        title: "Export Failed",
        description: "There was an error generating your PDF.",
        variant: "destructive",
      });
    }
  };

  // Filter loads based on status and search query
  useEffect(() => {
    if (!loads) return;
    
    // Make sure loads is treated as an array
    let filtered = Array.isArray(loads) ? [...loads] : [];
    
    // Filter by status
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((load) => load.status === statusFilter);
    }
    
    // Filter by view tab
    if (viewTab === "upcoming") {
      filtered = filtered.filter((load) => 
        new Date(load.pickupDate) > new Date() && 
        ["pending", "assigned", "in_transit"].includes(load.status)
      );
    } else if (viewTab === "in_transit") {
      filtered = filtered.filter((load) => load.status === "in_transit");
    } else if (viewTab === "completed") {
      filtered = filtered.filter((load) => load.status === "delivered");
    } else if (viewTab === "issue") {
      filtered = filtered.filter((load) => load.hasIssue);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (load) =>
          (load.loadNumber && load.loadNumber.toLowerCase().includes(query)) ||
          (load.origin && load.origin.toLowerCase().includes(query)) ||
          (load.destination && load.destination.toLowerCase().includes(query)) ||
          (load.client && load.client.name && load.client.name.toLowerCase().includes(query))
      );
    }
    
    setFilteredLoads(filtered);
  }, [loads, statusFilter, viewTab, searchQuery]);
  
  // Determine user permissions
  const canCreateLoad = 
    role?.department === "admin" || 
    role?.department === "dispatch" ||
    (role?.permissions && role?.permissions.canCreateLoads);
  
  // Format status for display
  const formatStatus = (status: string) => {
    const statusMap = {
      "pending": { label: "Pending", color: "text-amber-600 bg-amber-50 border-amber-200" },
      "assigned": { label: "Assigned", color: "text-blue-600 bg-blue-50 border-blue-200" },
      "in_transit": { label: "In Transit", color: "text-purple-600 bg-purple-50 border-purple-200" },
      "delivered": { label: "Delivered", color: "text-green-600 bg-green-50 border-green-200" },
      "cancelled": { label: "Cancelled", color: "text-red-600 bg-red-50 border-red-200" },
      "issue": { label: "Issue", color: "text-red-600 bg-red-50 border-red-200" },
    };
    
    return statusMap[status as keyof typeof statusMap] || { label: status, color: "text-gray-600 bg-gray-50 border-gray-200" };
  };

  // Render loading skeleton
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-12 w-full mb-6" />
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    );
  }

  // Render error state
  if (isError) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <AlertCircle className="mr-2 h-5 w-5" />
              Error Loading Dispatch Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              {error instanceof Error ? error.message : "Failed to load dispatch data"}
            </p>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/dispatch/loads"] })}
            >
              Retry
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const dummyLoads = [
    {
      id: 1,
      loadNumber: "LD-001",
      origin: "Chicago, IL",
      destination: "Dallas, TX",
      pickupDate: "2025-05-01",
      deliveryDate: "2025-05-03",
      client: { name: "ABC Logistics" },
      status: "in_transit",
      rate: 2500,
      driver: "John Smith",
      equipment: "Dry Van",
      miles: 967,
      weight: "42000 lbs",
      hasIssue: false
    },
    {
      id: 2,
      loadNumber: "LD-002",
      origin: "Atlanta, GA",
      destination: "Miami, FL",
      pickupDate: "2025-05-02",
      deliveryDate: "2025-05-04",
      client: { name: "XYZ Transport" },
      status: "pending",
      rate: 1800,
      equipment: "Reefer",
      miles: 663,
      weight: "38000 lbs",
      hasIssue: false
    },
    {
      id: 3,
      loadNumber: "LD-003",
      origin: "Denver, CO",
      destination: "Phoenix, AZ",
      pickupDate: "2025-05-01",
      deliveryDate: "2025-05-02",
      client: { name: "Fast Freight Inc." },
      status: "delivered",
      rate: 2200,
      driver: "Sarah Johnson",
      equipment: "Flatbed",
      miles: 862,
      weight: "44000 lbs",
      hasIssue: false
    }
  ];

  // Use dummy data only if production data is not available
  const displayLoads = filteredLoads.length > 0 ? filteredLoads : dummyLoads;

  return (
    <div className="container mx-auto">
      {/* Page header */}
      <MotionWrapper animation="fade" delay={0.1}>
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Dispatch Load Management
              </h1>
              <p className="text-gray-500 mt-1">
                Manage and track all loads in the system
              </p>
            </div>
            {canCreateLoad && (
              <Button
                onClick={() => setLocation("/dispatch/new-load")}
                className="mt-4 sm:mt-0 bg-gradient-to-r from-[#025E73] to-[#011F26] hover:opacity-90 text-white rounded-md transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Load
              </Button>
            )}
          </div>
        </div>
      </MotionWrapper>
      
      {/* Tabs for different views */}
      <MotionWrapper animation="slideUp" delay={0.2}>
        <Tabs defaultValue="all" value={viewTab} onValueChange={setViewTab} className="mb-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <TabsTrigger value="all">All Loads</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="in_transit">In Transit</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="issue">Issues</TabsTrigger>
          </TabsList>
          
          {/* These TabsContent elements are required for proper Tabs functionality */}
          <TabsContent value="all"></TabsContent>
          <TabsContent value="upcoming"></TabsContent>
          <TabsContent value="in_transit"></TabsContent>
          <TabsContent value="completed"></TabsContent>
          <TabsContent value="issue"></TabsContent>
        </Tabs>
      </MotionWrapper>
      
      {/* Search and filter controls */}
      <MotionWrapper animation="slideUp" delay={0.3}>
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-1/4">
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value)}
                >
                  <SelectTrigger id="status-filter" className="w-full">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="issue">Issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-3/4">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="search"
                    type="text"
                    placeholder="Search by load #, origin, destination, client..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {displayLoads.length} {displayLoads.length === 1 ? 'load' : 'loads'} found
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                    onClick={() => {
                      const dropdown = document.getElementById('exportDropdown');
                      if (dropdown) {
                        dropdown.classList.toggle('hidden');
                      }
                    }}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <div id="exportDropdown" className="hidden absolute right-0 z-10 mt-1 w-64 rounded-md shadow-lg bg-white divide-y divide-gray-100 ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="p-2 text-sm text-gray-700 font-medium">CSV Export</div>
                    <div className="py-1">
                      <button
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          document.getElementById('exportDropdown')?.classList.add('hidden');
                          exportLoadsToCSV('basic');
                        }}
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2 text-blue-600" />
                        <div>
                          <div className="font-medium">Basic CSV</div>
                          <div className="text-xs text-gray-500">Essential load data</div>
                        </div>
                      </button>
                      <button
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          document.getElementById('exportDropdown')?.classList.add('hidden');
                          exportLoadsToCSV('detailed');
                        }}
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2 text-indigo-600" />
                        <div>
                          <div className="font-medium">Detailed CSV</div>
                          <div className="text-xs text-gray-500">All load fields and details</div>
                        </div>
                      </button>
                    </div>
                    <div className="p-2 text-sm text-gray-700 font-medium">PDF Export</div>
                    <div className="py-1">
                      <button
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          document.getElementById('exportDropdown')?.classList.add('hidden');
                          exportLoadsToPDF('standard');
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2 text-cyan-600" />
                        <div>
                          <div className="font-medium">Standard PDF</div>
                          <div className="text-xs text-gray-500">Simple, clean format</div>
                        </div>
                      </button>
                      <button
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          document.getElementById('exportDropdown')?.classList.add('hidden');
                          exportLoadsToPDF('professional');
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2 text-teal-600" />
                        <div>
                          <div className="font-medium">Professional PDF</div>
                          <div className="text-xs text-gray-500">Modern design with metrics</div>
                        </div>
                      </button>
                      <button
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          document.getElementById('exportDropdown')?.classList.add('hidden');
                          exportLoadsToPDF('executive');
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2 text-purple-600" />
                        <div>
                          <div className="font-medium">Executive PDF</div>
                          <div className="text-xs text-gray-500">Premium report with summary</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </MotionWrapper>
      
      {/* Loads table */}
      <MotionWrapper animation="slideUp" delay={0.4}>
        <Card className="shadow overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Load #</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayLoads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No loads found. Create a new load to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayLoads.map((load) => (
                    <TableRow key={load.id}>
                      <TableCell className="font-medium">
                        {load.loadNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center text-sm">
                            <MapPin className="h-3 w-3 mr-1 text-gray-500" />
                            <span className="text-gray-700">{load.origin}</span>
                          </div>
                          <div className="flex items-center text-sm mt-1">
                            <MapPin className="h-3 w-3 mr-1 text-gray-500" />
                            <span className="text-gray-700">{load.destination}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-gray-900">
                          {load.client?.name}
                        </div>
                        {load.driver && (
                          <div className="text-xs text-gray-500">
                            Driver: {load.driver}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {load.equipment || "Standard"}
                        </Badge>
                        {load.weight && (
                          <div className="text-xs text-gray-500 mt-1">
                            Weight: {load.weight}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <div className="flex items-center">
                            <CalendarDays className="h-3 w-3 mr-1 text-gray-500" />
                            <span>Pickup: {formatDate(load.pickupDate)}</span>
                          </div>
                          {load.deliveryDate && (
                            <div className="flex items-center mt-1">
                              <CalendarDays className="h-3 w-3 mr-1 text-gray-500" />
                              <span>Delivery: {formatDate(load.deliveryDate)}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${formatStatus(load.status).color}`}>
                          {formatStatus(load.status).label}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium text-gray-900">
                          ${load.rate?.toLocaleString()}
                        </div>
                        {load.miles && (
                          <div className="text-xs text-gray-500">
                            {load.miles} miles
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => setLocation(`/dispatch/loads/${load.id}`)}
                            className="text-[#025E73] border-[#025E73] hover:bg-[#025E73]/10"
                          >
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              toast({
                                title: "Feature Not Available",
                                description: "Load editing is coming soon",
                              });
                            }}
                            className="text-[#025E73] border-[#025E73] hover:bg-[#025E73]/10"
                          >
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </MotionWrapper>
    </div>
  );
}