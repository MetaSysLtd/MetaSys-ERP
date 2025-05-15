import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export interface Participant {
  id: number;
  name: string;
  avatar?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: number;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: Participant[];
  lastMessage?: Message;
  unreadCount: number;
}

interface MessageContextType {
  conversations: Conversation[];
  totalUnreadCount: number;
  markConversationAsRead: (id: string) => void;
  sendMessage: (conversationId: string, content: string) => void;
  isLoading: boolean;
}

const MessageContext = createContext<MessageContextType | null>(null);

export function MessageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Fetch conversations from API
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/messages/conversations'],
    queryFn: async () => {
      if (!user) return { conversations: [] };
      const res = await fetch('/api/messages/conversations');
      if (!res.ok) throw new Error('Failed to fetch conversations');
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Update conversations when data changes
  useEffect(() => {
    if (data?.conversations) {
      setConversations(data.conversations);
    }
  }, [data]);

  // Calculate total unread count
  const totalUnreadCount = conversations.reduce(
    (total, conversation) => total + conversation.unreadCount,
    0
  );

  // Mark a conversation as read
  const markConversationAsRead = async (id: string) => {
    try {
      const res = await apiRequest('PATCH', `/api/messages/conversations/${id}/read`);
      if (!res.ok) throw new Error('Failed to mark conversation as read');
      
      // Update local state
      setConversations(prev => 
        prev.map(conversation => 
          conversation.id === id 
            ? { ...conversation, unreadCount: 0 } 
            : conversation
        )
      );
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark conversation as read. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Send a message
  const sendMessage = async (conversationId: string, content: string) => {
    try {
      const res = await apiRequest('POST', `/api/messages`, { 
        conversationId, 
        content
      });
      
      if (!res.ok) throw new Error('Failed to send message');
      
      const newMessage = await res.json();
      
      // Update local state
      setConversations(prev => 
        prev.map(conversation => 
          conversation.id === conversationId 
            ? { 
                ...conversation, 
                lastMessage: {
                  id: newMessage.id,
                  conversationId,
                  senderId: user?.id || 0,
                  content,
                  timestamp: new Date().toISOString(),
                  read: true
                }
              } 
            : conversation
        )
      );

      refetch(); // Refetch to get updated conversation data
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <MessageContext.Provider
      value={{
        conversations,
        totalUnreadCount,
        markConversationAsRead,
        sendMessage,
        isLoading,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
}