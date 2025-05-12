
import { ChatInterface } from "@/components/chat-interface";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get('conversation');
  const [conversationTitle, setConversationTitle] = useState<string | null>(null);
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchConversationTitle = async () => {
      if (conversationId && user) {
        try {
          const { data, error } = await supabase
            .from("conversations")
            .select("topic")
            .eq("id", conversationId)
            .eq("user_id", user.id)
            .single();
          
          if (data && !error) {
            setConversationTitle(data.topic || "Conversation");
          } else {
            console.error("Error fetching conversation title:", error);
            setConversationTitle("Conversation");
          }
        } catch (err) {
          console.error("Error in fetchConversationTitle:", err);
          setConversationTitle("Conversation");
        }
      } else {
        setConversationTitle(null);
      }
    };
    
    fetchConversationTitle();
  }, [conversationId, user]);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar className="w-64 flex-shrink-0" />
      
      <SidebarInset className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="flex gap-2 items-center">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-lg font-semibold">
              {conversationTitle ? conversationTitle : "New Chat"}
            </h1>
          </div>
        </div>
        <ChatInterface />
      </SidebarInset>
    </div>
  );
};

export default Index;
