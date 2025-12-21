import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PatientData {
  symptoms?: string[];
  vitalSigns?: {
    temperature?: number;
    bloodPressure?: { systolic: number; diastolic: number };
    heartRate?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
  };
  labResults?: { name: string; value: number; unit: string }[];
  medications?: string[];
  allergies?: string[];
  conditions?: string[];
  age?: number;
  gender?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, patientData } = await req.json() as { type: string; patientData: PatientData };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (type) {
      case "diagnostic":
        systemPrompt = `You are a clinical decision support AI assistant. You help healthcare providers by analyzing patient data and providing evidence-based diagnostic suggestions. 

IMPORTANT: You do NOT make diagnoses. You provide differential diagnoses ranked by likelihood based on the data provided, along with recommended next steps.

Always structure your response as JSON with this format:
{
  "differentials": [
    { "diagnosis": "Name", "likelihood": "high|medium|low", "reasoning": "Brief explanation" }
  ],
  "recommendedTests": ["List of recommended diagnostic tests"],
  "redFlags": ["Any concerning findings requiring immediate attention"],
  "clinicalPearls": ["Relevant clinical insights"]
}`;
        userPrompt = `Analyze this patient data and provide differential diagnoses:\n${JSON.stringify(patientData, null, 2)}`;
        break;

      case "drug-interaction":
        systemPrompt = `You are a clinical pharmacology AI assistant specialized in drug interactions. Analyze medication lists for potential interactions.

Always structure your response as JSON with this format:
{
  "interactions": [
    { 
      "drugs": ["Drug1", "Drug2"], 
      "severity": "critical|major|moderate|minor", 
      "mechanism": "How they interact",
      "clinicalEffect": "What happens to patient",
      "recommendation": "What to do"
    }
  ],
  "safetyAlerts": ["Important safety information"],
  "monitoringRequired": ["Parameters to monitor"]
}`;
        userPrompt = `Check for drug interactions in this medication list:\nMedications: ${patientData.medications?.join(", ")}\nAllergies: ${patientData.allergies?.join(", ")}\nConditions: ${patientData.conditions?.join(", ")}`;
        break;

      case "lab-interpretation":
        systemPrompt = `You are a clinical laboratory AI assistant. Help interpret lab results in clinical context.

Always structure your response as JSON with this format:
{
  "interpretation": [
    {
      "test": "Test name",
      "status": "normal|abnormal|critical",
      "clinicalSignificance": "What this means",
      "possibleCauses": ["List of possible causes"]
    }
  ],
  "patterns": ["Any notable patterns across multiple tests"],
  "recommendations": ["Follow-up tests or actions recommended"]
}`;
        userPrompt = `Interpret these lab results in clinical context:\n${JSON.stringify(patientData.labResults, null, 2)}\nPatient conditions: ${patientData.conditions?.join(", ")}`;
        break;

      default:
        throw new Error("Invalid request type");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Try to parse as JSON, otherwise return as text
    let parsedContent;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      parsedContent = JSON.parse(jsonStr);
    } catch {
      parsedContent = { rawResponse: content };
    }

    return new Response(JSON.stringify({ result: parsedContent, type }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ai-diagnostic function:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
