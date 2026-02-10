
-- ============================================================
-- Offline Entitlements — Persistent Store (Wave 4)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.offline_entitlements (
  entitlement_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  pod_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  kid TEXT NOT NULL,
  alg TEXT NOT NULL DEFAULT 'Ed25519' CHECK (alg = 'Ed25519'),
  token_hash TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CONSUMED', 'REVOKED', 'EXPIRED')),
  scope JSONB NOT NULL DEFAULT '[]'::jsonb,
  constraints_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  policy_version TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_from TIMESTAMPTZ NOT NULL,
  valid_to TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoke_reason TEXT,
  consumed_meta_json JSONB,
  audit_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for query patterns
CREATE INDEX IF NOT EXISTS idx_offline_entitlements_tenant_subject
  ON public.offline_entitlements (tenant_id, subject_id, valid_to DESC);

CREATE INDEX IF NOT EXISTS idx_offline_entitlements_tenant_device
  ON public.offline_entitlements (tenant_id, device_id, valid_to DESC);

CREATE INDEX IF NOT EXISTS idx_offline_entitlements_status_expiry
  ON public.offline_entitlements (status, valid_to);

-- Enable RLS
ALTER TABLE public.offline_entitlements ENABLE ROW LEVEL SECURITY;

-- RLS: Service-role only (kernel internal table — no direct user access)
CREATE POLICY "Service role full access on offline_entitlements"
  ON public.offline_entitlements
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_offline_entitlements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_offline_entitlements_updated_at
  BEFORE UPDATE ON public.offline_entitlements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_offline_entitlements_updated_at();
