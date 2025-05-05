
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/app-sidebar";
import { useToast } from "@/hooks/use-toast";
import { ProfilePicture } from "@/components/settings/ProfilePicture";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { profileSchema, ProfileFormValues, UserProfileData } from "@/types/profile";

export default function Settings() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
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
        })
        .eq("id", user.id);
      
      if (profileError) throw profileError;
      
      // Update employee data using direct update
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
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
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
    <div className="flex min-h-screen">
      <AppSidebar className="hidden md:block" />
      
      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>
          
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
        </div>
      </main>
    </div>
  );
}
