import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Mic,
  MicOff,
  Pause,
  Play,
  Square,
  Trash2,
  Copy,
  FileText,
  Volume2,
  Wand2,
  Clock,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TranscriptSegment {
  id: string;
  text: string;
  timestamp: number;
  speaker?: string;
  confidence: number;
}

const MOCK_TRANSCRIPTION = [
  { id: "1", text: "Patient presents with chief complaint of persistent cough for the past two weeks.", timestamp: 0, confidence: 0.95 },
  { id: "2", text: "Cough is productive with yellowish sputum, worse at night.", timestamp: 5, confidence: 0.92 },
  { id: "3", text: "Associated symptoms include mild fever and fatigue.", timestamp: 10, confidence: 0.88 },
  { id: "4", text: "No shortness of breath or chest pain reported.", timestamp: 14, confidence: 0.97 },
  { id: "5", text: "Physical examination reveals bilateral rhonchi on auscultation.", timestamp: 19, confidence: 0.91 },
];

export function VoiceDictation() {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcription, setTranscription] = useState<TranscriptSegment[]>([]);
  const [editedText, setEditedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const animationRef = useRef<number>();
  const durationRef = useRef<NodeJS.Timeout>();

  // Simulate audio level animation
  useEffect(() => {
    if (isRecording && !isPaused) {
      const animate = () => {
        setAudioLevel(Math.random() * 100);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
      
      durationRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (durationRef.current) {
        clearInterval(durationRef.current);
      }
      setAudioLevel(0);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (durationRef.current) {
        clearInterval(durationRef.current);
      }
    };
  }, [isRecording, isPaused]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
    setDuration(0);
    setTranscription([]);
    setEditedText("");
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    setIsProcessing(true);

    // Simulate processing delay
    setTimeout(() => {
      setTranscription(MOCK_TRANSCRIPTION);
      setEditedText(MOCK_TRANSCRIPTION.map(s => s.text).join(" "));
      setIsProcessing(false);
      toast({
        title: "Transcription Complete",
        description: `${MOCK_TRANSCRIPTION.length} segments transcribed`,
      });
    }, 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedText);
    toast({ title: "Copied to clipboard" });
  };

  const handleInsertToNote = () => {
    toast({
      title: "Inserted to Clinical Note",
      description: "Transcription has been added to the current note",
    });
  };

  const generateWaveformBars = () => {
    return Array.from({ length: 40 }, (_, i) => {
      const height = isRecording && !isPaused 
        ? Math.sin((i + audioLevel / 10) * 0.5) * 30 + Math.random() * 20 + 10
        : 4;
      return height;
    });
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Voice Dictation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recording Controls */}
        <div className="bg-muted/50 rounded-lg p-6 text-center">
          {/* Waveform Visualization */}
          <div className="h-20 flex items-center justify-center gap-0.5 mb-4">
            {generateWaveformBars().map((height, i) => (
              <div
                key={i}
                className={cn(
                  "w-1 rounded-full transition-all duration-100",
                  isRecording && !isPaused ? "bg-primary" : "bg-muted-foreground/30"
                )}
                style={{ height: `${height}px` }}
              />
            ))}
          </div>

          {/* Duration Display */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {isRecording && (
              <span className="relative flex h-3 w-3">
                <span className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  isPaused ? "bg-warning" : "bg-destructive"
                )} />
                <span className={cn(
                  "relative inline-flex rounded-full h-3 w-3",
                  isPaused ? "bg-warning" : "bg-destructive"
                )} />
              </span>
            )}
            <span className="text-3xl font-mono font-bold">
              {formatDuration(duration)}
            </span>
            {isRecording && (
              <Badge variant={isPaused ? "secondary" : "destructive"}>
                {isPaused ? "Paused" : "Recording"}
              </Badge>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-3">
            {!isRecording ? (
              <Button size="lg" onClick={handleStartRecording} className="gap-2">
                <Mic className="h-5 w-5" />
                Start Recording
              </Button>
            ) : (
              <>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handlePauseResume}
                  className="h-12 w-12 rounded-full"
                >
                  {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={handleStopRecording}
                  className="h-14 w-14 rounded-full"
                >
                  <Square className="h-6 w-6" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    setIsRecording(false);
                    setDuration(0);
                    setTranscription([]);
                  }}
                  className="h-12 w-12 rounded-full"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Processing State */}
        {isProcessing && (
          <div className="flex items-center justify-center gap-3 p-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-muted-foreground">Processing audio...</span>
          </div>
        )}

        {/* Transcription Results */}
        {transcription.length > 0 && !isProcessing && (
          <>
            {/* Segment View */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Transcription Segments</p>
                <Badge variant="secondary">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {transcription.length} segments
                </Badge>
              </div>
              <ScrollArea className="h-[150px] border rounded-lg">
                <div className="p-3 space-y-2">
                  {transcription.map((segment) => (
                    <div
                      key={segment.id}
                      className="flex items-start gap-3 p-2 rounded hover:bg-muted/50"
                    >
                      <span className="text-xs text-muted-foreground font-mono w-12">
                        {formatDuration(segment.timestamp)}
                      </span>
                      <p className="text-sm flex-1">{segment.text}</p>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          segment.confidence >= 0.9 ? "text-success" : 
                          segment.confidence >= 0.8 ? "text-warning" : "text-destructive"
                        )}
                      >
                        {Math.round(segment.confidence * 100)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Editable Text */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Edit Transcription</p>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={handleCopy}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Wand2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={5}
                className="font-mono text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleInsertToNote}>
                <FileText className="h-4 w-4 mr-2" />
                Insert to Note
              </Button>
              <Button variant="outline">
                <Volume2 className="h-4 w-4 mr-2" />
                Playback
              </Button>
            </div>
          </>
        )}

        {/* Quick Tips */}
        {!isRecording && transcription.length === 0 && !isProcessing && (
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">Quick Tips</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Speak clearly and at a moderate pace</li>
              <li>• Use "period" or "comma" for punctuation</li>
              <li>• Say "new paragraph" to start a new section</li>
              <li>• Medical terms are automatically recognized</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
