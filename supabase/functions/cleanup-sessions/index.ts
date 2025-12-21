import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Configurable timeout in minutes (default 30 minutes)
const SESSION_TIMEOUT_MINUTES = 30;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Calculate the cutoff time
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - SESSION_TIMEOUT_MINUTES);
    
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
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        expiredSessionsCount: expiredCount,
        timeoutMinutes: SESSION_TIMEOUT_MINUTES,
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
