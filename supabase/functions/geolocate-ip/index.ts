import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "Session ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get client IP from headers
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    
    console.log(`Geolocating IP: ${clientIp} for session: ${sessionId}`);
    
    let location = "Unknown";
    
    // Use ip-api.com (free, no API key required)
    if (clientIp && clientIp !== "unknown" && clientIp !== "127.0.0.1" && clientIp !== "::1") {
      try {
        const geoResponse = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,message,country,city,regionName`);
        const geoData = await geoResponse.json();
        
        console.log("Geolocation response:", geoData);
        
        if (geoData.status === "success") {
          const parts = [geoData.city, geoData.regionName, geoData.country].filter(Boolean);
          location = parts.join(", ") || "Unknown";
        }
      } catch (geoError) {
        console.error("Geolocation API error:", geoError);
      }
    }

    // Update the session with IP and location
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error: updateError } = await supabaseClient
      .from("user_sessions")
      .update({ 
        ip_address: clientIp,
        location: location 
      })
      .eq("id", sessionId);

    if (updateError) {
      console.error("Error updating session:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Session ${sessionId} updated with location: ${location}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        ip: clientIp, 
        location 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in geolocate-ip function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
