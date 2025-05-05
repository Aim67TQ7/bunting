
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Control } from "react-hook-form";
import { ProfileFormValues } from "@/types/profile";

interface LocationInfoFormProps {
  control: Control<ProfileFormValues>;
}

export function LocationInfoForm({ control }: LocationInfoFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Location</h3>
      <Separator />
      
      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          control={control}
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
          control={control}
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
          control={control}
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
  );
}
