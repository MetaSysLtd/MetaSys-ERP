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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

const taskSchema = z.object({
  loadNumbers: z.string().min(3, "Please enter at least one load number"),
  clientFollowups: z.number().min(0, "Must be a positive number"),
  newLeads: z.number().min(0, "Must be a positive number"),
  notes: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface DailyTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: number;
}

export function DailyTaskModal({ isOpen, onClose, taskId }: DailyTaskModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      loadNumbers: "",
      clientFollowups: 0,
      newLeads: 0,
      notes: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (values: TaskFormValues) => {
      const response = await apiRequest(
        "POST", 
        `/api/dispatch/tasks/${taskId}/submit`, 
        values
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dispatch/tasks"] });
      toast({
        description: (
          <ToastAlert color="green">
            Daily task submitted successfully
          </ToastAlert>
        ),
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        description: (
          <ToastAlert color="red">
            Failed to submit task: {error.message}
          </ToastAlert>
        ),
      });
    },
  });

  const onSubmit = (values: TaskFormValues) => {
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
          <DialogTitle className="text-xl font-bold">Daily Task Submission</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="loadNumbers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Load Numbers (comma separated)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter load numbers (e.g. L-1234, L-5678)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clientFollowups"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Follow-ups</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter number of client follow-ups"
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
              name="newLeads"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Leads</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter number of new leads"
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any notes (optional)"
                      className="resize-none"
                      {...field}
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
                "Submit Daily Task"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}