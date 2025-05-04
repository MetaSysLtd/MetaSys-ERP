import { useState } from "react";
import { useAnimationContext } from "@/contexts/AnimationContext";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
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
    toggleAnimations 
  } = useAnimationContext();
  
  const [open, setOpen] = useState(false);
  
  return (
    <div className="flex items-center space-x-2">
      <Switch 
        checked={animationsEnabled} 
        onCheckedChange={toggleAnimations}
        aria-label="Toggle animations"
        className="data-[state=checked]:bg-primary"
      />
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
            <Sparkles className="h-4 w-4" />
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
          <AnimationSettings />
        </DialogContent>
      </Dialog>
    </div>
  );
}