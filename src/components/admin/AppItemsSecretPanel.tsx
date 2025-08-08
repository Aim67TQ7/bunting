import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Category = "calculator" | "report" | "application" | "sales_tool";

interface AppItem {
  id: string;
  name: string;
  description: string;
  url: string;
  category: Category;
  is_active?: boolean;
  coming_soon?: boolean;
  requires_auth?: boolean;
  created_at?: string;
}

interface AppItemsSecretPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppItemsSecretPanel({ open, onOpenChange }: AppItemsSecretPanelProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AppItem[]>([]);

  // Minimal create form state
  const [form, setForm] = useState<Pick<AppItem, "name" | "description" | "url" | "category">>({
    name: "",
    description: "",
    url: "",
    category: "calculator",
  });
  const [isActive, setIsActive] = useState(true);

  const categoryOptions = useMemo(
    () => ["calculator", "report", "application", "sales_tool"],
    []
  );

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("app_items")
      .select("id, name, description, url, category, is_active, coming_soon, requires_auth, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Failed to load app items", description: error.message, variant: "destructive" });
    } else {
      setItems(data as AppItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleCreate = async () => {
    if (!form.name || !form.description || !form.url || !form.category) {
      toast({ title: "Missing fields", description: "Name, description, URL, and category are required." });
      return;
    }

    const { error } = await supabase.from("app_items").insert([
      {
        name: form.name,
        description: form.description,
        url: form.url,
        category: form.category,
        is_active: isActive,
      },
    ]);

    if (error) {
      toast({ title: "Create failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "App item added", description: `${form.name} created successfully.` });
      setForm({ name: "", description: "", url: "", category: "calculator" });
      setIsActive(true);
      fetchItems();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] sm:h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>App Items</SheetTitle>
        </SheetHeader>

        <div className="mt-4 grid gap-6">
          {/* Create new item */}
          <div className="grid gap-4 rounded-lg border p-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">URL</Label>
              <Input id="url" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as Category }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="z-[60]">
                  {categoryOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="active">Active</Label>
                <Button
                  id="active"
                  type="button"
                  variant={isActive ? "default" : "outline"}
                  onClick={() => setIsActive((v) => !v)}
                  aria-pressed={isActive}
                >
                  {isActive ? "Active" : "Inactive"}
                </Button>
              </div>
              <Button onClick={handleCreate}>Add New</Button>
            </div>
          </div>

          {/* Items table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5}>Loading…</TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>No app items found.</TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.is_active ? "Active" : "Inactive"}</TableCell>
                      <TableCell className="truncate max-w-[260px]">{item.url}</TableCell>
                      <TableCell>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
