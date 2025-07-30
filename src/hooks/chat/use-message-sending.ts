
import { useCallback } from 'react';
import { Message } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix to get just the base64 content
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

// Helper function to chunk large files
const chunkFile = (base64Content: string, chunkSize: number = 50000): string[] => {
  const chunks: string[] = [];
  for (let i = 0; i < base64Content.length; i += chunkSize) {
    chunks.push(base64Content.slice(i, i + chunkSize));
  }
  return chunks;
};

export function useMessageSending() {
  const { user } = useAuth();
  const { toast } = useToast();

  const sendMessageToAI = useCallback(
    async (messages: Message[], queryType?: string, conversationId?: string | null, file?: File) => {
      if (!user) return null;
      
      try {
        let aiResponse: any;
        let modelUsed: string = "groq-llama3-70b"; // Default model name
        
        // If a file is uploaded or vision mode is enabled, always route to Claude
        if (file || queryType === 'vision') {
          console.log('Using Claude for vision/file analysis');
          
          let fileData = null;
          if (file) {
            try {
              // Convert file to base64
              const base64Content = await fileToBase64(file);
              
              // Check if file needs chunking (if larger than 100KB in base64)
              const needsChunking = base64Content.length > 100000;
              
              fileData = {
                name: file.name,
                type: file.type,
                size: file.size,
                base64: needsChunking ? null : base64Content,
                chunks: needsChunking ? chunkFile(base64Content) : null,
                needsChunking
              };
              
              if (needsChunking) {
                toast({
                  title: "Processing large file",
                  description: `File chunked into ${fileData.chunks?.length} parts for processing`,
                  duration: 3000
                });
              }
            } catch (error) {
              console.error('Error processing file:', error);
              toast({
                title: "File processing error",
                description: "Failed to process the uploaded file",
                variant: "destructive"
              });
              throw error;
            }
          }
          
          const { data, error } = await supabase.functions.invoke('generate-with-claude', {
            body: { 
              messages: messages.map(m => ({ role: m.role, content: m.content })),
              conversationId: conversationId,
              userId: user.id,
              fileData: fileData
            }
          });
            
          if (error) throw error;
          aiResponse = data.content;
          modelUsed = data.model || "claude-3-5-sonnet";
        }
        // Use GPT-o3 endpoint if queryType is 'gpt-o3'
        else if (queryType === 'gpt-o3') {
          console.log('Using GPT-o3 for deep thinking response');
          const { data, error } = await supabase.functions.invoke('generate-with-openai-o3', {
            body: { 
              messages: messages.map(m => ({ role: m.role, content: m.content })),
              conversationId: conversationId,
              userId: user.id
            }
          });
            
          if (error) throw error;
          aiResponse = data.content;
          modelUsed = data.model || "gpt-o3-mini";
        }
        // Use OpenAI 4o with embeddings if queryType is 'server'
        else if (queryType === 'server') {
          console.log('Using OpenAI 4o with embeddings for server response');
          const { data, error } = await supabase.functions.invoke('generate-with-openai-embeddings', {
            body: { 
              messages: messages.map(m => ({ role: m.role, content: m.content })),
              conversationId: conversationId,
              userId: user.id
            }
          });
            
          if (error) throw error;
          aiResponse = data.content;
          modelUsed = data.model || "gpt-4o";
        }
        // Use the web-enabled endpoint if queryType is 'web'
        else if (queryType === 'web') {
          console.log('Using web search for response');
          const { data, error } = await supabase.functions.invoke('generate-with-groq', {
            body: { 
              messages: messages.map(m => ({ role: m.role, content: m.content })),
              stream: false,
              enableWeb: true,  // Enable web search
              conversationId: conversationId,
              userId: user.id
            }
          });
            
          if (error) throw error;
          aiResponse = data.choices[0].message.content;
          // Store the model name if provided in response
          if (data.model) {
            modelUsed = data.model;
          }
        } else {
          // Default to the standard GROQ endpoint
          const { data, error } = await supabase.functions.invoke('generate-with-groq', {
            body: { 
              messages: messages.map(m => ({ role: m.role, content: m.content })),
              stream: false,
              conversationId: conversationId,
              userId: user.id
            }
          });
            
          if (error) throw error;
          aiResponse = data.choices[0].message.content;
          // Store the model name if provided in response
          if (data.model) {
            modelUsed = data.model;
          }
        }
        
        return {
          content: aiResponse,
          model: modelUsed
        };
      } catch (error) {
        console.error("Error sending message to AI:", error);
        toast({
          title: "Error sending message",
          description: "There was a problem generating a response.",
          variant: "destructive"
        });
        throw error;
      }
    },
    [user, toast]
  );

  return { sendMessageToAI };
}
