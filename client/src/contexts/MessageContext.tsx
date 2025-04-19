import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';

export interface Message {
  id: string;
  sender: {
    id: number;
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
  read: boolean;
  conversation_id: string;
}

export interface Conversation {
  id: string;
  participants: {
    id: number;
    name: string;
    avatar?: string;
  }[];
  lastMessage?: Message;
  unreadCount: number;
}

interface MessageContextType {
  conversations: Conversation[];
  totalUnreadCount: number;
  markConversationAsRead: (id: string) => void;
  markMessageAsRead: (conversationId: string, messageId: string) => void;
  isLoading: boolean;
  fetchMessages: () => void;
}

const MessageContext = createContext<MessageContextType | null>(null);

export function MessageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Fetch messages from API
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/messages/conversations'],
    queryFn: async () => {
      if (!user) return { conversations: [] };
      const res = await fetch('/api/messages/conversations');
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
  });

  // Update conversations when data changes
  useEffect(() => {
    if (data?.conversations) {
      setConversations(data.conversations);
    }
  }, [data]);

  // Calculate total unread count
  const totalUnreadCount = conversations.reduce((acc, convo) => acc + convo.unreadCount, 0);

  // Mark an entire conversation as read
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

  // Mark a specific message as read
  const markMessageAsRead = async (conversationId: string, messageId: string) => {
    try {
      const res = await fetch(`/api/messages/${messageId}/read`, {
        method: 'POST',
      });
      
      if (res.ok) {
        setConversations(prev => 
          prev.map(conversation => {
            if (conversation.id === conversationId) {
              const updatedUnreadCount = Math.max(0, conversation.unreadCount - 1);
              return { ...conversation, unreadCount: updatedUnreadCount };
            }
            return conversation;
          })
        );
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  return (
    <MessageContext.Provider
      value={{
        conversations,
        totalUnreadCount,
        markConversationAsRead,
        markMessageAsRead,
        isLoading,
        fetchMessages: refetch,
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