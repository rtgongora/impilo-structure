import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withKernelMiddleware, kernelError, kernelSuccess, KernelContext } from "../_shared/middleware.ts";

serve(withKernelMiddleware(async (req: Request, ctx: KernelContext) => {
  const { message, emergencyType, history, location } = await req.json();
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  if (!LOVABLE_API_KEY) {
    console.log(`[${ctx.requestId}] LOVABLE_API_KEY not configured, using fallback response`);
    return kernelSuccess({ 
      response: getEmergencyFallbackResponse(message, emergencyType) 
    }, ctx);
  }

  const conversationHistory = history?.map((msg: any) => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.content
  })) || [];

  const systemPrompt = `You are an emergency medical triage AI assistant. Your role is to:
1. Keep the patient calm and reassured
2. Gather critical medical information quickly
3. Provide appropriate first aid guidance
4. Assess the severity of the situation
5. Advise on immediate actions while help is on the way

IMPORTANT GUIDELINES:
- Always prioritize life-threatening symptoms
- Ask focused, relevant questions based on the emergency type
- Provide clear, actionable instructions
- Never dismiss potentially serious symptoms
- Always reassure that emergency services have been notified
- If symptoms suggest a life-threatening emergency, emphasize staying calm and not moving unless necessary

Emergency Type: ${emergencyType || 'unknown'}
Patient Location: ${location || 'unknown'}

Respond concisely but thoroughly. Focus on immediate safety and gathering relevant medical information.`;

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
        ...conversationHistory,
        { role: "user", content: message }
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      return kernelError("RATE_LIMITED", "Service busy, please try again", 429, ctx);
    }
    console.error(`[${ctx.requestId}] AI gateway error:`, response.status);
    return kernelSuccess({ 
      response: getEmergencyFallbackResponse(message, emergencyType) 
    }, ctx);
  }

  const data = await response.json();
  const aiResponse = data.choices?.[0]?.message?.content || getEmergencyFallbackResponse(message, emergencyType);

  return kernelSuccess({ response: aiResponse }, ctx);

}, { skipHeaderValidation: true }));

function getEmergencyFallbackResponse(message: string, emergencyType: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (emergencyType === 'chest-pain') {
    if (lowerMessage.includes('arm') || lowerMessage.includes('jaw') || lowerMessage.includes('shoulder')) {
      return "The pain spreading to your arm, jaw, or shoulder is important information. This could indicate a cardiac issue. Please:\n\n1. Stay calm and avoid any physical activity\n2. If you have aspirin and are not allergic, chew one tablet\n3. Sit or lie down in a comfortable position\n4. Loosen any tight clothing\n\nEmergency services are on their way. Are you experiencing any shortness of breath or sweating?";
    }
    if (lowerMessage.includes('breath') || lowerMessage.includes('breathing')) {
      return "Chest pain with breathing difficulty needs immediate attention. Please:\n\n1. Sit upright to help breathing\n2. Try to take slow, calm breaths\n3. Don't lie flat if it makes breathing harder\n\nHelp is on the way. Is the chest pain constant or does it come and go?";
    }
    return "I understand you're experiencing chest pain. To help emergency responders, can you tell me:\n- Is the pain sharp, dull, or pressing?\n- Does it spread anywhere else?\n- How long has it been going on?\n\nPlease stay as calm and still as possible.";
  }
  
  if (emergencyType === 'breathing') {
    return "For breathing difficulties:\n\n1. Sit upright - don't lie down\n2. Try pursed-lip breathing: breathe in through your nose, out slowly through pursed lips\n3. Remove any tight clothing around your chest and neck\n4. If you have an inhaler, use it now\n\nDo you have any history of asthma, COPD, or heart problems?";
  }
  
  if (emergencyType === 'allergic') {
    return "For allergic reactions:\n\n1. If you have an EpiPen/Adrenaline auto-injector, use it now in your outer thigh\n2. Take an antihistamine if you can swallow safely\n3. If swelling is in your throat, sit upright\n4. Remove any jewelry if swelling is spreading\n\nAre you having any difficulty breathing or swallowing? Do you have any known severe allergies?";
  }
  
  if (emergencyType === 'poison') {
    return "For suspected poisoning:\n\n1. Do NOT induce vomiting unless specifically told to\n2. Try to identify what was taken and how much\n3. If it's a caustic substance, do not drink water or milk\n4. Keep the container/packaging if possible\n\nWhat substance was involved, and approximately when and how much was taken?";
  }
  
  if (emergencyType === 'injury') {
    return "For severe injuries:\n\n1. Apply direct pressure to any bleeding wounds\n2. Do not move if there might be a neck or spine injury\n3. Elevate injured limbs if possible\n4. Keep warm to prevent shock\n\nCan you describe the injury and what happened?";
  }
  
  return "I'm here to help you while emergency services are on their way. Please describe your symptoms and I'll provide guidance. Are you able to tell me:\n- What symptoms are you experiencing?\n- When did they start?\n- Do you have any medical conditions?\n\nHelp is coming.";
}
