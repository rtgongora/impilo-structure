import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LabTestCatalogItem {
  id: string;
  test_code: string;
  loinc_code: string | null;
  test_name: string;
  short_name: string | null;
  category: string;
  specimen_type: string;
  specimen_snomed_code: string | null;
  department: string | null;
  result_type: string;
  result_unit: string | null;
  ucum_unit: string | null;
  reference_range_low: number | null;
  reference_range_high: number | null;
  critical_low: number | null;
  critical_high: number | null;
  reference_range_text: string | null;
  is_panel: boolean;
  panel_components: string[] | null;
  turnaround_time_hours: number;
  requires_fasting: boolean;
  collection_instructions: string | null;
  stability_hours: number | null;
  temperature_requirement: string | null;
  is_orderable: boolean;
  is_active: boolean;
}

export function useLabTestCatalog(category?: string) {
  const [tests, setTests] = useState<LabTestCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("lab_test_catalog")
        .select("*")
        .eq("is_active", true)
        .eq("is_orderable", true)
        .order("category")
        .order("test_name");

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setTests((data as LabTestCatalogItem[]) || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [category]);

  const categories = [...new Set(tests.map(t => t.category))];

  return { tests, loading, error, categories, refetch: fetchTests };
}

export function useLabTestDetails(testId: string) {
  const [test, setTest] = useState<LabTestCatalogItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!testId) return;

    const fetchTest = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("lab_test_catalog")
        .select("*")
        .eq("id", testId)
        .single();

      if (!error && data) {
        setTest(data as LabTestCatalogItem);
      }
      setLoading(false);
    };

    fetchTest();
  }, [testId]);

  return { test, loading };
}
