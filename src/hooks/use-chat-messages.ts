
import { useState, useCallback } from 'react';
import { Message } from '../types/chat';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from './use-toast';

// Import our newly separated hooks
import { useChatState } from './chat/use-chat-state';
import { useConversationPersistence } from './chat/use-conversation-persistence';
import { useCorrections } from './chat/use-corrections';
import { useAutoSummary } from './chat/use-auto-summary';
import { useMessageSending } from './chat/use-message-sending';

export function useChatMessages() {
  const { 
    messages, 
    setMessages, 
    isLoading, 
    setIsLoading, 
    conversationId, 
    setConversationId,
    createUserMessage,
    createAIMessage
  } = useChatState();
  
  const { saveConversation, loadConversation } = useConversationPersistence();
  const { submitCorrection: submitCorrectionBase } = useCorrections();
  const { handleAutoSummary } = useAutoSummary();
  const { sendMessageToAI } = useMessageSending();
  
  const { user } = useAuth();
  const { toast } = useToast();

  const clearCurrentConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, [setMessages, setConversationId]);

  const submitCorrection = useCallback(
    async (messageId: string, correction: string, isGlobal: boolean = false) => {
      return submitCorrectionBase(messageId, correction, conversationId, isGlobal);
    },
    [submitCorrectionBase, conversationId]
  );

  const sendMessage = useCallback(
    async (content: string, autoSummarize = false, queryType?: string, file?: File) => {
      if (!user || !content.trim()) return;
      
      // Add user message to chat
      const userMessage = createUserMessage(content, autoSummarize, queryType);
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setIsLoading(true);
      
      try {
        // Determine topic for conversation (first 50 chars of first message)
        const topic = updatedMessages[0]?.content.slice(0, 50) || "New Conversation";
        
        // If it's a new conversation, save it to get an ID
        let currentConvoId = conversationId;
        if (!currentConvoId) {
          currentConvoId = await saveConversation(updatedMessages, topic, null, true);
          if (currentConvoId) {
            setConversationId(currentConvoId);
          }
        }
        
        // Get response from AI
        const aiResponseData = await sendMessageToAI(updatedMessages, queryType, currentConvoId, file);
        
        if (!aiResponseData) {
          throw new Error("Failed to get AI response");
        }
        
        // Add AI message to chat with model information
        const aiMessage = createAIMessage(aiResponseData.content, aiResponseData.model);
        
        const finalMessages = [...updatedMessages, aiMessage];
        setMessages(finalMessages);
        
        // Save conversation update
        await saveConversation(finalMessages, topic, currentConvoId);
        
        // Handle auto-summarization if requested
        if (autoSummarize) {
          // Get the last user message and AI response
          const messagesToSummarize = finalMessages.slice(-2);
          await handleAutoSummary(messagesToSummarize);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        toast({
          title: "Error sending message",
          description: "There was a problem generating a response.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    },
    [
      messages, 
      user, 
      conversationId, 
      setMessages, 
      setIsLoading, 
      setConversationId,
      saveConversation, 
      handleAutoSummary, 
      createUserMessage,
      createAIMessage,
      sendMessageToAI,
      toast
    ]
  );

  // Modified load conversation function 
  const loadConversationHandler = useCallback(
    async (id: string) => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const result = await loadConversation(id);
        
        if (result) {
          setMessages(result.messages);
          setConversationId(result.id);
        }
      } catch (error) {
        console.error("Error loading conversation:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [user, loadConversation, setMessages, setConversationId, setIsLoading]
  );

  return {
    messages,
    isLoading,
    sendMessage,
    saveConversation: (messages: Message[], topic: string) => 
      saveConversation(messages, topic, conversationId),
    loadConversation: loadConversationHandler,
    conversationId,
    clearCurrentConversation,
    submitCorrection
  };
}
