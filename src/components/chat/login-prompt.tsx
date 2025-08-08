
import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { isDemoMode } from "@/utils/demoMode";

export function LoginPrompt() {
  const isMobile = useIsMobile();
  
  if (isDemoMode()) {
    return (
      <div className={`flex h-full flex-col items-center justify-center ${isMobile ? 'p-2' : 'p-4'} text-center`}>
        <div className={`rounded-full bg-muted ${isMobile ? 'p-4 mb-3' : 'p-6 mb-4'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width={isMobile ? "20" : "24"} height={isMobile ? "20" : "24"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h2 className={`font-semibold mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>Demo mode is active</h2>
        <p className={`text-muted-foreground mb-4 ${isMobile ? 'text-sm px-2' : ''}`}>
          You can explore the app without signing in. Conversations won’t be saved.
        </p>
      </div>
    );
  }
  
  return (
    <div className={`flex h-full flex-col items-center justify-center ${isMobile ? 'p-2' : 'p-4'} text-center`}>
      <div className={`rounded-full bg-muted ${isMobile ? 'p-4 mb-3' : 'p-6 mb-4'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width={isMobile ? "20" : "24"} height={isMobile ? "20" : "24"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      </div>
      <h2 className={`font-semibold mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>Sign in to use the chat</h2>
      <p className={`text-muted-foreground mb-4 ${isMobile ? 'text-sm px-2' : ''}`}>
        You need to be signed in to start a conversation with BuntingGPT
      </p>
    </div>
  );
}
