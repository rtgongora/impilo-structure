import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RoleNotificationRequest {
  userId: string;
  oldRole: string;
  newRole: string;
  changedByName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, oldRole, newRole, changedByName }: RoleNotificationRequest = await req.json();

    console.log("Sending role notification for user:", userId);

    // Create Supabase client to get user email
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user email from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !userData?.user?.email) {
      console.error("Error fetching user:", userError);
      throw new Error("Could not find user email");
    }

    const userEmail = userData.user.email;
    console.log("Sending notification to:", userEmail);

    const emailResponse = await resend.emails.send({
      from: "Clinical EHR <onboarding@resend.dev>",
      to: [userEmail],
      subject: "Your Role Has Been Updated",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a; margin-bottom: 24px;">Role Change Notification</h1>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            Your role in the Clinical EHR system has been updated.
          </p>
          <div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 12px 0; color: #666;">
              <strong>Previous Role:</strong> <span style="color: #dc2626;">${oldRole}</span>
            </p>
            <p style="margin: 0; color: #666;">
              <strong>New Role:</strong> <span style="color: #16a34a;">${newRole}</span>
            </p>
          </div>
          <p style="color: #4a4a4a; font-size: 14px;">
            This change was made by <strong>${changedByName}</strong>.
          </p>
          <p style="color: #888; font-size: 12px; margin-top: 32px;">
            If you did not expect this change, please contact your administrator.
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-role-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
