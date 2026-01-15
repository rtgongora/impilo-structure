import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessRequest {
  documentId: string;
  processingType: "ocr" | "classify" | "extract" | "quality" | "full";
}

interface OcrResult {
  text: string;
  confidence: number;
  language?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { documentId, processingType } = await req.json() as ProcessRequest;

    // Fetch document
    const { data: document, error: docError } = await supabase
      .from("landela_documents")
      .select("*, landela_document_types(*)")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      throw new Error(`Document not found: ${docError?.message}`);
    }

    // Get file from storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from(document.storage_bucket)
      .download(document.storage_path);

    if (fileError) {
      throw new Error(`Failed to download file: ${fileError.message}`);
    }

    // Convert to base64 for AI processing
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = document.mime_type;

    const results: { quality?: unknown; ocr?: OcrResult; classification?: unknown; entities?: unknown } = {};

    // Quality Check
    if (processingType === "quality" || processingType === "full") {
      const qualityResult = await analyzeQuality(lovableApiKey, base64, mimeType);
      results.quality = qualityResult;

      await supabase
        .from("landela_documents")
        .update({
          ai_quality_score: qualityResult.score,
          ai_quality_issues: qualityResult.issues,
        })
        .eq("id", documentId);
    }

    // OCR Processing
    if (processingType === "ocr" || processingType === "full") {
      const ocrResult = await performOCR(lovableApiKey, base64, mimeType);
      results.ocr = ocrResult;

      await supabase
        .from("landela_documents")
        .update({
          ocr_processed: true,
          ocr_text: ocrResult.text,
          ocr_confidence: ocrResult.confidence,
        })
        .eq("id", documentId);
    }

    // Document Classification
    if (processingType === "classify" || processingType === "full") {
      const { data: docTypes } = await supabase
        .from("landela_document_types")
        .select("id, code, name, category")
        .eq("is_active", true);

      const classifyResult = await classifyDocument(
        lovableApiKey,
        base64,
        mimeType,
        results.ocr?.text || "",
        docTypes || []
      );
      results.classification = classifyResult;

      if (classifyResult.suggestedTypeId) {
        await supabase
          .from("landela_documents")
          .update({
            ai_classified: true,
            ai_classification_confidence: classifyResult.confidence,
            ai_suggested_type_id: classifyResult.suggestedTypeId,
          })
          .eq("id", documentId);
      }
    }

    // Entity Extraction
    if (processingType === "extract" || processingType === "full") {
      const extractResult = await extractEntities(
        lovableApiKey,
        results.ocr?.text || "",
        document.document_type_code
      );
      results.entities = extractResult;

      await supabase
        .from("landela_documents")
        .update({
          ai_extracted_entities: extractResult.entities,
        })
        .eq("id", documentId);
    }

    // Update status
    await supabase
      .from("landela_documents")
      .update({
        status: "indexing_required",
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    // Log processing
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        await supabase.from("landela_audit_log").insert({
          action: processingType === "full" ? "ai_classify" : `ai_${processingType}`,
          document_id: documentId,
          user_id: user.id,
          details: { processingType, results },
        });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Processing error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function analyzeQuality(apiKey: string, base64: string, mimeType: string) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `You are a document quality analyzer. Analyze the image and identify quality issues.
Return a JSON object with:
- score: number 0-1 (1 = perfect quality)
- issues: array of strings describing quality problems (blur, rotation, cropping, lighting, etc.)
- recommendations: array of strings with improvement suggestions`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this document image for quality issues:" },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "report_quality",
            description: "Report document quality analysis",
            parameters: {
              type: "object",
              properties: {
                score: { type: "number", minimum: 0, maximum: 1 },
                issues: { type: "array", items: { type: "string" } },
                recommendations: { type: "array", items: { type: "string" } },
              },
              required: ["score", "issues", "recommendations"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "report_quality" } },
    }),
  });

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  
  if (toolCall?.function?.arguments) {
    return JSON.parse(toolCall.function.arguments);
  }
  
  return { score: 0.5, issues: [], recommendations: [] };
}

async function performOCR(apiKey: string, base64: string, mimeType: string) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `You are an OCR engine. Extract ALL text from the document image accurately, preserving layout where possible. Return the extracted text and your confidence level.`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract all text from this document:" },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "report_ocr",
            description: "Report OCR extraction results",
            parameters: {
              type: "object",
              properties: {
                text: { type: "string", description: "Extracted text content" },
                confidence: { type: "number", minimum: 0, maximum: 1 },
                language: { type: "string", description: "Detected language" },
              },
              required: ["text", "confidence"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "report_ocr" } },
    }),
  });

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  
  if (toolCall?.function?.arguments) {
    return JSON.parse(toolCall.function.arguments);
  }
  
  return { text: "", confidence: 0 };
}

async function classifyDocument(
  apiKey: string,
  base64: string,
  mimeType: string,
  ocrText: string,
  docTypes: Array<{ id: string; code: string; name: string; category: string }>
) {
  const docTypeList = docTypes.map(t => `${t.code}: ${t.name} (${t.category})`).join("\n");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `You are a document classifier for a healthcare system. Classify the document into one of these types:

${docTypeList}

Analyze both the visual layout and the text content to determine the document type.`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Classify this document. OCR Text:\n${ocrText.substring(0, 2000)}` },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "classify_document",
            description: "Report document classification",
            parameters: {
              type: "object",
              properties: {
                documentTypeCode: { type: "string", description: "The code of the matched document type" },
                confidence: { type: "number", minimum: 0, maximum: 1 },
                reasoning: { type: "string", description: "Why this classification was chosen" },
              },
              required: ["documentTypeCode", "confidence", "reasoning"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "classify_document" } },
    }),
  });

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  
  if (toolCall?.function?.arguments) {
    const result = JSON.parse(toolCall.function.arguments);
    const matchedType = docTypes.find(t => t.code === result.documentTypeCode);
    return {
      ...result,
      suggestedTypeId: matchedType?.id || null,
    };
  }
  
  return { documentTypeCode: "OTHER", confidence: 0, suggestedTypeId: null };
}

async function extractEntities(apiKey: string, ocrText: string, documentType: string) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `You are an entity extractor for healthcare documents. Extract relevant entities from the document text based on the document type: ${documentType}

Extract entities like:
- Names (patient, provider, facility)
- IDs (patient ID, invoice number, PO number, certificate number)
- Dates (event date, expiry date, issue date)
- Amounts (for invoices/financial docs)
- Diagnosis codes, medication names, lab results (for clinical docs)
- Contact information`,
        },
        {
          role: "user",
          content: `Extract entities from this ${documentType} document:\n\n${ocrText.substring(0, 3000)}`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "report_entities",
            description: "Report extracted entities",
            parameters: {
              type: "object",
              properties: {
                entities: {
                  type: "object",
                  properties: {
                    patientName: { type: "string" },
                    patientId: { type: "string" },
                    providerName: { type: "string" },
                    facilityName: { type: "string" },
                    documentDate: { type: "string" },
                    expiryDate: { type: "string" },
                    invoiceNumber: { type: "string" },
                    poNumber: { type: "string" },
                    amount: { type: "number" },
                    currency: { type: "string" },
                    diagnoses: { type: "array", items: { type: "string" } },
                    medications: { type: "array", items: { type: "string" } },
                    labResults: { type: "array", items: { type: "object" } },
                    other: { type: "object" },
                  },
                },
                confidence: { type: "number", minimum: 0, maximum: 1 },
              },
              required: ["entities", "confidence"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "report_entities" } },
    }),
  });

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  
  if (toolCall?.function?.arguments) {
    return JSON.parse(toolCall.function.arguments);
  }
  
  return { entities: {}, confidence: 0 };
}
