import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { LabTestCatalogItem } from "./useLabTestCatalog";

export interface LabOrderEntry {
  tests: LabTestCatalogItem[];
  patient_id: string;
  encounter_id?: string;
  priority: "routine" | "urgent" | "stat";
  clinical_indication?: string;
  diagnosis_code?: string;
  collection_instructions?: string;
  infection_control_flags?: string[];
  biosafety_level?: string;
  notes?: string;
}

export function useLabOrderEntry() {
  const [creating, setCreating] = useState(false);
  const { user } = useAuth();

  const createLabOrder = async (order: LabOrderEntry) => {
    if (!user) {
      toast.error("You must be logged in to create lab orders");
      return null;
    }

    if (!order.patient_id) {
      toast.error("Patient is required");
      return null;
    }

    if (order.tests.length === 0) {
      toast.error("At least one test must be selected");
      return null;
    }

    setCreating(true);
    try {
      // Generate order number
      const { data: orderNumber } = await supabase.rpc("generate_lab_order_number");

      // Create the lab order
      const { data: newOrder, error: orderError } = await supabase
        .from("lab_orders")
        .insert({
          patient_id: order.patient_id,
          encounter_id: order.encounter_id,
          order_number: orderNumber,
          ordered_by: user.id,
          priority: order.priority,
          clinical_indication: order.clinical_indication,
          diagnosis_code: order.diagnosis_code,
          collection_instructions: order.collection_instructions,
          infection_control_flags: order.infection_control_flags,
          biosafety_level: order.biosafety_level,
          notes: order.notes,
          is_stat: order.priority === "stat",
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create lab_order_tests entries
      const orderTests = order.tests.map(test => ({
        lab_order_id: newOrder.id,
        test_catalog_id: test.id,
        status: "ordered",
        priority: order.priority,
      }));

      const { error: testsError } = await supabase
        .from("lab_order_tests")
        .insert(orderTests);

      if (testsError) throw testsError;

      // Also create lab_results entries (pending)
      const results = order.tests.map(test => ({
        lab_order_id: newOrder.id,
        test_name: test.test_name,
        test_code: test.test_code,
        loinc_code: test.loinc_code,
        category: test.category,
        reference_range: test.reference_range_text || 
          (test.reference_range_low && test.reference_range_high 
            ? `${test.reference_range_low} - ${test.reference_range_high}`
            : null),
        result_unit: test.result_unit,
        ucum_unit: test.ucum_unit,
        status: "pending",
      }));

      const { error: resultsError } = await supabase
        .from("lab_results")
        .insert(results);

      if (resultsError) throw resultsError;

      // Log workflow event
      await supabase.from("lab_workflow_events").insert({
        entity_type: "order",
        entity_id: newOrder.id,
        event_type: "order_created",
        to_status: "pending",
        performed_by: user.id,
        metadata: {
          test_count: order.tests.length,
          priority: order.priority,
        },
      });

      toast.success(`Lab order ${orderNumber} created with ${order.tests.length} test(s)`);
      return newOrder;
    } catch (err: any) {
      toast.error(`Failed to create lab order: ${err.message}`);
      return null;
    } finally {
      setCreating(false);
    }
  };

  const cancelLabOrder = async (orderId: string, reason?: string) => {
    if (!user) return false;

    try {
      const { error: orderError } = await supabase
        .from("lab_orders")
        .update({ status: "cancelled" })
        .eq("id", orderId);

      if (orderError) throw orderError;

      // Update all order tests
      await supabase
        .from("lab_order_tests")
        .update({ status: "cancelled" })
        .eq("lab_order_id", orderId);

      // Update all results
      await supabase
        .from("lab_results")
        .update({ status: "cancelled" })
        .eq("lab_order_id", orderId);

      // Log event
      await supabase.from("lab_workflow_events").insert({
        entity_type: "order",
        entity_id: orderId,
        event_type: "order_cancelled",
        to_status: "cancelled",
        performed_by: user.id,
        notes: reason,
      });

      toast.success("Lab order cancelled");
      return true;
    } catch (err) {
      toast.error("Failed to cancel lab order");
      return false;
    }
  };

  return { createLabOrder, cancelLabOrder, creating };
}
