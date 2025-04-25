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

const taskSchema = z.object({
  carriersUpdated: z.number().min(0, "Must be a positive number"),
  deadLeadsArchived: z.number().min(0, "Must be a positive number"),
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
      carriersUpdated: 0,
      deadLeadsArchived: 0,
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="carriersUpdated"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carriers Updated Today</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter number of carriers updated"
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
              name="deadLeadsArchived"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dead Leads Archived</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter number of dead leads archived"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-[#457B9D] hover:bg-[#2EC4B6] text-white rounded-md transition-all duration-200"
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