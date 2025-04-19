import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';

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
      const res = await fetch(`/api/messages/conversations/${id}/read`, {
        method: 'POST',
      });
      
      if (res.ok) {
        setConversations(prev => 
          prev.map(conversation => 
            conversation.id === id 
              ? { ...conversation, unreadCount: 0 } 
              : conversation
          )
        );
      }
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  // Send a message
  const sendMessage = async (conversationId: string, content: string) => {
    if (!content.trim()) return;
    
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          content,
        }),
      });
      
      if (res.ok) {
        // Optimistically update the UI
        const message = await res.json();
        
        setConversations(prev => 
          prev.map(conversation => 
            conversation.id === conversationId
              ? { 
                  ...conversation, 
                  lastMessage: message,
                }
              : conversation
          )
        );
        
        // Refetch to ensure data consistency
        refetch();
      }
    } catch (error) {
      console.error('Error sending message:', error);
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
  if (context === null) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
}