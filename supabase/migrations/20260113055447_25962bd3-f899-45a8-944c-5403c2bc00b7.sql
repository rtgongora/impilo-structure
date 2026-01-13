-- Step 1: Create all enum types first

DO $$ BEGIN
  CREATE TYPE public.privilege_type AS ENUM (
    'admitting', 'prescribing', 'surgery', 'anesthesia', 'radiology_order',
    'lab_order', 'blood_transfusion', 'controlled_substances', 'discharge',
    'death_certification', 'birth_notification', 'teaching', 'supervision'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.privilege_status AS ENUM (
    'active', 'suspended', 'expired', 'revoked', 'pending_approval'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.ownership_type AS ENUM (
    'sole', 'partnership', 'shareholder', 'trust', 'cooperative'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;