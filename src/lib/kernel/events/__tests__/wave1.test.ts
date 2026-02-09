/**
 * Impilo vNext v1.1 — Wave 1 Tests
 *
 * Tests for:
 *  1. Schema gate blocks events missing schema_version
 *  2. Schema gate blocks events missing meta.partition_key
 *  3. VITO create emits impilo.vito.patient.created.v1 with required envelope fields
 *  4. VITO merge emits impilo.vito.patient.merged.v1 with correct alias_map and partition_key
 *  5. EMIT_MODE toggle works
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateEventOrThrow,
  SchemaValidationError,
} from '@/lib/kernel/events/validator';
import {
  emitV11,
  emitWithPolicy,
  clearEventStore,
  getStoredEvents,
  setEmitMode,
} from '@/lib/kernel/events/emitter';
import {
  emitPatientCreated,
  emitPatientUpdated,
  emitPatientMerged,
} from '@/lib/kernel/events/vitoEvents';
import type { ImpiloEventEnvelopeV11 } from '@/lib/kernel/events/types';
import type { KernelRequestContext } from '@/lib/kernel/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validEnvelope(overrides: Partial<ImpiloEventEnvelopeV11> = {}): ImpiloEventEnvelopeV11 {
  return {
    event_id: crypto.randomUUID(),
    event_type: 'test.event.v1',
    schema_version: 1,
    correlation_id: crypto.randomUUID(),
    causation_id: null,
    idempotency_key: 'idem-1',
    producer: 'test',
    tenant_id: 'tenant-1',
    pod_id: 'pod-1',
    occurred_at: new Date().toISOString(),
    emitted_at: new Date().toISOString(),
    subject_type: 'patient',
    subject_id: 'pat-1',
    payload: { op: 'CREATE' as const, before: null, after: { name: 'Test' }, changed_fields: ['*'] },
    meta: { partition_key: 'pat-1' },
    ...overrides,
  };
}

function mockCtx(): KernelRequestContext {
  return {
    tenantId: 'test-tenant',
    podId: 'test-pod',
    requestId: crypto.randomUUID(),
    correlationId: crypto.randomUUID(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Schema Gate (validator)', () => {
  it('blocks events with missing schema_version', () => {
    const event = validEnvelope();
    (event as any).schema_version = undefined;
    expect(() => validateEventOrThrow(event)).toThrow(SchemaValidationError);
    try { validateEventOrThrow(event); } catch (e: any) {
      expect(e.code).toBe('SCHEMA_VERSION_MISSING_OR_INVALID');
    }
  });

  it('blocks events with schema_version < 1', () => {
    const event = validEnvelope({ schema_version: 0 });
    expect(() => validateEventOrThrow(event)).toThrow(SchemaValidationError);
  });

  it('blocks events with non-integer schema_version', () => {
    const event = validEnvelope({ schema_version: 1.5 as any });
    expect(() => validateEventOrThrow(event)).toThrow(SchemaValidationError);
  });

  it('blocks events with missing meta.partition_key', () => {
    const event = validEnvelope();
    event.meta = { partition_key: '' };
    expect(() => validateEventOrThrow(event)).toThrow(SchemaValidationError);
    try { validateEventOrThrow(event); } catch (e: any) {
      expect(e.code).toBe('PARTITION_KEY_MISSING');
    }
  });

  it('blocks events with missing meta object', () => {
    const event = validEnvelope();
    (event as any).meta = undefined;
    expect(() => validateEventOrThrow(event)).toThrow(SchemaValidationError);
  });

  it('blocks events with missing required string fields', () => {
    const event = validEnvelope();
    (event as any).event_id = '';
    expect(() => validateEventOrThrow(event)).toThrow(SchemaValidationError);
  });

  it('blocks events with invalid occurred_at', () => {
    const event = validEnvelope({ occurred_at: 'not-a-date' });
    expect(() => validateEventOrThrow(event)).toThrow(SchemaValidationError);
  });

  it('passes valid events', () => {
    const event = validEnvelope();
    expect(() => validateEventOrThrow(event)).not.toThrow();
  });
});

describe('Event Emitter', () => {
  beforeEach(() => {
    clearEventStore();
    setEmitMode('DUAL');
  });

  it('emitV11 stores a valid event', async () => {
    const event = validEnvelope();
    await emitV11(event);
    const stored = getStoredEvents();
    expect(stored).toHaveLength(1);
    expect(stored[0].event_id).toBe(event.event_id);
  });

  it('emitV11 rejects invalid events', async () => {
    const event = validEnvelope();
    (event as any).schema_version = undefined;
    await expect(async () => emitV11(event)).rejects.toThrow(SchemaValidationError);
    expect(getStoredEvents()).toHaveLength(0);
  });

  it('emitWithPolicy V1_ONLY does not store v1.1 event', async () => {
    const event = validEnvelope();
    const result = await emitWithPolicy({ mode: 'V1_ONLY', v11: event });
    expect(result.v1_emitted).toBe(true);
    expect(result.v11_emitted).toBe(false);
    expect(getStoredEvents()).toHaveLength(0);
  });

  it('emitWithPolicy DUAL stores v1.1 event', async () => {
    const event = validEnvelope();
    const result = await emitWithPolicy({ mode: 'DUAL', v11: event });
    expect(result.success).toBe(true);
    expect(result.v1_emitted).toBe(true);
    expect(result.v11_emitted).toBe(true);
    expect(getStoredEvents()).toHaveLength(1);
  });

  it('emitWithPolicy DUAL fails if v1.1 validation fails', async () => {
    const event = validEnvelope();
    (event as any).schema_version = undefined;
    const result = await emitWithPolicy({ mode: 'DUAL', v11: event });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Schema gate blocked');
  });
});

describe('VITO Events', () => {
  beforeEach(() => {
    clearEventStore();
    setEmitMode('V1_1_ONLY');
  });

  it('emitPatientCreated emits impilo.vito.patient.created.v1', async () => {
    const ctx = mockCtx();
    const result = await emitPatientCreated(ctx, {
      crid: 'CR-001',
      cpid: 'CP-001',
      given_name: 'Test',
      family_name: 'Patient',
    });
    expect(result.success).toBe(true);

    const events = getStoredEvents();
    expect(events).toHaveLength(1);
    const e = events[0];
    expect(e.event_type).toBe('impilo.vito.patient.created.v1');
    expect(e.schema_version).toBe(1);
    expect(e.subject_type).toBe('patient');
    expect(e.subject_id).toBe('CP-001'); // CPID preferred
    expect(e.meta.partition_key).toBe('CP-001');
    expect(e.tenant_id).toBe(ctx.tenantId);
    expect(e.pod_id).toBe(ctx.podId);
    expect(e.correlation_id).toBe(ctx.correlationId);
    expect(e.producer).toBe('vito');
    expect(e.payload).toHaveProperty('op', 'CREATE');
    expect((e.payload as any).before).toBeNull();
    expect((e.payload as any).after).toHaveProperty('given_name', 'Test');
  });

  it('emitPatientCreated falls back to CRID when CPID missing', async () => {
    const ctx = mockCtx();
    await emitPatientCreated(ctx, { crid: 'CR-002' });
    const e = getStoredEvents()[0];
    expect(e.subject_id).toBe('CR-002');
    expect(e.meta.partition_key).toBe('CR-002');
  });

  it('emitPatientUpdated emits with changed_fields', async () => {
    const ctx = mockCtx();
    await emitPatientUpdated(
      ctx,
      { crid: 'CR-001', given_name: 'Old' },
      { crid: 'CR-001', cpid: 'CP-001', given_name: 'New' },
      ['given_name']
    );
    const e = getStoredEvents()[0];
    expect(e.event_type).toBe('impilo.vito.patient.updated.v1');
    expect((e.payload as any).op).toBe('UPDATE');
    expect((e.payload as any).changed_fields).toEqual(['given_name']);
    expect((e.payload as any).before).toHaveProperty('given_name', 'Old');
    expect((e.payload as any).after).toHaveProperty('given_name', 'New');
  });

  it('emitPatientMerged emits with alias_map and correct partition_key', async () => {
    const ctx = mockCtx();
    await emitPatientMerged(ctx, {
      survivor_crid: 'CR-001',
      merged_crids: ['CR-002', 'CR-003'],
      alias_map: [
        { from: 'CR-002', to: 'CR-001' },
        { from: 'CR-003', to: 'CR-001' },
      ],
      cpid: 'CP-001',
      version: 2,
    });

    const e = getStoredEvents()[0];
    expect(e.event_type).toBe('impilo.vito.patient.merged.v1');
    expect((e.payload as any).op).toBe('MERGE');
    expect((e.payload as any).after.survivor_crid).toBe('CR-001');
    expect((e.payload as any).after.alias_map).toHaveLength(2);
    expect((e.payload as any).after.merged_crids).toEqual(['CR-002', 'CR-003']);
    expect(e.meta.partition_key).toBe('CP-001');
    expect(e.subject_id).toBe('CP-001');
  });

  it('emitPatientMerged uses CRID for partition when CPID absent', async () => {
    const ctx = mockCtx();
    await emitPatientMerged(ctx, {
      survivor_crid: 'CR-001',
      merged_crids: ['CR-002'],
      alias_map: [{ from: 'CR-002', to: 'CR-001' }],
    });
    const e = getStoredEvents()[0];
    expect(e.meta.partition_key).toBe('CR-001');
  });
});
