import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Copy, QrCode, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const DEFAULT_PIN = "2034155";

export function BadgeQRGenerator() {
  const [copied, setCopied] = useState(false);
  const [baseUrl, setBaseUrl] = useState("https://buntinggpt.com");
  
  // Generate the deep link URL
  const deepLink = `${baseUrl}/auth?badge_pin=${DEFAULT_PIN}`;
  
  // QR code URL using a public QR code API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(deepLink)}`;
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(deepLink);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "The signup link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please manually copy the link.",
        variant: "destructive",
      });
    }
  };
  
  const handleDownloadQR = () => {
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = "badge-signup-qr-code.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "QR Code downloaded",
      description: "The QR code has been saved to your downloads.",
    });
  };
  
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Popup blocked",
        description: "Please allow popups to print the QR code.",
        variant: "destructive",
      });
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>BuntingGPT Badge Signup QR Code</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
            }
            .container {
              text-align: center;
              max-width: 400px;
            }
            h1 {
              color: #1a365d;
              margin-bottom: 10px;
            }
            p {
              color: #4a5568;
              margin-bottom: 20px;
            }
            img {
              border: 4px solid #1a365d;
              border-radius: 12px;
              padding: 10px;
              background: white;
            }
            .instructions {
              margin-top: 20px;
              padding: 15px;
              background: #f7fafc;
              border-radius: 8px;
              text-align: left;
            }
            .instructions h3 {
              margin-top: 0;
              color: #2d3748;
            }
            .instructions ol {
              margin: 0;
              padding-left: 20px;
            }
            .instructions li {
              margin: 8px 0;
              color: #4a5568;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>BuntingGPT</h1>
            <p>Scan this QR code to sign up for BuntingGPT</p>
            <img src="${qrCodeUrl}" alt="Signup QR Code" />
            <div class="instructions">
              <h3>Instructions:</h3>
              <ol>
                <li>Scan this QR code with your phone's camera</li>
                <li>Enter your employee badge number</li>
                <li>Tap "Create Account"</li>
                <li>Set your personal PIN (4-8 digits)</li>
                <li>You're ready to use BuntingGPT!</li>
              </ol>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Badge Signup QR Code
        </CardTitle>
        <CardDescription>
          Generate a QR code that employees can scan to quickly sign up for BuntingGPT using their badge number.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* URL Configuration */}
        <div className="space-y-2">
          <Label htmlFor="baseUrl">Base URL</Label>
          <Input
            id="baseUrl"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://buntinggpt.com"
          />
          <p className="text-xs text-muted-foreground">
            Change this for testing on different environments
          </p>
        </div>
        
        {/* QR Code Display */}
        <div className="flex flex-col items-center gap-4 p-6 bg-muted/30 rounded-lg">
          <img
            src={qrCodeUrl}
            alt="Badge Signup QR Code"
            className="w-64 h-64 border-4 border-primary/20 rounded-lg bg-white p-2"
          />
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            Employees scan this code → Enter badge number → Create account → Set personal PIN
          </p>
        </div>
        
        {/* Deep Link Display */}
        <div className="space-y-2">
          <Label>Signup Link</Label>
          <div className="flex gap-2">
            <Input
              value={deepLink}
              readOnly
              className="font-mono text-xs"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyLink}
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleDownloadQR} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download PNG
          </Button>
          <Button onClick={handlePrint} variant="outline">
            <QrCode className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleCopyLink} variant="outline">
            {copied ? <Check className="h-4 w-4 mr-2 text-green-600" /> : <Copy className="h-4 w-4 mr-2" />}
            Copy Link
          </Button>
        </div>
        
        {/* Instructions */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">How it works:</h4>
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
            <li>Print or display this QR code in common areas</li>
            <li>Employees scan the code with their phone camera</li>
            <li>They enter their badge number and tap "Create Account"</li>
            <li>They're prompted to set a personal 4-8 digit PIN</li>
            <li>Account is created - they can now log in anytime!</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
