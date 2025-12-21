import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not configured, skipping email");
      return new Response(
        JSON.stringify({ success: false, message: "Email service not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { eventType, email, userId, details } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user email if not provided
    let recipientEmail = email;
    if (!recipientEmail && userId) {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('display_name')
        .eq('user_id', userId)
        .single();
      
      // Get email from auth.users
      const { data: { users } } = await supabaseClient.auth.admin.listUsers();
      const user = users?.find(u => u.id === userId);
      recipientEmail = user?.email;
    }

    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ success: false, message: "Email address required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if notifications are enabled
    const { data: settings } = await supabaseClient
      .from("system_settings")
      .select("key, value")
      .in("key", ["session_expiry_notification", "security_alerts_enabled"]);

    const sessionNotification = settings?.find(s => s.key === "session_expiry_notification")?.value === "true";
    const securityAlerts = settings?.find(s => s.key === "security_alerts_enabled")?.value === "true";

    let subject = "";
    let htmlContent = "";

    const baseStyles = `
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
      .header h1 { color: white; margin: 0; font-size: 24px; }
      .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none; }
      .alert { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 15px 0; }
      .danger { background: #fee2e2; border-color: #dc2626; }
      .info-list { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0; }
      .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
    `;

    switch (eventType) {
      case "new_login":
        if (!securityAlerts) {
          return new Response(
            JSON.stringify({ success: false, message: "Security alerts disabled" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        subject = "New login to your Impilo EHR account";
        htmlContent = `
          <html><head><style>${baseStyles}</style></head><body>
            <div class="header"><h1>New Login Detected</h1></div>
            <div class="content">
              <p>A new login to your account was detected:</p>
              <div class="info-list">
                <p><strong>Device:</strong> ${details?.device || "Unknown"}</p>
                <p><strong>Browser:</strong> ${details?.browser || "Unknown"}</p>
                <p><strong>IP Address:</strong> ${details?.ipAddress || "Unknown"}</p>
                <p><strong>Location:</strong> ${details?.location || "Unknown"}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <p>If this was you, you can ignore this message.</p>
              <div class="alert danger">
                <strong>Not you?</strong> Secure your account immediately by changing your password.
              </div>
            </div>
            <div class="footer">© ${new Date().getFullYear()} Impilo EHR</div>
          </body></html>
        `;
        break;

      case "password_changed":
        subject = "Your Impilo EHR password was changed";
        htmlContent = `
          <html><head><style>${baseStyles}</style></head><body>
            <div class="header"><h1>Password Changed</h1></div>
            <div class="content">
              <p>Your account password was successfully changed.</p>
              <div class="info-list">
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>IP Address:</strong> ${details?.ipAddress || "Unknown"}</p>
              </div>
              <div class="alert danger">
                <strong>Didn't make this change?</strong> Contact support immediately.
              </div>
            </div>
            <div class="footer">© ${new Date().getFullYear()} Impilo EHR</div>
          </body></html>
        `;
        break;

      case "2fa_enabled":
        subject = "Two-factor authentication enabled on your account";
        htmlContent = `
          <html><head><style>${baseStyles}</style></head><body>
            <div class="header"><h1>2FA Enabled</h1></div>
            <div class="content">
              <p>Two-factor authentication has been enabled on your account.</p>
              <p>Your account is now more secure. You'll need to enter a code from your authenticator app each time you log in.</p>
              <div class="alert">
                <strong>Keep your backup codes safe!</strong> You'll need them if you lose access to your authenticator app.
              </div>
            </div>
            <div class="footer">© ${new Date().getFullYear()} Impilo EHR</div>
          </body></html>
        `;
        break;

      case "2fa_disabled":
        subject = "⚠️ Two-factor authentication disabled";
        htmlContent = `
          <html><head><style>${baseStyles}</style></head><body>
            <div class="header"><h1>2FA Disabled</h1></div>
            <div class="content">
              <div class="alert danger">
                <strong>Warning:</strong> Two-factor authentication has been disabled on your account.
              </div>
              <p>Your account is now less secure. We recommend re-enabling 2FA.</p>
              <div class="info-list">
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <p>If you didn't make this change, secure your account immediately.</p>
            </div>
            <div class="footer">© ${new Date().getFullYear()} Impilo EHR</div>
          </body></html>
        `;
        break;

      case "force_password_reset":
        subject = "⚠️ Password reset required";
        htmlContent = `
          <html><head><style>${baseStyles}</style></head><body>
            <div class="header"><h1>Password Reset Required</h1></div>
            <div class="content">
              <div class="alert danger">
                <strong>Action Required:</strong> An administrator has required you to change your password.
              </div>
              <p><strong>Reason:</strong> ${details?.reason || "Security policy"}</p>
              <p>You will be prompted to change your password when you next log in.</p>
            </div>
            <div class="footer">© ${new Date().getFullYear()} Impilo EHR</div>
          </body></html>
        `;
        break;

      case "session_expired":
        if (!sessionNotification) {
          return new Response(
            JSON.stringify({ success: false, message: "Session notifications disabled" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        subject = "Your session has expired";
        htmlContent = `
          <html><head><style>${baseStyles}</style></head><body>
            <div class="header"><h1>Session Expired</h1></div>
            <div class="content">
              <p>Your session has been terminated due to inactivity.</p>
              <div class="info-list">
                <p><strong>Device:</strong> ${details?.device || "Unknown"}</p>
                <p><strong>Location:</strong> ${details?.location || "Unknown"}</p>
                <p><strong>Expired at:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <p>Please log in again to continue.</p>
            </div>
            <div class="footer">© ${new Date().getFullYear()} Impilo EHR</div>
          </body></html>
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
          <html><head><style>${baseStyles}</style></head><body>
            <div class="header"><h1>Account Locked</h1></div>
            <div class="content">
              <div class="alert danger">
                <strong>Security Alert:</strong> Your account has been temporarily locked.
              </div>
              <div class="info-list">
                <p><strong>Locked until:</strong> ${details?.unlockAt ? new Date(details.unlockAt).toLocaleString() : "Unknown"}</p>
                <p><strong>Reason:</strong> ${details?.reason || "Excessive failed login attempts"}</p>
              </div>
              <p>If this wasn't you, please contact support immediately.</p>
            </div>
            <div class="footer">© ${new Date().getFullYear()} Impilo EHR</div>
          </body></html>
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
          <html><head><style>${baseStyles}</style></head><body>
            <div class="header"><h1>Suspicious Activity</h1></div>
            <div class="content">
              <div class="alert danger">
                <strong>Warning:</strong> Unusual activity was detected on your account.
              </div>
              <div class="info-list">
                <p><strong>Activity:</strong> ${details?.activity || "Unknown"}</p>
                <p><strong>IP Address:</strong> ${details?.ipAddress || "Unknown"}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <p>If this was you, you can ignore this message. Otherwise, secure your account immediately.</p>
            </div>
            <div class="footer">© ${new Date().getFullYear()} Impilo EHR</div>
          </body></html>
        `;
        break;

      default:
        return new Response(
          JSON.stringify({ success: false, message: "Unknown event type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Send email using Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Impilo EHR Security <onboarding@resend.dev>",
        to: [recipientEmail],
        subject,
        html: htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend API error:", errorData);
      throw new Error(errorData.message || "Failed to send email");
    }

    console.log("Security notification sent:", eventType);

    // Log the notification
    await supabaseClient.from("security_events").insert({
      event_type: `notification_${eventType}`,
      severity: "info",
      email: recipientEmail,
      user_id: userId || null,
      details: { 
        message: `Security notification sent: ${eventType}`
      }
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in send-security-notification function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
