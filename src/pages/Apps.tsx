
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { Grid3X3 } from "lucide-react";

const Apps = () => {
  return (
    <ThemeProvider defaultTheme="light">
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar className="w-64 flex-shrink-0" />
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <h1 className="text-lg font-semibold">Applications</h1>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="rounded-full bg-muted p-4">
                <Grid3X3 className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-medium">Integrated Applications</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Access integrated tools and third-party applications
              </p>
            </div>
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
};

export default Apps;
