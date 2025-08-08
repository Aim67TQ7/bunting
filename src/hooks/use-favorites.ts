import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isDemoMode } from "@/utils/demoMode";

const DEMO_FAVORITES_KEY = "demo_favorites_v1";
const FAVORITES_EVENT = "favorites:updated";

type ToggleResult = "added" | "removed";

function getDemoFavorites(): string[] {
  try {
    const raw = localStorage.getItem(DEMO_FAVORITES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function setDemoFavorites(ids: string[]) {
  try {
    localStorage.setItem(DEMO_FAVORITES_KEY, JSON.stringify(ids.slice(0, 3)));
  } catch {}
}

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const emitUpdate = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(FAVORITES_EVENT));
    }
  };

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      if (isDemoMode()) {
        setFavorites(getDemoFavorites());
        return;
      }
      if (!user?.id) {
        setFavorites([]);
        return;
      }
      const { data, error } = await (supabase as any)
        .from("user_favorite_app_items")
        .select("app_item_id")
        .eq("user_id", user.id);
      if (error) throw error;
      setFavorites((data || []).map((r: any) => r.app_item_id));
    } catch (e) {
      console.error("Failed to load favorites", e);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  useEffect(() => {
    const onUpdated = () => fetchFavorites();
    if (typeof window !== "undefined") {
      window.addEventListener(FAVORITES_EVENT, onUpdated);
      return () => window.removeEventListener(FAVORITES_EVENT, onUpdated);
    }
  }, [fetchFavorites]);

  const isFavorite = useCallback(
    (id?: string) => (id ? favorites.includes(id) : false),
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (id: string): Promise<ToggleResult> => {
      if (!id) throw new Error("Missing app id");

      if (isDemoMode()) {
        const current = getDemoFavorites();
        if (current.includes(id)) {
          const next = current.filter((x) => x !== id);
          setDemoFavorites(next);
          setFavorites(next);
          emitUpdate();
          return "removed";
        }
        if (current.length >= 3) {
          const err: any = new Error("You can favorite up to 3 apps in demo mode.");
          err.code = "FAVORITE_LIMIT_EXCEEDED";
          throw err;
        }
        const next = [...current, id];
        setDemoFavorites(next);
        setFavorites(next);
        emitUpdate();
        return "added";
      }

      if (!user?.id) {
        const err: any = new Error("Please sign in to save favorites.");
        err.code = "AUTH_REQUIRED";
        throw err;
      }

      // Optimistic local update
      const currentlyFav = favorites.includes(id);
      if (currentlyFav) {
        setFavorites(favorites.filter((x) => x !== id));
        try {
          const { error } = await (supabase as any)
            .from("user_favorite_app_items")
            .delete()
            .eq("user_id", user.id)
            .eq("app_item_id", id);
          if (error) throw error;
          emitUpdate();
          return "removed";
        } catch (e) {
          console.error(e);
          // revert
          setFavorites((prev) => (prev.includes(id) ? prev : [...prev, id]));
          throw e;
        }
      } else {
        if (favorites.length >= 3) {
          const err: any = new Error("You can favorite up to 3 apps.");
          err.code = "FAVORITE_LIMIT_EXCEEDED";
          throw err;
        }
        setFavorites([...favorites, id]);
        try {
          const { error } = await (supabase as any)
            .from("user_favorite_app_items")
            .insert({ user_id: user.id, app_item_id: id });
          if (error) throw error;
          emitUpdate();
          return "added";
        } catch (e: any) {
          console.error(e);
          // revert
          setFavorites((prev) => prev.filter((x) => x !== id));
          throw e;
        }
      }
    },
    [favorites, user?.id]
  );

  return { favorites, loading, isFavorite, toggleFavorite };
}
