import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  resetLink: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, resetLink }: PasswordResetRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "Impilo EHR <onboarding@resend.dev>",
      to: [email],
      subject: "Reset Your Password - Impilo EHR",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 32px;">
                  <div style="width: 64px; height: 64px; background-color: #3b82f6; border-radius: 12px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                    <span style="color: #ffffff; font-weight: bold; font-size: 24px;">IM</span>
                  </div>
                  <h1 style="margin: 0; color: #18181b; font-size: 24px; font-weight: 600;">Reset Your Password</h1>
                </div>
                
                <p style="color: #52525b; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
                  You requested to reset your password for your Impilo EHR account. Click the button below to create a new password.
                </p>
                
                <div style="text-align: center; margin-bottom: 24px;">
                  <a href="${resetLink}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 500; font-size: 16px;">
                    Reset Password
                  </a>
                </div>
                
                <p style="color: #71717a; font-size: 14px; line-height: 20px; margin-bottom: 16px;">
                  This link will expire in 1 hour for security purposes.
                </p>
                
                <p style="color: #71717a; font-size: 14px; line-height: 20px;">
                  If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>
                
                <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">
                
                <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 0;">
                  Impilo EHR - Secure Clinical Teleconsultation Platform
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending password reset email:", error);
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
