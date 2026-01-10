import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Building2, 
  Clock, 
  RefreshCw,
  LogOut,
  ChevronDown,
  PlayCircle,
  StopCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useShift } from '@/contexts/ShiftContext';
import { ShiftControlPanel } from './ShiftControlPanel';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ShiftIndicatorProps {
  className?: string;
  compact?: boolean;
}

export function ShiftIndicator({ className, compact }: ShiftIndicatorProps) {
  const navigate = useNavigate();
  const { activeShift, isOnShift, shiftDuration, loading } = useShift();
  const [isOpen, setIsOpen] = useState(false);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const handleStartShift = () => {
    // Navigate to auth/workspace selection to start shift
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className={cn("animate-pulse h-8 w-24 bg-muted rounded-md", className)} />
    );
  }

  if (!isOnShift) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleStartShift}
        className={cn("gap-2", className)}
      >
        <PlayCircle className="h-4 w-4 text-green-500" />
        <span className="hidden sm:inline">Start Shift</span>
      </Button>
    );
  }

  if (compact) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 gap-1.5 text-xs", className)}
          >
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <MapPin className="h-3.5 w-3.5" />
            </div>
            <span className="hidden sm:inline truncate max-w-[100px]">
              {activeShift?.current_workspace_name || 'On Shift'}
            </span>
            <Badge variant="secondary" className="text-xs py-0 px-1.5 ml-1">
              {formatDuration(shiftDuration)}
            </Badge>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <ShiftDetails />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-auto py-1.5 px-3 gap-2 text-left justify-start",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <div className="p-1 rounded bg-primary/10">
              <MapPin className="h-3.5 w-3.5 text-primary" />
            </div>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-xs font-medium leading-tight">
              {activeShift?.current_workspace_name || 'On Shift'}
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight">
              {formatDuration(shiftDuration)} • {activeShift?.facility_name}
            </span>
          </div>
          <ChevronDown className="h-3 w-3 ml-auto text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <ShiftDetails />
      </PopoverContent>
    </Popover>
  );
}

function ShiftDetails() {
  const { activeShift, shiftDuration } = useShift();

  if (!activeShift) return null;

  const startTime = new Date(activeShift.started_at);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          Active Shift
        </h4>
        <Badge variant="secondary" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          {Math.floor(shiftDuration / 60)}h {shiftDuration % 60}m
        </Badge>
      </div>

      <div className="space-y-3">
        {/* Facility */}
        <div className="flex items-start gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Facility</p>
            <p className="text-sm font-medium">{activeShift.facility_name}</p>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-primary mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Current Workspace</p>
            <p className="text-sm font-medium">{activeShift.current_workspace_name || 'Not assigned'}</p>
          </div>
        </div>

        {/* Start Time */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Started at {format(startTime, 'HH:mm')} on {format(startTime, 'dd MMM yyyy')}</span>
        </div>
      </div>

      <Separator />

      {/* Shift Controls */}
      <ShiftControlPanel compact />
    </div>
  );
}

export default ShiftIndicator;
