import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Building2, User, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const LOCATIONS = ["Newton", "DuBois", "Redditch", "Berkhamsted", "Home-Office"] as const;
const JOB_LEVELS = ["Executive", "Manager", "Supervisor", "Lead", "Employee"] as const;
const DEPARTMENTS = [
  "Executive",
  "Engineering",
  "Sales",
  "Marketing",
  "Production",
  "Accounting",
  "Human Resources",
  "IT",
  "Operations",
  "Quality",
  "Research & Development",
  "Customer Service",
  "Shipping",
  "Purchasing",
] as const;

const employeeProfileSchema = z.object({
  display_name: z.string().min(1, "Display name is required"),
  location: z.enum(LOCATIONS, { required_error: "Please select a location" }),
  job_level: z.enum(JOB_LEVELS, { required_error: "Please select a job level" }),
  department: z.string().optional(),
  manager_id: z.string().optional(),
});

type EmployeeProfileFormValues = z.infer<typeof employeeProfileSchema>;

interface Manager {
  id: string;
  display_name: string;
  job_level: string;
}

interface EmployeeProfileFormProps {
  onProfileComplete?: () => void;
}

export function EmployeeProfileForm({ onProfileComplete }: EmployeeProfileFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [profileExists, setProfileExists] = useState(false);

  const form = useForm<EmployeeProfileFormValues>({
    resolver: zodResolver(employeeProfileSchema),
    defaultValues: {
      display_name: "",
      location: undefined,
      job_level: undefined,
      department: "",
      manager_id: "",
    },
  });

  // Fetch existing profile and available managers
  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      setIsFetching(true);
      try {
        // Fetch existing profile
        const { data: profile, error: profileError } = await supabase
          .from("emps")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError && profileError.code !== "PGRST116") {
          console.error("Error fetching profile:", profileError);
        }

        if (profile) {
          setProfileExists(true);
          form.reset({
            display_name: profile.display_name || "",
            location: profile.location as typeof LOCATIONS[number] || undefined,
            job_level: profile.job_level as typeof JOB_LEVELS[number] || undefined,
            department: profile.department || "",
            manager_id: profile.manager_id || "__none__",
          });
        }

        // Fetch available managers (all employees except current user)
        const { data: allEmployees, error: managersError } = await supabase
          .from("emps")
          .select("id, display_name, job_level")
          .neq("user_id", user.id)
          .not("display_name", "is", null);

        if (managersError) {
          console.error("Error fetching managers:", managersError);
        } else {
          setManagers(allEmployees || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsFetching(false);
      }
    }

    fetchData();
  }, [user, form]);

  const onSubmit = async (data: EmployeeProfileFormValues) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const profileData = {
        user_id: user.id,
        display_name: data.display_name,
        location: data.location,
        job_level: data.job_level,
        department: data.department || null,
        manager_id: data.manager_id && data.manager_id !== "__none__" ? data.manager_id : null,
        updated_at: new Date().toISOString(),
      };

      let error;
      if (profileExists) {
        // Update existing profile
        const result = await supabase
          .from("emps")
          .update(profileData)
          .eq("user_id", user.id);
        error = result.error;
      } else {
        // Insert new profile
        const result = await supabase.from("emps").insert(profileData);
        error = result.error;
      }

      if (error) {
        throw error;
      }

      toast({
        title: "Profile saved",
        description: "Your employee profile has been updated successfully.",
      });

      if (onProfileComplete) {
        onProfileComplete();
      }
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error saving profile",
        description: error.message || "An error occurred while saving your profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <CardTitle>Employee Profile</CardTitle>
        </div>
        <CardDescription>
          Complete your employee profile to access all features. This information helps build our organization chart.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* Display Name */}
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Display Name
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormDescription>How you'll appear to others in the organization</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your location" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LOCATIONS.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Job Level */}
            <FormField
              control={form.control}
              name="job_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Level *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your job level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {JOB_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Department */}
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Direct Manager */}
            <FormField
              control={form.control}
              name="manager_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Direct Manager
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your direct manager" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">No manager / Top level</SelectItem>
                      {managers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.display_name} {manager.job_level ? `(${manager.job_level})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select your direct supervisor. This helps build the org chart.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter>
            <Button type="submit" className="ml-auto" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Profile"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
