import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendIdRequest {
  idType: 'impilo' | 'provider';
  recipientEmail: string;
  recipientName: string;
  recipientPhone?: string;
  idValue: string;
  tokenValue?: string;
  additionalInfo?: {
    clientRegistryId?: string;
    shrId?: string;
    registryId?: string;
  };
  deliveryMethod: 'email' | 'sms' | 'both';
}

const generateSecureEmailHtml = (
  idType: 'impilo' | 'provider',
  recipientName: string,
  idValue: string,
  tokenValue?: string,
  additionalInfo?: SendIdRequest['additionalInfo']
): string => {
  const isImpilo = idType === 'impilo';
  const idLabel = isImpilo ? 'Impilo ID (PHID)' : 'Provider ID (Varapi)';
  const brandColor = isImpilo ? '#059669' : '#7c3aed';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Secure ${idLabel}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5;">
        <tr>
          <td style="padding: 40px 20px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, ${brandColor}, ${isImpilo ? '#10b981' : '#8b5cf6'}); padding: 32px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                    🔐 Impilo Health Platform
                  </h1>
                  <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                    Secure ${idLabel} Delivery
                  </p>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 32px;">
                  <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                    Dear <strong>${recipientName}</strong>,
                  </p>
                  
                  <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                    Your ${idLabel} has been generated. Please keep this information secure as it provides access to your ${isImpilo ? 'health records' : 'professional credentials'}.
                  </p>
                  
                  <!-- ID Card -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 8px; border: 2px solid ${brandColor};">
                    <tr>
                      <td style="padding: 24px;">
                        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                          Your ${idLabel}
                        </p>
                        <p style="margin: 0 0 16px 0; color: #111827; font-size: 20px; font-weight: 700; font-family: 'Courier New', monospace; word-break: break-all;">
                          ${idValue}
                        </p>
                        
                        ${tokenValue ? `
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;">
                        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                          Easy Recall Token
                        </p>
                        <p style="margin: 0; color: ${brandColor}; font-size: 24px; font-weight: 700; font-family: 'Courier New', monospace;">
                          ${tokenValue}
                        </p>
                        <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">
                          Use this shorter code when needed
                        </p>
                        ` : ''}
                        
                        ${additionalInfo?.clientRegistryId ? `
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;">
                        <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 11px;">
                          Client Registry ID: <span style="color: #374151;">${additionalInfo.clientRegistryId}</span>
                        </p>
                        ` : ''}
                        
                        ${additionalInfo?.shrId ? `
                        <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 11px;">
                          SHR ID: <span style="color: #374151;">${additionalInfo.shrId}</span>
                        </p>
                        ` : ''}
                        
                        ${additionalInfo?.registryId ? `
                        <p style="margin: 0; color: #6b7280; font-size: 11px;">
                          Registry ID: <span style="color: #374151;">${additionalInfo.registryId}</span>
                        </p>
                        ` : ''}
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Biometric Notice -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px; background-color: #fef3c7; border-radius: 8px;">
                    <tr>
                      <td style="padding: 16px;">
                        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                          <strong>🔒 Biometric Recovery:</strong> Your ${isImpilo ? 'fingerprint, facial scan, or iris' : 'biometrics'} can be used to recover this ID if forgotten. ${isImpilo ? 'Biometrics = PHID' : 'Biometrics = Provider ID'}.
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Security Tips -->
                  <div style="margin-top: 24px; padding: 16px; background-color: #f0fdf4; border-radius: 8px;">
                    <p style="margin: 0 0 8px 0; color: #166534; font-size: 14px; font-weight: 600;">
                      🛡️ Security Tips:
                    </p>
                    <ul style="margin: 0; padding-left: 20px; color: #166534; font-size: 13px; line-height: 1.6;">
                      <li>Keep this email in a secure folder</li>
                      <li>Do not share your ID with unauthorized persons</li>
                      <li>Register your biometrics for easy recovery</li>
                      <li>Contact support if you suspect unauthorized access</li>
                    </ul>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;">
                    This is an automated message from Impilo Health Platform
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                    © ${new Date().getFullYear()} Impilo Health. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-secure-id function invoked");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: SendIdRequest = await req.json();
    console.log("Request data:", { 
      idType: requestData.idType, 
      recipientEmail: requestData.recipientEmail,
      deliveryMethod: requestData.deliveryMethod 
    });

    const { 
      idType, 
      recipientEmail, 
      recipientName, 
      recipientPhone,
      idValue, 
      tokenValue, 
      additionalInfo,
      deliveryMethod 
    } = requestData;

    // Validate required fields
    if (!idType || !recipientEmail || !recipientName || !idValue) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields: idType, recipientEmail, recipientName, idValue" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const results: { email?: any; sms?: any } = {};

    // Send email if requested
    if (deliveryMethod === 'email' || deliveryMethod === 'both') {
      const idLabel = idType === 'impilo' ? 'Impilo ID (PHID)' : 'Provider ID (Varapi)';
      
      const emailHtml = generateSecureEmailHtml(
        idType,
        recipientName,
        idValue,
        tokenValue,
        additionalInfo
      );

      console.log("Sending email to:", recipientEmail);
      
      const emailResponse = await resend.emails.send({
        from: "Impilo Health <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: `🔐 Your Secure ${idLabel} - Impilo Health Platform`,
        html: emailHtml,
      });

      console.log("Email sent successfully:", emailResponse);
      results.email = emailResponse;
    }

    // SMS would be sent here if requested (requires SMS provider integration)
    if ((deliveryMethod === 'sms' || deliveryMethod === 'both') && recipientPhone) {
      console.log("SMS delivery requested for:", recipientPhone);
      // SMS integration would go here (e.g., Twilio, MessageBird)
      results.sms = { 
        status: 'pending', 
        message: 'SMS delivery requires additional provider integration' 
      };
    }

    // Log the ID delivery for audit
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from('id_generation_logs').insert({
      entity_type: idType === 'impilo' ? 'patient_id_delivery' : 'provider_id_delivery',
      generated_id: idValue,
      id_format: idType === 'impilo' ? 'PHID' : 'VARAPI',
      generation_method: 'secure_delivery',
      metadata: {
        delivery_method: deliveryMethod,
        recipient_email: recipientEmail,
        recipient_phone: recipientPhone || null,
        token_included: !!tokenValue,
        delivered_at: new Date().toISOString()
      }
    });

    console.log("Audit log created for ID delivery");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${idType === 'impilo' ? 'Impilo' : 'Provider'} ID sent successfully`,
        results 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-secure-id function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
