
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Calendar } from "./calendar";
import { ScrollArea } from "./scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "./badge";

export function CalendarDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { role } = useAuth();

  // Example events - replace with actual data from your backend
  const events = [
    {
      date: new Date(),
      title: role?.department === "sales" ? "Lead Follow-up" : "Carrier Check-in",
      type: "task"
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Calendar</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
          />
          
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              <h3 className="font-medium">Events for {date?.toLocaleDateString()}</h3>
              {events.map((event, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-md border">
                  <Badge variant="outline">{event.type}</Badge>
                  <span>{event.title}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
