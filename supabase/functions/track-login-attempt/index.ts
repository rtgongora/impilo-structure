import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, success, userAgent } = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Record the login attempt
    await supabaseClient.from("login_attempts").insert({
      email: email.toLowerCase(),
      ip_address: clientIp,
      user_agent: userAgent,
      success
    });

    // If successful login, clear any lockout and return
    if (success) {
      await supabaseClient
        .from("account_lockouts")
        .delete()
        .eq("email", email.toLowerCase());
      
      // Log security event
      await supabaseClient.from("security_events").insert({
        event_type: "login_success",
        severity: "info",
        email: email.toLowerCase(),
        ip_address: clientIp,
        user_agent: userAgent,
        details: { message: "Successful login" }
      });

      return new Response(
        JSON.stringify({ locked: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get security settings
    const { data: settings } = await supabaseClient
      .from("system_settings")
      .select("key, value")
      .in("key", ["max_login_attempts", "lockout_duration_minutes", "security_alerts_enabled"]);

    const maxAttempts = parseInt(settings?.find(s => s.key === "max_login_attempts")?.value || "5", 10);
    const lockoutMinutes = parseInt(settings?.find(s => s.key === "lockout_duration_minutes")?.value || "30", 10);
    const alertsEnabled = settings?.find(s => s.key === "security_alerts_enabled")?.value === "true";

    // Check for existing lockout
    const { data: existingLockout } = await supabaseClient
      .from("account_lockouts")
      .select("*")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existingLockout) {
      const unlockAt = new Date(existingLockout.unlock_at);
      if (unlockAt > new Date()) {
        return new Response(
          JSON.stringify({ 
            locked: true, 
            unlockAt: existingLockout.unlock_at,
            message: `Account locked until ${unlockAt.toLocaleTimeString()}`
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // Lockout expired, remove it
        await supabaseClient
          .from("account_lockouts")
          .delete()
          .eq("email", email.toLowerCase());
      }
    }

    // Count recent failed attempts
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - 15); // 15 minute window

    const { count } = await supabaseClient
      .from("login_attempts")
      .select("*", { count: "exact", head: true })
      .eq("email", email.toLowerCase())
      .eq("success", false)
      .gte("created_at", windowStart.toISOString());

    const failedAttempts = (count || 0) + 1; // +1 for current attempt

    // Log security event
    await supabaseClient.from("security_events").insert({
      event_type: "login_failed",
      severity: failedAttempts >= maxAttempts ? "critical" : "warning",
      email: email.toLowerCase(),
      ip_address: clientIp,
      user_agent: userAgent,
      details: { 
        message: "Failed login attempt",
        attemptNumber: failedAttempts,
        maxAttempts
      }
    });

    // Check if we should lock the account
    if (failedAttempts >= maxAttempts) {
      const unlockAt = new Date();
      unlockAt.setMinutes(unlockAt.getMinutes() + lockoutMinutes);

      await supabaseClient.from("account_lockouts").upsert({
        email: email.toLowerCase(),
        locked_at: new Date().toISOString(),
        unlock_at: unlockAt.toISOString(),
        reason: `Exceeded ${maxAttempts} failed login attempts`
      }, { onConflict: "email" });

      // Log lockout event
      await supabaseClient.from("security_events").insert({
        event_type: "account_locked",
        severity: "critical",
        email: email.toLowerCase(),
        ip_address: clientIp,
        user_agent: userAgent,
        details: { 
          message: "Account locked due to excessive failed login attempts",
          lockoutMinutes,
          unlockAt: unlockAt.toISOString()
        }
      });

      // Send security alert if enabled
      if (alertsEnabled) {
        const resendKey = Deno.env.get("RESEND_API_KEY");
        if (resendKey) {
          // Get admin emails
          const { data: adminProfiles } = await supabaseClient
            .from("profiles")
            .select("user_id")
            .eq("role", "admin");

          if (adminProfiles && adminProfiles.length > 0) {
            // This would need auth.users access which we can't do directly
            // For now, log that we would send an alert
            console.log("Would send security alert to admins for account lockout:", email);
          }
        }
      }

      return new Response(
        JSON.stringify({ 
          locked: true, 
          unlockAt: unlockAt.toISOString(),
          message: `Account locked for ${lockoutMinutes} minutes due to too many failed attempts`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        locked: false,
        attemptsRemaining: maxAttempts - failedAttempts,
        message: `${maxAttempts - failedAttempts} attempts remaining before lockout`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in track-login-attempt function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
