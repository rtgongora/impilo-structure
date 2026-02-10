/**
 * Impilo vNext v1.1 — Wave 3 Tests
 *
 * Tests for TSHEPO PDP, Class A enforcement, MSIKA tariff update,
 * and actor context extraction.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { KernelRequestContext } from '@/lib/kernel/types';
import type { AuditActor } from '@/lib/kernel/audit/types';
import { evaluatePolicy } from '@/lib/kernel/tshepo/pdpEngine';
import { pdpDecide } from '@/lib/kernel/tshepo/pdpService';
import { enforceClassAOrThrow } from '@/lib/kernel/consistency/classAEnforcer';
import { msikaTariffUpdate, clearTariffStore } from '@/lib/kernel/msika/commands';
import { getActorFromHeaders } from '@/lib/kernel/security/actorContext';
import { clearAuditLedger, getAuditChain, verifyChain } from '@/lib/kernel/audit/ledger';
import { clearIdempotencyStore } from '@/lib/kernel/idempotency/store';
import { clearEventStore, getStoredEvents } from '@/lib/kernel/events/emitter';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCtx(overrides?: Partial<KernelRequestContext>): KernelRequestContext {
  return {
    tenantId: 'tenant-1',
    podId: 'pod-1',
    requestId: crypto.randomUUID(),
    correlationId: crypto.randomUUID(),
    ...overrides,
  };
}

function makeActor(roles: string[], aal = 'aal2'): AuditActor & { assurance_level: string } {
  return {
    subject_id: 'user-1',
    roles,
    facility_id: 'fac-1',
    assurance_level: aal,
  };
}

// ---------------------------------------------------------------------------
// TSHEPO PDP Engine Tests
// ---------------------------------------------------------------------------

describe('TSHEPO PDP Engine', () => {
  it('returns STEP_UP_REQUIRED when assurance_level missing', () => {
    const res = evaluatePolicy({
      subject: { user_id: 'u1', roles: ['CLINICIAN'] },
      action: 'clinical.view',
      resource: {},
      context: { tenant_id: 't1', pod_id: 'p1' },
    });
    expect(res.decision).toBe('STEP_UP_REQUIRED');
    expect(res.reason_codes).toContain('ASSURANCE_LEVEL_INSUFFICIENT');
  });

  it('returns STEP_UP_REQUIRED when assurance_level invalid', () => {
    const res = evaluatePolicy({
      subject: { user_id: 'u1', roles: ['CLINICIAN'], assurance_level: 'bogus' },
      action: 'clinical.view',
      resource: {},
      context: { tenant_id: 't1', pod_id: 'p1' },
    });
    expect(res.decision).toBe('STEP_UP_REQUIRED');
  });

  it('DENY tariff action without FINANCE_ADMIN or REGISTRY_ADMIN', () => {
    const res = evaluatePolicy({
      subject: { user_id: 'u1', roles: ['CLINICIAN'], assurance_level: 'aal2' },
      action: 'finance.msika.tariff.update',
      resource: {},
      context: { tenant_id: 't1', pod_id: 'p1' },
    });
    expect(res.decision).toBe('DENY');
    expect(res.reason_codes).toContain('ROLE_MISSING');
  });

  it('ALLOW tariff action with FINANCE_ADMIN', () => {
    const res = evaluatePolicy({
      subject: { user_id: 'u1', roles: ['FINANCE_ADMIN'], assurance_level: 'aal2' },
      action: 'finance.msika.tariff.update',
      resource: {},
      context: { tenant_id: 't1', pod_id: 'p1' },
    });
    expect(res.decision).toBe('ALLOW');
    expect(res.reason_codes).toContain('FINANCE_PRIVILEGE_OK');
  });

  it('ALLOW tariff action with REGISTRY_ADMIN', () => {
    const res = evaluatePolicy({
      subject: { user_id: 'u1', roles: ['REGISTRY_ADMIN'], assurance_level: 'aal3' },
      action: 'finance.msika.tariff.update',
      resource: {},
      context: { tenant_id: 't1', pod_id: 'p1' },
    });
    expect(res.decision).toBe('ALLOW');
  });

  it('DENY controlled substance without PHARMACIST or CLINICIAN_SENIOR', () => {
    const res = evaluatePolicy({
      subject: { user_id: 'u1', roles: ['CLINICIAN'], assurance_level: 'aal2' },
      action: 'clinical.prescribe.controlled_substance',
      resource: {},
      context: { tenant_id: 't1', pod_id: 'p1' },
    });
    expect(res.decision).toBe('DENY');
    expect(res.reason_codes).toContain('CONTROLLED_SUBSTANCE_PRIVILEGE_MISSING');
  });

  it('ALLOW default action with valid assurance level', () => {
    const res = evaluatePolicy({
      subject: { user_id: 'u1', roles: ['CLINICIAN'], assurance_level: 'aal1' },
      action: 'clinical.view.patient',
      resource: {},
      context: { tenant_id: 't1', pod_id: 'p1' },
    });
    expect(res.decision).toBe('ALLOW');
  });

  it('DENY when subject.user_id missing', () => {
    const res = evaluatePolicy({
      subject: { user_id: '', roles: ['CLINICIAN'], assurance_level: 'aal2' },
      action: 'clinical.view',
      resource: {},
      context: { tenant_id: 't1', pod_id: 'p1' },
    });
    expect(res.decision).toBe('DENY');
    expect(res.reason_codes).toContain('SUBJECT_MISSING');
  });
});

// ---------------------------------------------------------------------------
// PDP Service (with audit)
// ---------------------------------------------------------------------------

describe('TSHEPO PDP Service (pdpDecide)', () => {
  beforeEach(() => {
    clearAuditLedger();
  });

  it('appends audit record for every decision', async () => {
    const ctx = makeCtx();
    await pdpDecide(ctx, {
      subject: { user_id: 'u1', roles: ['CLINICIAN'], assurance_level: 'aal2' },
      action: 'clinical.view',
      resource: { patient_cpid: 'cpid-1' },
      context: { tenant_id: ctx.tenantId, pod_id: ctx.podId },
    });

    const chain = getAuditChain(ctx.tenantId, ctx.podId);
    expect(chain.length).toBe(1);
    expect(chain[0].action).toBe('tshepo.pdp.decide');
    expect(chain[0].decision).toBe('ALLOW');
  });

  it('appends audit for DENY decisions too', async () => {
    const ctx = makeCtx();
    await pdpDecide(ctx, {
      subject: { user_id: 'u1', roles: ['CLINICIAN'], assurance_level: 'aal2' },
      action: 'finance.msika.tariff.update',
      resource: {},
      context: { tenant_id: ctx.tenantId, pod_id: ctx.podId },
    });

    const chain = getAuditChain(ctx.tenantId, ctx.podId);
    expect(chain.length).toBe(1);
    expect(chain[0].decision).toBe('DENY');
  });
});

// ---------------------------------------------------------------------------
// Class A Enforcer
// ---------------------------------------------------------------------------

describe('Class A Enforcer', () => {
  beforeEach(() => {
    clearAuditLedger();
  });

  it('throws POLICY_DENY when PDP denies', async () => {
    const ctx = makeCtx();
    await expect(
      enforceClassAOrThrow({
        ctx,
        subject: { user_id: 'u1', roles: ['CLINICIAN'], assurance_level: 'aal2' },
        action: 'finance.msika.tariff.update',
        resource: { tariff_id: 't1' },
      })
    ).rejects.toMatchObject({ code: 'POLICY_DENY', status: 403 });
  });

  it('throws STEP_UP_REQUIRED when assurance missing', async () => {
    const ctx = makeCtx();
    await expect(
      enforceClassAOrThrow({
        ctx,
        subject: { user_id: 'u1', roles: ['FINANCE_ADMIN'] },
        action: 'finance.msika.tariff.update',
        resource: { tariff_id: 't1' },
      })
    ).rejects.toMatchObject({ code: 'STEP_UP_REQUIRED', status: 412 });
  });

  it('returns policy context on ALLOW', async () => {
    const ctx = makeCtx();
    const result = await enforceClassAOrThrow({
      ctx,
      subject: { user_id: 'u1', roles: ['FINANCE_ADMIN'], assurance_level: 'aal2' },
      action: 'finance.msika.tariff.update',
      resource: { tariff_id: 't1' },
    });
    expect(result.policy_version).toBe('2026-02-08.1');
    expect(result.reason_codes).toContain('FINANCE_PRIVILEGE_OK');
  });
});

// ---------------------------------------------------------------------------
// Actor Context
// ---------------------------------------------------------------------------

describe('Actor Context', () => {
  it('extracts actor from headers', () => {
    const actor = getActorFromHeaders({
      'x-actor-subject-id': 'user-1',
      'x-actor-roles': 'FINANCE_ADMIN,CLINICIAN',
      'x-actor-facility-id': 'fac-1',
      'x-actor-assurance-level': 'aal2',
    });
    expect(actor.subject_id).toBe('user-1');
    expect(actor.roles).toEqual(['FINANCE_ADMIN', 'CLINICIAN']);
    expect(actor.assurance_level).toBe('aal2');
  });

  it('throws AUTH_REQUIRED when subject missing', () => {
    expect(() => getActorFromHeaders({
      'x-actor-roles': 'CLINICIAN',
    })).toThrow();
  });

  it('throws AUTH_REQUIRED when roles missing', () => {
    expect(() => getActorFromHeaders({
      'x-actor-subject-id': 'user-1',
    })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// MSIKA Tariff Update (integrated)
// ---------------------------------------------------------------------------

describe('MSIKA Tariff Update', () => {
  beforeEach(() => {
    clearAuditLedger();
    clearIdempotencyStore();
    clearEventStore();
    clearTariffStore();
  });

  const futureTariff = (): any => ({
    tariff_id: 'tariff-1',
    product_id: 'prod-1',
    currency: 'ZAR',
    amount: 150.00,
    effective_from: '2027-01-01',
  });

  it('blocks without PDP allow (role missing)', async () => {
    const ctx = makeCtx();
    const actor = makeActor(['CLINICIAN']);
    await expect(
      msikaTariffUpdate(ctx, crypto.randomUUID(), futureTariff(), actor)
    ).rejects.toMatchObject({ code: 'POLICY_DENY' });
  });

  it('blocks when assurance level missing (STEP_UP_REQUIRED)', async () => {
    const ctx = makeCtx();
    const actor = makeActor(['FINANCE_ADMIN'], '');
    // assurance_level is empty string → invalid
    await expect(
      msikaTariffUpdate(ctx, crypto.randomUUID(), futureTariff(), actor)
    ).rejects.toMatchObject({ code: 'STEP_UP_REQUIRED' });
  });

  it('succeeds with FINANCE_ADMIN + aal2, emits event, writes audit', async () => {
    const ctx = makeCtx();
    const actor = makeActor(['FINANCE_ADMIN']);
    const key = crypto.randomUUID();

    const result = await msikaTariffUpdate(ctx, key, futureTariff(), actor);

    expect(result.success).toBe(true);
    expect(result.status_code).toBe(200);
    expect(result.idempotent_replay).toBe(false);

    // Check event emitted
    const events = getStoredEvents();
    const tariffEvents = events.filter(e => e.event_type === 'impilo.msika.tariff.updated.v1');
    expect(tariffEvents.length).toBe(1);
    expect(tariffEvents[0].meta.partition_key).toBe('tariff-1');

    // Check audit (PDP decision + MSIKA commit = 2 records)
    const chain = getAuditChain(ctx.tenantId, ctx.podId);
    expect(chain.length).toBe(2);
    expect(chain[0].action).toBe('tshepo.pdp.decide');
    expect(chain[1].action).toBe('msika.tariff.update');
    expect(chain[1].reason_codes).toContain('COMMIT_OK');
  });

  it('idempotent replay returns same response, no duplicate events/audit', async () => {
    const ctx = makeCtx();
    const actor = makeActor(['FINANCE_ADMIN']);
    const key = crypto.randomUUID();
    const tariff = futureTariff();

    // First call
    const r1 = await msikaTariffUpdate(ctx, key, tariff, actor);
    expect(r1.success).toBe(true);

    const eventsAfterFirst = getStoredEvents().length;
    const auditAfterFirst = getAuditChain(ctx.tenantId, ctx.podId).length;

    // Second call — same key, same body
    const r2 = await msikaTariffUpdate(ctx, key, tariff, actor);
    expect(r2.idempotent_replay).toBe(true);
    expect(r2.status_code).toBe(r1.status_code);

    // No new events or audit
    expect(getStoredEvents().length).toBe(eventsAfterFirst);
    expect(getAuditChain(ctx.tenantId, ctx.podId).length).toBe(auditAfterFirst);
  });

  it('idempotency conflict returns 409', async () => {
    const ctx = makeCtx();
    const actor = makeActor(['FINANCE_ADMIN']);
    const key = crypto.randomUUID();

    await msikaTariffUpdate(ctx, key, futureTariff(), actor);

    const differentTariff = { ...futureTariff(), amount: 999 };
    const r2 = await msikaTariffUpdate(ctx, key, differentTariff, actor);
    expect(r2.status_code).toBe(409);
    expect((r2.body as any).error.code).toBe('IDEMPOTENCY_CONFLICT');
  });

  it('audit chain verifies ok', async () => {
    const ctx = makeCtx();
    const actor = makeActor(['FINANCE_ADMIN']);

    await msikaTariffUpdate(ctx, crypto.randomUUID(), futureTariff(), actor);
    await msikaTariffUpdate(ctx, crypto.randomUUID(), {
      ...futureTariff(), tariff_id: 'tariff-2', effective_from: '2027-06-01',
    }, actor);

    const verification = await verifyChain(ctx.tenantId, ctx.podId);
    expect(verification.ok).toBe(true);
    expect(verification.total_records).toBe(4); // 2 PDP + 2 MSIKA
  });

  it('missing idempotency key returns 400', async () => {
    const ctx = makeCtx();
    const actor = makeActor(['FINANCE_ADMIN']);

    await expect(
      msikaTariffUpdate(ctx, null, futureTariff(), actor)
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_KEY_REQUIRED' });
  });
});
