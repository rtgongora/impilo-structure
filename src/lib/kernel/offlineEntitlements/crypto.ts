/**
 * Impilo vNext v1.1 — Offline Entitlement Crypto (Ed25519 KMS Abstraction)
 *
 * Uses Ed25519 signing via @noble/curves (pure JS, works everywhere).
 * Supports key rotation via kid (key ID).
 *
 * Production: HSM/KMS-backed Ed25519 via the same interface.
 */

// @ts-ignore — @noble/curves exports use .js extensions; Vite resolves correctly
import { ed25519 } from '@noble/curves/ed25519.js';
import type { EntitlementPayload } from './types';

// ---------------------------------------------------------------------------
// Key Store (in-memory prototype; production: Vault/KMS/DevFileKms)
// ---------------------------------------------------------------------------

interface KeyPair {
  kid: string;
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  createdAt: string;
}

const keyStore = new Map<string, KeyPair>();
let activeKid: string | null = null;

/**
 * Generate a new Ed25519 signing key pair.
 * Production: this would call HSM/KMS to generate Ed25519 key.
 */
export async function generateSigningKey(kid?: string): Promise<string> {
  const keyId = kid || `key-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const privateKey = ed25519.utils.randomSecretKey();
  const publicKey = ed25519.getPublicKey(privateKey);

  keyStore.set(keyId, {
    kid: keyId,
    privateKey,
    publicKey,
    createdAt: new Date().toISOString(),
  });

  activeKid = keyId;
  return keyId;
}

/**
 * Get the active signing key ID.
 */
export function getActiveKid(): string {
  if (!activeKid) {
    throw new Error('No active signing key. Call generateSigningKey() first.');
  }
  return activeKid;
}

/**
 * Set the active key for signing.
 */
export function setActiveKid(kid: string): void {
  if (!keyStore.has(kid)) {
    throw new Error(`Key ${kid} not found in store.`);
  }
  activeKid = kid;
}

/**
 * Check if a kid exists in the key store.
 */
export function hasKey(kid: string): boolean {
  return keyStore.has(kid);
}

/**
 * Sign an entitlement payload with Ed25519 and return a base64-encoded token.
 * Format: base64(payload).base64(signature).kid
 *
 * The payload MUST contain alg: "Ed25519" and the kid.
 */
export async function signEntitlement(payload: EntitlementPayload): Promise<string> {
  const kid = payload.kid;
  const kp = keyStore.get(kid);
  if (!kp) {
    throw new Error(`Signing key ${kid} not found.`);
  }

  if (payload.alg !== 'Ed25519') {
    throw new Error('Entitlement payload must specify alg: "Ed25519".');
  }

  const payloadJson = JSON.stringify(payload);
  const payloadBytes = new TextEncoder().encode(payloadJson);

  const signature = ed25519.sign(payloadBytes, kp.privateKey);

  const payloadB64 = btoa(payloadJson);
  const sigB64 = btoa(String.fromCharCode(...signature));

  return `${payloadB64}.${sigB64}.${kid}`;
}

/**
 * Verify an entitlement token (Ed25519) and extract payload.
 * Returns the payload if valid, null if invalid.
 * Rejects any non-Ed25519 algorithm.
 */
export async function verifyEntitlementSignature(
  token: string
): Promise<{ valid: boolean; payload: EntitlementPayload | null; kid: string | null }> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, payload: null, kid: null };
  }

  const [payloadB64, sigB64, kid] = parts;
  const kp = keyStore.get(kid);
  if (!kp) {
    return { valid: false, payload: null, kid };
  }

  try {
    const payloadJson = atob(payloadB64);
    const payloadBytes = new TextEncoder().encode(payloadJson);
    const sigBytes = Uint8Array.from(atob(sigB64), c => c.charCodeAt(0));

    const valid = ed25519.verify(sigBytes, payloadBytes, kp.publicKey);

    if (!valid) {
      return { valid: false, payload: null, kid };
    }

    const payload = JSON.parse(payloadJson) as EntitlementPayload;

    // Reject non-Ed25519 algorithms
    if (payload.alg !== 'Ed25519') {
      return { valid: false, payload: null, kid };
    }

    return { valid: true, payload, kid };
  } catch {
    return { valid: false, payload: null, kid };
  }
}

/**
 * Clear all keys. For testing only.
 */
export function clearKeyStore(): void {
  keyStore.clear();
  activeKid = null;
}
