
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { v4 as uuidv4 } from "uuid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface ReportIssueFormProps {
  defaultRoute?: string;
}

export function ReportIssueForm({ defaultRoute }: ReportIssueFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const currentRoute = defaultRoute || window.location.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast({
        title: "Not signed in",
        description: "Please sign in to submit an issue.",
        variant: "destructive",
      });
      return;
    }
    if (!title.trim() || !description.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a title and description.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      let screenshotPath: string | undefined;

      if (file) {
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const path = `${user.id}/${uuidv4()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from("issue-screenshots")
          .upload(path, file, { contentType: file.type });

        if (uploadError) {
          throw new Error(`Failed to upload screenshot: ${uploadError.message}`);
        }

        screenshotPath = path;
      }

      const { error: insertError } = await supabase
        .from("issue_reports" as any)
        .insert([
          {
            user_id: user.id,
            title,
            description,
            priority,
            app_route: currentRoute,
            screenshot_path: screenshotPath,
          },
        ]);

      if (insertError) {
        throw new Error(`Failed to submit issue: ${insertError.message}`);
      }

      // Reset form
      setTitle("");
      setDescription("");
      setPriority("medium");
      setFile(null);
    } catch (err: any) {
      console.error("Issue submission error:", err);
      toast({
        title: "Submission failed",
        description: err?.message || "Unable to submit issue right now.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report an Issue</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="issue-title">Title</Label>
            <Input
              id="issue-title"
              placeholder="Short summary of the problem"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="issue-description">Description</Label>
            <Textarea
              id="issue-description"
              placeholder="Describe what happened, what you expected, and any steps to reproduce..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issue-priority">Priority</Label>
              <select
                id="issue-priority"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium (default)</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issue-route">Route</Label>
              <Input id="issue-route" value={currentRoute} readOnly />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issue-screenshot">Screenshot (optional)</Label>
            <Input
              id="issue-screenshot"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              Please include a screenshot if it helps illustrate the problem.
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Issue"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

