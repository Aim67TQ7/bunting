
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        
        if (error) {
          setError(error.message);
          return;
        }

        // If no error, proceed to the settings page to complete profile
        setTimeout(() => {
          navigate("/settings");
        }, 2000);
      } catch (err) {
        console.error("Auth callback error:", err);
        setError("An unexpected error occurred during authentication");
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          {error ? (
            <>
              <h2 className="text-2xl font-bold text-destructive mb-4">Authentication Error</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => navigate("/auth")}>
                Return to Login
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-4">Completing Authentication</h2>
              <div className="flex justify-center mb-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <p className="text-muted-foreground">
                Please wait while we complete the authentication process...
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
