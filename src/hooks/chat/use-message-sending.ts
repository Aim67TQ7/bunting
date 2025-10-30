
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
    async (messages: Message[], queryType?: string, conversationId?: string | null, fileOrFiles?: File | File[]) => {
      if (!user) return null;
      
      try {
        let aiResponse: any;
        let modelUsed: string = "llama-3.3-70b-versatile"; // Default model name
        
        // Route to Claude only when vision is explicitly requested and GPT-5 is not selected
        const filesArray: File[] = Array.isArray(fileOrFiles)
          ? fileOrFiles
          : fileOrFiles
          ? [fileOrFiles]
          : [];
        if ((filesArray.length > 0 && queryType === 'vision') || queryType === 'vision') {
          console.log('Using Claude for vision/file analysis');
          
          let fileData = null;
          if (filesArray.length === 1) {
            try {
              // Convert file to base64
              const base64Content = await fileToBase64(filesArray[0]);
              
              // Check if file needs chunking (if larger than 100KB in base64)
              const needsChunking = base64Content.length > 100000;
              
              fileData = {
                name: filesArray[0].name,
                type: filesArray[0].type,
                size: filesArray[0].size,
                base64: needsChunking ? null : base64Content,
                chunks: needsChunking ? chunkFile(base64Content) : null,
                needsChunking
              } as any;
              
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
        // Use GPT-4o-mini if queryType is 'gpt4o' or 'smart'
        else if (queryType === 'gpt4o' || queryType === 'smart') {
          const isSmart = queryType === 'smart';
          console.log(`Using GPT-4o-mini for ${isSmart ? 'Smart Analysis' : 'response'}`, Array.isArray(fileOrFiles) ? `(with ${fileOrFiles.length} attachment(s) preview)` : (fileOrFiles ? '(with attachment preview)' : ''));

          // Build previews for up to 10 files (safe limits per file and total)
          const filesArray: File[] = Array.isArray(fileOrFiles)
            ? fileOrFiles
            : fileOrFiles
            ? [fileOrFiles]
            : [];

          let totalBytes = 0;
          const MAX_FILES = 10;
          const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50MB total
          const MAX_TEXT_PREVIEW = 10000; // chars
          const MAX_BASE64_PREVIEW = 16000; // chars

          const limitedFiles = filesArray.slice(0, MAX_FILES);

          const fileDataList: any[] = [];
          for (const f of limitedFiles) {
            totalBytes += f.size;
            if (totalBytes > MAX_TOTAL_BYTES) break;

            let preview: string | null = null;
            let truncated = false;
            try {
              // Prefer text preview for text-like files
              const lowerName = f.name.toLowerCase();
              const isTextLike = f.type.startsWith('text/') || /\.(csv|json|md|txt)$/i.test(lowerName);
              if (isTextLike) {
                // Read as text
                const text = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.readAsText(f);
                  reader.onload = () => resolve((reader.result as string) || '');
                  reader.onerror = reject;
                });
                preview = text.slice(0, MAX_TEXT_PREVIEW);
                truncated = text.length > MAX_TEXT_PREVIEW;
              } else {
                // Fallback to base64 data URL preview (first N chars only)
                const b64 = await fileToBase64(f);
                preview = b64.slice(0, MAX_BASE64_PREVIEW);
                truncated = b64.length > MAX_BASE64_PREVIEW;
              }
            } catch (e) {
              console.warn('Preview generation failed for file', f.name, e);
            }

            fileDataList.push({
              name: f.name,
              type: f.type,
              size: f.size,
              base64Preview: preview,
              truncated,
            });
          }

          const { data, error } = await supabase.functions.invoke('generate-with-openai-o3', {
            body: {
              messages: messages.map(m => ({ role: m.role, content: m.content })),
              conversationId: conversationId,
              userId: user.id,
              fileDataList,
              smart: isSmart,
            }
          });
          
          if (error) throw error;
          aiResponse = data.content;
          modelUsed = data.model || 'gpt-4o-mini';
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
          // Default to Groq endpoint for fast responses
          console.log('Using default Groq endpoint');
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
          modelUsed = data.model || "llama-3.3-70b-versatile";
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
