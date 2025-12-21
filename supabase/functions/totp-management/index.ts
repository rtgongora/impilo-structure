import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Base32 encoding/decoding for TOTP secrets
const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function generateRandomSecret(length = 20): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    result += base32Chars[bytes[i] % 32];
  }
  return result;
}

function base32Decode(encoded: string): ArrayBuffer {
  const cleaned = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const bits: number[] = [];
  
  for (const char of cleaned) {
    const val = base32Chars.indexOf(char);
    if (val === -1) continue;
    bits.push(...[...val.toString(2).padStart(5, '0')].map(Number));
  }
  
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, (i + 1) * 8).join(''), 2);
  }
  
  return bytes.buffer;
}

async function generateTOTP(secret: string, timeStep = 30, digits = 6): Promise<string> {
  const key = base32Decode(secret);
  const counter = Math.floor(Date.now() / 1000 / timeStep);
  
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  counterView.setBigUint64(0, BigInt(counter), false);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, counterBuffer);
  const signatureArray = new Uint8Array(signature);
  
  const offset = signatureArray[signatureArray.length - 1] & 0xf;
  const binary = 
    ((signatureArray[offset] & 0x7f) << 24) |
    ((signatureArray[offset + 1] & 0xff) << 16) |
    ((signatureArray[offset + 2] & 0xff) << 8) |
    (signatureArray[offset + 3] & 0xff);
  
  const otp = binary % Math.pow(10, digits);
  return otp.toString().padStart(digits, '0');
}

async function verifyTOTP(secret: string, token: string, window = 1): Promise<boolean> {
  const timeStep = 30;
  const currentCounter = Math.floor(Date.now() / 1000 / timeStep);
  
  for (let i = -window; i <= window; i++) {
    const counter = currentCounter + i;
    const counterBuffer = new ArrayBuffer(8);
    const counterView = new DataView(counterBuffer);
    counterView.setBigUint64(0, BigInt(counter), false);
    
    const key = base32Decode(secret);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, counterBuffer);
    const signatureArray = new Uint8Array(signature);
    
    const offset = signatureArray[signatureArray.length - 1] & 0xf;
    const binary = 
      ((signatureArray[offset] & 0x7f) << 24) |
      ((signatureArray[offset + 1] & 0xff) << 16) |
      ((signatureArray[offset + 2] & 0xff) << 8) |
      (signatureArray[offset + 3] & 0xff);
    
    const otp = (binary % 1000000).toString().padStart(6, '0');
    if (otp === token) {
      return true;
    }
  }
  
  return false;
}

function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    const code = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    codes.push(code.slice(0, 4) + '-' + code.slice(4));
  }
  return codes;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, token, email } = await req.json();
    console.log(`TOTP management action: ${action} for user: ${user.id}`);

    switch (action) {
      case 'generate': {
        // Generate new TOTP secret and backup codes
        const secret = generateRandomSecret();
        const backupCodes = generateBackupCodes();
        
        // Store temporarily (not enabled yet)
        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update({ 
            totp_secret: secret,
            backup_codes: backupCodes,
            totp_enabled: false 
          })
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Error storing TOTP secret:', updateError);
          throw updateError;
        }

        // Generate OTP URI for QR code
        const issuer = 'Impilo EHR';
        const accountName = user.email || 'user';
        const otpUri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

        return new Response(JSON.stringify({ 
          secret,
          otpUri,
          backupCodes 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'verify': {
        // Verify TOTP and enable 2FA
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('totp_secret')
          .eq('user_id', user.id)
          .single();

        if (profileError || !profile?.totp_secret) {
          return new Response(JSON.stringify({ error: 'No TOTP secret found' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const isValid = await verifyTOTP(profile.totp_secret, token);
        
        if (!isValid) {
          return new Response(JSON.stringify({ error: 'Invalid verification code' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Enable 2FA
        const { error: enableError } = await supabaseClient
          .from('profiles')
          .update({ totp_enabled: true })
          .eq('user_id', user.id);

        if (enableError) {
          throw enableError;
        }

        // Log security event
        await supabaseClient.from('security_events').insert({
          user_id: user.id,
          email: user.email,
          event_type: '2fa_enabled',
          severity: 'info',
          details: { method: 'totp' },
        });

        console.log(`2FA enabled for user: ${user.id}`);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'validate': {
        // Validate TOTP during login (called with email for users not yet authenticated)
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('totp_secret, totp_enabled, backup_codes, user_id')
          .eq('user_id', user.id)
          .single();

        if (profileError || !profile?.totp_secret || !profile.totp_enabled) {
          return new Response(JSON.stringify({ error: '2FA not enabled' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if it's a backup code
        if (token.includes('-') && profile.backup_codes?.includes(token)) {
          // Remove used backup code
          const updatedCodes = profile.backup_codes.filter((c: string) => c !== token);
          await supabaseClient
            .from('profiles')
            .update({ backup_codes: updatedCodes })
            .eq('user_id', user.id);

          await supabaseClient.from('security_events').insert({
            user_id: user.id,
            email: user.email,
            event_type: '2fa_backup_code_used',
            severity: 'warning',
            details: { remaining_codes: updatedCodes.length },
          });

          return new Response(JSON.stringify({ success: true, backup_code_used: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const isValid = await verifyTOTP(profile.totp_secret, token);

        if (!isValid) {
          await supabaseClient.from('security_events').insert({
            user_id: user.id,
            email: user.email,
            event_type: '2fa_failed',
            severity: 'warning',
            details: {},
          });

          return new Response(JSON.stringify({ error: 'Invalid code' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'disable': {
        // Disable 2FA
        const { error: disableError } = await supabaseClient
          .from('profiles')
          .update({ 
            totp_enabled: false,
            totp_secret: null,
            backup_codes: null 
          })
          .eq('user_id', user.id);

        if (disableError) {
          throw disableError;
        }

        await supabaseClient.from('security_events').insert({
          user_id: user.id,
          email: user.email,
          event_type: '2fa_disabled',
          severity: 'warning',
          details: {},
        });

        console.log(`2FA disabled for user: ${user.id}`);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'check': {
        // Check if user has 2FA enabled
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('totp_enabled')
          .eq('user_id', user.id)
          .single();

        return new Response(JSON.stringify({ 
          enabled: profile?.totp_enabled || false 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error: unknown) {
    console.error('TOTP management error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
