
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { BasicInfoForm } from "./BasicInfoForm";
import { WorkInfoForm } from "./WorkInfoForm";
import { LocationInfoForm } from "./LocationInfoForm";
import { ProfileFormValues } from "@/types/profile";
import { UseFormReturn } from "react-hook-form";
import { Loader2 } from "lucide-react";

interface ProfileFormProps {
  form: UseFormReturn<ProfileFormValues>;
  onSubmit: (data: ProfileFormValues) => Promise<void>;
  isLoading: boolean;
}

export function ProfileForm({ form, onSubmit, isLoading }: ProfileFormProps) {
  return (
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
            <BasicInfoForm control={form.control} />
            <WorkInfoForm control={form.control} />
            <LocationInfoForm control={form.control} />
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
  );
}
