import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.log("RESEND_API_KEY not configured, skipping email");
      return new Response(
        JSON.stringify({ success: false, message: "Email service not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendKey);
    const { eventType, email, details } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if notifications are enabled
    const { data: settings } = await supabaseClient
      .from("system_settings")
      .select("key, value")
      .in("key", ["session_expiry_notification", "security_alerts_enabled"]);

    const sessionNotification = settings?.find(s => s.key === "session_expiry_notification")?.value === "true";
    const securityAlerts = settings?.find(s => s.key === "security_alerts_enabled")?.value === "true";

    let subject = "";
    let htmlContent = "";

    switch (eventType) {
      case "session_expired":
        if (!sessionNotification) {
          return new Response(
            JSON.stringify({ success: false, message: "Session notifications disabled" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        subject = "Your session has expired";
        htmlContent = `
          <h1>Session Expired</h1>
          <p>Your session has been terminated due to inactivity.</p>
          <p>For your security, please log in again to continue using the application.</p>
          <p><strong>Details:</strong></p>
          <ul>
            <li>Device: ${details?.device || "Unknown"}</li>
            <li>Location: ${details?.location || "Unknown"}</li>
            <li>Expired at: ${new Date().toLocaleString()}</li>
          </ul>
          <p>If you did not expect this, please contact your system administrator.</p>
        `;
        break;

      case "account_locked":
        if (!securityAlerts) {
          return new Response(
            JSON.stringify({ success: false, message: "Security alerts disabled" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        subject = "⚠️ Security Alert: Account Locked";
        htmlContent = `
          <h1 style="color: #dc2626;">Security Alert</h1>
          <p>Your account has been temporarily locked due to multiple failed login attempts.</p>
          <p><strong>Details:</strong></p>
          <ul>
            <li>Locked until: ${details?.unlockAt ? new Date(details.unlockAt).toLocaleString() : "Unknown"}</li>
            <li>Reason: ${details?.reason || "Excessive failed login attempts"}</li>
          </ul>
          <p>If this wasn't you, please contact support immediately.</p>
        `;
        break;

      case "suspicious_activity":
        if (!securityAlerts) {
          return new Response(
            JSON.stringify({ success: false, message: "Security alerts disabled" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        subject = "⚠️ Security Alert: Suspicious Activity Detected";
        htmlContent = `
          <h1 style="color: #dc2626;">Suspicious Activity Detected</h1>
          <p>We detected unusual activity on your account.</p>
          <p><strong>Details:</strong></p>
          <ul>
            <li>Activity: ${details?.activity || "Unknown"}</li>
            <li>IP Address: ${details?.ipAddress || "Unknown"}</li>
            <li>Time: ${new Date().toLocaleString()}</li>
          </ul>
          <p>If this was you, you can ignore this message. Otherwise, please secure your account immediately.</p>
        `;
        break;

      default:
        return new Response(
          JSON.stringify({ success: false, message: "Unknown event type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, message: "Email address required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailResponse = await resend.emails.send({
      from: "Security <onboarding@resend.dev>",
      to: [email],
      subject,
      html: htmlContent,
    });

    console.log("Security notification sent:", emailResponse);

    // Log the notification
    await supabaseClient.from("security_events").insert({
      event_type: `notification_${eventType}`,
      severity: "info",
      email,
      details: { 
        message: `Security notification sent: ${eventType}`
      }
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-security-notification function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
