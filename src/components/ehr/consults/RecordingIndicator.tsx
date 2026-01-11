/**
 * RecordingIndicator - Visual indicator for session recording
 * Shows recording status with consent information
 */
import { Circle, CircleDot, Pause, Play, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  hasConsent: boolean;
  formattedDuration: string;
  pauseRecording?: () => void;
  resumeRecording?: () => void;
}

interface RecordingIndicatorProps {
  recording?: RecordingState;
  // Individual props as alternative
  isRecording?: boolean;
  isPaused?: boolean;
  duration?: string;
  hasConsent?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  showControls?: boolean;
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
}

export function RecordingIndicator({
  recording,
  isRecording: isRecordingProp,
  isPaused: isPausedProp,
  duration: durationProp,
  hasConsent: hasConsentProp,
  onPause,
  onResume,
  showControls = false,
  size = 'md',
  compact = false,
}: RecordingIndicatorProps) {
  // Support both recording object and individual props
  const isRecording = recording?.isRecording ?? isRecordingProp ?? false;
  const isPaused = recording?.isPaused ?? isPausedProp ?? false;
  const duration = recording?.formattedDuration ?? durationProp ?? '00:00';
  const hasConsent = recording?.hasConsent ?? hasConsentProp ?? false;
  const handlePause = onPause ?? recording?.pauseRecording;
  const handleResume = onResume ?? recording?.resumeRecording;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const dotSizes = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
  };

  if (!hasConsent) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={cn("gap-1.5", sizeClasses[size])}>
              <AlertCircle className={cn(dotSizes[size], "text-warning")} />
              <span className="text-warning">No Recording Consent</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Recording consent not obtained. Session will not be recorded.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (!isRecording) {
    return (
      <Badge variant="outline" className={cn("gap-1.5", sizeClasses[size])}>
        <Circle className={cn(dotSizes[size], "text-muted-foreground")} />
        <span className="text-muted-foreground">Not Recording</span>
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={isPaused ? "secondary" : "destructive"}
        className={cn("gap-1.5", sizeClasses[size])}
      >
        {isPaused ? (
          <>
            <Pause className={dotSizes[size]} />
            <span>Paused</span>
          </>
        ) : (
          <>
            <CircleDot className={cn(dotSizes[size], "animate-pulse")} />
            <span>Recording</span>
          </>
        )}
        <span className="font-mono ml-1">{duration}</span>
      </Badge>

      {showControls && (
        isPaused ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleResume}>
                  <Play className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Resume Recording</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handlePause}>
                  <Pause className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Pause Recording</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      )}
    </div>
  );
}

/**
 * RecordingConsentBanner - Banner to obtain recording consent
 */
interface RecordingConsentBannerProps {
  onConsent: () => void;
  onDecline: () => void;
}

export function RecordingConsentBanner({
  onConsent,
  onDecline,
}: RecordingConsentBannerProps) {
  return (
    <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
          <CircleDot className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium">Session Recording</h4>
          <p className="text-sm text-muted-foreground mt-1">
            This telemedicine session will be recorded and stored as part of the patient's 
            clinical record for documentation and quality assurance purposes.
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={onConsent}>
              I Consent to Recording
            </Button>
            <Button variant="outline" size="sm" onClick={onDecline}>
              Proceed Without Recording
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
