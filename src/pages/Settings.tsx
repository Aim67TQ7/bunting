
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/app-sidebar";
import { useToast } from "@/hooks/use-toast";
import { ProfilePicture } from "@/components/settings/ProfilePicture";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { PasswordManager } from "@/components/settings/PasswordManager";
import { profileSchema, ProfileFormValues, UserProfileData } from "@/types/profile";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Settings() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
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

  // Fetch user data from profile and Employee_id tables
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (profileError) throw profileError;
        
        // Fetch employee data using direct query
        const { data: employeeData, error: employeeError } = await supabase
          .from('Employee_id')
          .select('*')
          .eq('user_id', user.id)
          .single();
            
        if (employeeError && employeeError.code !== "PGRST116") {
          console.error("Error fetching employee data directly:", employeeError);
        }
        
        // Merge the data
        const mergedData: UserProfileData = {
          email: user.email,
          first_name: profileData?.first_name || "",
          call_name: profileData?.call_name || "",
          avatar_url: profileData?.avatar_url || null,
          ...(employeeData || {}),
        };
        
        setUserData(mergedData);
        setAvatarUrl(profileData?.avatar_url || null);
        
        // Update form
        form.reset({
          email: user.email,
          first_name: profileData?.first_name || "",
          call_name: profileData?.call_name || "",
          department: employeeData?.department || "",
          jobTitle: employeeData?.jobTitle || "",
          officeLocation: employeeData?.officeLocation || "",
          city: employeeData?.city || "",
          state: employeeData?.state || "",
          country: employeeData?.country || "",
        });
        
      } catch (err) {
        console.error("Error fetching user data:", err);
        toast({
          title: "Error",
          description: "Failed to load your profile data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [user, form, toast]);

  // Handle profile update
  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: data.first_name,
          call_name: data.call_name,
          avatar_url: avatarUrl, // Make sure to include current avatar url
          email: user.email,     // Update email field to match user's email
        })
        .eq("id", user.id);
      
      if (profileError) throw profileError;
      
      // Check if employee record exists
      const { data: existingEmployee, error: checkError } = await supabase
        .from('Employee_id')
        .select('user_id')
        .eq("user_id", user.id)
        .single();
        
      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }
      
      if (existingEmployee) {
        // Update existing employee record
        const { error: employeeError } = await supabase
          .from('Employee_id')
          .update({
            department: data.department,
            jobTitle: data.jobTitle,
            officeLocation: data.officeLocation,
            city: data.city,
            state: data.state,
            country: data.country,
          })
          .eq("user_id", user.id);
        
        if (employeeError) {
          throw employeeError;
        }
      } else {
        // Create new employee record if it doesn't exist yet
        const { error: insertError } = await supabase
          .from('Employee_id')
          .insert({
            user_id: user.id,
            department: data.department,
            jobTitle: data.jobTitle,
            officeLocation: data.officeLocation,
            city: data.city,
            state: data.state,
            country: data.country,
            // Required field for Employee_id table
            userPrincipalName: user.email 
          });
          
        if (insertError) {
          throw insertError;
        }
      }
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      
      // Refresh user data
      setUserData({
        ...userData,
        first_name: data.first_name,
        call_name: data.call_name,
        department: data.department,
        jobTitle: data.jobTitle,
        officeLocation: data.officeLocation,
        city: data.city,
        state: data.state,
        country: data.country,
      });
      
    } catch (err) {
      console.error("Error updating profile:", err);
      toast({
        title: "Error",
        description: "Failed to update your profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpdate = (url: string) => {
    setAvatarUrl(url);
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
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile" className="space-y-6">
                  <ProfilePicture 
                    userId={user?.id}
                    avatarUrl={avatarUrl}
                    firstName={userData?.first_name}
                    email={user?.email}
                    onAvatarUpdate={handleAvatarUpdate}
                  />
                  
                  <ProfileForm 
                    form={form} 
                    onSubmit={onSubmit} 
                    isLoading={isLoading} 
                  />
                </TabsContent>
                
                <TabsContent value="security" className="space-y-6">
                  <PasswordManager />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
