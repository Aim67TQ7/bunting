
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppSidebar } from "@/components/app-sidebar";
import { useToast } from "@/hooks/use-toast";
import { profileSchema, ProfileFormValues } from "@/types/profile";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function Settings() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: "",
      first_name: "",
      call_name: "",
      department: "",
      jobTitle: "",
      officeLocation: "",
      city: "",
      state: "",
      country: "",
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    try {
      // This is where authentication code was before
      // Now just show a toast indicating this feature is not implemented
      
      toast({
        title: "Feature not available",
        description: "Profile management requires authentication which has been removed",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "An error occurred while processing your request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar className="w-64 flex-shrink-0" />
        
        <SidebarInset className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <div className="flex gap-2 items-center">
              <SidebarTrigger className="md:hidden" />
              <h1 className="text-lg font-semibold">Settings</h1>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="mx-auto max-w-2xl">
              <div className="text-center p-8 bg-muted/30 rounded-lg">
                <h2 className="text-xl font-semibold mb-2">Authentication Removed</h2>
                <p>Authentication has been removed from this application. Settings management requires authentication to work properly.</p>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
