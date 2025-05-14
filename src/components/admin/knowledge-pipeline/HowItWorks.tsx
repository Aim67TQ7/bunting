
import React from "react";

export function HowItWorks() {
  return (
    <div className="rounded-md bg-muted p-3">
      <h4 className="text-sm font-medium">How it works</h4>
      <ol className="mt-2 text-xs space-y-1 text-muted-foreground pl-5 list-decimal">
        <li>Conversations from the past week are retrieved</li>
        <li>AI removes all personal identifiable information</li>
        <li>Core knowledge is extracted and structured</li>
        <li>Knowledge base is automatically expanded</li>
      </ol>
    </div>
  );
}
