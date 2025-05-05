import { useState, useEffect } from "react";
import { useAnimationContext } from "@/contexts/AnimationContext";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Check, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { AnimationSettings } from "./animation-settings";

export function AnimationSettingsCompact() {
  const { 
    animationsEnabled, 
    toggleAnimations,
    isSaving
  } = useAnimationContext();

  const [open, setOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success">("idle");

  // Update save status when isSaving changes
  useEffect(() => {
    if (isSaving) {
      setSaveStatus("saving");
    } else if (saveStatus === "saving") {
      setSaveStatus("success");
      const timeout = setTimeout(() => setSaveStatus("idle"), 1500);
      return () => clearTimeout(timeout);
    }
  }, [isSaving, saveStatus]);

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center gap-1">
        <AnimatePresence mode="wait">
          {saveStatus === "saving" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, width: 0 }}
              animate={{ opacity: 1, scale: 1, width: 'auto' }}
              exit={{ opacity: 0, scale: 0.8, width: 0 }}
              className="text-primary"
            >
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            </motion.div>
          )}
          {saveStatus === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, width: 0 }}
              animate={{ opacity: 1, scale: 1, width: 'auto' }}
              exit={{ opacity: 0, scale: 0.8, width: 0 }}
              className="text-green-600 dark:text-green-500"
            >
              <Check className="h-3 w-3 mr-1" />
            </motion.div>
          )}
        </AnimatePresence>
        <Switch 
          checked={animationsEnabled} 
          onCheckedChange={toggleAnimations}
          aria-label="Toggle animations"
          className="data-[state=checked]:bg-primary"
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
            <Settings2 className="h-4 w-4" />
            <span className="sr-only">Animation Settings</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Animation Settings</DialogTitle>
            <DialogDescription>
              Customize animation behaviors across the MetaSys ERP platform
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            <AnimationSettings />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}