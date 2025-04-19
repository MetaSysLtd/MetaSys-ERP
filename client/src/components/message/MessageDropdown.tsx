import React from 'react';
import { useNavigate } from 'wouter/use-location';
import { Button } from '@/components/ui/button';
import { useMessages, Conversation } from '@/contexts/MessageContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { NotificationBadge } from '@/components/ui/notification-badge';
import { MessageSquare, CheckIcon, Send } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface MessageDropdownProps {
  className?: string;
}

export function MessageDropdown({ className }: MessageDropdownProps) {
  const { conversations, totalUnreadCount, markConversationAsRead, isLoading } = useMessages();
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleConversationClick = (conversation: Conversation) => {
    if (conversation.unreadCount > 0) {
      markConversationAsRead(conversation.id);
    }
    
    navigate(`/messages/${conversation.id}`);
    setOpen(false);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.length > 0 ? conversation.participants[0] : null;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("relative", className)}>
          <MessageSquare className="h-5 w-5" />
          <NotificationBadge 
            count={totalUnreadCount} 
            className="absolute -top-1 -right-1"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h3 className="font-medium">Messages</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/messages/new')}
            className="h-8 text-xs"
          >
            <Send className="mr-1 h-3.5 w-3.5" />
            New Message
          </Button>
        </div>
        
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex justify-center items-center h-[300px]">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : conversations.length > 0 ? (
            <div className="py-1">
              {conversations.map((conversation) => {
                const otherParticipant = getOtherParticipant(conversation);
                
                return (
                  <div
                    key={conversation.id}
                    className={cn(
                      "flex gap-3 px-4 py-2 hover:bg-accent cursor-pointer transition-colors",
                      conversation.unreadCount > 0 && "bg-muted/50"
                    )}
                    onClick={() => handleConversationClick(conversation)}
                  >
                    <div className="shrink-0">
                      <Avatar className="h-9 w-9">
                        {otherParticipant?.avatar ? (
                          <AvatarImage src={otherParticipant.avatar} alt={otherParticipant.name} />
                        ) : (
                          <AvatarFallback>{otherParticipant ? getInitials(otherParticipant.name) : '?'}</AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                    <div className="space-y-1 flex-1 overflow-hidden">
                      <div className="flex justify-between items-start">
                        <p className={cn(
                          "text-sm",
                          conversation.unreadCount > 0 && "font-medium"
                        )}>
                          {otherParticipant ? otherParticipant.name : 'Unknown'}
                        </p>
                        {conversation.lastMessage && (
                          <small className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                            {formatDistanceToNow(new Date(conversation.lastMessage.timestamp), { addSuffix: true })}
                          </small>
                        )}
                      </div>
                      {conversation.lastMessage && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                    {conversation.unreadCount > 0 && (
                      <div className="shrink-0 self-center">
                        <NotificationBadge count={conversation.unreadCount} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex justify-center items-center h-[300px] text-muted-foreground text-sm">
              No messages
            </div>
          )}
        </ScrollArea>
        
        <div className="border-t p-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-center text-xs"
            onClick={() => {
              navigate('/messages');
              setOpen(false);
            }}
          >
            See all messages
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}