import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withKernelMiddleware, kernelError, kernelSuccess, KernelContext } from "../_shared/middleware.ts";

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

serve(withKernelMiddleware(async (req: Request, ctx: KernelContext) => {
  const { type, patientData } = await req.json() as { type: string; patientData: PatientData };
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  if (!LOVABLE_API_KEY) {
    return kernelError("INTERNAL_ERROR", "LOVABLE_API_KEY is not configured", 500, ctx);
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
      return kernelError("INVALID_REQUEST", "Invalid request type", 400, ctx);
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
      return kernelError("RATE_LIMITED", "Rate limit exceeded. Please try again later.", 429, ctx);
    }
    if (response.status === 402) {
      return kernelError("INTERNAL_ERROR", "AI credits exhausted. Please add funds to continue.", 402, ctx);
    }
    const errorText = await response.text();
    console.error(`[${ctx.requestId}] AI Gateway error:`, response.status, errorText);
    return kernelError("INTERNAL_ERROR", `AI Gateway error: ${response.status}`, 500, ctx);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    return kernelError("INTERNAL_ERROR", "No content in AI response", 500, ctx);
  }

  let parsedContent;
  try {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;
    parsedContent = JSON.parse(jsonStr);
  } catch {
    parsedContent = { rawResponse: content };
  }

  return kernelSuccess({ result: parsedContent, type }, ctx);
}));
