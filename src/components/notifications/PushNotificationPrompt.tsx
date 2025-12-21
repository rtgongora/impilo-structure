import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Bell, BellOff, CheckCircle, X } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

const PROMPT_SHOWN_KEY = "push_notification_prompt_shown";

export function PushNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const { isSupported, permission, requestPermission } = usePushNotifications();

  useEffect(() => {
    // Check if we should show the prompt
    if (!isSupported) return;
    if (permission === "granted" || permission === "denied") return;

    const promptShown = localStorage.getItem(PROMPT_SHOWN_KEY);
    if (promptShown) return;

    // Show prompt after a short delay on first login
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isSupported, permission]);

  const handleEnable = async () => {
    const granted = await requestPermission();
    localStorage.setItem(PROMPT_SHOWN_KEY, "true");
    setShowPrompt(false);

    if (granted) {
      toast.success("Push notifications enabled!");
    } else {
      toast.info("You can enable notifications later in your browser settings");
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(PROMPT_SHOWN_KEY, "true");
    setShowPrompt(false);
  };

  if (!isSupported || permission !== "default") {
    return null;
  }

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center">Enable Notifications</DialogTitle>
          <DialogDescription className="text-center">
            Stay informed about important updates like shift handoffs, critical
            alerts, and medication reminders.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Shift Handoff Alerts</p>
              <p className="text-xs text-muted-foreground">
                Get notified when a handoff is assigned to you
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Critical Lab Values</p>
              <p className="text-xs text-muted-foreground">
                Immediate alerts for critical patient results
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Medication Reminders</p>
              <p className="text-xs text-muted-foreground">
                Never miss a scheduled medication administration
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleEnable} className="w-full">
            <Bell className="h-4 w-4 mr-2" />
            Enable Notifications
          </Button>
          <Button variant="ghost" onClick={handleDismiss} className="w-full">
            <BellOff className="h-4 w-4 mr-2" />
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
