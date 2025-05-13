
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from "@/components/ui/select";
import { Save, X } from "lucide-react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";

interface KnowledgeEditFormProps {
  entry: any;
  onSaved: () => void;
  onCancel: () => void;
}

export function KnowledgeEditForm({ entry, onSaved, onCancel }: KnowledgeEditFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm({
    defaultValues: {
      title: entry?.content?.title || '',
      summary: entry?.content?.summary || '',
      source: entry?.content?.source || '',
      document_type: entry?.document_type || 'company',
      scope: entry?.scope || 'global',
    },
  });

  async function onSubmit(values: any) {
    setIsLoading(true);
    try {
      // Create updated content object
      const updatedContent = {
        ...entry.content,
        title: values.title,
        summary: values.summary,
        source: values.source,
      };

      const { error } = await supabase
        .from('training_data')
        .update({
          content: updatedContent,
          document_type: values.document_type,
          scope: values.scope,
        })
        .eq('id', entry.id);

      if (error) throw error;

      toast({
        title: "Entry updated",
        description: "Knowledge entry was successfully updated",
      });
      
      onSaved();
    } catch (error) {
      console.error('Error updating knowledge entry:', error);
      toast({
        title: "Error",
        description: "Failed to update knowledge entry",
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
        
        <div className="grid grid-cols-2 gap-4">
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
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Summary</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter knowledge summary" 
                  className="min-h-[200px]" 
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
                <Input placeholder="Enter source information" {...field} />
              </FormControl>
              <FormDescription>
                Optional: Identify where this knowledge originated from
              </FormDescription>
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
