import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Default timeout in minutes if not configured
const DEFAULT_SESSION_TIMEOUT_MINUTES = 30;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch the configurable timeout from system_settings
    let timeoutMinutes = DEFAULT_SESSION_TIMEOUT_MINUTES;
    
    const { data: settingsData, error: settingsError } = await supabaseClient
      .from("system_settings")
      .select("value")
      .eq("key", "session_timeout_minutes")
      .maybeSingle();

    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
    } else if (settingsData?.value) {
      const parsedValue = parseInt(String(settingsData.value), 10);
      if (!isNaN(parsedValue) && parsedValue > 0) {
        timeoutMinutes = parsedValue;
      }
    }

    console.log(`Using session timeout of ${timeoutMinutes} minutes`);

    // Calculate the cutoff time
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - timeoutMinutes);
    
    console.log(`Cleaning up sessions inactive since: ${cutoffTime.toISOString()}`);

    // Find and end inactive sessions
    const { data: expiredSessions, error: selectError } = await supabaseClient
      .from("user_sessions")
      .select("id, user_id")
      .eq("is_active", true)
      .lt("last_activity_at", cutoffTime.toISOString());

    if (selectError) {
      console.error("Error finding expired sessions:", selectError);
      return new Response(
        JSON.stringify({ error: "Failed to find expired sessions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const expiredCount = expiredSessions?.length || 0;
    console.log(`Found ${expiredCount} expired sessions`);

    if (expiredCount > 0) {
      const { error: updateError } = await supabaseClient
        .from("user_sessions")
        .update({ 
          is_active: false, 
          ended_at: new Date().toISOString() 
        })
        .eq("is_active", true)
        .lt("last_activity_at", cutoffTime.toISOString());

      if (updateError) {
        console.error("Error ending expired sessions:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to end expired sessions" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log(`Successfully cleaned up ${expiredCount} expired sessions`);

    // Also clean up expired trusted devices
    const now = new Date().toISOString();
    
    const { data: expiredDevices, error: deviceSelectError } = await supabaseClient
      .from("trusted_devices")
      .select("id")
      .or(`expires_at.lt.${now},is_active.eq.false`);

    if (deviceSelectError) {
      console.error("Error finding expired devices:", deviceSelectError);
    } else {
      const expiredDeviceCount = expiredDevices?.length || 0;
      console.log(`Found ${expiredDeviceCount} expired trusted devices`);

      if (expiredDeviceCount > 0) {
        const { error: deviceDeleteError } = await supabaseClient
          .from("trusted_devices")
          .delete()
          .or(`expires_at.lt.${now},is_active.eq.false`);

        if (deviceDeleteError) {
          console.error("Error deleting expired devices:", deviceDeleteError);
        } else {
          console.log(`Successfully cleaned up ${expiredDeviceCount} expired trusted devices`);
        }
      }
    }

    const expiredDeviceCount = expiredDevices?.length || 0;
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        expiredSessionsCount: expiredCount,
        expiredDevicesCount: expiredDeviceCount,
        timeoutMinutes: timeoutMinutes,
        cutoffTime: cutoffTime.toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in cleanup-sessions function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
