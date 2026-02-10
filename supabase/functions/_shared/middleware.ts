/**
 * Impilo vNext v1.1 — Shared Edge Function Middleware
 * 
 * Server-side middleware for ALL edge functions.
 * Enforces mandatory headers, standard error format, and correlation propagation
 * per Technical Companion Spec §A-C.
 * 
 * Usage in edge functions:
 *   import { withKernelMiddleware, KernelContext } from "../_shared/middleware.ts";
 *   
 *   serve(withKernelMiddleware(async (req, ctx: KernelContext) => {
 *     // ctx.tenantId, ctx.podId, ctx.requestId, ctx.correlationId available
 *     // Return a standard Response
 *   }));
 */

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, " +
    "x-tenant-id, x-pod-id, x-request-id, x-correlation-id, " +
    "x-facility-id, x-workspace-id, x-shift-id, " +
    "x-purpose-of-use, x-actor-id, x-actor-type, " +
    "x-device-fingerprint, x-client-timeout-ms, " +
    "idempotency-key",
};

export interface KernelContext {
  tenantId: string;
  podId: string;
  requestId: string;
  correlationId: string;
  actorId?: string;
  actorType?: string;
  purposeOfUse?: string;
  deviceFingerprint?: string;
  facilityId?: string;
  workspaceId?: string;
  shiftId?: string;
}

interface V1_1Error {
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
    request_id: string;
    correlation_id: string;
  };
}

/**
 * Generate a UUID v4 using Deno's crypto.
 */
function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Build a v1.1 standard error response.
 */
export function kernelError(
  code: string,
  message: string,
  status: number,
  ctx: KernelContext,
  details: Record<string, unknown> = {}
): Response {
  const body: V1_1Error = {
    error: {
      code,
      message,
      details,
      request_id: ctx.requestId,
      correlation_id: ctx.correlationId,
    },
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "X-Request-ID": ctx.requestId,
      "X-Correlation-ID": ctx.correlationId,
    },
  });
}

/**
 * Build a success response with standard headers.
 */
export function kernelSuccess(
  body: unknown,
  ctx: KernelContext,
  status: number = 200
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "X-Request-ID": ctx.requestId,
      "X-Correlation-ID": ctx.correlationId,
    },
  });
}

/**
 * Extract and validate kernel context from request headers.
 * Returns null + error response if validation fails.
 */
function extractContext(req: Request): { ctx: KernelContext | null; errorResponse: Response | null } {
  const requestId = req.headers.get("x-request-id") || generateUUID();
  const correlationId = req.headers.get("x-correlation-id") || generateUUID();
  const tenantId = req.headers.get("x-tenant-id");
  const podId = req.headers.get("x-pod-id");

  // Partial context for error reporting
  const partialCtx: KernelContext = {
    tenantId: tenantId || "",
    podId: podId || "",
    requestId,
    correlationId,
  };

  const missingHeaders: string[] = [];
  if (!tenantId) missingHeaders.push("X-Tenant-ID");
  if (!podId) missingHeaders.push("X-Pod-ID");

  if (missingHeaders.length > 0) {
    return {
      ctx: null,
      errorResponse: kernelError(
        "MISSING_REQUIRED_HEADER",
        `Missing required headers: ${missingHeaders.join(", ")}`,
        400,
        partialCtx,
        { missing_headers: missingHeaders }
      ),
    };
  }

  return {
    ctx: {
      tenantId: tenantId!,
      podId: podId!,
      requestId,
      correlationId,
      actorId: req.headers.get("x-actor-id") || undefined,
      actorType: req.headers.get("x-actor-type") || undefined,
      purposeOfUse: req.headers.get("x-purpose-of-use") || undefined,
      deviceFingerprint: req.headers.get("x-device-fingerprint") || undefined,
      facilityId: req.headers.get("x-facility-id") || undefined,
      workspaceId: req.headers.get("x-workspace-id") || undefined,
      shiftId: req.headers.get("x-shift-id") || undefined,
    },
    errorResponse: null,
  };
}

/**
 * Middleware wrapper for edge functions.
 * Handles CORS preflight, header validation, and error formatting.
 * 
 * @param handler - The actual request handler receiving (req, ctx)
 * @param options - Optional config (e.g., skipHeaderValidation for health checks)
 */
export function withKernelMiddleware(
  handler: (req: Request, ctx: KernelContext) => Promise<Response>,
  options?: { skipHeaderValidation?: boolean }
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Extract context
    if (options?.skipHeaderValidation) {
      const ctx: KernelContext = {
        tenantId: req.headers.get("x-tenant-id") || "system",
        podId: req.headers.get("x-pod-id") || "national",
        requestId: req.headers.get("x-request-id") || generateUUID(),
        correlationId: req.headers.get("x-correlation-id") || generateUUID(),
      };
      try {
        return await handler(req, ctx);
      } catch (err) {
        console.error(`[${ctx.requestId}] Unhandled error:`, err);
        return kernelError(
          "INTERNAL_ERROR",
          err instanceof Error ? err.message : "Internal server error",
          500,
          ctx
        );
      }
    }

    const { ctx, errorResponse } = extractContext(req);
    if (!ctx) {
      return errorResponse!;
    }

    try {
      return await handler(req, ctx);
    } catch (err) {
      console.error(`[${ctx.requestId}] Unhandled error:`, err);
      return kernelError(
        "INTERNAL_ERROR",
        err instanceof Error ? err.message : "Internal server error",
        500,
        ctx
      );
    }
  };
}
