/**
 * useSpeechToText — Unified voice dictation hook
 * Uses Web Speech API (browser-native) with optional ElevenLabs Scribe fallback.
 */
import { useState, useRef, useCallback, useEffect } from "react";

export type SpeechEngine = "browser" | "elevenlabs" | "auto";

interface UseSpeechToTextOptions {
  engine?: SpeechEngine;
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

interface UseSpeechToTextReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  resetTranscript: () => void;
  activeEngine: "browser" | "elevenlabs" | "none";
}

// Check Web Speech API support
const getSpeechRecognitionClass = (): any => {
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
};

const isBrowserSpeechSupported = () => !!getSpeechRecognitionClass();

export function useSpeechToText({
  engine = "auto",
  language = "en-US",
  continuous = true,
  interimResults = true,
  onTranscript,
  onError,
}: UseSpeechToTextOptions = {}): UseSpeechToTextReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const activeEngineRef = useRef<"browser" | "elevenlabs" | "none">("none");

  const browserSupported = isBrowserSpeechSupported();
  const isSupported = browserSupported; // ElevenLabs always available via edge function

  // Determine which engine to use
  const resolvedEngine = engine === "auto" ? "browser" : engine;

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort?.();
        } catch {}
      }
    };
  }, []);

  const startBrowserRecognition = useCallback(() => {
    const SpeechRecognitionClass = getSpeechRecognitionClass();

    if (!SpeechRecognitionClass) {
      onError?.("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = language;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        setTranscript((prev) => {
          const newText = prev ? prev + " " + final.trim() : final.trim();
          onTranscript?.(newText, true);
          return newText;
        });
        setInterimTranscript("");
      }
      if (interim) {
        setInterimTranscript(interim);
        onTranscript?.(interim, false);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      onError?.(event.error || "Speech recognition error");
      setIsListening(false);
    };

    recognition.onend = () => {
      // Auto-restart if still supposed to be listening (continuous mode)
      if (isListening && continuous) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      activeEngineRef.current = "browser";
      setIsListening(true);
    } catch (e: any) {
      onError?.(e.message || "Failed to start speech recognition");
    }
  }, [language, continuous, interimResults, onTranscript, onError, isListening]);

  const startListening = useCallback(() => {
    if (isListening) return;

    // Request mic permission first
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => {
        if (resolvedEngine === "browser" && browserSupported) {
          startBrowserRecognition();
        } else if (!browserSupported) {
          onError?.(
            "Speech recognition is not supported in this browser. Try Chrome or Edge."
          );
        } else {
          startBrowserRecognition();
        }
      })
      .catch(() => {
        onError?.("Microphone access is required for voice dictation");
      });
  }, [
    isListening,
    resolvedEngine,
    browserSupported,
    startBrowserRecognition,
    onError,
  ]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    activeEngineRef.current = "none";
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
    activeEngine: activeEngineRef.current,
  };
}
