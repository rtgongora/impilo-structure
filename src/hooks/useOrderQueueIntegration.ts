import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
        .select("first_name, last_name, mrn, health_id")
        .eq("id", patientId)
        .single();

      // 3. Generate ticket number
      const ticketPrefix = getTicketPrefix(orderType);
      const ticketNumber = `${ticketPrefix}${Math.floor(Math.random() * 900) + 100}`;

      // 4. Create the queue item
      const { data: queueItem, error: insertError } = await supabase
        .from("queue_items")
        .insert({
          queue_id: queue.id,
          patient_id: patientId,
          health_id: patient?.health_id,
          encounter_id: encounterId,
          entry_type: "order_routing",
          reason_for_visit: getOrderDescription(orderType),
          priority: mapPriorityToQueue(priority),
          ticket_number: ticketNumber,
          notes: specialInstructions,
          metadata: {
            source_order_id: orderId,
            source_order_type: orderType,
          },
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      // 5. Update the original order with the queue reference
      await updateOrderWithQueueRef(orderId, orderType, queueItem.id);

      // 6. Send notification to patient
      await supabase.from("client_queue_notifications").insert({
        patient_id: patientId,
        queue_item_id: queueItem.id,
        notification_type: "order_routing",
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
        .select("*, patient:patients(first_name, last_name)")
        .eq("id", queueItemId)
        .single();

      if (fetchError || !queueItem) throw new Error("Queue item not found");

      // Mark current queue item as completed
      const { error: updateError } = await supabase
        .from("queue_items")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", queueItemId);

      if (updateError) throw updateError;

      // If return routing is specified, create new queue item
      if (returnToQueueId) {
        const ticketNumber = `R${Math.floor(Math.random() * 900) + 100}`;

        await supabase.from("queue_items").insert({
          queue_id: returnToQueueId,
          patient_id: queueItem.patient_id,
          health_id: queueItem.health_id,
          encounter_id: queueItem.encounter_id,
          entry_type: "return_routing",
          reason_for_visit: returnReason || "Return from investigation",
          priority: queueItem.priority,
          ticket_number: ticketNumber,
          transferred_from_queue_id: queueItem.queue_id,
          transferred_from_item_id: queueItemId,
          transfer_reason: "Order completed, returning to care pathway",
        });

        // Notify patient
        await supabase.from("client_queue_notifications").insert({
          patient_id: queueItem.patient_id,
          notification_type: "return_routing",
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
        .select(`
          id,
          patient_id,
          status,
          ticket_number,
          reason_for_visit,
          priority,
          created_at,
          metadata,
          queue:queue_definitions(name)
        `)
        .eq("patient_id", patientId)
        .eq("entry_type", "order_routing")
        .in("status", ["waiting", "called", "in_service"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        order_id: (item.metadata as any)?.source_order_id || item.id,
        order_type: (item.metadata as any)?.source_order_type || "lab",
        patient_id: item.patient_id,
        patient_name: "",
        order_name: item.reason_for_visit || "Unknown",
        status: mapQueueStatusToOrder(item.status),
        queue_id: undefined,
        queue_item_id: item.id,
        created_at: item.created_at,
        priority: item.priority as any,
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

function mapOrderTypeToServiceType(orderType: string): string {
  switch (orderType) {
    case "lab": return "lab_sample_collection";
    case "imaging": return "imaging";
    case "pharmacy": return "pharmacy";
    case "procedure": return "procedure_room";
    default: return "general";
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

function mapPriorityToQueue(priority?: string): string {
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

async function updateOrderWithQueueRef(orderId: string, orderType: string, queueItemId: string) {
  let table: string;
  
  switch (orderType) {
    case "lab":
      table = "lab_orders";
      break;
    case "imaging":
      table = "imaging_orders";
      break;
    case "pharmacy":
      table = "medication_orders";
      break;
    default:
      return; // Unknown order type
  }

  try {
    await supabase
      .from(table)
      .update({ queue_item_id: queueItemId })
      .eq("id", orderId);
  } catch (error) {
    console.warn(`Could not update ${table} with queue reference:`, error);
  }
}
