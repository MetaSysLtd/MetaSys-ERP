import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Truck,
  Search,
  MapPin,
  CalendarCheck,
  Clock,
  Phone,
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Package,
  RefreshCw,
  User,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { MotionWrapper } from "@/components/ui/motion-wrapper";

export default function TrackingPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const queryClient = useQueryClient();
  const searchParams = new URLSearchParams(search);
  
  const [loadId, setLoadId] = useState<string | null>(searchParams.get("id"));
  const [trackingNumber, setTrackingNumber] = useState<string>(searchParams.get("tracking") || "");
  const [activeTab, setActiveTab] = useState<string>("map");
  
  // Get load tracking data
  const { data: trackingData, isLoading, error, isError } = useQuery({
    queryKey: ["/api/dispatch/tracking", loadId],
    enabled: !!loadId,
  });
  
  // Search for a load
  const handleSearch = () => {
    if (!trackingNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a tracking number",
        variant: "destructive",
      });
      return;
    }
    
    // Update URL and tracking number
    const newParams = new URLSearchParams();
    newParams.set("tracking", trackingNumber);
    setLocation(`/dispatch/tracking?${newParams.toString()}`);
    
    // In a real application, this would query the API
    // For now, we'll simulate finding the load by ID
    setLoadId("1"); // Dummy ID for demo purposes
    
    // Invalidate tracking data to trigger a refetch
    queryClient.invalidateQueries({ queryKey: ["/api/dispatch/tracking"] });
  };
  
  // When the component mounts, check if we have a tracking number in the URL
  useEffect(() => {
    if (searchParams.get("tracking")) {
      setTrackingNumber(searchParams.get("tracking") || "");
      handleSearch();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Mock tracking data for the demo
  const mockTrackingData = {
    id: 1,
    loadNumber: "LD-001",
    trackingNumber: "TRK-123456",
    status: "in_transit",
    origin: "Chicago, IL",
    destination: "Dallas, TX",
    pickupDate: "2025-05-01T08:00:00Z",
    estimatedDelivery: "2025-05-03T14:00:00Z",
    currentLocation: "St. Louis, MO",
    lastUpdated: "2025-05-02T10:30:00Z",
    client: {
      name: "ABC Logistics",
      contactName: "John Smith",
      phoneNumber: "(555) 123-4567",
      email: "john@abclogistics.com",
    },
    driver: {
      name: "Mike Johnson",
      phoneNumber: "(555) 987-6543",
      truckNumber: "T-789",
    },
    events: [
      {
        id: 1,
        time: "2025-05-01T08:15:00Z",
        location: "Chicago, IL",
        status: "Picked up",
        notes: "Load picked up on time",
      },
      {
        id: 2,
        time: "2025-05-01T12:30:00Z",
        location: "Indianapolis, IN",
        status: "In transit",
        notes: "Load moving as scheduled",
      },
      {
        id: 3,
        time: "2025-05-02T08:45:00Z",
        location: "St. Louis, MO",
        status: "Check-in",
        notes: "Driver checked in, everything on schedule",
      },
    ],
    loadDetails: {
      weight: "42000 lbs",
      equipment: "Dry Van",
      temperature: "N/A",
      pieces: "48 pallets",
      specialInstructions: "Call customer 1 hour before delivery",
    },
  };
  
  // Use mock data for demonstration purposes
  const displayData = trackingData || mockTrackingData;
  
  // Format the date with time
  const formatDateWithTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateString;
    }
  };
  
  // Calculate estimated time of arrival
  const calculateETA = (estimatedDelivery: string) => {
    const now = new Date();
    const eta = new Date(estimatedDelivery);
    const diffTime = eta.getTime() - now.getTime();
    
    // If the ETA is in the past
    if (diffTime < 0) {
      return "Delivered";
    }
    
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    }
    
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  };
  
  // Get status badge styling
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string, color: string }> = {
      "pending": { label: "Pending", color: "bg-amber-50 text-amber-600 border-amber-200" },
      "in_transit": { label: "In Transit", color: "bg-purple-50 text-purple-600 border-purple-200" },
      "delivered": { label: "Delivered", color: "bg-green-50 text-green-600 border-green-200" },
      "delayed": { label: "Delayed", color: "bg-red-50 text-red-600 border-red-200" },
      "cancelled": { label: "Cancelled", color: "bg-gray-50 text-gray-600 border-gray-200" },
    };
    
    return statusMap[status] || { label: status, color: "bg-gray-50 text-gray-600 border-gray-200" };
  };
  
  // Render loading skeleton
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-4 mb-6">
          <Skeleton className="h-10 w-full sm:w-96" />
          <Skeleton className="h-10 w-full sm:w-40" />
        </div>
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    );
  }
  
  // Render search form if no load is being tracked
  if (!loadId) {
    return (
      <div className="container mx-auto py-6">
        <MotionWrapper animation="fade-down" delay={0.1}>
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">
              Track Shipment
            </h1>
            <p className="text-gray-500 mt-1">
              Enter a tracking number to monitor the status of your shipment
            </p>
          </div>
        </MotionWrapper>
        
        <MotionWrapper animation="fade-up" delay={0.2}>
          <Card className="max-w-2xl mx-auto shadow">
            <CardHeader>
              <CardTitle>Shipment Tracking</CardTitle>
              <CardDescription>
                Enter a load number, tracking number, or PRO number
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Truck className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      placeholder="Enter tracking number"
                      className="pl-10"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleSearch}
                  className="bg-gradient-to-r from-[#025E73] to-[#011F26] hover:opacity-90 text-white rounded-md transition-all duration-200"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Track
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-2 border-t pt-6">
              <div className="text-sm text-gray-500">
                <p>Examples of valid tracking numbers:</p>
                <ul className="list-disc pl-5 mt-2">
                  <li>LD-12345 (Load Number)</li>
                  <li>TRK-67890 (Tracking Number)</li>
                  <li>PRO-54321 (PRO Number)</li>
                </ul>
              </div>
            </CardFooter>
          </Card>
        </MotionWrapper>
      </div>
    );
  }
  
  // Render tracking details
  return (
    <div className="container mx-auto py-6">
      <MotionWrapper animation="fade-down" delay={0.1}>
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Shipment Tracking
              </h1>
              <div className="flex items-center mt-1">
                <span className="text-gray-500 mr-2">Load:</span>
                <span className="font-medium">{displayData.loadNumber}</span>
                <span className="mx-2 text-gray-400">|</span>
                <span className="text-gray-500 mr-2">Tracking:</span>
                <span className="font-medium">{displayData.trackingNumber}</span>
              </div>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Refresh tracking data
                  queryClient.invalidateQueries({ queryKey: ["/api/dispatch/tracking", loadId] });
                  toast({
                    title: "Refreshed",
                    description: "Tracking information updated",
                  });
                }}
                className="text-[#025E73] border-[#025E73] hover:bg-[#025E73]/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="ml-2 text-[#025E73] border-[#025E73] hover:bg-[#025E73]/10"
                onClick={() => {
                  // Reset tracking
                  setLoadId(null);
                  setTrackingNumber("");
                  setLocation("/dispatch/tracking");
                }}
              >
                <Search className="h-4 w-4 mr-2" />
                Track Another
              </Button>
            </div>
          </div>
        </div>
      </MotionWrapper>
      
      {/* Status Card */}
      <MotionWrapper animation="fade-up" delay={0.2}>
        <Card className="mb-6 shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h2 className="text-sm font-medium text-gray-500 mb-1">Status</h2>
                <div className="flex items-center">
                  <Badge className={`${getStatusBadge(displayData.status).color} h-6 text-sm capitalize`}>
                    {getStatusBadge(displayData.status).label}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: {formatDateWithTime(displayData.lastUpdated)}
                </p>
              </div>
              
              <div>
                <h2 className="text-sm font-medium text-gray-500 mb-1">Estimated Delivery</h2>
                <p className="font-medium">{formatDateWithTime(displayData.estimatedDelivery)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  ETA: {calculateETA(displayData.estimatedDelivery)}
                </p>
              </div>
              
              <div>
                <h2 className="text-sm font-medium text-gray-500 mb-1">Current Location</h2>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-500 mr-1" />
                  <span className="font-medium">{displayData.currentLocation}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </MotionWrapper>
      
      {/* Tabs for different views */}
      <MotionWrapper animation="fade-up" delay={0.3}>
        <Tabs defaultValue="map" value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-1 sm:grid-cols-4 w-full gap-2">
            <TabsTrigger value="map">Map View</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="details">Load Details</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="map" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipment Route</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 border rounded-md h-[400px] flex items-center justify-center">
                  <div className="text-center p-6">
                    <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 mb-1">Map View Coming Soon</p>
                    <p className="text-sm text-gray-400">
                      Live tracking map will be available in the next update
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border rounded-md p-4">
                    <h3 className="text-sm font-medium flex items-center mb-2">
                      <MapPin className="h-4 w-4 text-gray-500 mr-1" />
                      Origin
                    </h3>
                    <p className="font-medium text-gray-900">{displayData.origin}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Pickup: {formatDateWithTime(displayData.pickupDate)}
                    </p>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="text-sm font-medium flex items-center mb-2">
                      <MapPin className="h-4 w-4 text-gray-500 mr-1" />
                      Destination
                    </h3>
                    <p className="font-medium text-gray-900">{displayData.destination}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Expected: {formatDateWithTime(displayData.estimatedDelivery)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="timeline" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipment Timeline</CardTitle>
                <CardDescription>
                  Track the progress of your shipment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {displayData.events.map((event) => (
                    <div key={event.id} className="relative pl-8 pb-8">
                      <div className="absolute left-0 top-0 mt-1 h-full w-px bg-[#025E73]/20"></div>
                      <div className="absolute left-0 top-1 h-4 w-4 rounded-full border-2 border-[#025E73] bg-white"></div>
                      <div className="mb-1 text-sm font-medium">{event.status}</div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {formatDateWithTime(event.time)}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">{event.location}</span>
                        {event.notes && (
                          <p className="mt-1 text-gray-500">{event.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="details" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Load Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Equipment Type</h3>
                      <p className="font-medium">{displayData.loadDetails.equipment}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Weight</h3>
                      <p className="font-medium">{displayData.loadDetails.weight}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Pieces</h3>
                      <p className="font-medium">{displayData.loadDetails.pieces}</p>
                    </div>
                    
                    {displayData.loadDetails.temperature !== "N/A" && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Temperature</h3>
                        <p className="font-medium">{displayData.loadDetails.temperature}</p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Special Instructions</h3>
                    <div className="p-4 bg-gray-50 rounded-md border">
                      <p className="text-sm">{displayData.loadDetails.specialInstructions}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="contacts" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border rounded-md p-4">
                    <h3 className="text-md font-medium mb-3">Client</h3>
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Company</h4>
                        <p className="font-medium">{displayData.client.name}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Contact</h4>
                        <p>{displayData.client.contactName}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Phone</h4>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-gray-500 mr-2" />
                          <p>{displayData.client.phoneNumber}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Email</h4>
                        <p className="text-sm">{displayData.client.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="text-md font-medium mb-3">Driver</h3>
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Name</h4>
                        <p className="font-medium">{displayData.driver.name}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Truck Number</h4>
                        <p>{displayData.driver.truckNumber}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Phone</h4>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-gray-500 mr-2" />
                          <p>{displayData.driver.phoneNumber}</p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="ml-2 h-8 px-2 text-xs text-[#025E73] hover:bg-[#025E73]/10"
                          >
                            Call
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </MotionWrapper>
    </div>
  );
}