import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/page-layout";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider } from "@/components/ui/sidebar";
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
import { ConversationPreferences } from "@/components/settings/ConversationPreferences";
import { EmployeeProfileForm } from "@/components/settings/EmployeeProfileForm";
import { supabase } from "@/integrations/supabase/client";
import { AppItemsSecretPanel } from "@/components/admin/AppItemsSecretPanel";
import { ReportIssueForm } from "@/components/issues/ReportIssueForm";
import { MyIssuesList } from "@/components/issues/MyIssuesList";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
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
  const [appItemsOpen, setAppItemsOpen] = useState(false);
  const navigate = useNavigate();

  const handleProfileComplete = () => {
    toast({
      title: "Profile Complete",
      description: "Your employee profile has been saved. Redirecting to dashboard...",
    });
    setTimeout(() => {
      navigate("/");
    }, 1500);
  };

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

  const handlePreferencesUpdate = (preferences: string) => {
    setProfile((prev: any) => prev ? { ...prev, conversation_preferences: preferences } : null);
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
        // Success toasts are suppressed by our toast hook update
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
      <PageLayout title="Settings">
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-2xl space-y-6">
            {user ? (
                <>
                  {/* Employee Profile Form - First priority */}
                  <EmployeeProfileForm onProfileComplete={handleProfileComplete} />

                  <ProfilePicture 
                    userId={user.id}
                    avatarUrl={profile?.avatar_url}
                    firstName={profile?.first_name}
                    email={user.email}
                    onAvatarUpdate={handleAvatarUpdate}
                  />

                  {/* Account Info moved just below Profile Picture */}
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
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input 
                            id="password" 
                            type="password" 
                            value="••••••••••••" 
                            readOnly 
                            className="cursor-not-allowed"
                          />
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

                  {/* Collapsible sections */}
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="conversation-preferences">
                      <Card className="border-0">
                        <CardHeader className="p-0">
                          <AccordionTrigger className="px-4">
                            <CardTitle>Conversation Preferences</CardTitle>
                          </AccordionTrigger>
                        </CardHeader>
                        <AccordionContent className="px-4">
                          <ConversationPreferences
                            userId={user.id}
                            currentPreferences={profile?.conversation_preferences || ""}
                            onPreferencesUpdate={handlePreferencesUpdate}
                          />
                        </AccordionContent>
                      </Card>
                    </AccordionItem>

                    <AccordionItem value="report-issue">
                      <Card className="border-0">
                        <CardHeader className="p-0">
                          <AccordionTrigger className="px-4">
                            <CardTitle>Report an Issue</CardTitle>
                          </AccordionTrigger>
                        </CardHeader>
                        <AccordionContent className="px-4">
                          <ReportIssueForm />
                        </AccordionContent>
                      </Card>
                    </AccordionItem>

                    <AccordionItem value="my-issues">
                      <Card className="border-0">
                        <CardHeader className="p-0">
                          <AccordionTrigger className="px-4">
                            <CardTitle>My Reported Issues</CardTitle>
                          </AccordionTrigger>
                        </CardHeader>
                        <AccordionContent className="px-4">
                          <MyIssuesList />
                        </AccordionContent>
                      </Card>
                    </AccordionItem>
                  </Accordion>
                </>
            ) : (
              <div className="text-center p-8 bg-muted/30 rounded-lg">
                <h2 className="text-xl font-semibold mb-2">Please Sign In</h2>
                <p>You need to be logged in to view and manage your settings.</p>
              </div>
            )}
          </div>
        </div>
        <AppItemsSecretPanel open={appItemsOpen} onOpenChange={setAppItemsOpen} />
        <Button
          size="icon"
          className="fixed bottom-4 right-4 h-3 w-3 rounded-full bg-primary shadow-md opacity-60 hover:opacity-100 z-[70]"
          aria-label="Open app items panel"
          onClick={() => {
            const code = window.prompt('Enter passcode');
            if (code === '203') {
              setAppItemsOpen(true);
            } else if (code !== null) {
              toast({ title: 'Access denied', description: 'Incorrect passcode.', variant: 'destructive' });
            }
          }}
        />
      </PageLayout>
    </SidebarProvider>
  );
}

