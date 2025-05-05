
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Form schema
const registerSchema = z.object({
  employee: z.string().uuid({ message: "Please select an employee from the list" }),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

// Interface for Employee data
export interface Employee {
  employee_id: string;
  displayName: string;
  userPrincipalName: string;
}

interface RegisterFormProps {
  onSuccess: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      employee: "",
    },
  });

  // Fetch available employees (those without user_id)
  useEffect(() => {
    const fetchAvailableEmployees = async () => {
      setIsFetching(true);
      setFetchError(null);
      
      try {
        console.log("Fetching available employees...");
        
        // Try using the RPC function first
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_available_employees');
          
        if (rpcError) {
          console.error("Error fetching employees via RPC:", rpcError);
          
          // Fallback to direct query if RPC fails
          console.log("Falling back to direct query...");
          const { data: queryData, error: queryError } = await supabase
            .from('Employee_id')
            .select('employee_id, displayName, userPrincipalName')
            .is('user_id', null);
            
          if (queryError) {
            throw queryError;
          }
          
          console.log(`Direct query found ${queryData?.length || 0} employees`);
          setEmployees(queryData || []);
        } else {
          // Format the RPC response to match our Employee interface
          // The RPC function returns lowercase column names
          const formattedData = rpcData.map((emp: any) => ({
            employee_id: emp.employee_id,
            displayName: emp.displayname,
            userPrincipalName: emp.userprincipalname
          }));
          
          console.log(`RPC found ${formattedData?.length || 0} employees`);
          setEmployees(formattedData || []);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        setFetchError("Failed to load employee list. Please try again later.");
        setEmployees([]);
      } finally {
        setIsFetching(false);
      }
    };

    fetchAvailableEmployees();
  }, []);

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      // Find the selected employee
      const selectedEmployee = employees.find(emp => emp.employee_id === data.employee);
      
      if (!selectedEmployee) {
        toast({
          title: "Error",
          description: "Selected employee not found",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Send magic link to the employee's email
      const { error } = await supabase.auth.signInWithOtp({
        email: selectedEmployee.userPrincipalName,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email sent",
          description: `Check ${selectedEmployee.userPrincipalName} for a magic link to complete your registration`,
        });
        onSuccess();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="employee"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Your Name</FormLabel>
              <div className="relative">
                {isFetching && (
                  <div className="absolute right-2 top-2 z-10">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={isFetching || employees.length === 0}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue 
                        placeholder={
                          isFetching ? "Loading employees..." : 
                          fetchError ? "Error loading employees" :
                          employees.length === 0 ? "No available employees found" : 
                          "Select your name from the list"
                        } 
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-80 overflow-y-auto">
                    {fetchError ? (
                      <SelectItem value="error" disabled>{fetchError}</SelectItem>
                    ) : employees.length === 0 ? (
                      <SelectItem value="none" disabled>No available employees found</SelectItem>
                    ) : (
                      employees.map((employee) => (
                        <SelectItem key={employee.employee_id} value={employee.employee_id}>
                          {employee.displayName} ({employee.userPrincipalName})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="text-sm text-muted-foreground">
          A magic link will be sent to your email address to complete the registration.
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading || isFetching || employees.length === 0}
        >
          {isLoading ? "Sending magic link..." : "Send Magic Link"}
        </Button>
      </form>
    </Form>
  );
}
