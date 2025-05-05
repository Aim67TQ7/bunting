
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Control } from "react-hook-form";
import { ProfileFormValues } from "@/types/profile";

interface BasicInfoFormProps {
  control: Control<ProfileFormValues>;
}

export function BasicInfoForm({ control }: BasicInfoFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Basic Information</h3>
      <Separator />
      
      <FormField
        control={control}
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
          control={control}
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
          control={control}
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
  );
}
