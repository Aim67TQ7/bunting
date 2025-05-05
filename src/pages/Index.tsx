
import { ChatInterface } from "@/components/chat-interface";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";

const Index = () => {
  return (
    <ThemeProvider defaultTheme="light">
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar className="w-64 flex-shrink-0" />
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <h1 className="text-lg font-semibold">Chat</h1>
          </div>
          <ChatInterface />
        </main>
      </div>
    </ThemeProvider>
  );
};

export default Index;
