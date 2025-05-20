
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message } from '@/types/chat';

export function useChatState() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Function to update messages
  const updateMessages = (newMessages: Message[]) => {
    setMessages(newMessages);
  };

  // Function to add a message to the chat
  const addMessage = (message: Message) => {
    setMessages(prevMessages => [...prevMessages, message]);
    return [...messages, message];
  };

  // Function to create a user message
  const createUserMessage = (content: string, autoSummarize = false, queryType?: string) => {
    return {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date(),
      autoSummarize,
      queryType
    } as Message;
  };

  // Function to create an AI message
  const createAIMessage = (content: string, model?: string) => {
    return {
      id: uuidv4(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      model: model || 'groq-llama3-70b' // Default model name
    } as Message;
  };

  return {
    messages,
    setMessages,
    isLoading,
    setIsLoading,
    conversationId,
    setConversationId,
    updateMessages,
    addMessage,
    createUserMessage,
    createAIMessage
  };
}
