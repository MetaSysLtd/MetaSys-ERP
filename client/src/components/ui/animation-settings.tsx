import { useState } from "react";
import { useAnimationContext } from "@/contexts/AnimationContext";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

export function AnimationSettings() {
  const { 
    animationsEnabled, 
    toggleAnimations, 
    transitionSpeed, 
    setTransitionSpeed,
    pageTransition,
    setPageTransition
  } = useAnimationContext();
  
  const [selectedDemo, setSelectedDemo] = useState<"page" | "component">("page");
  const [demoActive, setDemoActive] = useState(false);
  
  // Function to show animation demo
  const triggerDemo = () => {
    setDemoActive(true);
    setTimeout(() => setDemoActive(false), 1500);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Animation Settings</span>
          <Switch 
            checked={animationsEnabled} 
            onCheckedChange={toggleAnimations}
            aria-label="Toggle animations"
          />
        </CardTitle>
        <CardDescription>
          Customize animation behaviors across the MetaSys ERP platform
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {animationsEnabled ? (
          <>
            <div className="space-y-2">
              <Label className="text-base">Transition Speed</Label>
              <RadioGroup 
                defaultValue={transitionSpeed} 
                onValueChange={(val) => setTransitionSpeed(val as "fast" | "normal" | "slow")}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fast" id="speed-fast" />
                  <Label htmlFor="speed-fast">Fast</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="normal" id="speed-normal" />
                  <Label htmlFor="speed-normal">Normal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="slow" id="speed-slow" />
                  <Label htmlFor="speed-slow">Slow</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label className="text-base">Page Transition Effect</Label>
              <RadioGroup 
                defaultValue={pageTransition} 
                onValueChange={(val) => setPageTransition(val as "fade" | "slide" | "zoom" | "gradient")}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fade" id="transition-fade" />
                  <Label htmlFor="transition-fade">Fade</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="slide" id="transition-slide" />
                  <Label htmlFor="transition-slide">Slide</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="zoom" id="transition-zoom" />
                  <Label htmlFor="transition-zoom">Zoom</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="gradient" id="transition-gradient" />
                  <Label htmlFor="transition-gradient">Gradient (Brand Colors)</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Label className="text-base mb-3 block">Preview Animation</Label>
              
              <Tabs defaultValue={selectedDemo} onValueChange={(v) => setSelectedDemo(v as "page" | "component")}>
                <TabsList className="mb-4">
                  <TabsTrigger value="page">Page Transition</TabsTrigger>
                  <TabsTrigger value="component">Component Animation</TabsTrigger>
                </TabsList>
                
                <TabsContent value="page" className="relative min-h-[200px] border rounded-md p-4">
                  <div className="flex flex-col items-center justify-center h-full">
                    {selectedDemo === "page" && (
                      <>
                        {/* Demo container */}
                        <div className="w-full h-[180px] relative overflow-hidden rounded border border-gray-200 dark:border-gray-700">
                          {/* Animation demo */}
                          <AnimatePresence mode="wait">
                            {!demoActive && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0 flex items-center justify-center p-4"
                              >
                                <div className="text-center space-y-2">
                                  <h3 className="text-lg font-medium">Dashboard</h3>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    This demonstrates a page transition effect
                                  </p>
                                </div>
                              </motion.div>
                            )}
                            {demoActive && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800 p-4"
                              >
                                <div className="text-center space-y-2">
                                  <h3 className="text-lg font-medium">Reports</h3>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Page content has changed
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          
                          {/* Overlay for gradient demo */}
                          {pageTransition === "gradient" && demoActive && (
                            <motion.div
                              initial={{ opacity: 1 }}
                              animate={{ opacity: 0 }}
                              transition={{ duration: 0.6 }}
                              className="absolute inset-0 pointer-events-none z-50"
                              style={{
                                background: 'linear-gradient(135deg, rgba(2,94,115,0.3) 0%, rgba(242,167,27,0.3) 50%, rgba(65,39,84,0.3) 100%)',
                                backdropFilter: 'blur(6px)',
                              }}
                            />
                          )}
                        </div>
                        
                        <Button onClick={triggerDemo} variant="outline" className="mt-4">
                          Preview Transition
                        </Button>
                      </>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="component" className="min-h-[200px] border rounded-md p-4">
                  <div className="flex flex-col items-center justify-center h-full">
                    {selectedDemo === "component" && (
                      <>
                        <div className="text-center mb-4">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Click to see component animation
                          </p>
                        </div>
                        
                        <motion.div
                          animate={demoActive ? { scale: 1.05, y: -5 } : { scale: 1, y: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="p-4 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer"
                          onClick={triggerDemo}
                        >
                          <span className="text-base font-medium">Interactive Component</span>
                        </motion.div>
                      </>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-amber-500 dark:text-amber-400 text-5xl mb-4">✨</div>
            <h3 className="text-lg font-medium mb-2">Animations Disabled</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              Animations are currently disabled. Toggle the switch above to enable smooth transitions 
              and interactive elements throughout the platform.
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="border-t pt-4 flex justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Animation preferences are saved automatically and synced across devices
        </p>
      </CardFooter>
    </Card>
  );
}