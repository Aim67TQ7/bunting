import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Key, Copy, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

export function UserPasswordManager() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [reason, setReason] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successPassword, setSuccessPassword] = useState<string | null>(null);

  const generatePassword = () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      toast({ title: "Enter a search term", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast({ title: "Not authenticated", variant: "destructive" });
        return;
      }

      const response = await supabase.functions.invoke("admin-set-password", {
        body: { action: "search", targetEmail: searchQuery },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      setUsers(response.data.users || []);
      if (response.data.users?.length === 0) {
        toast({ title: "No users found", description: "Try a different search term" });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({ 
        title: "Search failed", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const openPasswordDialog = (user: User) => {
    setSelectedUser(user);
    setNewPassword("");
    setReason("");
    setSuccessPassword(null);
    setIsDialogOpen(true);
  };

  const handleSetPassword = async () => {
    if (!selectedUser || !newPassword) return;

    if (newPassword.length < 8) {
      toast({ title: "Password too short", description: "Must be at least 8 characters", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await supabase.functions.invoke("admin-set-password", {
        body: { 
          action: "set-password", 
          targetEmail: selectedUser.email,
          newPassword,
          reason
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      setSuccessPassword(newPassword);
      toast({ title: "Password updated", description: `Password set for ${selectedUser.email}` });
    } catch (error) {
      console.error("Set password error:", error);
      toast({ 
        title: "Failed to set password", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedUser(null);
    setNewPassword("");
    setReason("");
    setSuccessPassword(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          User Password Management
        </CardTitle>
        <CardDescription>
          Search for users and set temporary passwords when magic links are blocked
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchUsers()}
            />
          </div>
          <Button onClick={searchUsers} disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            {loading ? "Searching..." : "Search"}
          </Button>
        </div>

        {users.length > 0 && (
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Sign In</TableHead>
                  <TableHead>Confirmed</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(user.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.last_sign_in_at 
                        ? format(new Date(user.last_sign_in_at), "MMM d, yyyy h:mm a")
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      {user.email_confirmed_at ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => openPasswordDialog(user)}>
                        <Key className="h-3 w-3 mr-1" />
                        Set Password
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Temporary Password</DialogTitle>
              <DialogDescription>
                Set a temporary password for <strong>{selectedUser?.email}</strong>
              </DialogDescription>
            </DialogHeader>

            {successPassword ? (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                    Password set successfully! Share this with the user:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-background border rounded px-3 py-2 text-sm font-mono">
                      {successPassword}
                    </code>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(successPassword)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Remind the user to change their password after logging in.
                  </p>
                </div>
                <DialogFooter>
                  <Button onClick={closeDialog}>Close</Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter or generate password"
                    />
                    <Button variant="outline" onClick={generatePassword} title="Generate random password">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                </div>

                <div className="space-y-2">
                  <Label>Reason (optional)</Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Why is this password being reset?"
                    rows={2}
                  />
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                  <Button 
                    onClick={handleSetPassword} 
                    disabled={!newPassword || newPassword.length < 8 || isSubmitting}
                  >
                    {isSubmitting ? "Setting..." : "Set Password"}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
