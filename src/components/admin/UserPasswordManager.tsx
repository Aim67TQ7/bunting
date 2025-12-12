import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Key, Copy, RefreshCw, CheckCircle2, AlertCircle, X } from "lucide-react";
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
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successPassword, setSuccessPassword] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      setShowDropdown(true);
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

  const selectUser = (user: User) => {
    setSelectedUser(user);
    setShowDropdown(false);
    setNewPassword("");
    setReason("");
    setSuccessPassword(null);
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

  const clearSelection = () => {
    setSelectedUser(null);
    setNewPassword("");
    setReason("");
    setSuccessPassword(null);
  };

  return (
    <Card className="bg-card">
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
        {/* Search with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                className="bg-background"
              />
            </div>
            <Button onClick={searchUsers} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              {loading ? "..." : "Search"}
            </Button>
          </div>

          {/* Dropdown Results */}
          {showDropdown && users.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => selectUser(user)}
                  className="w-full px-4 py-3 text-left hover:bg-accent flex items-center justify-between border-b border-border last:border-b-0"
                >
                  <div>
                    <p className="font-medium text-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Last login: {user.last_sign_in_at 
                        ? format(new Date(user.last_sign_in_at), "MMM d, yyyy h:mm a")
                        : "Never"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.email_confirmed_at ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected User Panel */}
        {selectedUser && (
          <div className="border border-border rounded-lg p-4 bg-muted/50 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{selectedUser.email}</p>
                <p className="text-xs text-muted-foreground">
                  Created: {format(new Date(selectedUser.created_at), "MMM d, yyyy")} • 
                  Last login: {selectedUser.last_sign_in_at 
                    ? format(new Date(selectedUser.last_sign_in_at), "MMM d, yyyy")
                    : "Never"}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {successPassword ? (
              <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-2">
                  Password set successfully! Share this with the user:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm font-mono text-foreground">
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
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-foreground">New Password</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter or generate password"
                      className="bg-background"
                    />
                    <Button variant="outline" onClick={generatePassword} title="Generate random password">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Reason (optional)</Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Why is this password being reset?"
                    rows={2}
                    className="bg-background"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={clearSelection}>Cancel</Button>
                  <Button 
                    onClick={handleSetPassword} 
                    disabled={!newPassword || newPassword.length < 8 || isSubmitting}
                  >
                    {isSubmitting ? "Setting..." : "Set Password"}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
