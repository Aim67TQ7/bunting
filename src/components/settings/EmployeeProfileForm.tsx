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
      // Use security definer function to bypass RLS
      const { error } = await supabase.rpc("upsert_emp_record", {
        p_user_id: user.id,
        p_display_name: data.display_name,
        p_location: data.location,
        p_job_level: "Employee", // Default job level
        p_department: data.department || null,
        p_manager_id: data.manager_id && data.manager_id !== "__none__" ? data.manager_id : null,
      });

      if (error) {
        throw error;
      }

      setProfileExists(true);

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

            {/* Report To */}
            <FormField
              control={form.control}
              name="manager_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Report To:
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select who you report to" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">No manager / Top level</SelectItem>
                      {managers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.display_name}
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
