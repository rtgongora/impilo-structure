import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Mic,
  MicOff,
  Loader2,
  MessageSquare,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VoiceCommandButtonProps {
  onCommand?: (command: string, action: string) => void;
  className?: string;
}

const COMMAND_PATTERNS = [
  { pattern: /order (.*)/i, action: "order", extract: 1 },
  { pattern: /prescribe (.*)/i, action: "prescribe", extract: 1 },
  { pattern: /document (.*)/i, action: "document", extract: 1 },
  { pattern: /note (.*)/i, action: "note", extract: 1 },
  { pattern: /vitals? for (.*)/i, action: "vitals", extract: 1 },
  { pattern: /search (?:for )?patient (.*)/i, action: "search_patient", extract: 1 },
];

export function VoiceCommandButton({ onCommand, className }: VoiceCommandButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [commandHistory, setCommandHistory] = useState<Array<{ text: string; action?: string; timestamp: Date }>>([]);
  const [recognition, setRecognition] = useState<any>(null);

  const processCommand = useCallback((text: string) => {
    const lowerText = text.toLowerCase().trim();
    for (const cmd of COMMAND_PATTERNS) {
      const match = lowerText.match(cmd.pattern);
      if (match) {
        const extractedValue = match[cmd.extract];
        setCommandHistory((prev) => [{ text, action: cmd.action, timestamp: new Date() }, ...prev.slice(0, 9)]);
        onCommand?.(extractedValue, cmd.action);
        toast.success(`Command: ${cmd.action} - "${extractedValue}"`);
        return;
      }
    }
    setCommandHistory((prev) => [{ text, action: "note", timestamp: new Date() }, ...prev.slice(0, 9)]);
    onCommand?.(text, "note");
  }, [onCommand]);

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast.error("Speech recognition not supported");
      return;
    }
    const rec = new SpeechRecognitionAPI();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          setTranscript(event.results[i][0].transcript);
        }
      }
      if (finalTranscript) processCommand(finalTranscript);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    rec.start();
    setRecognition(rec);
    setIsListening(true);
    setTranscript("");
    setShowDialog(true);
  }, [processCommand]);

  const stopListening = useCallback(() => {
    recognition?.stop();
    setIsListening(false);
  }, [recognition]);

  return (
    <>
      <Button
        variant={isListening ? "destructive" : "outline"}
        size="icon"
        onClick={isListening ? stopListening : startListening}
        className={cn("relative", className)}
        title="Voice Commands"
      >
        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        {isListening && <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Voice Commands
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className={cn("p-4 rounded-lg border-2", isListening ? "border-primary bg-primary/5 animate-pulse" : "border-muted")}>
              <div className="flex items-center justify-center gap-3">
                {isListening ? <Mic className="h-8 w-8 text-primary" /> : <MicOff className="h-8 w-8 text-muted-foreground" />}
                <p className="font-medium">{isListening ? "Listening..." : "Microphone Off"}</p>
              </div>
            </div>
            {transcript && (
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 mt-0.5" />
                  <p className="text-sm">{transcript}</p>
                </div>
              </div>
            )}
            {commandHistory.length > 0 && (
              <ScrollArea className="h-[120px]">
                <div className="space-y-2">
                  {commandHistory.map((cmd, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-muted/30 text-sm flex justify-between">
                      <span className="truncate">{cmd.text}</span>
                      {cmd.action && <Badge variant="outline" className="text-xs ml-2">{cmd.action}</Badge>}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            <div className="flex gap-2">
              <Button variant={isListening ? "destructive" : "default"} className="flex-1" onClick={isListening ? stopListening : startListening}>
                {isListening ? <><MicOff className="h-4 w-4 mr-2" />Stop</> : <><Mic className="h-4 w-4 mr-2" />Start</>}
              </Button>
              <Button variant="outline" onClick={() => setShowDialog(false)}><X className="h-4 w-4" /></Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
