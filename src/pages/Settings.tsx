
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload } from "lucide-react";

// Form schema for profile update
const profileSchema = z.object({
  email: z.string().email().optional(),
  first_name: z.string().min(1, "First name is required"),
  call_name: z.string().min(1, "Call name is required"),
  department: z.string().optional(),
  jobTitle: z.string().optional(),
  officeLocation: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// Interface for employee and profile data
interface UserProfileData {
  email?: string;
  first_name?: string;
  call_name?: string;
  avatar_url?: string;
  department?: string;
  jobTitle?: string;
  officeLocation?: string;
  city?: string;
  state?: string;
  country?: string;
}

// Interface for Employee_id table data
interface EmployeeData {
  employee_id: string;
  user_id: string | null;
  displayName?: string;
  userPrincipalName?: string;
  department?: string;
  jobTitle?: string;
  officeLocation?: string;
  city?: string;
  state?: string;
  country?: string;
}

// Interface for profile table data
interface ProfileData {
  id: string;
  email?: string;
  first_name?: string;
  call_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export default function Settings() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;
    
    setIsUploading(true);
    try {
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;
      
      // Upload image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);
      
      const avatarUrl = data.publicUrl;
      
      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);
      
      if (updateError) throw updateError;
      
      // Update UI
      setAvatarUrl(avatarUrl);
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully",
      });
      
    } catch (err) {
      console.error("Error uploading avatar:", err);
      toast({
        title: "Error",
        description: "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen">
      <AppSidebar className="hidden md:block" />
      
      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>
                Update your profile picture
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl || ""} alt={userData?.first_name || "User"} />
                <AvatarFallback>
                  {userData?.first_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md">
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span>Upload new picture</span>
                      </>
                    )}
                  </div>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile information
              </CardDescription>
            </CardHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Basic Information</h3>
                    <Separator />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} disabled />
                          </FormControl>
                          <FormDescription>
                            Your email address cannot be changed
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="call_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>@call name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormDescription>
                              This will be used in communications
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  {/* Work Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Work Information</h3>
                    <Separator />
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="jobTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Title</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="officeLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Office Location</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  {/* Location Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Location</h3>
                    <Separator />
                    
                    <div className="grid gap-4 md:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State/Province</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button type="submit" className="ml-auto" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>
      </main>
    </div>
  );
}
