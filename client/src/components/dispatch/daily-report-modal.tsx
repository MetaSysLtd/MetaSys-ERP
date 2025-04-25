import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToastAlert } from "@/components/ui/toast-alert";
import { Loader2 } from "lucide-react";

const reportSchema = z.object({
  loadsBooked: z.number().min(0, "Must be a positive number"),
  invoiceUsd: z.number().min(0, "Must be a positive number"),
  activeLeads: z.number().min(0, "Must be a positive number"),
  pendingInvoiceUsd: z.number().min(0, "Must be a positive number"),
});

type ReportFormValues = z.infer<typeof reportSchema>;

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: number;
}

export function DailyReportModal({ isOpen, onClose, reportId }: DailyReportModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      loadsBooked: 0,
      invoiceUsd: 0,
      activeLeads: 0,
      pendingInvoiceUsd: 0,
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (values: ReportFormValues) => {
      const response = await apiRequest(
        "POST",
        `/api/dispatch/reports/${reportId}/submit`,
        values
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dispatch/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dispatch/performance"] });
      toast({
        description: (
          <ToastAlert color="green">
            Daily report submitted successfully
          </ToastAlert>
        ),
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        description: (
          <ToastAlert color="red">
            Failed to submit report: {error.message}
          </ToastAlert>
        ),
      });
    },
  });

  const onSubmit = (values: ReportFormValues) => {
    submitMutation.mutate(values);
  };

  // Prevent closing the modal if it's open and the form hasn't been submitted
  const handleClose = () => {
    if (submitMutation.isPending) return;
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]" onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Daily Report Submission</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="loadsBooked"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loads Booked Today</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter number of loads booked"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="invoiceUsd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Invoice Value (USD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter total invoice amount"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="activeLeads"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Active Leads</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter number of active leads"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pendingInvoiceUsd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pending Invoice Value (USD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter pending invoice amount"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-[#457B9D] hover:bg-[#2EC4B6] text-white rounded-md transition-all duration-200 mt-6"
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Daily Report"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}