/**
 * MSIKA Flow v1.1 — Typed SDK Client
 */
import { supabase } from "@/integrations/supabase/client";

const FN = "msika-flow-v1";

function headers(): Record<string, string> {
  return {
    "X-Tenant-Id": "default",
    "X-Correlation-Id": crypto.randomUUID(),
    "X-Device-Fingerprint": crypto.randomUUID(),
    "X-Purpose-Of-Use": "COMMERCE",
    "X-Actor-Id": "msika-flow-ui",
    "X-Actor-Type": "PATIENT",
    "X-Session-Assurance": "HIGH",
  };
}

async function api(path: string, method = "GET", body?: unknown) {
  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || "";
  const anonKey = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY || "";
  const url = `${supabaseUrl}/functions/v1/${FN}/${path}`;
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token || anonKey;
  const resp = await fetch(url, {
    method,
    headers: { ...headers(), "Content-Type": "application/json", Authorization: `Bearer ${token}`, apikey: anonKey },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await resp.json().catch(() => null);
  if (!resp.ok) throw new Error(data?.error?.message || `API error ${resp.status}`);
  return data;
}

// Cart
export const validateCart = (items: any[]) => api("v1/cart/validate", "POST", { items });

// Orders
export const createOrder = (order: any) => api("v1/orders", "POST", order);
export const getOrder = (id: string) => api(`v1/orders/${id}`);
export const listOrders = (params?: Record<string, string>) => {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return api(`v1/orders${qs}`);
};
export const cancelOrder = (id: string, reason?: string) => api(`v1/orders/${id}/cancel`, "POST", { reason_code: reason });
export const priceOrder = (id: string) => api(`v1/orders/${id}/price`, "POST");
export const payOrder = (id: string) => api(`v1/orders/${id}/pay`, "POST");
export const routeOrder = (id: string, routeType?: string) => api(`v1/orders/${id}/route`, "POST", { route_type: routeType });
export const acceptOrder = (id: string) => api(`v1/orders/${id}/accept`, "POST");
export const markReady = (id: string, mode?: string) => api(`v1/orders/${id}/mark-ready`, "POST", { mode });
export const markDelivered = (id: string) => api(`v1/orders/${id}/mark-delivered`, "POST");
export const getTracking = (id: string) => api(`v1/orders/${id}/tracking`);

// Pickup
export const issuePickup = (id: string, delegated?: boolean) => api(`v1/orders/${id}/pickup/issue`, "POST", { delegated });
export const claimPickup = (orderId: string, otp?: string, token?: string) => api("v1/pickup/claim", "POST", { order_id: orderId, otp, token });

// Rx
export const attachRxToken = (orderId: string, tokenRef: string) => api("v1/rx/attach-token", "POST", { order_id: orderId, token_ref: tokenRef });
export const proposeSubstitution = (orderId: string, proposal: any) => api(`v1/rx/${orderId}/substitution/propose`, "POST", proposal);
export const approveSubstitution = (orderId: string) => api(`v1/rx/${orderId}/substitution/approve`, "POST");

// Bookings
export const createBooking = (booking: any) => api("v1/bookings/create", "POST", booking);
export const rescheduleBooking = (id: string, data: any) => api(`v1/bookings/${id}/reschedule`, "POST", data);
export const cancelBooking = (id: string) => api(`v1/bookings/${id}/cancel`, "POST");

// Vendors
export const applyVendor = (vendor: any) => api("v1/vendors/apply", "POST", vendor);
export const listVendors = () => api("v1/vendors");
export const getVendorOrders = (vendorId: string) => api(`v1/vendors/${vendorId}/orders`);

// Ops
export const getPendingReviews = () => api("v1/ops/reviews/pending");
export const approveReview = (id: string) => api(`v1/ops/reviews/${id}/approve`, "POST");
export const rejectReview = (id: string, notes?: string) => api(`v1/ops/reviews/${id}/reject`, "POST", { notes });

// Refunds
export const requestRefund = (orderId: string, amount: number, reason: string) => api(`v1/orders/${orderId}/refund/request`, "POST", { amount, reason });
