/**
 * Impilo vNext v1.1 — Wave 4 Tests
 *
 * Offline Entitlements + BUTANO Events
 *
 * Run: npx vitest run src/lib/kernel/wave4/__tests__/wave4.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Wave 4: Offline Entitlements
import {
  issueEntitlement,
  verifyEntitlementOffline,
  generateSigningKey,
  clearKeyStore,
  clearEntitlementStore,
  getEntitlement,
  updateEntitlementStatus,
  ENTITLEMENT_ERRORS,
} from '../../offlineEntitlements';
import type { EntitlementIssuanceRequest } from '../../offlineEntitlements';

// Wave 4: BUTANO Events
import {
  emitButanoResourceCreated,
  emitButanoResourceUpdated,
  emitButanoReconcileCompleted,
} from '../../butano';

// Shared kernel
import type { KernelRequestContext } from '../../types';
import { clearEventStore, getStoredEvents } from '../../events/emitter';
import { clearAuditLedger, getAuditChain } from '../../audit/ledger';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCtx(overrides?: Partial<KernelRequestContext>): KernelRequestContext {
  return {
    tenantId: 'test-tenant',
    podId: 'national',
    requestId: crypto.randomUUID(),
    correlationId: crypto.randomUUID(),
    ...overrides,
  };
}

function futureDate(hoursFromNow: number): string {
  const d = new Date();
  d.setHours(d.getHours() + hoursFromNow);
  return d.toISOString();
}

function pastDate(hoursAgo: number): string {
  const d = new Date();
  d.setHours(d.getHours() - hoursAgo);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Wave 4 Tests
// ---------------------------------------------------------------------------

describe('Wave 4 — Offline Entitlements + BUTANO Events', () => {
  beforeEach(async () => {
    clearEventStore();
    clearAuditLedger();
    clearKeyStore();
    clearEntitlementStore();
    await generateSigningKey('test-key-1');
  });

  // =========================================================================
  // Offline Entitlements — Issuance
  // =========================================================================

  describe('Offline Entitlement Issuance', () => {
    it('should issue entitlement when PDP allows', async () => {
      const ctx = makeCtx();
      const request: EntitlementIssuanceRequest = {
        device_id: 'device-001',
        subject_id: 'prid-clinician-1',
        scope: ['clinical.capture.vitals'],
        valid_from: new Date().toISOString(),
        valid_to: futureDate(4),
        constraints: { facility_id: 'frid-001' },
      };

      const result = await issueEntitlement(ctx, request);

      expect(result.entitlement_jwt).toBeTruthy();
      expect(result.entitlement_id).toBeTruthy();
      expect(result.policy_version).toBeTruthy();

      // Stored in store
      const stored = getEntitlement(result.entitlement_id);
      expect(stored).not.toBeNull();
      expect(stored!.status).toBe('ACTIVE');
      expect(stored!.scope).toEqual(['clinical.capture.vitals']);
    });

    it('should write audit record on issuance', async () => {
      const ctx = makeCtx();
      const request: EntitlementIssuanceRequest = {
        device_id: 'device-002',
        subject_id: 'prid-clinician-2',
        scope: ['clinical.capture.notes'],
        valid_from: new Date().toISOString(),
        valid_to: futureDate(2),
      };

      await issueEntitlement(ctx, request);

      // Check audit chain
      const chain = getAuditChain(ctx.tenantId, ctx.podId);
      // At least 2 records: 1 from PDP decision + 1 from entitlement issuance
      expect(chain.length).toBeGreaterThanOrEqual(2);
      
      // Find the entitlement issuance audit
      const issuanceAudit = chain.find(r => r.action === 'offline.entitlement.issued');
      expect(issuanceAudit).toBeDefined();
      expect(issuanceAudit!.decision).toBe('SYSTEM');
    });

    it('should emit entitlement.issued event', async () => {
      const ctx = makeCtx();
      const request: EntitlementIssuanceRequest = {
        device_id: 'device-003',
        subject_id: 'prid-clinician-3',
        scope: ['clinical.read.timeline'],
        valid_from: new Date().toISOString(),
        valid_to: futureDate(1),
      };

      await issueEntitlement(ctx, request);

      const events = getStoredEvents();
      const issuedEvent = events.find(e => e.event_type === 'impilo.offline.entitlement.issued.v1');
      expect(issuedEvent).toBeDefined();
      expect(issuedEvent!.producer).toBe('tshepo-service');
      expect(issuedEvent!.meta.partition_key).toContain(ctx.tenantId);
    });

    it('should reject validity window exceeding 6 hours', async () => {
      const ctx = makeCtx();
      const request: EntitlementIssuanceRequest = {
        device_id: 'device-004',
        subject_id: 'prid-clinician-4',
        scope: ['clinical.capture.vitals'],
        valid_from: new Date().toISOString(),
        valid_to: futureDate(8), // exceeds 6h
      };

      await expect(issueEntitlement(ctx, request)).rejects.toMatchObject({
        code: 'INVALID_REQUEST',
        status: 400,
      });
    });
  });

  // =========================================================================
  // Offline Entitlements — Verification
  // =========================================================================

  describe('Offline Entitlement Verification', () => {
    it('should verify valid entitlement', async () => {
      const ctx = makeCtx();
      const request: EntitlementIssuanceRequest = {
        device_id: 'device-010',
        subject_id: 'prid-clinician-10',
        scope: ['clinical.capture.vitals', 'clinical.capture.notes'],
        valid_from: new Date().toISOString(),
        valid_to: futureDate(4),
        constraints: { facility_id: 'frid-001' },
      };

      const issued = await issueEntitlement(ctx, request);
      const result = await verifyEntitlementOffline(
        issued.entitlement_jwt,
        'clinical.capture.vitals',
        { facility_id: 'frid-001' }
      );

      expect(result.valid).toBe(true);
      expect(result.entitlement_id).toBe(issued.entitlement_id);
      expect(result.payload).toBeDefined();
    });

    it('should reject wrong scope', async () => {
      const ctx = makeCtx();
      const request: EntitlementIssuanceRequest = {
        device_id: 'device-011',
        subject_id: 'prid-clinician-11',
        scope: ['clinical.capture.vitals'],
        valid_from: new Date().toISOString(),
        valid_to: futureDate(2),
      };

      const issued = await issueEntitlement(ctx, request);
      const result = await verifyEntitlementOffline(
        issued.entitlement_jwt,
        'clinical.capture.notes' // not in scope
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toBe(ENTITLEMENT_ERRORS.ENTITLEMENT_SCOPE_MISMATCH);
    });

    it('should reject expired entitlement', async () => {
      const ctx = makeCtx();
      const request: EntitlementIssuanceRequest = {
        device_id: 'device-012',
        subject_id: 'prid-clinician-12',
        scope: ['clinical.capture.vitals'],
        valid_from: pastDate(5),
        valid_to: pastDate(1), // already expired
      };

      const issued = await issueEntitlement(ctx, request);
      const result = await verifyEntitlementOffline(
        issued.entitlement_jwt,
        'clinical.capture.vitals'
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toBe(ENTITLEMENT_ERRORS.ENTITLEMENT_EXPIRED);
    });

    it('should reject revoked entitlement', async () => {
      const ctx = makeCtx();
      const request: EntitlementIssuanceRequest = {
        device_id: 'device-013',
        subject_id: 'prid-clinician-13',
        scope: ['clinical.capture.vitals'],
        valid_from: new Date().toISOString(),
        valid_to: futureDate(2),
      };

      const issued = await issueEntitlement(ctx, request);

      // Revoke it
      updateEntitlementStatus(issued.entitlement_id, 'REVOKED', {
        revoked_at: new Date().toISOString(),
      });

      const result = await verifyEntitlementOffline(
        issued.entitlement_jwt,
        'clinical.capture.vitals'
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toBe(ENTITLEMENT_ERRORS.ENTITLEMENT_REVOKED);
    });

    it('should reject unknown kid', async () => {
      // Create a token with current key, then clear keys
      const ctx = makeCtx();
      const request: EntitlementIssuanceRequest = {
        device_id: 'device-014',
        subject_id: 'prid-clinician-14',
        scope: ['clinical.capture.vitals'],
        valid_from: new Date().toISOString(),
        valid_to: futureDate(2),
      };

      const issued = await issueEntitlement(ctx, request);

      // Clear all keys — simulates kid mismatch
      clearKeyStore();

      const result = await verifyEntitlementOffline(
        issued.entitlement_jwt,
        'clinical.capture.vitals'
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toBe(ENTITLEMENT_ERRORS.ENTITLEMENT_KID_UNKNOWN);
    });

    it('should reject invalid signature', async () => {
      const result = await verifyEntitlementOffline(
        'invalid.signature.garbage',
        'clinical.capture.vitals'
      );

      expect(result.valid).toBe(false);
    });

    it('should enforce facility constraint', async () => {
      const ctx = makeCtx();
      const request: EntitlementIssuanceRequest = {
        device_id: 'device-015',
        subject_id: 'prid-clinician-15',
        scope: ['clinical.capture.vitals'],
        valid_from: new Date().toISOString(),
        valid_to: futureDate(2),
        constraints: { facility_id: 'frid-001' },
      };

      const issued = await issueEntitlement(ctx, request);

      // Wrong facility
      const result = await verifyEntitlementOffline(
        issued.entitlement_jwt,
        'clinical.capture.vitals',
        { facility_id: 'frid-999' }
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toBe(ENTITLEMENT_ERRORS.ENTITLEMENT_CONSTRAINT_VIOLATION);
    });

    it('should enforce patient allowlist constraint', async () => {
      const ctx = makeCtx();
      const request: EntitlementIssuanceRequest = {
        device_id: 'device-016',
        subject_id: 'prid-clinician-16',
        scope: ['clinical.capture.vitals'],
        valid_from: new Date().toISOString(),
        valid_to: futureDate(2),
        constraints: { patient_cpid_allowlist: ['CPID-A', 'CPID-B'] },
      };

      const issued = await issueEntitlement(ctx, request);

      // Patient not in allowlist
      const result = await verifyEntitlementOffline(
        issued.entitlement_jwt,
        'clinical.capture.vitals',
        { patient_cpid: 'CPID-X' }
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toBe(ENTITLEMENT_ERRORS.ENTITLEMENT_CONSTRAINT_VIOLATION);

      // Patient in allowlist
      const result2 = await verifyEntitlementOffline(
        issued.entitlement_jwt,
        'clinical.capture.vitals',
        { patient_cpid: 'CPID-A' }
      );

      expect(result2.valid).toBe(true);
    });
  });

  // =========================================================================
  // BUTANO Events
  // =========================================================================

  describe('BUTANO Event Emitters', () => {
    it('should emit resource.created with correct v1.1 envelope', async () => {
      const ctx = makeCtx();

      await emitButanoResourceCreated(ctx, {
        resource_type: 'Observation',
        fhir_id: 'obs-123',
        subject_cpid: 'CPID-patient-1',
        encounter_id: 'enc-456',
        effective_at: new Date().toISOString(),
        is_provisional: false,
        tags: ['vitals', 'blood-pressure'],
      });

      const events = getStoredEvents();
      const event = events.find(e => e.event_type === 'impilo.butano.fhir.resource.created.v1');

      expect(event).toBeDefined();
      expect(event!.producer).toBe('butano-service');
      expect(event!.subject_type).toBe('observation');
      expect(event!.subject_id).toBe('obs-123');
      expect(event!.meta.partition_key).toBe('CPID-patient-1');
      expect(event!.schema_version).toBe(1);
      expect(event!.tenant_id).toBe(ctx.tenantId);
      expect(event!.correlation_id).toBe(ctx.correlationId);

      // Verify delta payload
      const payload = event!.payload as any;
      expect(payload.op).toBe('CREATE');
      expect(payload.before).toBeNull();
      expect(payload.after.resource_type).toBe('Observation');
      expect(payload.after.subject_cpid).toBe('CPID-patient-1');
      expect(payload.changed_fields).toEqual(['*']);
    });

    it('should emit resource.updated with changed fields', async () => {
      const ctx = makeCtx();

      await emitButanoResourceUpdated(
        ctx,
        {
          resource_type: 'Observation',
          fhir_id: 'obs-456',
          subject_cpid: 'CPID-patient-2',
          is_provisional: false,
          tags: ['vitals'],
        },
        ['value', 'status'],
        { value: 'old-value', status: 'preliminary' }
      );

      const events = getStoredEvents();
      const event = events.find(e => e.event_type === 'impilo.butano.fhir.resource.updated.v1');

      expect(event).toBeDefined();
      expect(event!.meta.partition_key).toBe('CPID-patient-2');

      const payload = event!.payload as any;
      expect(payload.op).toBe('UPDATE');
      expect(payload.before).toEqual({ value: 'old-value', status: 'preliminary' });
      expect(payload.changed_fields).toEqual(['value', 'status']);
    });

    it('should emit reconcile.completed with partition key = to_cpid', async () => {
      const ctx = makeCtx();

      await emitButanoReconcileCompleted(ctx, {
        from_ocpid: 'O-CPID-old',
        to_cpid: 'CPID-canonical',
        records_rewritten: 42,
      });

      const events = getStoredEvents();
      const event = events.find(e => e.event_type === 'impilo.butano.reconcile.completed.v1');

      expect(event).toBeDefined();
      expect(event!.meta.partition_key).toBe('CPID-canonical');
      expect(event!.subject_type).toBe('reconciliation');

      const payload = event!.payload as any;
      expect(payload.op).toBe('UPDATE');
      expect(payload.after.records_rewritten).toBe(42);
    });

    it('should pass schema gate validation for all BUTANO events', async () => {
      const ctx = makeCtx();

      // All three should pass without throwing
      await emitButanoResourceCreated(ctx, {
        resource_type: 'Condition',
        fhir_id: 'cond-001',
        subject_cpid: 'CPID-test',
      });

      await emitButanoResourceUpdated(ctx, {
        resource_type: 'Condition',
        fhir_id: 'cond-001',
        subject_cpid: 'CPID-test',
      }, ['status']);

      await emitButanoReconcileCompleted(ctx, {
        from_ocpid: 'O-CPID-1',
        to_cpid: 'CPID-2',
        records_rewritten: 5,
      });

      expect(getStoredEvents().length).toBe(3);
    });
  });

  // =========================================================================
  // Backward Compatibility
  // =========================================================================

  describe('Backward Compatibility — Waves 1-3 Intact', () => {
    it('Wave 1 — Event emitter still works', async () => {
      const { emitPatientCreated } = await import('../../events/vitoEvents');
      const ctx = makeCtx();

      const result = await emitPatientCreated(ctx, {
        crid: 'CRID-compat-1',
        cpid: 'CPID-compat-1',
        given_name: 'Test',
        family_name: 'Patient',
      });

      expect(result.success).toBe(true);
      expect(result.v11_emitted).toBe(true);

      const events = getStoredEvents();
      const vitoEvent = events.find(e => e.event_type === 'impilo.vito.patient.created.v1');
      expect(vitoEvent).toBeDefined();
    });

    it('Wave 2 — Idempotency check still works', async () => {
      const { checkIdempotency } = await import('../../idempotency/middleware');
      const ctx = makeCtx();

      const result = await checkIdempotency(
        'idem-key-compat-1',
        ctx,
        'POST /test',
        { foo: 'bar' }
      );

      expect(result.action).toBe('proceed');
    });

    it('Wave 2 — Audit ledger chain still verifiable', async () => {
      const { appendAuditRecord, verifyChain } = await import('../../audit/ledger');
      const ctx = makeCtx();

      await appendAuditRecord({
        audit_id: crypto.randomUUID(),
        tenant_id: ctx.tenantId,
        pod_id: ctx.podId,
        occurred_at: new Date().toISOString(),
        request_id: ctx.requestId,
        correlation_id: ctx.correlationId,
        actor: { subject_id: 'test', roles: ['TEST'] },
        action: 'compat.test',
        decision: 'ALLOW',
        reason_codes: ['TEST_OK'],
        policy_version: 'test-v1',
        resource: {},
      });

      const result = await verifyChain(ctx.tenantId, ctx.podId);
      expect(result.ok).toBe(true);
    });

    it('Wave 3 — PDP engine still evaluates', () => {
      const { evaluatePolicy } = require('../../tshepo/pdpEngine');
      
      const result = evaluatePolicy({
        subject: {
          user_id: 'prid-1',
          roles: ['CLINICIAN'],
          assurance_level: 'aal2',
        },
        action: 'clinical.view.patient',
        resource: { patient_cpid: 'CPID-1' },
        context: { tenant_id: 'test', pod_id: 'national' },
      });

      expect(result.decision).toBe('ALLOW');
    });
  });
});
