
import { MessageRole } from "@/components/chat-message";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  autoSummarize?: boolean;
  queryType?: string;
  model?: string; // Added model field to track which AI model was used
}

export interface StarterQuestion {
  icon: React.ReactNode;
  title: string;
  description: string;
  question: string;
}
