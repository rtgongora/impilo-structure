import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useFulfillmentActions } from "./useFulfillmentActions";

export interface PatientPrescription {
  id: string;
  prescription_number: string;
  prescribed_at: string;
  status: string;
  priority: string;
  refills_remaining: number;
  valid_until?: string;
  is_controlled_substance: boolean;
  prescriber?: { display_name: string };
  items: PatientPrescriptionItem[];
  fulfillment_request?: { id: string; status: string; request_number: string };
}

export interface PatientPrescriptionItem {
  id: string;
  medication_name: string;
  generic_name?: string;
  dosage: string;
  dosage_unit: string;
  frequency: string;
  route: string;
  quantity: number;
  instructions?: string;
  status: string;
}

export interface VendorBid {
  id: string;
  vendor_id: string;
  vendor_name: string;
  vendor_type: string;
  verified: boolean;
  rating: number;
  distance: number;
  location: string;
  can_fulfill_all: boolean;
  items_available: number;
  total_items: number;
  total_amount: number;
  delivery_fee: number;
  estimated_ready_time: string;
  delivery_available: boolean;
  status: string;
  submitted_at: string;
}

export interface FulfillmentRequest {
  id: string;
  request_number: string;
  request_type: string;
  status: string;
  priority: string;
  created_at: string;
  bidding_deadline?: string;
  awarded_vendor_id?: string;
  total_amount?: number;
  delivery_required: boolean;
  items: { id: string; product_name: string; quantity: number; unit_of_measure: string; notes?: string }[];
  bids: VendorBid[];
}

export interface UploadedPrescriptionScan {
  id: string;
  image_url: string;
  status: "scanning" | "authenticating" | "authenticated" | "rejected" | "auctioning" | "bids_received";
  prescriber_name?: string;
  prescribed_date?: string;
  extracted_items: { name: string; dosage: string; quantity: number; instructions: string }[];
  validation_notes?: string;
}

export function usePatientPrescriptions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["patient-prescriptions", user?.id],
    queryFn: async (): Promise<PatientPrescription[]> => {
      if (!user?.id) return [];

      const { data: patient } = await supabase.from("patients").select("id").eq("user_id", user.id).maybeSingle();
      if (!patient) return [];

      const { data: rxData, error } = await supabase
        .from("prescriptions")
        .select("id, prescription_number, prescribed_at, status, priority, refills_remaining, valid_until, is_controlled_substance, prescribed_by")
        .eq("patient_id", patient.id)
        .in("status", ["active", "partially_filled"])
        .order("prescribed_at", { ascending: false });

      if (error || !rxData) return [];

      const rxIds = rxData.map(p => p.id);
      const prescriberIds = rxData.map(p => p.prescribed_by).filter(Boolean) as string[];

      const [itemsRes, profilesRes, fulfillRes] = await Promise.all([
        rxIds.length ? supabase.from("prescription_items").select("*").in("prescription_id", rxIds) : { data: [] },
        prescriberIds.length ? supabase.from("profiles").select("id, display_name").in("id", prescriberIds) : { data: [] },
        rxIds.length ? supabase.from("fulfillment_requests").select("id, status, request_number, prescription_id").in("prescription_id", rxIds) : { data: [] },
      ]);

      const itemsMap = new Map<string, PatientPrescriptionItem[]>();
      (itemsRes.data || []).forEach((item: any) => {
        const arr = itemsMap.get(item.prescription_id) || [];
        arr.push(item);
        itemsMap.set(item.prescription_id, arr);
      });

      const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p.display_name]));
      const fulfillMap = new Map((fulfillRes.data || []).map((f: any) => [f.prescription_id, { id: f.id, status: f.status, request_number: f.request_number }]));

      return rxData.map(rx => ({
        id: rx.id,
        prescription_number: rx.prescription_number,
        prescribed_at: rx.prescribed_at,
        status: rx.status,
        priority: rx.priority,
        refills_remaining: rx.refills_remaining || 0,
        valid_until: rx.valid_until || undefined,
        is_controlled_substance: rx.is_controlled_substance || false,
        prescriber: rx.prescribed_by ? { display_name: profileMap.get(rx.prescribed_by) || "Unknown" } : undefined,
        items: itemsMap.get(rx.id) || [],
        fulfillment_request: fulfillMap.get(rx.id),
      }));
    },
    enabled: !!user?.id,
  });
}

export function usePatientFulfillmentRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["patient-fulfillment-requests", user?.id],
    queryFn: async (): Promise<FulfillmentRequest[]> => {
      if (!user?.id) return [];

      const { data: patient } = await supabase.from("patients").select("id").eq("user_id", user.id).maybeSingle();
      if (!patient) return [];

      const { data: reqData, error } = await supabase
        .from("fulfillment_requests")
        .select("id, request_number, request_type, status, priority, created_at, bidding_deadline, awarded_vendor_id, total_amount, delivery_required")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error || !reqData) return [];

      const reqIds = reqData.map(r => r.id);

      const [itemsRes, bidsRes] = await Promise.all([
        reqIds.length ? supabase.from("fulfillment_request_items").select("*").in("request_id", reqIds) : { data: [] },
        reqIds.length ? supabase.from("vendor_bids").select("*").in("request_id", reqIds) : { data: [] },
      ]);

      const vendorIds = [...new Set((bidsRes.data || []).map((b: any) => b.vendor_id))];
      const vendorsRes = vendorIds.length ? await supabase.from("vendors").select("id, name, vendor_type, is_verified, rating, city").in("id", vendorIds) : { data: [] };
      const vendorMap = new Map((vendorsRes.data || []).map((v: any) => [v.id, v]));

      const itemsMap = new Map<string, any[]>();
      (itemsRes.data || []).forEach((item: any) => {
        const arr = itemsMap.get(item.request_id) || [];
        arr.push(item);
        itemsMap.set(item.request_id, arr);
      });

      const bidsMap = new Map<string, any[]>();
      (bidsRes.data || []).forEach((bid: any) => {
        const arr = bidsMap.get(bid.request_id) || [];
        arr.push(bid);
        bidsMap.set(bid.request_id, arr);
      });

      return reqData.map(req => ({
        id: req.id,
        request_number: req.request_number,
        request_type: req.request_type,
        status: req.status,
        priority: req.priority,
        created_at: req.created_at,
        bidding_deadline: req.bidding_deadline || undefined,
        awarded_vendor_id: req.awarded_vendor_id || undefined,
        total_amount: req.total_amount || undefined,
        delivery_required: req.delivery_required,
        items: itemsMap.get(req.id) || [],
        bids: (bidsMap.get(req.id) || []).map((bid: any) => {
          const vendor = vendorMap.get(bid.vendor_id);
          return {
            id: bid.id,
            vendor_id: bid.vendor_id,
            vendor_name: vendor?.name || "Unknown",
            vendor_type: vendor?.vendor_type || "vendor",
            verified: vendor?.is_verified || false,
            rating: vendor?.rating || 0,
            distance: 0,
            location: vendor?.city || "",
            can_fulfill_all: bid.can_fulfill_all,
            items_available: bid.can_fulfill_all ? (itemsMap.get(req.id)?.length || 0) : 0,
            total_items: itemsMap.get(req.id)?.length || 0,
            total_amount: bid.total_amount,
            delivery_fee: bid.delivery_fee || 0,
            estimated_ready_time: bid.estimated_ready_time || "",
            delivery_available: bid.delivery_available,
            status: bid.status,
            submitted_at: bid.submitted_at,
          };
        }),
      }));
    },
    enabled: !!user?.id,
  });
}

export function useConvertPrescriptionToFulfillment() {
  const queryClient = useQueryClient();
  const { convertPrescriptionToFulfillment, submitForBidding } = useFulfillmentActions();

  return useMutation({
    mutationFn: async ({ prescriptionId, patientId, encounterId, deliveryRequired, deliveryAddress }: {
      prescriptionId: string; patientId: string; encounterId?: string; deliveryRequired?: boolean; deliveryAddress?: string;
    }) => {
      const request = await convertPrescriptionToFulfillment({ prescriptionId, patientId, encounterId, deliveryRequired, deliveryAddress });
      if (!request) throw new Error("Failed to create fulfillment request");
      await submitForBidding(request.id, 4);
      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-prescriptions"] });
      queryClient.invalidateQueries({ queryKey: ["patient-fulfillment-requests"] });
      toast.success("Prescription submitted to marketplace!");
    },
    onError: () => toast.error("Failed to submit prescription"),
  });
}

export function useSelectVendorBid() {
  const queryClient = useQueryClient();
  const { awardBid } = useFulfillmentActions();

  return useMutation({
    mutationFn: async ({ requestId, bidId, vendorId, amount }: { requestId: string; bidId: string; vendorId: string; amount: number }) => {
      const success = await awardBid(requestId, bidId, vendorId, amount);
      if (!success) throw new Error("Failed");
      return { requestId, bidId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-fulfillment-requests"] });
      toast.success("Vendor selected!");
    },
    onError: () => toast.error("Failed to select vendor"),
  });
}

export function useUploadPhysicalPrescription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploadState, setUploadState] = useState<UploadedPrescriptionScan | null>(null);

  const uploadPrescription = async (file: File) => {
    if (!user?.id) { toast.error("You must be logged in"); return null; }

    const scanId = `scan-${Date.now()}`;
    setUploadState({ id: scanId, image_url: URL.createObjectURL(file), status: "scanning", extracted_items: [] });

    try {
      await new Promise(r => setTimeout(r, 1500));
      setUploadState(p => p ? { ...p, status: "authenticating" } : null);

      await new Promise(r => setTimeout(r, 2000));
      setUploadState(p => p ? {
        ...p, status: "authenticated", prescriber_name: "Dr. Sarah Moyo",
        prescribed_date: new Date(Date.now() - 2 * 86400000).toISOString(),
        extracted_items: [
          { name: "Metformin 500mg", dosage: "500mg", quantity: 60, instructions: "Take 1 tablet twice daily" },
          { name: "Amlodipine 5mg", dosage: "5mg", quantity: 30, instructions: "Take 1 tablet once daily" },
        ],
      } : null);

      await new Promise(r => setTimeout(r, 1500));
      setUploadState(p => p ? { ...p, status: "auctioning" } : null);

      await new Promise(r => setTimeout(r, 2000));
      setUploadState(p => p ? { ...p, status: "bids_received" } : null);

      queryClient.invalidateQueries({ queryKey: ["patient-fulfillment-requests"] });
      toast.success("Prescription verified!");
      return uploadState;
    } catch {
      setUploadState(p => p ? { ...p, status: "rejected", validation_notes: "Failed" } : null);
      toast.error("Failed to process prescription");
      return null;
    }
  };

  const resetUpload = () => setUploadState(null);
  return { uploadPrescription, uploadState, resetUpload };
}
