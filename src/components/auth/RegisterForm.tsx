
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

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
  const [employees, setEmployees] = useState<Employee[]>([]);
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
      try {
        // Use direct query instead of RPC
        const { data, error } = await supabase
          .from('Employee_id')
          .select('employee_id, displayName, userPrincipalName')
          .is('user_id', null);
          
        if (error) {
          console.error("Error fetching employees directly:", error);
          throw error;
        }
        
        setEmployees(data || []);
      } catch (error) {
        console.error("Error fetching employees:", error);
        setEmployees([]);
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
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your name from the list" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {employees && employees.length === 0 ? (
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
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="text-sm text-muted-foreground">
          A magic link will be sent to your email address to complete the registration.
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading || employees.length === 0}>
          {isLoading ? "Sending magic link..." : "Send Magic Link"}
        </Button>
      </form>
    </Form>
  );
}
