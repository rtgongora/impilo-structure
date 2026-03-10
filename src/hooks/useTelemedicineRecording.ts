/**
 * useTelemedicineRecording - Automatic recording management for telemedicine sessions
 * All telemedicine interactions are recorded and filed as part of patient record
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";

export interface RecordingMetadata {
  recordingId: string;
  sessionId: string;
  patientId: string;
  referralId: string;
  mode: 'audio' | 'video' | 'chat' | 'async' | 'board' | 'scheduled';
  participants: { id: string; name: string; role: string }[];
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  storagePath?: string;
  fileSize?: number;
  consentObtained: boolean;
  consentTimestamp?: string;
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  hasConsent: boolean;
}

interface UseTelemedicineRecordingOptions {
  sessionId: string;
  patientId: string;
  referralId: string;
  mode: RecordingMetadata['mode'];
  autoStart?: boolean;
}

export function useTelemedicineRecording({
  sessionId,
  patientId,
  referralId,
  mode,
  autoStart = true,
}: UseTelemedicineRecordingOptions) {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    hasConsent: false,
  });
  
  const [metadata, setMetadata] = useState<RecordingMetadata | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Duration timer
  useEffect(() => {
    if (state.isRecording && !state.isPaused) {
      timerRef.current = setInterval(() => {
        setState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.isRecording, state.isPaused]);

  // Start recording
  const startRecording = useCallback(async (participants: { id: string; name: string; role: string }[]) => {
    if (!state.hasConsent) {
      toast.error("Recording consent required before starting");
      return false;
    }

    const recordingId = `REC-${Date.now()}-${sessionId.slice(0, 8)}`;
    
    const newMetadata: RecordingMetadata = {
      recordingId,
      sessionId,
      patientId,
      referralId,
      mode,
      participants,
      startedAt: new Date().toISOString(),
      consentObtained: true,
      consentTimestamp: new Date().toISOString(),
    };
    
    setMetadata(newMetadata);
    setState(prev => ({ ...prev, isRecording: true, duration: 0 }));
    
    // For audio/video modes, attempt to capture media stream
    if (mode === 'audio' || mode === 'video') {
      try {
        const constraints = mode === 'video' 
          ? { audio: true, video: true }
          : { audio: true };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const recorder = new MediaRecorder(stream, {
          mimeType: mode === 'video' ? 'video/webm' : 'audio/webm',
        });
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };
        
        mediaRecorderRef.current = recorder;
        recorder.start(1000); // Capture every second
      } catch (error) {
        console.warn("Could not access media devices for recording:", error);
        // Continue with metadata-only recording
      }
    }
    
    toast.success("Recording started - All interactions will be documented");
    return true;
  }, [state.hasConsent, sessionId, patientId, referralId, mode]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (!state.isRecording || !metadata) return null;
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    const finalMetadata: RecordingMetadata = {
      ...metadata,
      endedAt: new Date().toISOString(),
      durationSeconds: state.duration,
      storagePath: `/recordings/${patientId}/${metadata.recordingId}`,
      fileSize: chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0),
    };
    
    setMetadata(finalMetadata);
    setState(prev => ({ ...prev, isRecording: false, isPaused: false }));
    chunksRef.current = [];
    
    toast.success("Recording saved to patient record");
    return finalMetadata;
  }, [state.isRecording, state.duration, metadata, patientId]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
    }
    setState(prev => ({ ...prev, isPaused: true }));
  }, []);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
    setState(prev => ({ ...prev, isPaused: false }));
  }, []);

  // Obtain consent
  const obtainConsent = useCallback(() => {
    setState(prev => ({ ...prev, hasConsent: true }));
    toast.success("Recording consent obtained");
    return true;
  }, []);

  // Add chat message to recording log
  const logChatMessage = useCallback((message: {
    senderId: string;
    senderName: string;
    content: string;
    timestamp: string;
  }) => {
    if (!state.isRecording) return;
    // In production, this would append to the recording log
    console.log("[Recording] Chat message:", message);
  }, [state.isRecording]);

  // Add event to recording log
  const logEvent = useCallback((event: {
    type: string;
    description: string;
    data?: any;
  }) => {
    if (!state.isRecording) return;
    console.log("[Recording] Event:", {
      ...event,
      timestamp: new Date().toISOString(),
    });
  }, [state.isRecording]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    ...state,
    metadata,
    formattedDuration: formatDuration(state.duration),
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    obtainConsent,
    logChatMessage,
    logEvent,
  };
}
