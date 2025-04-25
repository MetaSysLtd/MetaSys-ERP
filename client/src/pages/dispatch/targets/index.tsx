import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, AlertCircle, Target, ArrowUpRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import PageHeader from '@/components/layout/PageHeader';

interface PerformanceTarget {
  id: number;
  orgId: number;
  type: 'daily' | 'weekly';
  minPct: number;
  maxPct: number;
  createdAt: string;
  updatedAt: string;
}

// Form validation schema
const targetFormSchema = z.object({
  type: z.enum(['daily', 'weekly']),
  minPct: z.coerce.number().min(1, 'Minimum target must be at least 1'),
  maxPct: z.coerce.number().min(1, 'Maximum target must be at least 1'),
}).refine(data => data.maxPct >= data.minPct, {
  message: "Maximum target must be greater than or equal to minimum target",
  path: ["maxPct"]
});

type TargetFormValues = z.infer<typeof targetFormSchema>;

export default function PerformanceTargetsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');
  
  // Fetch performance targets
  const { data: performanceTargets, isLoading, refetch } = useQuery({
    queryKey: ['/api/performance-targets'],
    queryFn: () => 
      apiRequest('GET', '/api/performance-targets')
        .then(res => res.json()),
  });
  
  // Create or update target mutation
  const updateTargetMutation = useMutation({
    mutationFn: (data: TargetFormValues) => 
      apiRequest('POST', '/api/performance-targets', data)
        .then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/performance-targets'] });
      toast({
        title: 'Performance targets updated',
        description: 'The performance targets have been updated successfully',
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update targets',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });
  
  // Create form for daily targets
  const dailyForm = useForm<TargetFormValues>({
    resolver: zodResolver(targetFormSchema),
    defaultValues: {
      type: 'daily',
      minPct: performanceTargets?.daily?.minPct || 5,
      maxPct: performanceTargets?.daily?.maxPct || 10,
    }
  });
  
  // Create form for weekly targets
  const weeklyForm = useForm<TargetFormValues>({
    resolver: zodResolver(targetFormSchema),
    defaultValues: {
      type: 'weekly',
      minPct: performanceTargets?.weekly?.minPct || 25,
      maxPct: performanceTargets?.weekly?.maxPct || 50,
    }
  });
  
  // Update forms when data is loaded
  React.useEffect(() => {
    if (performanceTargets?.daily) {
      dailyForm.reset({
        type: 'daily',
        minPct: performanceTargets.daily.minPct,
        maxPct: performanceTargets.daily.maxPct
      });
    }
    
    if (performanceTargets?.weekly) {
      weeklyForm.reset({
        type: 'weekly',
        minPct: performanceTargets.weekly.minPct,
        maxPct: performanceTargets.weekly.maxPct
      });
    }
  }, [performanceTargets, dailyForm, weeklyForm]);
  
  const onSubmitDaily = (data: TargetFormValues) => {
    updateTargetMutation.mutate(data);
  };
  
  const onSubmitWeekly = (data: TargetFormValues) => {
    updateTargetMutation.mutate(data);
  };
  
  return (
    <div className="container mx-auto p-4">
      <PageHeader 
        title="Performance Targets" 
        description="Configure and manage your team's performance targets"
      />
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6">
          <Tabs defaultValue="daily" value={activeTab} onValueChange={(value) => setActiveTab(value as 'daily' | 'weekly')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="daily">Daily Targets</TabsTrigger>
              <TabsTrigger value="weekly">Weekly Targets</TabsTrigger>
            </TabsList>
            
            <TabsContent value="daily">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2 text-brandTeal" />
                    Daily Performance Targets
                  </CardTitle>
                  <CardDescription>
                    Set minimum and maximum daily targets for dispatch team members
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...dailyForm}>
                    <form onSubmit={dailyForm.handleSubmit(onSubmitDaily)} className="space-y-6">
                      <FormField
                        control={dailyForm.control}
                        name="minPct"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Daily Loads Target</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                min={1}
                              />
                            </FormControl>
                            <FormDescription>
                              Minimum number of loads a dispatcher should book daily
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={dailyForm.control}
                        name="maxPct"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Daily Invoice Amount Target (USD)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                min={1}
                              />
                            </FormControl>
                            <FormDescription>
                              Target USD amount in invoices a dispatcher should generate daily
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit"
                        disabled={updateTargetMutation.isPending || !dailyForm.formState.isDirty}
                        className="w-full"
                      >
                        {updateTargetMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save Daily Targets
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="weekly">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2 text-brandTeal" />
                    Weekly Performance Targets
                  </CardTitle>
                  <CardDescription>
                    Set minimum and maximum weekly targets for dispatch team members
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...weeklyForm}>
                    <form onSubmit={weeklyForm.handleSubmit(onSubmitWeekly)} className="space-y-6">
                      <FormField
                        control={weeklyForm.control}
                        name="minPct"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Weekly Loads Target</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                min={1}
                              />
                            </FormControl>
                            <FormDescription>
                              Minimum number of loads a dispatcher should book weekly
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={weeklyForm.control}
                        name="maxPct"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weekly Invoice Amount Target (USD)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                min={1}
                              />
                            </FormControl>
                            <FormDescription>
                              Target USD amount in invoices a dispatcher should generate weekly
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit"
                        disabled={updateTargetMutation.isPending || !weeklyForm.formState.isDirty}
                        className="w-full"
                      >
                        {updateTargetMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save Weekly Targets
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <Card>
            <CardHeader>
              <CardTitle>Performance Target Information</CardTitle>
              <CardDescription>
                How performance targets work in the dispatch system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-md border border-yellow-100">
                <h3 className="font-medium flex items-center text-yellow-800 mb-2">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Important Information
                </h3>
                <p className="text-sm text-yellow-700">
                  Performance targets are used to track dispatcher productivity and generate color-coded
                  notifications. When dispatchers submit their daily reports, their performance will be
                  compared against these targets.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2 flex items-center">
                  <ArrowUpRight className="h-4 w-4 mr-2 text-red-500" />
                  Red Notifications
                </h3>
                <p className="text-sm text-muted-foreground">
                  When a dispatcher's performance falls below the minimum target, they will receive 
                  a red notification indicating underperformance.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2 flex items-center">
                  <ArrowUpRight className="h-4 w-4 mr-2 text-green-500" />
                  Green Notifications
                </h3>
                <p className="text-sm text-muted-foreground">
                  When a dispatcher achieves or exceeds the maximum target, they will receive 
                  a green notification congratulating them on their high performance.
                </p>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Daily Min</TableHead>
                    <TableHead>Daily Max</TableHead>
                    <TableHead>Weekly Min</TableHead>
                    <TableHead>Weekly Max</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Loads Booked</TableCell>
                    <TableCell>{performanceTargets?.daily?.minPct || '-'}</TableCell>
                    <TableCell>{performanceTargets?.daily?.maxPct || '-'}</TableCell>
                    <TableCell>{performanceTargets?.weekly?.minPct || '-'}</TableCell>
                    <TableCell>{performanceTargets?.weekly?.maxPct || '-'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Invoice Amount (USD)</TableCell>
                    <TableCell>${performanceTargets?.daily?.minPct || '-'}</TableCell>
                    <TableCell>${performanceTargets?.daily?.maxPct || '-'}</TableCell>
                    <TableCell>${performanceTargets?.weekly?.minPct || '-'}</TableCell>
                    <TableCell>${performanceTargets?.weekly?.maxPct || '-'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}