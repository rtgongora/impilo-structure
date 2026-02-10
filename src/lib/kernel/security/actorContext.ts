/**
 * Impilo vNext v1.1 — Actor Context Extraction
 *
 * Resolves the acting subject from JWT claims or fallback headers.
 * Used by all command endpoints to identify who is performing the action.
 *
 * Priority:
 * 1. JWT claims (if present) — prototype: not implemented, skip
 * 2. Explicit headers:
 *    - X-Actor-Subject-ID (required)
 *    - X-Actor-Roles (comma-separated, required)
 *    - X-Actor-Facility-ID (optional)
 *    - X-Actor-Assurance-Level (optional)
 * 3. If nothing → throw 401 AUTH_REQUIRED
 */

import type { AuditActor } from '../audit/types';

export interface ActorHeaders {
  'x-actor-subject-id'?: string;
  'x-actor-roles'?: string;
  'x-actor-facility-id'?: string;
  'x-actor-assurance-level'?: string;
  [key: string]: string | undefined;
}

/**
 * Extract actor from request headers.
 * @throws structured error with code AUTH_REQUIRED if actor cannot be resolved.
 */
export function getActorFromHeaders(headers: ActorHeaders): AuditActor & { assurance_level?: string } {
  const subjectId = headers['x-actor-subject-id'];
  const rolesRaw = headers['x-actor-roles'];

  if (!subjectId || !rolesRaw) {
    throw {
      code: 'AUTH_REQUIRED',
      status: 401,
      message: 'Cannot resolve actor identity. Provide X-Actor-Subject-ID and X-Actor-Roles headers.',
    };
  }

  const roles = rolesRaw.split(',').map(r => r.trim()).filter(Boolean);
  if (roles.length === 0) {
    throw {
      code: 'AUTH_REQUIRED',
      status: 401,
      message: 'X-Actor-Roles header is empty; at least one role is required.',
    };
  }

  return {
    subject_id: subjectId,
    roles,
    facility_id: headers['x-actor-facility-id'],
    assurance_level: headers['x-actor-assurance-level'],
  };
}
