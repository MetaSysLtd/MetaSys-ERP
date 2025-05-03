import { useState } from "react";
import { BugReportForm } from "./BugReportForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BugIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BugReportDialogProps {
  trigger?: React.ReactNode;
  className?: string;
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  initialModule?: string;
  initialPage?: string;
}

export function BugReportDialog({
  trigger,
  className,
  buttonVariant = "outline",
  buttonSize = "default",
  initialModule,
  initialPage,
}: BugReportDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant={buttonVariant}
            size={buttonSize}
            className={cn("gap-2", className)}
          >
            <BugIcon className="h-4 w-4" />
            Report Bug
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Report a Bug</DialogTitle>
          <DialogDescription>
            Help us improve by reporting any issues you encounter.
          </DialogDescription>
        </DialogHeader>
        <BugReportForm 
          onSuccess={() => setOpen(false)} 
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}