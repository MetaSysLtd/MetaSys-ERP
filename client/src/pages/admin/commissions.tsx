import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Plus, Trash2, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Redirect } from "wouter";

// Define type for commission tier
interface CommissionTier {
  id?: string; // Local ID for UI only
  min: number;
  max: number;
  pct?: number; // For dispatch
  active?: number; // For sales
  inbound?: number; // For sales
  isNew?: boolean; // Track newly added tiers
}

export default function CommissionsAdmin() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("sales");
  const [salesTiers, setSalesTiers] = useState<CommissionTier[]>([]);
  const [dispatchTiers, setDispatchTiers] = useState<CommissionTier[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // Check if user has admin privileges
  const isAdmin = role?.level && role.level >= 4;
  
  // Fetch commission rules
  const { isLoading: isLoadingSales } = useQuery({
    queryKey: ['/api/commissions/rules', 'sales'],
    queryFn: async () => {
      const response = await fetch('/api/commissions/rules/sales');
      if (!response.ok) throw new Error('Failed to fetch sales commission rules');
      const data = await response.json();
      
      // Extract tiers from the rules
      if (data && data.tiers) {
        const formatted = data.tiers.map((tier: any, index: number) => ({
          ...tier,
          id: `sales-${index}`
        }));
        setSalesTiers(formatted);
      }
      return data;
    },
    enabled: isAdmin
  });

  const { isLoading: isLoadingDispatch } = useQuery({
    queryKey: ['/api/commissions/rules', 'dispatch'],
    queryFn: async () => {
      const response = await fetch('/api/commissions/rules/dispatch');
      if (!response.ok) throw new Error('Failed to fetch dispatch commission rules');
      const data = await response.json();
      
      // Extract tiers from the rules
      if (data && data.tiers) {
        const formatted = data.tiers.map((tier: any, index: number) => ({
          ...tier,
          id: `dispatch-${index}`
        }));
        setDispatchTiers(formatted);
      }
      return data;
    },
    enabled: isAdmin
  });

  // Update commission rules mutation
  const updateRulesMutation = useMutation({
    mutationFn: async ({ type, tiers }: { type: string, tiers: CommissionTier[] }) => {
      const response = await apiRequest('POST', `/api/admin/commissions/${type}`, {
        tiers: tiers.map(({ id, isNew, ...rest }) => rest) // Remove UI-only fields
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update commission rules');
      }
      
      return await response.json();
    },
    onSuccess: (data, variables) => {
      // Update the query cache
      queryClient.invalidateQueries({ queryKey: ['/api/commissions/rules', variables.type] });
      
      toast({
        title: "Rules Updated",
        description: `${variables.type.charAt(0).toUpperCase() + variables.type.slice(1)} commission rules have been updated successfully.`,
      });
      
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle adding a new tier
  const handleAddTier = (type: 'sales' | 'dispatch') => {
    const newTier: CommissionTier = type === 'sales'
      ? { id: `${type}-new-${Date.now()}`, min: 0, max: 0, active: 0, inbound: 0, isNew: true }
      : { id: `${type}-new-${Date.now()}`, min: 0, max: 0, pct: 0, isNew: true };
    
    if (type === 'sales') {
      setSalesTiers([...salesTiers, newTier]);
    } else {
      setDispatchTiers([...dispatchTiers, newTier]);
    }
    
    setIsEditing(true);
  };

  // Handle removing a tier
  const handleRemoveTier = (type: 'sales' | 'dispatch', id: string) => {
    if (type === 'sales') {
      setSalesTiers(salesTiers.filter(tier => tier.id !== id));
    } else {
      setDispatchTiers(dispatchTiers.filter(tier => tier.id !== id));
    }
    
    setIsEditing(true);
  };

  // Handle updating tier values
  const handleTierChange = (
    type: 'sales' | 'dispatch',
    id: string,
    field: string,
    value: string
  ) => {
    const numValue = Number(value);
    
    if (type === 'sales') {
      setSalesTiers(
        salesTiers.map(tier =>
          tier.id === id ? { ...tier, [field]: numValue } : tier
        )
      );
    } else {
      setDispatchTiers(
        dispatchTiers.map(tier =>
          tier.id === id ? { ...tier, [field]: numValue } : tier
        )
      );
    }
    
    setIsEditing(true);
  };

  // Handle saving rules
  const handleSaveRules = (type: 'sales' | 'dispatch') => {
    updateRulesMutation.mutate({
      type,
      tiers: type === 'sales' ? salesTiers : dispatchTiers
    });
  };

  // If user is not admin, redirect to dashboard
  if (!isAdmin) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Commission Rules</h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sales">Sales Commission</TabsTrigger>
          <TabsTrigger value="dispatch">Dispatch Commission</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Sales Commission Rules</CardTitle>
              <CardDescription>
                Configure commission tiers based on active leads count
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing && (
                <Alert className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Changes Pending</AlertTitle>
                  <AlertDescription>
                    You have unsaved changes. Click Save Rules to apply them.
                  </AlertDescription>
                </Alert>
              )}
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Min Leads</TableHead>
                    <TableHead>Max Leads</TableHead>
                    <TableHead>Amount (PKR)</TableHead>
                    <TableHead>Inbound Amount (PKR)</TableHead>
                    <TableHead width="100px">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesTiers.map((tier) => (
                    <TableRow key={tier.id}>
                      <TableCell>
                        <Input
                          type="number"
                          value={tier.min}
                          onChange={(e) => handleTierChange('sales', tier.id!, 'min', e.target.value)}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={tier.max}
                          onChange={(e) => handleTierChange('sales', tier.id!, 'max', e.target.value)}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={tier.active}
                          onChange={(e) => handleTierChange('sales', tier.id!, 'active', e.target.value)}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={tier.inbound}
                          onChange={(e) => handleTierChange('sales', tier.id!, 'inbound', e.target.value)}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTier('sales', tier.id!)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => handleAddTier('sales')}
                  className="flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tier
                </Button>
                
                <Button
                  onClick={() => handleSaveRules('sales')}
                  disabled={!isEditing || updateRulesMutation.isPending}
                  className="bg-[#457B9D] hover:bg-[#2EC4B6] text-white rounded-md transition-colors duration-200"
                >
                  {updateRulesMutation.isPending ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Rules
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="dispatch">
          <Card>
            <CardHeader>
              <CardTitle>Dispatch Commission Rules</CardTitle>
              <CardDescription>
                Configure commission tiers based on invoice total
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing && (
                <Alert className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Changes Pending</AlertTitle>
                  <AlertDescription>
                    You have unsaved changes. Click Save Rules to apply them.
                  </AlertDescription>
                </Alert>
              )}
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Min Amount (PKR)</TableHead>
                    <TableHead>Max Amount (PKR)</TableHead>
                    <TableHead>Percentage (%)</TableHead>
                    <TableHead width="100px">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dispatchTiers.map((tier) => (
                    <TableRow key={tier.id}>
                      <TableCell>
                        <Input
                          type="number"
                          value={tier.min}
                          onChange={(e) => handleTierChange('dispatch', tier.id!, 'min', e.target.value)}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={tier.max}
                          onChange={(e) => handleTierChange('dispatch', tier.id!, 'max', e.target.value)}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={tier.pct}
                          onChange={(e) => handleTierChange('dispatch', tier.id!, 'pct', e.target.value)}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTier('dispatch', tier.id!)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => handleAddTier('dispatch')}
                  className="flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tier
                </Button>
                
                <Button
                  onClick={() => handleSaveRules('dispatch')}
                  disabled={!isEditing || updateRulesMutation.isPending}
                  className="bg-[#457B9D] hover:bg-[#2EC4B6] text-white rounded-md transition-colors duration-200"
                >
                  {updateRulesMutation.isPending ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Rules
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}