/**
 * Impilo vNext v1.1 — Event Emitter with Dual-Emit Policy
 *
 * Provides:
 *  - emitV11()        — emit a validated v1.1 event
 *  - emitWithPolicy() — respects EMIT_MODE (V1_ONLY | V1_1_ONLY | DUAL)
 *
 * Events are validated via the schema gate BEFORE publish.
 * Prototype event bus stores events in-memory and logs them.
 */

import type {
  ImpiloEventEnvelopeV11,
  EmitMode,
  EventPublishResult,
} from './types';
import { validateEventOrThrow, SchemaValidationError } from './validator';

// ---------------------------------------------------------------------------
// In-process Event Bus (prototype — no external broker)
// ---------------------------------------------------------------------------

export type EventBusListener = (event: ImpiloEventEnvelopeV11) => void;

/** In-memory store of published v1.1 events (bounded to 1000 for prototype). */
const eventStore: ImpiloEventEnvelopeV11[] = [];
const MAX_STORE = 1000;

const listeners: EventBusListener[] = [];

/**
 * Subscribe to v1.1 events (for testing / UI display).
 */
export function onEvent(listener: EventBusListener): () => void {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

/**
 * Get all stored events (most recent first). For testing / debugging.
 */
export function getStoredEvents(): readonly ImpiloEventEnvelopeV11[] {
  return [...eventStore];
}

/**
 * Clear the event store. For testing only.
 */
export function clearEventStore(): void {
  eventStore.length = 0;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

let defaultEmitMode: EmitMode = 'DUAL';
let defaultProducer = 'impilo-prototype';

/**
 * Set the global emit mode.
 */
export function setEmitMode(mode: EmitMode): void {
  defaultEmitMode = mode;
}

export function getEmitMode(): EmitMode {
  return defaultEmitMode;
}

/**
 * Set the default producer name.
 */
export function setProducerName(name: string): void {
  defaultProducer = name;
}

export function getProducerName(): string {
  return defaultProducer;
}

// ---------------------------------------------------------------------------
// Core emit functions
// ---------------------------------------------------------------------------

/**
 * Emit a v1.1 event. The schema gate runs FIRST — if validation fails,
 * a SchemaValidationError is thrown and the event is NOT published.
 */
export async function emitV11(event: ImpiloEventEnvelopeV11): Promise<void> {
  // Schema gate — blocks on failure
  validateEventOrThrow(event);

  // Publish to in-memory bus
  if (eventStore.length >= MAX_STORE) {
    eventStore.shift(); // drop oldest
  }
  eventStore.push(event);

  // Notify listeners
  for (const fn of listeners) {
    try {
      fn(event);
    } catch (err) {
      console.error('[EventBus] listener error:', err);
    }
  }

  // Console log for observability
  console.log(
    `[EventBus] v1.1 emitted: ${event.event_type} | id=${event.event_id} | partition=${event.meta.partition_key}`
  );
}

/**
 * Emit with dual-emit policy.
 *
 * @param mode - Override emit mode, or use global default.
 * @param v11  - The v1.1 event envelope.
 * @param v10  - Optional legacy (v1.0) event object. If provided and mode
 *               includes V1, it will be logged (prototype has no legacy bus).
 */
export async function emitWithPolicy(args: {
  mode?: EmitMode;
  v11: ImpiloEventEnvelopeV11;
  v10?: unknown;
}): Promise<EventPublishResult> {
  const mode = args.mode ?? defaultEmitMode;

  const result: EventPublishResult = {
    success: false,
    mode,
    v1_emitted: false,
    v11_emitted: false,
    event_id: args.v11.event_id,
  };

  try {
    // V1_ONLY — legacy only
    if (mode === 'V1_ONLY') {
      if (args.v10) {
        console.log('[EventBus] v1.0 legacy emit:', JSON.stringify(args.v10).slice(0, 200));
      }
      result.v1_emitted = true;
      result.success = true;
      return result;
    }

    // V1_1_ONLY — v1.1 only (with validation)
    if (mode === 'V1_1_ONLY') {
      await emitV11(args.v11);
      result.v11_emitted = true;
      result.success = true;
      return result;
    }

    // DUAL — legacy first, then v1.1. If v1.1 validation fails, the whole emit fails.
    if (args.v10) {
      console.log('[EventBus] v1.0 legacy emit:', JSON.stringify(args.v10).slice(0, 200));
    }
    result.v1_emitted = true;

    await emitV11(args.v11);
    result.v11_emitted = true;
    result.success = true;
    return result;
  } catch (err) {
    if (err instanceof SchemaValidationError) {
      result.error = `Schema gate blocked: ${err.code} — ${err.message}`;
    } else {
      result.error = err instanceof Error ? err.message : 'Unknown emit error';
    }
    result.success = false;
    return result;
  }
}
