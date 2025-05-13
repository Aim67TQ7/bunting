
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from "@/components/ui/select";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { PlusCircle } from "lucide-react";

export function KnowledgeForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm({
    defaultValues: {
      title: '',
      summary: '',
      source: '',
      document_type: 'company',
      scope: 'global',
    },
  });

  async function onSubmit(values: any) {
    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase
        .from('training_data')
        .insert({
          content: {
            title: values.title,
            summary: values.summary,
            source: values.source || 'manual-entry'
          },
          document_type: values.document_type,
          scope: values.scope,
          user_id: userData.user.id,
        });

      if (error) throw error;

      toast({
        title: "Knowledge added",
        description: "New knowledge entry was successfully created",
      });
      
      // Reset form
      form.reset({
        title: '',
        summary: '',
        source: '',
        document_type: 'company',
        scope: 'global',
      });
      
    } catch (error) {
      console.error('Error adding knowledge entry:', error);
      toast({
        title: "Error",
        description: "Failed to add knowledge entry",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter a title" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="document_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="contact">Contact</SelectItem>
                  <SelectItem value="purchase_order">Purchase Order</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="scope"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scope</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="global">Global</SelectItem>
                  <SelectItem value="user">User Specific</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Global entries are available to all users, user-specific are only for you
              </FormDescription>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Knowledge Content</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter knowledge content" 
                  className="min-h-[120px]" 
                  {...field} 
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source</FormLabel>
              <FormControl>
                <Input placeholder="Enter source information (optional)" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {isLoading ? "Adding..." : "Add Knowledge"}
        </Button>
      </form>
    </Form>
  );
}
