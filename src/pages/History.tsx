
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { History as HistoryIcon } from "lucide-react";

const History = () => {
  // Mock chat history data
  const chatHistory = [
    { id: 1, title: "Magnetic separator troubleshooting", date: "May 4, 2025", preview: "Discussed issues with the MB-5 separator..." },
    { id: 2, title: "Product recommendation for food industry", date: "May 3, 2025", preview: "Recommended RE series magnets for..." },
    { id: 3, title: "Custom design inquiry", date: "May 1, 2025", preview: "Discussed specifications for custom..." },
  ];

  return (
    <ThemeProvider defaultTheme="light">
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar className="w-64 flex-shrink-0" />
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <h1 className="text-lg font-semibold">Chat History</h1>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {chatHistory.length > 0 ? (
              <div className="space-y-4">
                {chatHistory.map((chat) => (
                  <div
                    key={chat.id}
                    className="rounded-lg border p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between">
                      <h3 className="font-medium">{chat.title}</h3>
                      <span className="text-xs text-muted-foreground">{chat.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {chat.preview}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="rounded-full bg-muted p-4">
                  <HistoryIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-medium">No chat history</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  When you chat with BuntingGPT, your conversations will appear here
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
};

export default History;
