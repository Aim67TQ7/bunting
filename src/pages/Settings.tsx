
import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { useToast } from "@/hooks/use-toast";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ProfilePicture } from "@/components/settings/ProfilePicture";
import { supabase } from "@/integrations/supabase/client";

// Modified schema to remove current password requirement since user is already authenticated
const passwordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Settings() {
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const { toast } = useToast();
  const { user, updatePassword } = useAuth();

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      setProfile(data);
    };

    fetchProfile();
  }, [user?.id]);

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    setProfile((prev: any) => prev ? { ...prev, avatar_url: newAvatarUrl } : null);
  };
  
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onPasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
    setIsLoading(true);
    try {
      const { error } = await updatePassword(values.newPassword);
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password Updated",
          description: "Your password has been updated successfully",
        });
        setIsChangePasswordOpen(false);
        passwordForm.reset();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An error occurred while updating your password",
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
            <div className="mx-auto max-w-2xl space-y-6">
              {user ? (
                <>
                  <ProfilePicture 
                    userId={user.id}
                    avatarUrl={profile?.avatar_url}
                    firstName={profile?.first_name}
                    email={user.email}
                    onAvatarUpdate={handleAvatarUpdate}
                  />
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" value={user.email} readOnly />
                        </div>
                        <div>
                          <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
                            <DialogTrigger asChild>
                              <Button>Change Password</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Change Password</DialogTitle>
                              </DialogHeader>
                              <Form {...passwordForm}>
                                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                                  <FormField
                                    control={passwordForm.control}
                                    name="newPassword"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>New Password</FormLabel>
                                        <FormControl>
                                          <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={passwordForm.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Confirm New Password</FormLabel>
                                        <FormControl>
                                          <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <div className="flex justify-end gap-2">
                                    <Button 
                                      type="button" 
                                      variant="outline" 
                                      onClick={() => setIsChangePasswordOpen(false)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button type="submit" disabled={isLoading}>
                                      {isLoading ? "Updating..." : "Update Password"}
                                    </Button>
                                  </div>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="text-center p-8 bg-muted/30 rounded-lg">
                  <h2 className="text-xl font-semibold mb-2">Please Sign In</h2>
                  <p>You need to be logged in to view and manage your settings.</p>
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
