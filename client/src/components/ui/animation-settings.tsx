import React from 'react';
import { useAnimation } from '@/contexts/AnimationContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AnimationSettings() {
  const {
    animationsEnabled,
    toggleAnimations,
    transitionSpeed,
    setTransitionSpeed,
    reducedMotion,
  } = useAnimation();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          aria-label="Animation Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Animation Settings</h4>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="animations-toggle" className="flex flex-col gap-1">
              <span>Enable Animations</span>
              <span className="text-xs text-muted-foreground">
                Turn animations on or off
              </span>
            </Label>
            <Switch
              id="animations-toggle"
              checked={animationsEnabled}
              onCheckedChange={toggleAnimations}
              disabled={reducedMotion}
            />
          </div>
          
          {reducedMotion && (
            <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              Your system is set to reduce motion. Animations will be limited to
              respect your preferences.
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <Label htmlFor="transition-speed" className="flex flex-col gap-1">
              <span>Animation Speed</span>
              <span className="text-xs text-muted-foreground">
                How fast animations should play
              </span>
            </Label>
            <Select
              value={transitionSpeed}
              onValueChange={(value) =>
                setTransitionSpeed(value as 'fast' | 'normal' | 'slow')
              }
              disabled={!animationsEnabled || reducedMotion}
            >
              <SelectTrigger id="transition-speed" className="w-24">
                <SelectValue placeholder="Select speed" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fast">Fast</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="slow">Slow</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}