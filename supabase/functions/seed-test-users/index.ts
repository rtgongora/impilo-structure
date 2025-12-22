import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const testUsers = [
  {
    email: 'sarah.moyo@impilo.health',
    password: 'Impilo2025!',
    displayName: 'Dr. Sarah Moyo',
    role: 'doctor',
    specialty: 'Internal Medicine',
    department: 'Medicine',
    providerId: 'VARAPI-2025-ZW000001-A1B2',
    facilityId: 'GOFR-ZA-001'
  },
  {
    email: 'tendai.ncube@impilo.health',
    password: 'Impilo2025!',
    displayName: 'Dr. Tendai Ncube',
    role: 'doctor',
    specialty: 'Emergency Medicine',
    department: 'Emergency',
    providerId: 'VARAPI-2025-ZW000002-C3D4',
    facilityId: 'GOFR-ZA-001'
  },
  {
    email: 'grace.mutasa@impilo.health',
    password: 'Impilo2025!',
    displayName: 'Sr. Grace Mutasa',
    role: 'nurse',
    specialty: 'Critical Care',
    department: 'ICU',
    providerId: 'VARAPI-2025-ZW000003-E5F6',
    facilityId: 'GOFR-ZA-001'
  },
  {
    email: 'farai.chikwava@impilo.health',
    password: 'Impilo2025!',
    displayName: 'Dr. Farai Chikwava',
    role: 'doctor',
    specialty: 'Pediatrics',
    department: 'Paediatrics',
    providerId: 'VARAPI-2025-ZW000004-G7H8',
    facilityId: 'GOFR-ZA-002'
  },
  {
    email: 'rumbi.mhaka@impilo.health',
    password: 'Impilo2025!',
    displayName: 'Pharm. Rumbidzai Mhaka',
    role: 'pharmacist',
    specialty: 'Clinical Pharmacy',
    department: 'Pharmacy',
    providerId: 'VARAPI-2025-ZW000005-I9J0',
    facilityId: 'GOFR-ZA-001'
  },
  {
    email: 'admin@impilo.health',
    password: 'ImpiloAdmin2025!',
    displayName: 'System Administrator',
    role: 'admin',
    specialty: null,
    department: 'IT',
    providerId: null,
    facilityId: 'GOFR-ZA-001',
    isAdmin: true
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const results: { email: string; success: boolean; error?: string; userId?: string }[] = [];

    for (const user of testUsers) {
      try {
        // Create user in auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            display_name: user.displayName,
            role: user.role,
            specialty: user.specialty,
            department: user.department
          }
        });

        if (authError) {
          // Check if user already exists
          if (authError.message.includes('already been registered')) {
            results.push({ email: user.email, success: false, error: 'User already exists' });
            continue;
          }
          throw authError;
        }

        const userId = authData.user.id;

        // Update profile with provider ID and facility
        await supabaseAdmin
          .from('profiles')
          .update({
            provider_registry_id: user.providerId,
            facility_id: user.facilityId,
            license_number: user.providerId ? user.providerId.split('-').slice(-2).join('-') : null
          })
          .eq('user_id', userId);

        // Link provider record to user
        if (user.providerId) {
          await supabaseAdmin
            .from('providers')
            .update({ user_id: userId })
            .eq('ihris_id', user.providerId);
        }

        // Add admin role if specified
        if (user.isAdmin) {
          await supabaseAdmin
            .from('user_roles')
            .insert({ user_id: userId, role: 'admin' });
        }

        results.push({ email: user.email, success: true, userId });
        console.log(`Created user: ${user.email}`);

      } catch (userError) {
        console.error(`Error creating user ${user.email}:`, userError);
        results.push({ 
          email: user.email, 
          success: false, 
          error: userError instanceof Error ? userError.message : 'Unknown error' 
        });
      }
    }

    return new Response(JSON.stringify({ 
      message: 'Test users seeding complete',
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Seed users error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
