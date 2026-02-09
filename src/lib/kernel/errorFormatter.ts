/**
 * Impilo vNext v1.1 — Standard Error Formatter
 * 
 * Produces the mandatory error response format per Tech Companion Spec §C.
 * Used by both client-side error handling and server-side edge functions.
 */

import type { V1_1ErrorCode, V1_1ErrorResponse, KernelRequestContext } from './types';
import { V1_1_ERROR_CODES } from './types';

/**
 * Build a v1.1 compliant error response.
 */
export function formatError(
  code: V1_1ErrorCode,
  message: string,
  ctx: Pick<KernelRequestContext, 'requestId' | 'correlationId'>,
  details: Record<string, unknown> = {}
): V1_1ErrorResponse {
  return {
    error: {
      code,
      message,
      details,
      request_id: ctx.requestId,
      correlation_id: ctx.correlationId,
    },
  };
}

/**
 * Build a missing-header 400 error.
 */
export function formatMissingHeaderError(
  missingHeaders: string[],
  ctx: Pick<KernelRequestContext, 'requestId' | 'correlationId'>
): V1_1ErrorResponse {
  return formatError(
    V1_1_ERROR_CODES.MISSING_REQUIRED_HEADER,
    `Missing required headers: ${missingHeaders.join(', ')}`,
    ctx,
    { missing_headers: missingHeaders }
  );
}

/**
 * Map HTTP status codes to default error codes.
 */
export function httpStatusToErrorCode(status: number): V1_1ErrorCode {
  switch (status) {
    case 400: return V1_1_ERROR_CODES.INVALID_REQUEST;
    case 401: return V1_1_ERROR_CODES.AUTH_INVALID_CREDENTIALS;
    case 403: return V1_1_ERROR_CODES.POLICY_DENY;
    case 409: return V1_1_ERROR_CODES.IDENTITY_CONFLICT;
    case 429: return V1_1_ERROR_CODES.RATE_LIMITED;
    default: return V1_1_ERROR_CODES.INTERNAL_ERROR;
  }
}
