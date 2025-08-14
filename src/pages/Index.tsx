
import { ChatInterface } from "@/components/chat-interface";
import { PageLayout } from "@/components/page-layout";
import { useSearchParams } from "react-router-dom";

const Index = () => {
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get('conversation');
  
  return (
    <PageLayout showMobileHeader={false} className="p-0">
      <ChatInterface conversationId={conversationId} />
    </PageLayout>
  );
};

export default Index;
