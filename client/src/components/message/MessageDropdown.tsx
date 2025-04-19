import { useState, useRef, useEffect } from "react";
import { MessageSquare, ChevronRight, Send, Dot } from "lucide-react";
import { format } from "date-fns";
import { useMessages } from "@/contexts/MessageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { getInitials } from "@/lib/utils";

export function MessageDropdown() {
  const { conversations, totalUnreadCount, markConversationAsRead, sendMessage, isLoading } =
    useMessages();
  const [open, setOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref]);

  // Handle selecting a conversation
  const handleSelectConversation = (id: string) => {
    setSelectedConversation(id);
    markConversationAsRead(id);
  };

  // Handle sending a message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedConversation && messageText.trim()) {
      sendMessage(selectedConversation, messageText);
      setMessageText("");
    }
  };

  // Go back to conversation list
  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  // Find selected conversation
  const currentConversation = selectedConversation 
    ? conversations.find(c => c.id === selectedConversation) 
    : null;

  return (
    <div ref={ref}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-full"
          >
            <MessageSquare className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            {totalUnreadCount > 0 && (
              <NotificationBadge
                count={totalUnreadCount}
                className="absolute -top-1 -right-1"
              />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-80 md:w-96"
          forceMount
        >
          {!selectedConversation ? (
            // Conversation list view
            <>
              <div className="flex items-center justify-between p-4">
                <DropdownMenuLabel className="text-base font-semibold">
                  Messages
                </DropdownMenuLabel>
              </div>
              <DropdownMenuSeparator />
              <ScrollArea className="h-[calc(80vh-8rem)] md:h-[480px]">
                <DropdownMenuGroup className="p-2">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-md"
                      >
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                      </div>
                    ))
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                        <MessageSquare className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                      </div>
                      <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                        No messages
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Your messages will appear here.
                      </p>
                    </div>
                  ) : (
                    conversations.map((conversation) => {
                      const otherParticipants = conversation.participants.filter(
                        (p) => p.id !== 1 // Assuming current user id is 1
                      );
                      const otherParticipant = otherParticipants[0];
                      
                      return (
                        <DropdownMenuItem
                          key={conversation.id}
                          className={`flex items-start gap-3 p-3 rounded-md cursor-pointer ${
                            conversation.unreadCount > 0
                              ? "bg-blue-50 dark:bg-blue-900/20"
                              : ""
                          }`}
                          onClick={() => handleSelectConversation(conversation.id)}
                        >
                          {/* User avatar */}
                          {otherParticipant.avatar ? (
                            <img
                              src={otherParticipant.avatar}
                              alt={otherParticipant.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="bg-[#2170dd] rounded-full h-10 w-10 flex items-center justify-center text-sm font-medium text-white">
                              {getInitials(otherParticipant.name, '')}
                            </div>
                          )}
                          
                          {/* Message content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium truncate">
                                {otherParticipant.name}
                              </p>
                              {conversation.unreadCount > 0 && (
                                <NotificationBadge
                                  count={conversation.unreadCount}
                                  className="ml-auto"
                                />
                              )}
                            </div>
                            {conversation.lastMessage && (
                              <>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                  {conversation.lastMessage.content}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  {format(
                                    new Date(conversation.lastMessage.timestamp),
                                    "MMM d, h:mm a"
                                  )}
                                </p>
                              </>
                            )}
                          </div>
                          
                          <ChevronRight className="h-4 w-4 text-gray-400 self-center" />
                        </DropdownMenuItem>
                      );
                    })
                  )}
                </DropdownMenuGroup>
              </ScrollArea>
              <DropdownMenuSeparator />
              <Link href="/messages" className="block">
                <Button
                  variant="ghost"
                  className="w-full justify-center py-2 text-[#2170dd] hover:text-[#1861c9]"
                  onClick={() => setOpen(false)}
                >
                  View all messages
                </Button>
              </Link>
            </>
          ) : (
            // Conversation detail view
            <>
              <div className="flex items-center p-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToList}
                  className="mr-2 -ml-2"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                </Button>
                
                <DropdownMenuLabel className="text-base font-semibold flex-1">
                  {currentConversation && currentConversation.participants.find(p => p.id !== 1)?.name}
                </DropdownMenuLabel>
              </div>
              <DropdownMenuSeparator />
              <ScrollArea className="h-80">
                <div className="p-3 space-y-4">
                  {/* Message thread would go here */}
                  <div className="text-center text-sm text-gray-500">
                    View full conversation history in the messages page
                  </div>
                </div>
              </ScrollArea>
              <DropdownMenuSeparator />
              <form onSubmit={handleSendMessage} className="p-3 flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!messageText.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}