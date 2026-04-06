/**
 * ElevenLabs Scribe — Speech-to-Text edge function
 * Accepts audio (base64 or multipart) and returns transcription via ElevenLabs Scribe v2.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, " +
    "x-tenant-id, x-pod-id, x-request-id, x-correlation-id",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ELEVENLABS_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let audioBlob: Blob;
    let languageCode = "eng";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const audioFile = formData.get("audio");
      if (!audioFile || !(audioFile instanceof File)) {
        return new Response(
          JSON.stringify({ error: "Missing 'audio' file in form data" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      audioBlob = audioFile;
      languageCode = (formData.get("language") as string) || "eng";
    } else {
      const body = await req.json();
      if (!body.audio) {
        return new Response(
          JSON.stringify({ error: "Missing 'audio' field (base64)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Decode base64 audio
      const binaryStr = atob(body.audio);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      audioBlob = new Blob([bytes], { type: body.mimeType || "audio/webm" });
      languageCode = body.language || "eng";
    }

    // Call ElevenLabs Scribe API
    const apiFormData = new FormData();
    apiFormData.append("file", audioBlob, "recording.webm");
    apiFormData.append("model_id", "scribe_v2");
    apiFormData.append("language_code", languageCode);
    apiFormData.append("tag_audio_events", "false");
    apiFormData.append("diarize", "false");

    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: apiFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs Scribe error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Transcription failed", details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const transcription = await response.json();

    return new Response(
      JSON.stringify({
        text: transcription.text || "",
        words: transcription.words || [],
        language: transcription.language_code || languageCode,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Scribe function error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
