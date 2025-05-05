
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "default" | "outline" | "secondary";
}

export function ThemeToggle({ className, variant = "secondary" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={cn("h-9 w-9", className)}
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  );
}
