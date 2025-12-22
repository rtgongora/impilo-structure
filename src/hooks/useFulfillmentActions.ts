import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { addHours } from "date-fns";

export interface ConvertPrescriptionOptions {
  prescriptionId: string;
  patientId: string;
  encounterId?: string;
  priority?: "stat" | "urgent" | "routine";
  deliveryRequired?: boolean;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryProvince?: string;
  deliveryPostalCode?: string;
  notes?: string;
}

export function useFulfillmentActions() {
  const { user } = useAuth();
  const [converting, setConverting] = useState(false);
  const [generatingBids, setGeneratingBids] = useState(false);

  /**
   * Convert an e-prescription into a fulfillment request (auction trigger)
   */
  const convertPrescriptionToFulfillment = async (options: ConvertPrescriptionOptions) => {
    if (!user) {
      toast.error("You must be logged in to create fulfillment requests");
      return null;
    }

    setConverting(true);
    try {
      // Fetch prescription items
      const { data: prescriptionItems, error: itemsError } = await supabase
        .from("prescription_items")
        .select("*")
        .eq("prescription_id", options.prescriptionId);

      if (itemsError) throw itemsError;
      if (!prescriptionItems?.length) {
        toast.error("No items found in this prescription");
        return null;
      }

      // Generate fulfillment request number
      const { data: requestNumber } = await supabase.rpc("generate_fulfillment_number");

      // Create the fulfillment request
      const { data: fulfillmentRequest, error: requestError } = await supabase
        .from("fulfillment_requests")
        .insert({
          request_number: requestNumber || `FUL-${Date.now()}`,
          request_type: "prescription",
          patient_id: options.patientId,
          encounter_id: options.encounterId,
          prescription_id: options.prescriptionId,
          priority: options.priority || "routine",
          delivery_required: options.deliveryRequired || false,
          delivery_address: options.deliveryAddress,
          delivery_city: options.deliveryCity,
          delivery_province: options.deliveryProvince,
          delivery_postal_code: options.deliveryPostalCode,
          notes: options.notes,
          requested_by: user.id,
          status: "draft",
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Create fulfillment request items from prescription items
      const fulfillmentItems = prescriptionItems.map((item) => ({
        request_id: fulfillmentRequest.id,
        prescription_item_id: item.id,
        product_name: item.medication_name,
        quantity: item.quantity,
        unit_of_measure: item.dosage_unit,
        notes: item.instructions,
      }));

      const { error: fulfillmentItemsError } = await supabase
        .from("fulfillment_request_items")
        .insert(fulfillmentItems);

      if (fulfillmentItemsError) throw fulfillmentItemsError;

      // Create tracking entry
      await supabase.from("fulfillment_tracking").insert({
        request_id: fulfillmentRequest.id,
        status: "draft",
        notes: "Fulfillment request created from prescription",
        updated_by: user.id,
      });

      toast.success(`Fulfillment request ${requestNumber} created successfully`);
      return fulfillmentRequest;
    } catch (err) {
      console.error("Error converting prescription:", err);
      toast.error("Failed to create fulfillment request");
      return null;
    } finally {
      setConverting(false);
    }
  };

  /**
   * Submit a fulfillment request for vendor bidding
   */
  const submitForBidding = async (requestId: string, biddingWindowHours = 2) => {
    if (!user) {
      toast.error("You must be logged in");
      return false;
    }

    try {
      const biddingDeadline = addHours(new Date(), biddingWindowHours);

      const { error } = await supabase
        .from("fulfillment_requests")
        .update({
          status: "bidding",
          bidding_deadline: biddingDeadline.toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;

      // Add tracking entry
      await supabase.from("fulfillment_tracking").insert({
        request_id: requestId,
        status: "bidding",
        notes: `Request opened for vendor bidding until ${biddingDeadline.toLocaleString()}`,
        updated_by: user.id,
      });

      toast.success("Request submitted for vendor bidding");
      return true;
    } catch (err) {
      console.error("Error submitting for bidding:", err);
      toast.error("Failed to submit for bidding");
      return false;
    }
  };

  /**
   * Generate demo vendor bids for a fulfillment request
   * This is for demonstration/testing purposes
   */
  const generateDemoBids = async (requestId: string) => {
    if (!user) {
      toast.error("You must be logged in");
      return false;
    }

    setGeneratingBids(true);
    try {
      // Fetch the fulfillment request items to calculate base pricing
      const { data: items, error: itemsError } = await supabase
        .from("fulfillment_request_items")
        .select("*")
        .eq("request_id", requestId);

      if (itemsError) throw itemsError;
      if (!items?.length) {
        toast.error("No items found in this request");
        return false;
      }

      // Fetch active vendors - using any cast to avoid deep type inference issue
      const vendorResult = await (supabase as any)
        .from("vendors")
        .select("id, name, delivery_available")
        .eq("is_active", true)
        .limit(5);

      if (vendorResult.error) throw vendorResult.error;
      const vendors = vendorResult.data as { id: string; name: string; delivery_available: boolean }[];
      if (!vendors?.length) {
        toast.error("No active vendors found for bidding");
        return false;
      }

      // Generate unit prices for each item (R75-R200 per unit)
      const unitPrices: Record<string, number> = {};
      items.forEach((item) => {
        unitPrices[item.id] = Math.round((75 + Math.random() * 125) * 100) / 100;
      });

      // Calculate base price
      const basePrice = items.reduce((sum, item) => {
        return sum + unitPrices[item.id] * item.quantity;
      }, 0);

      // Generate competitive bids from vendors
      const bids = vendors.map((vendor) => {
        // Vary pricing based on vendor characteristics
        const priceVariation = 0.85 + Math.random() * 0.35; // 85%-120% of base
        
        // Create vendor-specific unit prices
        const vendorUnitPrices: Record<string, number> = {};
        items.forEach((item) => {
          vendorUnitPrices[item.id] = Math.round(unitPrices[item.id] * priceVariation * 100) / 100;
        });

        const totalAmount = Math.round(basePrice * priceVariation * 100) / 100;
        const discountPercent = Math.round(Math.random() * 15 * 100) / 100; // 0-15% discount
        const deliveryFee = vendor.delivery_available ? Math.round(25 + Math.random() * 75) : 0;

        // Estimate ready time: 30 mins to 4 hours
        const readyMinutes = 30 + Math.floor(Math.random() * 210);
        const estimatedReady = new Date(Date.now() + readyMinutes * 60000);

        return {
          request_id: requestId,
          vendor_id: vendor.id,
          status: "submitted",
          can_fulfill_all: Math.random() > 0.2, // 80% chance can fulfill all
          unit_prices: vendorUnitPrices,
          total_amount: totalAmount,
          discount_percent: discountPercent,
          estimated_ready_time: estimatedReady.toISOString(),
          delivery_available: vendor.delivery_available,
          delivery_fee: deliveryFee,
          notes: `Demo bid from ${vendor.name}`,
        };
      });

      // Insert bids
      const { error: bidsError } = await supabase.from("vendor_bids").insert(bids);

      if (bidsError) throw bidsError;

      toast.success(`Generated ${bids.length} demo vendor bids`);
      return true;
    } catch (err) {
      console.error("Error generating demo bids:", err);
      toast.error("Failed to generate demo bids");
      return false;
    } finally {
      setGeneratingBids(false);
    }
  };

  /**
   * Award a bid to a vendor
   */
  const awardBid = async (requestId: string, bidId: string, vendorId: string, amount: number) => {
    if (!user) {
      toast.error("You must be logged in");
      return false;
    }

    try {
      // Update bid status to accepted
      const { error: bidError } = await supabase
        .from("vendor_bids")
        .update({ status: "accepted" })
        .eq("id", bidId);

      if (bidError) throw bidError;

      // Reject other bids
      await supabase
        .from("vendor_bids")
        .update({ status: "rejected" })
        .eq("request_id", requestId)
        .neq("id", bidId);

      // Update fulfillment request
      const { error: requestError } = await supabase
        .from("fulfillment_requests")
        .update({
          status: "awarded",
          awarded_vendor_id: vendorId,
          awarded_at: new Date().toISOString(),
          total_amount: amount,
        })
        .eq("id", requestId);

      if (requestError) throw requestError;

      // Add tracking entry
      await supabase.from("fulfillment_tracking").insert({
        request_id: requestId,
        status: "awarded",
        notes: `Bid awarded for R${amount.toFixed(2)}`,
        updated_by: user.id,
      });

      toast.success("Bid awarded successfully");
      return true;
    } catch (err) {
      console.error("Error awarding bid:", err);
      toast.error("Failed to award bid");
      return false;
    }
  };

  /**
   * Update fulfillment request status with tracking
   */
  const updateFulfillmentStatus = async (
    requestId: string,
    newStatus: string,
    notes?: string,
    location?: string
  ) => {
    if (!user) {
      toast.error("You must be logged in");
      return false;
    }

    try {
      // Update request status
      const { error: requestError } = await supabase
        .from("fulfillment_requests")
        .update({ status: newStatus as any })
        .eq("id", requestId);

      if (requestError) throw requestError;

      // Add tracking entry
      await supabase.from("fulfillment_tracking").insert({
        request_id: requestId,
        status: newStatus as any,
        notes: notes || `Status updated to ${newStatus}`,
        location: location || null,
        updated_by: user.id,
      });

      toast.success(`Order status updated to ${newStatus}`);
      return true;
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Failed to update status");
      return false;
    }
  };

  /**
   * Confirm an awarded order (vendor accepts)
   */
  const confirmOrder = async (requestId: string) => {
    return updateFulfillmentStatus(requestId, "confirmed", "Vendor confirmed the order");
  };

  /**
   * Mark order as processing
   */
  const startProcessing = async (requestId: string) => {
    return updateFulfillmentStatus(requestId, "processing", "Order is being prepared");
  };

  /**
   * Mark order as ready for pickup
   */
  const markReady = async (requestId: string, location?: string) => {
    return updateFulfillmentStatus(requestId, "ready", "Order is ready for pickup", location);
  };

  /**
   * Mark order as dispatched for delivery
   */
  const dispatchOrder = async (requestId: string, notes?: string) => {
    return updateFulfillmentStatus(requestId, "dispatched", notes || "Order dispatched for delivery");
  };

  /**
   * Mark order as delivered
   */
  const markDelivered = async (requestId: string, location?: string) => {
    return updateFulfillmentStatus(requestId, "delivered", "Order delivered to patient", location);
  };

  /**
   * Complete the order
   */
  const completeOrder = async (requestId: string) => {
    return updateFulfillmentStatus(requestId, "completed", "Order completed successfully");
  };

  /**
   * Cancel the order
   */
  const cancelOrder = async (requestId: string, reason?: string) => {
    return updateFulfillmentStatus(requestId, "cancelled", reason || "Order cancelled");
  };

  return {
    convertPrescriptionToFulfillment,
    submitForBidding,
    generateDemoBids,
    awardBid,
    updateFulfillmentStatus,
    confirmOrder,
    startProcessing,
    markReady,
    dispatchOrder,
    markDelivered,
    completeOrder,
    cancelOrder,
    converting,
    generatingBids,
  };
}
