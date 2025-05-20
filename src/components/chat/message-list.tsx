
import { Message } from "@/types/chat";
import { ChatMessage } from "@/components/chat-message";

interface MessageListProps {
  messages: Message[];
  isAiResponding?: boolean;
  onSubmitCorrection?: (messageId: string, correction: string) => Promise<boolean>;
}

export function MessageList({ messages, isAiResponding, onSubmitCorrection }: MessageListProps) {
  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <ChatMessage
          key={message.id || index}
          role={message.role}
          content={message.content}
          timestamp={message.timestamp}
          model={message.model}
          messageId={message.id}
          onSubmitCorrection={onSubmitCorrection}
        />
      ))}
      
      {isAiResponding && (
        <ChatMessage
          role="assistant"
          content=""
          timestamp={new Date()}
          isLoading={true}
          messageId="loading"
        />
      )}
    </div>
  );
}
