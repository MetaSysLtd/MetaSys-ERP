
import { Button } from "./button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { BugReportForm } from "../bugs/BugReportForm";
import { ScrollArea } from "./scroll-area";
import { HelpCircle, Book, Bug, MessageCircle } from "lucide-react";

export function HelpCenterDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Help Center</DialogTitle>
          <DialogDescription>
            Find help documentation, report bugs, or get support
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="docs" className="w-full h-full">
          <TabsList>
            <TabsTrigger value="docs">
              <Book className="h-4 w-4 mr-2" />
              Documentation
            </TabsTrigger>
            <TabsTrigger value="bugs">
              <Bug className="h-4 w-4 mr-2" />
              Report Bug
            </TabsTrigger>
            <TabsTrigger value="support">
              <MessageCircle className="h-4 w-4 mr-2" />
              Support
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="docs" className="h-[calc(100%-3rem)]">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6">
                {/* Documentation content */}
                <section>
                  <h3 className="text-lg font-semibold mb-2">Getting Started</h3>
                  <p className="text-muted-foreground">
                    Welcome to MetaSys ERP. This guide will help you understand the basics of using the platform.
                  </p>
                </section>
                
                <section>
                  <h3 className="text-lg font-semibold mb-2">Key Features</h3>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Real-time dashboard updates</li>
                    <li>Task management and tracking</li>
                    <li>Integrated calendar with automated syncing</li>
                    <li>Permission-based access control</li>
                  </ul>
                </section>
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="bugs" className="h-[calc(100%-3rem)]">
            <ScrollArea className="h-full">
              <BugReportForm onSubmitSuccess={() => onOpenChange(false)} />
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="support" className="h-[calc(100%-3rem)]">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact Support</h3>
                <p className="text-muted-foreground">
                  Need help? Our support team is available to assist you.
                </p>
                <Button className="bg-[#025E73] hover:bg-[#011F26] text-white">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Start Chat
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
