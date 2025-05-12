import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2, Settings2, Info, Save, Archive } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Define the form schema for active lead tiers
const ActiveLeadTierSchema = z.object({
  activeleads: z.coerce.number().min(0, { message: "Must be a positive number" }),
  amount: z.coerce.number().min(0, { message: "Must be a positive number" })
});

// Define the commission policy form schema
const CommissionPolicySchema = z.object({
  name: z.string().min(3, { message: "Name is required (min 3 characters)" }),
  scope: z.enum(["dispatch_sales", "dispatch_agent", "saas_sales"], {
    required_error: "Scope is required",
    invalid_type_error: "Scope must be one of the predefined types",
  }),
  rules: z.object({
    activeLeadTable: z.array(ActiveLeadTierSchema).min(1, { message: "At least one tier is required" }),
    inboundFactor: z.coerce.number().min(0).max(1, { message: "Must be between 0 and 1" }),
    starterSplit: z.coerce.number().min(0).max(1, { message: "Must be between 0 and 1" }),
    closerSplit: z.coerce.number().min(0).max(1, { message: "Must be between 0 and 1" }),
    penaltyThreshold: z.coerce.number().min(0, { message: "Must be a positive number" }),
    penaltyFactor: z.coerce.number().min(0).max(1, { message: "Must be between 0 and 1" }),
    teamLeadBonusAmount: z.coerce.number().min(0, { message: "Must be a positive number" }),
  }),
  isActive: z.boolean().default(false),
  validFrom: z.date().nullable().optional(),
  validTo: z.date().nullable().optional(),
});

type CommissionPolicyFormValues = z.infer<typeof CommissionPolicySchema>;

export default function CommissionPolicyEditor({ policyId }: { policyId?: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("sales");

  // Set up react-hook-form
  const form = useForm<CommissionPolicyFormValues>({
    resolver: zodResolver(CommissionPolicySchema),
    defaultValues: {
      name: "",
      scope: "dispatch_sales",
      rules: {
        activeLeadTable: [{ activeleads: 0, amount: 15000 }],
        inboundFactor: 0.75,
        starterSplit: 0.6,
        closerSplit: 0.4,
        penaltyThreshold: 20,
        penaltyFactor: 0.75,
        teamLeadBonusAmount: 1000,
      },
      isActive: false,
      validFrom: new Date(),
      validTo: null
    }
  });

  // Set up field array for active lead tiers
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rules.activeLeadTable"
  });

  // Fetch existing policy if policyId is provided
  const { data: existingPolicy, isLoading: isLoadingPolicy } = useQuery({
    queryKey: ["/api/commissions/policy", policyId],
    queryFn: async () => {
      if (!policyId) return null;
      const res = await apiRequest("GET", `/api/commissions/policy/${policyId}`);
      if (!res.ok) throw new Error("Failed to fetch policy");
      return res.json();
    },
    enabled: !!policyId
  });

  // Set form values when existing policy is loaded
  useEffect(() => {
    if (existingPolicy) {
      form.reset({
        name: existingPolicy.name,
        scope: existingPolicy.scope,
        rules: {
          activeLeadTable: existingPolicy.rules?.activeLeadTable || [{ activeleads: 0, amount: 15000 }],
          inboundFactor: existingPolicy.rules?.inboundFactor || 0.75,
          starterSplit: existingPolicy.rules?.starterSplit || 0.6,
          closerSplit: existingPolicy.rules?.closerSplit || 0.4,
          penaltyThreshold: existingPolicy.rules?.penaltyThreshold || 20,
          penaltyFactor: existingPolicy.rules?.penaltyFactor || 0.75,
          teamLeadBonusAmount: existingPolicy.rules?.teamLeadBonusAmount || 1000,
        },
        isActive: existingPolicy.isActive || false,
        validFrom: existingPolicy.validFrom ? new Date(existingPolicy.validFrom) : new Date(),
        validTo: existingPolicy.validTo ? new Date(existingPolicy.validTo) : null
      });
      setActiveTab(existingPolicy.scope === "dispatch_sales" ? "sales" : "dispatch");
    }
  }, [existingPolicy, form]);

  // Create commission policy mutation
  const createPolicyMutation = useMutation({
    mutationFn: async (data: CommissionPolicyFormValues) => {
      const res = await apiRequest("POST", "/api/commissions/policy", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create policy");
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate all the related queries to refresh policy data
      queryClient.invalidateQueries({ queryKey: ['/api/commissions/policy'] });
      // Also invalidate monthly commission data since it may depend on active policies
      queryClient.invalidateQueries({ queryKey: ['/api/commissions/monthly'] });

      toast({
        title: "Policy created",
        description: "Commission policy has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create policy",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update commission policy mutation
  const updatePolicyMutation = useMutation({
    mutationFn: async (data: CommissionPolicyFormValues) => {
      const res = await apiRequest("PUT", `/api/commissions/policy/${policyId}`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update policy");
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate all the related queries to refresh policy data
      queryClient.invalidateQueries({ queryKey: ['/api/commissions/policy'] });
      queryClient.invalidateQueries({ queryKey: ['/api/commissions/policy', policyId] });
      // Also invalidate monthly commission data since it may depend on active policies
      queryClient.invalidateQueries({ queryKey: ['/api/commissions/monthly'] });

      toast({
        title: "Policy updated",
        description: "Commission policy has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update policy",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Archive commission policy mutation
  const archivePolicyMutation = useMutation({
    mutationFn: async () => {
      if (!policyId) throw new Error("No policy ID provided");
      const res = await apiRequest("PATCH", `/api/commissions/policy/${policyId}/archive`, {});
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to archive policy");
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate all the related queries to refresh policy data
      queryClient.invalidateQueries({ queryKey: ['/api/commissions/policy'] });
      queryClient.invalidateQueries({ queryKey: ['/api/commissions/policy', policyId] });
      // Also invalidate monthly commission data since it may depend on active policies
      queryClient.invalidateQueries({ queryKey: ['/api/commissions/monthly'] });

      toast({
        title: "Policy archived",
        description: "Commission policy has been archived successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to archive policy",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: CommissionPolicyFormValues) => {
    // Ensure starter and closer splits add up to 1
    if (Math.abs(values.rules.starterSplit + values.rules.closerSplit - 1) > 0.01) {
      toast({
        title: "Invalid commission splits",
        description: "Starter and closer splits must add up to 100%",
        variant: "destructive",
      });
      return;
    }

    // Save form values
    if (policyId) {
      updatePolicyMutation.mutate(values);
    } else {
      createPolicyMutation.mutate(values);
    }
  };

  // Add a new tier to the active lead table
  const addTier = () => {
    const lastTier = fields[fields.length - 1];
    const newActiveLeadsValue = lastTier ? lastTier.activeleads + 5 : 0;
    const newAmountValue = lastTier ? lastTier.amount + 5000 : 15000;

    append({
      activeleads: newActiveLeadsValue,
      amount: newAmountValue
    });
  };

  if (isLoadingPolicy) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{policyId ? "Edit Commission Policy" : "Create Commission Policy"}</CardTitle>
            <CardDescription>
              Configure commission structure and calculation rules
            </CardDescription>
          </div>
          <Settings2 className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="max-h-[calc(100vh-12rem)] overflow-y-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-5xl mx-auto">
            <Tabs value={activeTab} onValueChange={(value) => {
              setActiveTab(value);
              form.setValue("type", value);
            }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sales">Sales Commission</TabsTrigger>
                <TabsTrigger value="dispatch">Dispatch Commission</TabsTrigger>
              </TabsList>
              <TabsContent value="sales" className="pt-4">
                <div className="space-y-4">
                  {/* Active Lead Tiers */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium">Active Lead Tiers</h3>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addTier}
                        className="bg-[#025E73] text-white hover:bg-[#011F26] transition-all duration-200"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Tier
                      </Button>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md">
                      <div className="grid grid-cols-12 gap-4 font-medium text-sm mb-2 text-muted-foreground">
                        <div className="col-span-5">Active Leads (≥)</div>
                        <div className="col-span-5">Commission Amount (PKR)</div>
                        <div className="col-span-2"></div>
                      </div>
                      {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-12 sm:gap-4 gap-2 mb-3">
                          <div className="col-span-12 sm:col-span-5">
                            <FormField
                              control={form.control}
                              name={`rules.activeLeadTable.${index}.activeleads`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input type="number" {...field} min={0} className="w-full" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="col-span-12 sm:col-span-5">
                            <FormField
                              control={form.control}
                              name={`rules.activeLeadTable.${index}.amount`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input type="number" {...field} min={0} className="w-full" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="col-span-2 flex items-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={fields.length <= 1}
                              onClick={() => remove(index)}
                              className="h-9 w-9 p-0"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Role-based Commission Splits */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Role-based Commission Splits</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                      <FormField
                        control={form.control}
                        name="rules.starterSplit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Starter Split ({Math.round(field.value * 100)}%)</FormLabel>
                            <FormControl>
                              <Slider
                                value={[field.value * 100]}
                                min={0}
                                max={100}
                                step={5}
                                onValueChange={(value) => {
                                  field.onChange(value[0] / 100);
                                  // Auto-update closer split to keep sum at 100%
                                  form.setValue("rules.closerSplit", 1 - (value[0] / 100));
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Percentage of commission for lead generator
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="rules.closerSplit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Closer Split ({Math.round(field.value * 100)}%)</FormLabel>
                            <FormControl>
                              <Slider
                                value={[field.value * 100]}
                                min={0}
                                max={100}
                                step={5}
                                onValueChange={(value) => {
                                  field.onChange(value[0] / 100);
                                  // Auto-update starter split to keep sum at 100%
                                  form.setValue("rules.starterSplit", 1 - (value[0] / 100));
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Percentage of commission for deal closer
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Adjustment Factors */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Adjustment Factors</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="rules.inboundFactor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Inbound Lead Factor ({Math.round(field.value * 100)}%)</FormLabel>
                            <FormControl>
                              <Slider
                                value={[field.value * 100]}
                                min={0}
                                max={100}
                                step={5}
                                onValueChange={(value) => field.onChange(value[0] / 100)}
                              />
                            </FormControl>
                            <FormDescription>
                              Commission reduction for inbound leads
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="rules.penaltyFactor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>No Active Leads Penalty ({Math.round(field.value * 100)}%)</FormLabel>
                            <FormControl>
                              <Slider
                                value={[field.value * 100]}
                                min={0}
                                max={100}
                                step={5}
                                onValueChange={(value) => field.onChange(value[0] / 100)}
                              />
                            </FormControl>
                            <FormDescription>
                              Commission reduction if no active leads
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Additional Settings */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Additional Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="rules.penaltyThreshold"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Call Attempts Threshold</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>
                              Minimum call attempts before penalties apply
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="rules.teamLeadBonusAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Team Lead Bonus (PKR)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>
                              Additional bonus for team leads
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Policy Status */}
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active Policy</FormLabel>
                          <FormDescription>
                            Make this the active commission policy for calculations
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              <TabsContent value="dispatch" className="pt-4">
                <div className="p-6 text-center text-muted-foreground">
                  <p>Dispatch commission structure follows similar patterns</p>
                  <p>but is calculated based on different metrics.</p>
                  <p>Please switch to Sales tab to configure.</p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between items-center">
              {/* Archive Button - only show for existing policies that are active */}
              {policyId && existingPolicy?.isActive && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => archivePolicyMutation.mutate()}
                  disabled={archivePolicyMutation.isPending}
                >
                  {archivePolicyMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Archiving...
                    </>
                  ) : (
                    <>
                      <Archive className="mr-2 h-4 w-4" />
                      Archive Policy
                    </>
                  )}
                </Button>
              )}

              {/* Save Button */}
              <Button
                type="submit"
                disabled={createPolicyMutation.isPending || updatePolicyMutation.isPending}
                className={policyId && existingPolicy?.isActive ? "" : "ml-auto"}
              >
                {(createPolicyMutation.isPending || updatePolicyMutation.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {policyId ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {policyId ? "Update Policy" : "Create Policy"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}