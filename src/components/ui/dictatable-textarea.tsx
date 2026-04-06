/**
 * DictatableTextarea — Drop-in replacement for <Textarea> with built-in voice dictation.
 * Renders the standard Textarea with a mic button in the corner.
 */
import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { DictationButton } from "@/components/ui/dictation-button";
import { cn } from "@/lib/utils";

interface DictatableTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Show dictation button (default true) */
  dictation?: boolean;
  /** Language for speech recognition */
  dictationLanguage?: string;
  /** Controlled value — required for dictation to work */
  value?: string;
  /** onChange handler */
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  /** Direct value change handler (alternative to onChange) */
  onValueChange?: (value: string) => void;
}

const DictatableTextarea = React.forwardRef<
  HTMLTextAreaElement,
  DictatableTextareaProps
>(
  (
    {
      dictation = true,
      dictationLanguage = "en-US",
      className,
      value,
      onChange,
      onValueChange,
      disabled,
      ...props
    },
    ref
  ) => {
    const handleDictationChange = React.useCallback(
      (newValue: string) => {
        if (onValueChange) {
          onValueChange(newValue);
        } else if (onChange) {
          // Synthesize a change event
          const nativeEvent = new Event("input", { bubbles: true });
          const syntheticTarget = {
            value: newValue,
          } as HTMLTextAreaElement;
          const syntheticEvent = {
            ...nativeEvent,
            target: syntheticTarget,
            currentTarget: syntheticTarget,
          } as unknown as React.ChangeEvent<HTMLTextAreaElement>;
          onChange(syntheticEvent);
        }
      },
      [onChange, onValueChange]
    );

    return (
      <div className="relative">
        <Textarea
          ref={ref}
          className={cn(dictation && "pr-10", className)}
          value={value}
          onChange={onChange}
          disabled={disabled}
          {...props}
        />
        {dictation && (
          <div className="absolute top-1.5 right-1.5">
            <DictationButton
              value={typeof value === "string" ? value : ""}
              onValueChange={handleDictationChange}
              language={dictationLanguage}
              size="icon"
              className="h-7 w-7"
              disabled={disabled}
            />
          </div>
        )}
      </div>
    );
  }
);
DictatableTextarea.displayName = "DictatableTextarea";

export { DictatableTextarea };
