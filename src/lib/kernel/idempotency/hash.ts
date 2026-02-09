/**
 * Impilo vNext v1.1 — Canonical Request Hashing
 *
 * Produces a deterministic SHA-256 hex digest of a request body
 * by serializing with sorted keys so semantically identical bodies
 * always hash the same.
 */

/**
 * Canonical JSON serialization: sorts object keys recursively.
 */
export function canonicalJson(obj: unknown): string {
  return JSON.stringify(obj, (_key, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.keys(value)
        .sort()
        .reduce<Record<string, unknown>>((sorted, k) => {
          sorted[k] = (value as Record<string, unknown>)[k];
          return sorted;
        }, {});
    }
    return value;
  });
}

/**
 * Compute SHA-256 hex digest of canonicalized input.
 * Works in both browser (Web Crypto) and test environments.
 */
export async function computeRequestHash(body: unknown): Promise<string> {
  const canonical = canonicalJson(body ?? {});
  const encoder = new TextEncoder();
  const data = encoder.encode(canonical);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
