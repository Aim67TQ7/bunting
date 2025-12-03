import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Cookie, Settings, Shield } from "lucide-react";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  preferences: boolean;
  consentTimestamp: string;
}

const CONSENT_KEY = "gdpr_cookie_consent";
const CONSENT_EXPIRY_MONTHS = 12;

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    preferences: false,
    consentTimestamp: "",
  });

  useEffect(() => {
    const storedConsent = localStorage.getItem(CONSENT_KEY);
    
    if (storedConsent) {
      try {
        const parsed = JSON.parse(storedConsent) as CookiePreferences;
        const consentDate = new Date(parsed.consentTimestamp);
        const expiryDate = new Date(consentDate);
        expiryDate.setMonth(expiryDate.getMonth() + CONSENT_EXPIRY_MONTHS);
        
        if (new Date() > expiryDate) {
          // Consent expired, show banner again
          setShowBanner(true);
        } else {
          setPreferences(parsed);
        }
      } catch {
        setShowBanner(true);
      }
    } else {
      setShowBanner(true);
    }
  }, []);

  const saveConsent = (prefs: Omit<CookiePreferences, "consentTimestamp">) => {
    const fullPrefs: CookiePreferences = {
      ...prefs,
      necessary: true, // Always true
      consentTimestamp: new Date().toISOString(),
    };
    
    localStorage.setItem(CONSENT_KEY, JSON.stringify(fullPrefs));
    setPreferences(fullPrefs);
    setShowBanner(false);
    setShowCustomize(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      preferences: true,
    });
  };

  const handleRejectNonEssential = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      preferences: false,
    });
  };

  const handleSaveCustom = () => {
    saveConsent({
      necessary: true,
      analytics: preferences.analytics,
      preferences: preferences.preferences,
    });
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg">
      <div className="max-w-4xl mx-auto">
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Cookie className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Cookie Consent</CardTitle>
            </div>
            <CardDescription className="text-sm">
              We use cookies to enhance your experience, analyze site traffic, and for security. 
              Under GDPR regulations, we require your consent to use non-essential cookies.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleAcceptAll} className="gap-2">
                  <Shield className="h-4 w-4" />
                  Accept All
                </Button>
                <Button variant="outline" onClick={handleRejectNonEssential}>
                  Reject Non-Essential
                </Button>
                <Dialog open={showCustomize} onOpenChange={setShowCustomize}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="gap-2">
                      <Settings className="h-4 w-4" />
                      Customize
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Cookie className="h-5 w-5" />
                        Cookie Preferences
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      {/* Necessary Cookies */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="font-medium">Necessary Cookies</Label>
                          <p className="text-xs text-muted-foreground">
                            Required for the website to function. Cannot be disabled.
                          </p>
                        </div>
                        <Switch checked disabled />
                      </div>
                      
                      {/* Analytics Cookies */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="font-medium">Analytics Cookies</Label>
                          <p className="text-xs text-muted-foreground">
                            Help us understand how visitors interact with our website.
                          </p>
                        </div>
                        <Switch
                          checked={preferences.analytics}
                          onCheckedChange={(checked) =>
                            setPreferences((prev) => ({ ...prev, analytics: checked }))
                          }
                        />
                      </div>
                      
                      {/* Preference Cookies */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="font-medium">Preference Cookies</Label>
                          <p className="text-xs text-muted-foreground">
                            Remember your settings and preferences for future visits.
                          </p>
                        </div>
                        <Switch
                          checked={preferences.preferences}
                          onCheckedChange={(checked) =>
                            setPreferences((prev) => ({ ...prev, preferences: checked }))
                          }
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowCustomize(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveCustom}>Save Preferences</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <a
                href="https://gdpr.eu/cookies/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary underline"
              >
                Learn more about cookies & GDPR
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
