import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if browser supports notifications
    if ("Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!isSupported || permission !== "granted") return null;

      try {
        const notification = new Notification(title, {
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          ...options,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        return notification;
      } catch (error) {
        console.error("Error sending notification:", error);
        return null;
      }
    },
    [isSupported, permission]
  );

  // Subscribe to handoff notifications
  useEffect(() => {
    if (!user?.id || permission !== "granted") return;

    const channel = supabase
      .channel("handoff-notifications")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "shift_handoffs",
          filter: `incoming_user_id=eq.${user.id}`,
        },
        (payload) => {
          const handoff = payload.new as any;
          
          if (handoff.status === "pending") {
            sendNotification("New Handoff Pending", {
              body: `You have a new shift handoff waiting for your acceptance.`,
              tag: `handoff-${handoff.id}`,
              requireInteraction: true,
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "shift_handoffs",
          filter: `incoming_user_id=eq.${user.id}`,
        },
        (payload) => {
          const handoff = payload.new as any;
          
          sendNotification("New Handoff Assigned", {
            body: `A new shift handoff has been assigned to you.`,
            tag: `handoff-${handoff.id}`,
            requireInteraction: true,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, permission, sendNotification]);

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
  };
}