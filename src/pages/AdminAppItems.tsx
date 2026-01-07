import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppItemIconUpload } from "@/components/admin/AppItemIconUpload";
import { UserPasswordManager } from "@/components/admin/UserPasswordManager";
import { BadgeQRGenerator } from "@/components/admin/BadgeQRGenerator";
import { Plus, Pencil, Trash2, Image, ExternalLink } from "lucide-react";

const ADMIN_EMAIL = "rclausing@buntingmagnetics.com";

type Category = "calculator" | "report" | "application" | "sales_tool";

interface AppItem {
  id: string;
  name: string;
  description: string;
  url: string;
  category: Category;
  icon_path: string | null;
  video_url: string | null;
  iframe_height: string | null;
  license: string | null;
  auth_type: string | null;
  auth_passcode: string | null;
  is_active: boolean | null;
  is_new: boolean | null;
  coming_soon: boolean | null;
  show_to_demo: boolean;
  requires_auth: boolean | null;
  created_at: string | null;
}

const defaultFormState = {
  name: "",
  description: "",
  url: "",
  category: "calculator" as Category,
  icon_path: "",
  video_url: "",
  iframe_height: "800px",
  license: "111-111",
  auth_type: "none",
  auth_passcode: "",
  is_active: true,
  is_new: false,
  coming_soon: false,
  show_to_demo: true,
  requires_auth: false,
};

export default function AdminAppItems() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [items, setItems] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<AppItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [form, setForm] = useState(defaultFormState);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const categoryOptions: Category[] = ["calculator", "report", "application", "sales_tool"];

  // Access control check
  useEffect(() => {
    if (user && user.email !== ADMIN_EMAIL) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, navigate, toast]);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("app_items")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      toast({ title: "Failed to load items", description: error.message, variant: "destructive" });
    } else {
      setItems(data as AppItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) {
      fetchItems();
    }
  }, [user]);

  const filteredItems = useMemo(() => {
    if (categoryFilter === "all") return items;
    return items.filter(item => item.category === categoryFilter);
  }, [items, categoryFilter]);

  const handleCreate = async () => {
    if (!form.name || !form.description || !form.url) {
      toast({ title: "Missing fields", description: "Name, description, and URL are required.", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("app_items").insert([{
      name: form.name,
      description: form.description,
      url: form.url,
      category: form.category,
      icon_path: form.icon_path || null,
      video_url: form.video_url || null,
      iframe_height: form.iframe_height || "800px",
      license: form.license || "111-111",
      auth_type: form.auth_type || "none",
      auth_passcode: form.auth_passcode || null,
      is_active: form.is_active,
      is_new: form.is_new,
      coming_soon: form.coming_soon,
      show_to_demo: form.show_to_demo,
      requires_auth: form.requires_auth,
    }]);

    if (error) {
      toast({ title: "Create failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `${form.name} created successfully.` });
      setForm(defaultFormState);
      setIsCreateOpen(false);
      fetchItems();
    }
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    
    const { error } = await supabase.from("app_items").update({
      name: form.name,
      description: form.description,
      url: form.url,
      category: form.category,
      icon_path: form.icon_path || null,
      video_url: form.video_url || null,
      iframe_height: form.iframe_height || "800px",
      license: form.license || "111-111",
      auth_type: form.auth_type || "none",
      auth_passcode: form.auth_passcode || null,
      is_active: form.is_active,
      is_new: form.is_new,
      coming_soon: form.coming_soon,
      show_to_demo: form.show_to_demo,
      requires_auth: form.requires_auth,
    }).eq("id", editingItem.id);

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `${form.name} updated successfully.` });
      setEditingItem(null);
      setIsEditOpen(false);
      fetchItems();
    }
  };

  const handleDelete = async (item: AppItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    const { error } = await supabase.from("app_items").delete().eq("id", item.id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: `${item.name} has been removed.` });
      fetchItems();
    }
  };

  const handleToggle = async (item: AppItem, field: "is_active" | "is_new" | "coming_soon" | "show_to_demo", value: boolean) => {
    setUpdatingIds(s => new Set(s).add(item.id));
    
    const { error } = await supabase.from("app_items").update({ [field]: value }).eq("id", item.id);
    
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, [field]: value } : i));
    }
    
    setUpdatingIds(s => {
      const n = new Set(s);
      n.delete(item.id);
      return n;
    });
  };

  const openEditDialog = (item: AppItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description,
      url: item.url,
      category: item.category,
      icon_path: item.icon_path || "",
      video_url: item.video_url || "",
      iframe_height: item.iframe_height || "800px",
      license: item.license || "111-111",
      auth_type: item.auth_type || "none",
      auth_passcode: item.auth_passcode || "",
      is_active: item.is_active ?? true,
      is_new: item.is_new ?? false,
      coming_soon: item.coming_soon ?? false,
      show_to_demo: item.show_to_demo ?? true,
      requires_auth: item.requires_auth ?? false,
    });
    setIsEditOpen(true);
  };

  const handleIconUploaded = (url: string) => {
    setForm(f => ({ ...f, icon_path: url }));
  };

  // Block render for non-admin users
  if (!user || user.email !== ADMIN_EMAIL) {
    return null;
  }

  const FormFields = () => (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="basic">Basic Info</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
        <TabsTrigger value="icon">Icon</TabsTrigger>
      </TabsList>
      
      <TabsContent value="basic" className="space-y-4 mt-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea id="description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="url">URL *</Label>
          <Input id="url" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as Category }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {categoryOptions.map(opt => (
                <SelectItem key={opt} value={opt}>{opt.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="video_url">Video URL (optional)</Label>
          <Input id="video_url" value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} />
        </div>
      </TabsContent>
      
      <TabsContent value="settings" className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="iframe_height">Iframe Height</Label>
            <Input id="iframe_height" value={form.iframe_height} onChange={e => setForm(f => ({ ...f, iframe_height: e.target.value }))} placeholder="800px" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="license">License</Label>
            <Input id="license" value={form.license} onChange={e => setForm(f => ({ ...f, license: e.target.value }))} placeholder="111-111" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Auth Type</Label>
            <Select value={form.auth_type} onValueChange={v => setForm(f => ({ ...f, auth_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="passcode">Passcode</SelectItem>
                <SelectItem value="token">Token</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="auth_passcode">Auth Passcode</Label>
            <Input id="auth_passcode" value={form.auth_passcode} onChange={e => setForm(f => ({ ...f, auth_passcode: e.target.value }))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>Active</Label>
            <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>New Badge</Label>
            <Switch checked={form.is_new} onCheckedChange={v => setForm(f => ({ ...f, is_new: v }))} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>Coming Soon</Label>
            <Switch checked={form.coming_soon} onCheckedChange={v => setForm(f => ({ ...f, coming_soon: v }))} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>Show to Demo</Label>
            <Switch checked={form.show_to_demo} onCheckedChange={v => setForm(f => ({ ...f, show_to_demo: v }))} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>Requires Auth</Label>
            <Switch checked={form.requires_auth} onCheckedChange={v => setForm(f => ({ ...f, requires_auth: v }))} />
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="icon" className="space-y-4 mt-4">
        <AppItemIconUpload 
          currentIconUrl={form.icon_path} 
          onIconUploaded={handleIconUploaded} 
        />
        <div className="grid gap-2">
          <Label htmlFor="icon_path">Icon URL (or upload above)</Label>
          <Input id="icon_path" value={form.icon_path} onChange={e => setForm(f => ({ ...f, icon_path: e.target.value }))} placeholder="https://..." />
        </div>
      </TabsContent>
    </Tabs>
  );

  return (
    <PageLayout title="Admin - App Items">
      <div className="p-4 md:p-6 space-y-6">
        <BadgeQRGenerator />
        <UserPasswordManager />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>App Items Management</CardTitle>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setForm(defaultFormState)}>
                  <Plus className="h-4 w-4 mr-2" /> Add New
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New App Item</DialogTitle>
                </DialogHeader>
                <FormFields />
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreate}>Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <Label>Filter by Category:</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categoryOptions.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground ml-auto">
                {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
              </span>
            </div>
            
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Icon</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-center">Active</TableHead>
                    <TableHead className="text-center">New</TableHead>
                    <TableHead className="text-center">Coming Soon</TableHead>
                    <TableHead className="text-center">Demo</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">Loading...</TableCell>
                    </TableRow>
                  ) : filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">No items found.</TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <label className="cursor-pointer group relative">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 2 * 1024 * 1024) {
                                  toast({ title: "File too large", description: "Max 2MB", variant: "destructive" });
                                  return;
                                }
                                setUpdatingIds(s => new Set(s).add(item.id));
                                const ext = file.name.split('.').pop();
                                const fileName = `${item.id}-${Date.now()}.${ext}`;
                                const { error: uploadError } = await supabase.storage
                                  .from('application_icons')
                                  .upload(fileName, file, { upsert: true });
                                if (uploadError) {
                                  toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
                                  setUpdatingIds(s => { const n = new Set(s); n.delete(item.id); return n; });
                                  return;
                                }
                                const { data: urlData } = supabase.storage.from('application_icons').getPublicUrl(fileName);
                                const { error: updateError } = await supabase
                                  .from('app_items')
                                  .update({ icon_path: urlData.publicUrl })
                                  .eq('id', item.id);
                                if (updateError) {
                                  toast({ title: "Update failed", description: updateError.message, variant: "destructive" });
                                } else {
                                  setItems(prev => prev.map(i => i.id === item.id ? { ...i, icon_path: urlData.publicUrl } : i));
                                }
                                setUpdatingIds(s => { const n = new Set(s); n.delete(item.id); return n; });
                                e.target.value = '';
                              }}
                            />
                            {item.icon_path ? (
                              <img 
                                src={item.icon_path} 
                                alt="" 
                                className="w-8 h-8 rounded object-cover group-hover:opacity-70 transition-opacity" 
                              />
                            ) : (
                              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center group-hover:bg-muted/70 transition-colors">
                                <Image className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            {updatingIds.has(item.id) && (
                              <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded">
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              </div>
                            )}
                          </label>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {item.name}
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{item.category.replace("_", " ")}</TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={!!item.is_active}
                            disabled={updatingIds.has(item.id)}
                            onCheckedChange={v => handleToggle(item, "is_active", v)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={!!item.is_new}
                            disabled={updatingIds.has(item.id)}
                            onCheckedChange={v => handleToggle(item, "is_new", v)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={!!item.coming_soon}
                            disabled={updatingIds.has(item.id)}
                            onCheckedChange={v => handleToggle(item, "coming_soon", v)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={!!item.show_to_demo}
                            disabled={updatingIds.has(item.id)}
                            onCheckedChange={v => handleToggle(item, "show_to_demo", v)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item)} className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit: {editingItem?.name}</DialogTitle>
            </DialogHeader>
            <FormFields />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdate}>Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
}
