/**
 * ChatSession - Text-based instant messaging consultation
 * For quick clinical queries and ongoing text-based discussions
 */
import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Send,
  Paperclip,
  FileText,
  Image,
  Mic,
  Video,
  Phone,
  User,
  Clock,
  CheckCheck,
  Check,
  AlertCircle,
  MoreVertical,
  ArrowLeft,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ReferralPackage, ChatMessage } from "@/types/telehealth";

interface ChatSessionProps {
  referral: ReferralPackage;
  sessionId: string;
  onEscalateToVideo?: () => void;
  onEscalateToAudio?: () => void;
  onComplete: () => void;
  onBack: () => void;
}

interface ExtendedChatMessage extends ChatMessage {
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  attachments?: { name: string; type: string; url: string }[];
}

export function ChatSession({
  referral,
  sessionId,
  onEscalateToVideo,
  onEscalateToAudio,
  onComplete,
  onBack,
}: ChatSessionProps) {
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([
    {
      id: "system-1",
      senderId: "system",
      senderName: "System",
      senderRole: "System",
      content: `Chat consultation started for ${referral.clinicalNarrative.reasonForReferral}`,
      timestamp: new Date().toISOString(),
      type: "system",
    },
    {
      id: "msg-1",
      senderId: referral.context.referringProviderId,
      senderName: referral.context.referringProviderName,
      senderRole: "Referring Clinician",
      content: `Hello, I've referred this patient for ${referral.context.specialty} consultation. ${referral.clinicalNarrative.reasonForReferral}`,
      timestamp: new Date(Date.now() - 120000).toISOString(),
      type: "text",
      status: "read",
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Simulate typing indicator
  useEffect(() => {
    if (isTyping) {
      const timeout = setTimeout(() => setIsTyping(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [isTyping]);

  const sendMessage = useCallback(() => {
    if (!newMessage.trim()) return;

    const message: ExtendedChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: "current-user",
      senderName: "Dr. Current User",
      senderRole: "Consultant",
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: "text",
      status: "sending",
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");

    // Simulate message delivery
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === message.id ? { ...m, status: "sent" } : m
        )
      );
    }, 500);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === message.id ? { ...m, status: "delivered" } : m
        )
      );
      // Simulate remote typing
      setIsTyping(true);
    }, 1000);
  }, [newMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleAttachment = () => {
    toast.info("Attachment feature - select files to share");
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "sending":
        return <Clock className="h-3 w-3 text-muted-foreground" />;
      case "sent":
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case "read":
        return <CheckCheck className="h-3 w-3 text-primary" />;
      default:
        return null;
    }
  };

  const handleEndChat = () => {
    setMessages((prev) => [
      ...prev,
      {
        id: `system-${Date.now()}`,
        senderId: "system",
        senderName: "System",
        senderRole: "System",
        content: "Chat consultation ended. Please document your findings in the consultation response.",
        timestamp: new Date().toISOString(),
        type: "system",
      },
    ]);
    toast.success("Chat ended - proceeding to documentation");
    setTimeout(onComplete, 1000);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>
                {referral.context.referringProviderName.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Chat Consultation
              </h3>
              <p className="text-xs text-muted-foreground">
                With {referral.context.referringProviderName} • {referral.context.referringFacilityName}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isTyping && (
            <Badge variant="outline" className="animate-pulse">
              <span className="flex gap-0.5 items-center">
                Typing
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </span>
            </Badge>
          )}
          
          {/* Escalation options */}
          {onEscalateToAudio && (
            <Button variant="outline" size="sm" onClick={onEscalateToAudio}>
              <Phone className="h-4 w-4 mr-1" />
              Call
            </Button>
          )}
          {onEscalateToVideo && (
            <Button variant="outline" size="sm" onClick={onEscalateToVideo}>
              <Video className="h-4 w-4 mr-1" />
              Video
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Archive className="h-4 w-4 mr-2" />
                Export Chat Log
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEndChat}>
                End Chat & Document
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Patient Context Banner */}
      <div className="p-2 bg-primary/5 border-b flex items-center gap-4 text-sm">
        <span className="font-medium">{referral.patientHID}</span>
        <Separator orientation="vertical" className="h-4" />
        <span>{referral.context.specialty}</span>
        <Separator orientation="vertical" className="h-4" />
        <span className="text-muted-foreground">{referral.clinicalNarrative.chiefComplaint}</span>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.type === "system" && "justify-center",
                message.senderId === "current-user" && "justify-end",
                message.senderId !== "current-user" && message.type !== "system" && "justify-start"
              )}
            >
              {message.type === "system" ? (
                <div className="px-4 py-2 rounded-full bg-muted text-xs text-muted-foreground">
                  {message.content}
                </div>
              ) : (
                <div
                  className={cn(
                    "max-w-[70%] rounded-lg p-3",
                    message.senderId === "current-user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.senderId !== "current-user" && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-xs">{message.senderName}</span>
                      <Badge variant="outline" className="text-[10px] h-4">
                        {message.senderRole}
                      </Badge>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[10px] opacity-70">
                      {format(new Date(message.timestamp), "HH:mm")}
                    </span>
                    {message.senderId === "current-user" && getStatusIcon(message.status)}
                  </div>
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3 px-4">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t bg-background">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Button variant="outline" size="icon" onClick={handleAttachment}>
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your clinical message..."
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">
          Messages are encrypted and logged for clinical documentation
        </p>
      </div>
    </div>
  );
}
