
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Control } from "react-hook-form";
import { ProfileFormValues } from "@/types/profile";

interface WorkInfoFormProps {
  control: Control<ProfileFormValues>;
}

export function WorkInfoForm({ control }: WorkInfoFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Work Information</h3>
      <Separator />
      
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={control}
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
          control={control}
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
          control={control}
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
  );
}
