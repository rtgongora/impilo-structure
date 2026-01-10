import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

export interface OrderQueueItem {
  id: string;
  order_id: string;
  order_type: "lab" | "imaging" | "pharmacy" | "procedure";
  patient_id: string;
  patient_name: string;
  order_name: string;
  status: "pending" | "in_queue" | "in_progress" | "completed";
  queue_id?: string;
  queue_item_id?: string;
  created_at: string;
  priority: "routine" | "urgent" | "stat";
}

interface CreateQueueFromOrderParams {
  orderId: string;
  orderType: "lab" | "imaging" | "pharmacy" | "procedure";
  patientId: string;
  encounterId?: string;
  facilityId: string;
  priority?: "routine" | "urgent" | "stat";
  specialInstructions?: string;
}

// Valid service types from the database enum
type ValidServiceType = Database["public"]["Enums"]["queue_service_type"];

// Valid entry types from the database enum
type ValidEntryType = Database["public"]["Enums"]["queue_entry_type"];

// Valid priority types
type ValidPriority = Database["public"]["Enums"]["queue_priority"];

export function useOrderQueueIntegration() {
  const [loading, setLoading] = useState(false);

  /**
   * Creates a queue item when an order is placed
   * This is the core of the Order → Queue routing system
   */
  const createQueueFromOrder = useCallback(async (params: CreateQueueFromOrderParams): Promise<string | null> => {
    const { orderId, orderType, patientId, encounterId, facilityId, priority, specialInstructions } = params;

    setLoading(true);
    try {
      // 1. Find the appropriate queue for this order type
      const queueServiceType = mapOrderTypeToServiceType(orderType);
      
      const { data: queue, error: queueError } = await supabase
        .from("queue_definitions")
        .select("id, name")
        .eq("facility_id", facilityId)
        .eq("service_type", queueServiceType)
        .eq("is_active", true)
        .order("display_order")
        .limit(1)
        .maybeSingle();

      if (queueError) {
        console.error("Error finding queue:", queueError);
        throw new Error("Could not find appropriate service queue");
      }

      // If no queue exists, the order will still be tracked but won't have queue routing
      if (!queue) {
        console.warn(`No queue found for order type ${orderType} at facility ${facilityId}`);
        return null;
      }

      // 2. Get patient info for the ticket
      const { data: patient } = await supabase
        .from("patients")
        .select("first_name, last_name, mrn")
        .eq("id", patientId)
        .single();

      // 3. Generate ticket number
      const ticketPrefix = getTicketPrefix(orderType);
      const ticketNumber = `${ticketPrefix}${Math.floor(Math.random() * 900) + 100}`;

      // 4. Create the queue item
      const insertData = {
        queue_id: queue.id,
        patient_id: patientId,
        encounter_id: encounterId,
        entry_type: "walk_in" as ValidEntryType,
        reason_for_visit: `${getOrderDescription(orderType)} - Order #${orderId.slice(0, 8)}`,
        priority: mapPriorityToQueue(priority) as ValidPriority,
        ticket_number: ticketNumber,
        notes: specialInstructions ? `[Order Routing] ${specialInstructions}` : `[Order Routing] Source: ${orderType} order`,
      };

      const { data: queueItem, error: insertError } = await supabase
        .from("queue_items")
        .insert(insertData)
        .select("id")
        .single();

      if (insertError) throw insertError;

      // 5. Send notification to patient
      await supabase.from("client_queue_notifications").insert({
        patient_id: patientId,
        queue_item_id: queueItem.id,
        notification_type: "queue_confirmation",
        title: `${getOrderTypeName(orderType)} Ordered`,
        message: `Please proceed to ${queue.name}. Your ticket number is ${ticketNumber}.`,
        channel: "in_app",
        priority: priority === "stat" ? "high" : "normal",
      });

      toast.success(`Order routed to ${queue.name}`, {
        description: `Ticket: ${ticketNumber}`,
      });

      return queueItem.id;
    } catch (error) {
      console.error("Error creating queue from order:", error);
      toast.error("Failed to route order to queue");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * When an order is completed, automatically trigger return routing
   * E.g., after lab collection, patient returns to consultation
   */
  const completeOrderAndRoute = useCallback(async (
    queueItemId: string,
    returnToQueueId?: string,
    returnReason?: string
  ): Promise<boolean> => {
    setLoading(true);
    try {
      // Get the queue item details
      const { data: queueItem, error: fetchError } = await supabase
        .from("queue_items")
        .select("id, patient_id, encounter_id, priority, queue_id")
        .eq("id", queueItemId)
        .single();

      if (fetchError || !queueItem) throw new Error("Queue item not found");

      // Mark current queue item as completed
      const { error: updateError } = await supabase
        .from("queue_items")
        .update({
          status: "completed" as Database["public"]["Enums"]["queue_item_status"],
          completed_at: new Date().toISOString(),
        })
        .eq("id", queueItemId);

      if (updateError) throw updateError;

      // If return routing is specified, create new queue item
      if (returnToQueueId) {
        const ticketNumber = `R${Math.floor(Math.random() * 900) + 100}`;

        const returnInsertData = {
          queue_id: returnToQueueId,
          patient_id: queueItem.patient_id,
          encounter_id: queueItem.encounter_id,
          entry_type: "internal_transfer" as ValidEntryType,
          reason_for_visit: returnReason || "Return from investigation",
          priority: queueItem.priority,
          ticket_number: ticketNumber,
          transferred_from_queue_id: queueItem.queue_id,
          transferred_from_item_id: queueItemId,
          transfer_reason: "Order completed, returning to care pathway",
        };

        await supabase.from("queue_items").insert(returnInsertData);

        // Notify patient
        await supabase.from("client_queue_notifications").insert({
          patient_id: queueItem.patient_id,
          notification_type: "queue_update",
          title: "Please Return",
          message: returnReason || "Your investigation is complete. Please return for review.",
          channel: "in_app",
        });
      }

      return true;
    } catch (error) {
      console.error("Error completing order queue:", error);
      toast.error("Failed to complete order");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get pending order-based queue items for a patient
   */
  const getPatientOrderQueues = useCallback(async (patientId: string): Promise<OrderQueueItem[]> => {
    try {
      const { data, error } = await supabase
        .from("queue_items")
        .select("id, patient_id, status, ticket_number, reason_for_visit, priority, created_at, notes")
        .eq("patient_id", patientId)
        .in("status", ["waiting", "called", "in_service"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filter for order-related items (those with [Order Routing] in notes)
      return (data || [])
        .filter(item => item.notes?.includes("[Order Routing]"))
        .map(item => ({
          id: item.id,
          order_id: item.id,
          order_type: extractOrderType(item.reason_for_visit || ""),
          patient_id: item.patient_id || "",
          patient_name: "",
          order_name: item.reason_for_visit || "Unknown",
          status: mapQueueStatusToOrder(item.status),
          queue_id: undefined,
          queue_item_id: item.id,
          created_at: item.created_at || "",
          priority: mapQueuePriorityToOrder(item.priority),
        }));
    } catch (error) {
      console.error("Error fetching order queues:", error);
      return [];
    }
  }, []);

  return {
    loading,
    createQueueFromOrder,
    completeOrderAndRoute,
    getPatientOrderQueues,
  };
}

// Helper functions

function mapOrderTypeToServiceType(orderType: string): ValidServiceType {
  switch (orderType) {
    case "lab": return "lab_sample_collection";
    case "imaging": return "imaging";
    case "pharmacy": return "pharmacy";
    case "procedure": return "procedure_room";
    default: return "general_reception";
  }
}

function getTicketPrefix(orderType: string): string {
  switch (orderType) {
    case "lab": return "L";
    case "imaging": return "X";
    case "pharmacy": return "P";
    case "procedure": return "R";
    default: return "O";
  }
}

function getOrderDescription(orderType: string): string {
  switch (orderType) {
    case "lab": return "Laboratory Sample Collection";
    case "imaging": return "Radiology / Imaging";
    case "pharmacy": return "Pharmacy Dispensing";
    case "procedure": return "Procedure Room";
    default: return "Order Processing";
  }
}

function getOrderTypeName(orderType: string): string {
  switch (orderType) {
    case "lab": return "Lab Test";
    case "imaging": return "Imaging Study";
    case "pharmacy": return "Medication";
    case "procedure": return "Procedure";
    default: return "Order";
  }
}

function mapPriorityToQueue(priority?: string): ValidPriority {
  switch (priority) {
    case "stat": return "emergency";
    case "urgent": return "urgent";
    default: return "routine";
  }
}

function mapQueueStatusToOrder(status: string): OrderQueueItem["status"] {
  switch (status) {
    case "waiting": return "in_queue";
    case "called":
    case "in_service": return "in_progress";
    case "completed": return "completed";
    default: return "pending";
  }
}

function mapQueuePriorityToOrder(priority: string): "routine" | "urgent" | "stat" {
  switch (priority) {
    case "emergency":
    case "very_urgent": return "stat";
    case "urgent": return "urgent";
    default: return "routine";
  }
}

function extractOrderType(reasonForVisit: string): "lab" | "imaging" | "pharmacy" | "procedure" {
  if (reasonForVisit.toLowerCase().includes("lab")) return "lab";
  if (reasonForVisit.toLowerCase().includes("imaging") || reasonForVisit.toLowerCase().includes("radiology")) return "imaging";
  if (reasonForVisit.toLowerCase().includes("pharmacy")) return "pharmacy";
  return "procedure";
}
