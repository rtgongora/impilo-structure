import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Check if IP matches a single IP or CIDR range
function ipMatchesEntry(clientIp: string, entryIp: string, isRange: boolean): boolean {
  if (!isRange) {
    return clientIp === entryIp;
  }

  // Parse CIDR notation
  const [rangeIp, prefixLength] = entryIp.split('/');
  if (!prefixLength) return clientIp === entryIp;

  const prefix = parseInt(prefixLength, 10);
  
  // Convert IPs to binary for comparison
  const clientParts = clientIp.split('.').map(Number);
  const rangeParts = rangeIp.split('.').map(Number);
  
  if (clientParts.length !== 4 || rangeParts.length !== 4) {
    return false;
  }

  // Convert to 32-bit integers
  const clientInt = (clientParts[0] << 24) | (clientParts[1] << 16) | (clientParts[2] << 8) | clientParts[3];
  const rangeInt = (rangeParts[0] << 24) | (rangeParts[1] << 16) | (rangeParts[2] << 8) | rangeParts[3];
  
  // Create mask
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  
  return (clientInt & mask) === (rangeInt & mask);
}

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

    // Check IP whitelist setting
    const { data: whitelistSetting } = await supabaseClient
      .from("system_settings")
      .select("value")
      .eq("key", "ip_whitelist_enabled")
      .maybeSingle();

    const isWhitelistEnabled = whitelistSetting?.value === "true";

    if (isWhitelistEnabled && clientIp !== "unknown") {
      // Fetch all enabled whitelist entries
      const { data: whitelistEntries } = await supabaseClient
        .from("ip_whitelist")
        .select("ip_address, is_range")
        .eq("is_enabled", true);

      if (whitelistEntries && whitelistEntries.length > 0) {
        const isAllowed = whitelistEntries.some(entry => 
          ipMatchesEntry(clientIp, entry.ip_address, entry.is_range)
        );

        if (!isAllowed) {
          // Log security event for blocked IP
          await supabaseClient.from("security_events").insert({
            event_type: "ip_blocked",
            severity: "warning",
            email: email.toLowerCase(),
            ip_address: clientIp,
            user_agent: userAgent,
            details: { message: "Login attempt from non-whitelisted IP address" }
          });

          console.log(`Blocked login attempt from non-whitelisted IP: ${clientIp}`);

          return new Response(
            JSON.stringify({ 
              blocked: true,
              reason: "ip_not_whitelisted",
              message: "Access denied. Your IP address is not authorized to access this system."
            }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

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
