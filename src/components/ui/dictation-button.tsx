/**
 * DictationButton — A mic toggle button for voice dictation.
 * Appends transcribed speech to the target value via onChange callback.
 */
import { useCallback, useEffect, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { cn } from "@/lib/utils";

interface DictationButtonProps {
  /** Current text value of the target field */
  value: string;
  /** Called with the updated text (existing + dictated) */
  onValueChange: (newValue: string) => void;
  /** Language for recognition (BCP-47) */
  language?: string;
  /** Size variant */
  size?: "sm" | "default" | "icon";
  /** Additional className */
  className?: string;
  /** Disabled */
  disabled?: boolean;
}

export function DictationButton({
  value,
  onValueChange,
  language = "en-US",
  size = "icon",
  className,
  disabled = false,
}: DictationButtonProps) {
  const baseValueRef = useRef(value);

  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    toggleListening,
    stopListening,
    resetTranscript,
  } = useSpeechToText({
    language,
    continuous: true,
    interimResults: true,
  });

  // Capture the base value when dictation starts
  useEffect(() => {
    if (isListening && transcript === "" && interimTranscript === "") {
      baseValueRef.current = value;
    }
  }, [isListening]);

  // Append finalized transcript to value
  useEffect(() => {
    if (transcript) {
      const separator = baseValueRef.current && !baseValueRef.current.endsWith(" ") ? " " : "";
      onValueChange(baseValueRef.current + separator + transcript);
    }
  }, [transcript]);

  const handleToggle = useCallback(() => {
    if (isListening) {
      stopListening();
      resetTranscript();
    } else {
      baseValueRef.current = value;
      resetTranscript();
      toggleListening();
    }
  }, [isListening, value, stopListening, resetTranscript, toggleListening]);

  if (!isSupported) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={isListening ? "default" : "ghost"}
          size={size}
          className={cn(
            "relative",
            isListening &&
              "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            className
          )}
          onClick={handleToggle}
          disabled={disabled}
        >
          {isListening ? (
            <>
              <MicOff className="h-4 w-4" />
              {/* Pulsing indicator */}
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
              </span>
            </>
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        {isListening ? "Stop dictation" : "Voice dictation"}
      </TooltipContent>
    </Tooltip>
  );
}
