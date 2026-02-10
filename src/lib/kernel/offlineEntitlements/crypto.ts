/**
 * Impilo vNext v1.1 — Offline Entitlement Crypto (KMS Abstraction)
 *
 * Prototype: uses Web Crypto Ed25519-like signing via ECDSA P-256 (Ed25519
 * not universally available in Web Crypto). Production: HSM/KMS-backed Ed25519.
 *
 * Supports key rotation via kid (key ID).
 */

import type { EntitlementPayload } from './types';

// ---------------------------------------------------------------------------
// Key Store (in-memory prototype; production: Vault/KMS)
// ---------------------------------------------------------------------------

interface KeyPair {
  kid: string;
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  createdAt: string;
}

const keyStore = new Map<string, KeyPair>();
let activeKid: string | null = null;

/**
 * Generate a new signing key pair.
 * Production: this would call HSM/KMS to generate Ed25519 key.
 */
export async function generateSigningKey(kid?: string): Promise<string> {
  const keyId = kid || `key-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign', 'verify']
  );

  keyStore.set(keyId, {
    kid: keyId,
    privateKey: keyPair.privateKey,
    publicKey: keyPair.publicKey,
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
 * Sign an entitlement payload and return a base64-encoded token.
 * Format: base64(payload).base64(signature).kid
 */
export async function signEntitlement(payload: EntitlementPayload): Promise<string> {
  const kid = payload.kid;
  const keyPair = keyStore.get(kid);
  if (!keyPair) {
    throw new Error(`Signing key ${kid} not found.`);
  }

  const payloadJson = JSON.stringify(payload);
  const payloadBytes = new TextEncoder().encode(payloadJson);

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    keyPair.privateKey,
    payloadBytes
  );

  const payloadB64 = btoa(payloadJson);
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

  return `${payloadB64}.${sigB64}.${kid}`;
}

/**
 * Verify an entitlement token and extract payload.
 * Returns the payload if valid, null if invalid.
 */
export async function verifyEntitlementSignature(
  token: string
): Promise<{ valid: boolean; payload: EntitlementPayload | null; kid: string | null }> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, payload: null, kid: null };
  }

  const [payloadB64, sigB64, kid] = parts;
  const keyPair = keyStore.get(kid);
  if (!keyPair) {
    return { valid: false, payload: null, kid };
  }

  try {
    const payloadJson = atob(payloadB64);
    const payloadBytes = new TextEncoder().encode(payloadJson);
    const sigBytes = Uint8Array.from(atob(sigB64), c => c.charCodeAt(0));

    const valid = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      keyPair.publicKey,
      sigBytes,
      payloadBytes
    );

    if (!valid) {
      return { valid: false, payload: null, kid };
    }

    const payload = JSON.parse(payloadJson) as EntitlementPayload;
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
