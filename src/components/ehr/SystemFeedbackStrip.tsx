import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SystemMessage {
  id: string;
  type: "error" | "warning" | "success" | "info";
  message: string;
  timestamp: Date;
  dismissible: boolean;
  action?: { label: string; onClick: () => void };
}

const typeConfig = {
  error: {
    bg: "bg-destructive/10",
    border: "border-destructive/20",
    text: "text-destructive",
    icon: AlertCircle,
  },
  warning: {
    bg: "bg-warning/10",
    border: "border-warning/20",
    text: "text-warning",
    icon: AlertCircle,
  },
  success: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-600",
    icon: CheckCircle2,
  },
  info: {
    bg: "bg-primary/10",
    border: "border-primary/20",
    text: "text-primary",
    icon: Info,
  },
};

export function SystemFeedbackStrip() {
  const [messages, setMessages] = useState<SystemMessage[]>([]);

  // Listen for system-level events
  useEffect(() => {
    const handleOnline = () => {
      setMessages((prev) => prev.filter((m) => m.id !== "offline"));
      addMessage({
        id: "online-" + Date.now(),
        type: "success",
        message: "Connection restored",
        timestamp: new Date(),
        dismissible: true,
      });
    };

    const handleOffline = () => {
      addMessage({
        id: "offline",
        type: "error",
        message: "Network connection lost — changes may not be saved",
        timestamp: new Date(),
        dismissible: false,
        action: {
          label: "Retry",
          onClick: () => window.location.reload(),
        },
      });
    };

    // Custom event listener for app-level system feedback
    const handleSystemFeedback = (e: CustomEvent<SystemMessage>) => {
      addMessage(e.detail);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("system-feedback", handleSystemFeedback as EventListener);

    // Check initial state
    if (!navigator.onLine) handleOffline();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("system-feedback", handleSystemFeedback as EventListener);
    };
  }, []);

  const addMessage = (msg: SystemMessage) => {
    setMessages((prev) => {
      const exists = prev.find((m) => m.id === msg.id);
      if (exists) return prev;
      return [...prev, msg];
    });

    // Auto-dismiss success/info after 6s
    if (msg.type === "success" || msg.type === "info") {
      setTimeout(() => dismiss(msg.id), 6000);
    }
  };

  const dismiss = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  if (messages.length === 0) return null;

  return (
    <div className="space-y-0">
      <AnimatePresence>
        {messages.map((msg) => {
          const config = typeConfig[msg.type];
          const Icon = config.icon;
          return (
            <motion.div
              key={msg.id}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn("flex items-center gap-2 px-3 py-1.5 text-xs border-b", config.bg, config.border)}
            >
              <Icon className={cn("h-3.5 w-3.5 shrink-0", config.text)} />
              <span className={cn("flex-1", config.text)}>{msg.message}</span>
              {msg.action && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("h-5 text-[10px] px-2", config.text)}
                  onClick={msg.action.onClick}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  {msg.action.label}
                </Button>
              )}
              {msg.dismissible && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => dismiss(msg.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// Helper to dispatch system feedback from anywhere in the app
export function dispatchSystemFeedback(msg: Omit<SystemMessage, "timestamp">) {
  window.dispatchEvent(
    new CustomEvent("system-feedback", {
      detail: { ...msg, timestamp: new Date() },
    })
  );
}
