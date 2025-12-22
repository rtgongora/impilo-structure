import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Smartphone, 
  Monitor, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  Shield,
  Zap,
  Bell
} from "lucide-react";
import impiloLogo from "@/assets/impilo-logo.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    { icon: Zap, title: "Fast & Reliable", description: "Works instantly, even on slow connections" },
    { icon: WifiOff, title: "Offline Ready", description: "Access patient data without internet" },
    { icon: Bell, title: "Push Notifications", description: "Get alerts for critical results" },
    { icon: Shield, title: "Secure", description: "Same security as the web app" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src={impiloLogo} alt="Impilo" className="h-12 w-auto" />
            </div>
            <p className="text-xl text-muted-foreground">
              Install the app on your device for the best experience
            </p>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center mb-8">
            {isOnline ? (
              <Badge className="bg-green-500 px-4 py-2">
                <Wifi className="w-4 h-4 mr-2" />
                Online
              </Badge>
            ) : (
              <Badge variant="destructive" className="px-4 py-2">
                <WifiOff className="w-4 h-4 mr-2" />
                Offline Mode
              </Badge>
            )}
          </div>

          {/* Main Card */}
          <Card className="mb-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {isInstalled ? "App Installed!" : "Install Impilo"}
              </CardTitle>
              <CardDescription>
                {isInstalled 
                  ? "You're all set! Access Impilo from your home screen."
                  : "Add Impilo to your home screen for quick access"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isInstalled ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium">Successfully Installed</p>
                  <p className="text-muted-foreground">
                    Open the app from your home screen or app drawer
                  </p>
                </div>
              ) : deferredPrompt ? (
                <div className="text-center py-4">
                  <Button size="lg" onClick={handleInstall} className="gap-2">
                    <Download className="w-5 h-5" />
                    Install Now
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center text-muted-foreground">
                    <p className="mb-4">To install Impilo on your device:</p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Smartphone className="w-8 h-8 text-primary" />
                          <h3 className="font-semibold">Mobile (iOS/Android)</h3>
                        </div>
                        <ol className="text-sm text-muted-foreground space-y-2">
                          <li>1. Tap the Share button in your browser</li>
                          <li>2. Select "Add to Home Screen"</li>
                          <li>3. Tap "Add" to confirm</li>
                        </ol>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Monitor className="w-8 h-8 text-primary" />
                          <h3 className="font-semibold">Desktop (Chrome/Edge)</h3>
                        </div>
                        <ol className="text-sm text-muted-foreground space-y-2">
                          <li>1. Click the install icon in the address bar</li>
                          <li>2. Or open browser menu → "Install Impilo"</li>
                          <li>3. Click "Install" to confirm</li>
                        </ol>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {features.map((feature, i) => (
              <Card key={i}>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Install;
