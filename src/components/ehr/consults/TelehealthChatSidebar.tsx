/**
 * TelehealthChatSidebar - Persistent chat sidebar for ongoing case-linked conversations
 * Shows all active chats with unread indicators and allows quick switching
 */
import { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Send,
  User,
  Building,
  Clock,
  Paperclip,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ChatSession {
  id: string;
  referralId: string;
  patientName: string;
  patientHID: string;
  providerName: string;
  facilityName: string;
  specialty: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isActive: boolean;
  messages: ChatMessage[];
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "self" | "other";
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface TelehealthChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
}

// Mock active chats
const MOCK_CHATS: ChatSession[] = [
  {
    id: "chat-1",
    referralId: "REF-2025-004",
    patientName: "Farai Ndlovu",
    patientHID: "PHID-ZW-2025-901234",
    providerName: "Dr. Tendai Ncube",
    facilityName: "Gweru Provincial Hospital",
    specialty: "Internal Medicine",
    lastMessage: "Can we adjust the metformin dose?",
    lastMessageTime: new Date(Date.now() - 300000).toISOString(),
    unreadCount: 2,
    isActive: true,
    messages: [
      {
        id: "m1",
        senderId: "other-1",
        senderName: "Dr. Tendai Ncube",
        senderRole: "other",
        content: "Good morning, I need to discuss the medication adjustment for this patient.",
        timestamp: new Date(Date.now() - 900000).toISOString(),
        isRead: true,
      },
      {
        id: "m2",
        senderId: "self-1",
        senderName: "You",
        senderRole: "self",
        content: "Good morning! I've reviewed the case. What specific concerns do you have?",
        timestamp: new Date(Date.now() - 600000).toISOString(),
        isRead: true,
      },
      {
        id: "m3",
        senderId: "other-1",
        senderName: "Dr. Tendai Ncube",
        senderRole: "other",
        content: "Can we adjust the metformin dose?",
        timestamp: new Date(Date.now() - 300000).toISOString(),
        isRead: false,
      },
    ],
  },
  {
    id: "chat-2",
    referralId: "REF-2025-007",
    patientName: "Simba Makoni",
    patientHID: "PHID-ZW-2025-456789",
    providerName: "Dr. Grace Mupfumira",
    facilityName: "Masvingo Provincial Hospital",
    specialty: "Pediatrics",
    lastMessage: "Thank you for the guidance.",
    lastMessageTime: new Date(Date.now() - 1800000).toISOString(),
    unreadCount: 0,
    isActive: true,
    messages: [
      {
        id: "m1",
        senderId: "other-1",
        senderName: "Dr. Grace Mupfumira",
        senderRole: "other",
        content: "Thank you for the guidance.",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        isRead: true,
      },
    ],
  },
  {
    id: "chat-3",
    referralId: "REF-2025-008",
    patientName: "Nyasha Chigumba",
    patientHID: "PHID-ZW-2025-789012",
    providerName: "Dr. Peter Madziva",
    facilityName: "Bindura Hospital",
    specialty: "Surgery",
    lastMessage: "Imaging results are now available",
    lastMessageTime: new Date(Date.now() - 120000).toISOString(),
    unreadCount: 1,
    isActive: true,
    messages: [
      {
        id: "m1",
        senderId: "other-1",
        senderName: "Dr. Peter Madziva",
        senderRole: "other",
        content: "Imaging results are now available",
        timestamp: new Date(Date.now() - 120000).toISOString(),
        isRead: false,
      },
    ],
  },
];

export function TelehealthChatSidebar({
  isOpen,
  onClose,
  onMinimize,
  isMinimized,
}: TelehealthChatSidebarProps) {
  const [chats, setChats] = useState<ChatSession[]>(MOCK_CHATS);
  const [activeChat, setActiveChat] = useState<ChatSession | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [expandedChat, setExpandedChat] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const totalUnread = chats.reduce((acc, chat) => acc + chat.unreadCount, 0);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeChat?.messages]);

  const handleSelectChat = (chat: ChatSession) => {
    setActiveChat(chat);
    // Mark as read
    setChats(prev => 
      prev.map(c => c.id === chat.id ? { ...c, unreadCount: 0 } : c)
    );
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeChat) return;

    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      senderId: "self",
      senderName: "You",
      senderRole: "self",
      content: newMessage,
      timestamp: new Date().toISOString(),
      isRead: true,
    };

    setChats(prev =>
      prev.map(c =>
        c.id === activeChat.id
          ? { 
              ...c, 
              messages: [...c.messages, newMsg],
              lastMessage: newMessage,
              lastMessageTime: new Date().toISOString(),
            }
          : c
      )
    );

    setActiveChat(prev => 
      prev ? { ...prev, messages: [...prev.messages, newMsg] } : null
    );
    
    setNewMessage("");
  };

  if (!isOpen) return null;

  // Minimized state - just show floating badge
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onMinimize}
          className="h-14 w-14 rounded-full shadow-lg relative"
        >
          <MessageSquare className="h-6 w-6" />
          {totalUnread > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center text-xs"
            >
              {totalUnread}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-4 z-50 w-80 bg-background border rounded-t-lg shadow-xl flex flex-col max-h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <span className="font-semibold">Active Chats</span>
          {totalUnread > 0 && (
            <Badge variant="secondary" className="h-5 min-w-5 p-0 flex items-center justify-center text-xs">
              {totalUnread}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={onMinimize}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {activeChat ? (
        // Active chat view
        <div className="flex flex-col flex-1 min-h-0">
          {/* Chat header */}
          <div className="p-2 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setActiveChat(null)}
                >
                  <ChevronDown className="h-4 w-4 rotate-90" />
                </Button>
                <div>
                  <p className="text-sm font-medium">{activeChat.patientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {activeChat.providerName} • {activeChat.specialty}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {activeChat.referralId}
              </Badge>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-3">
              {activeChat.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.senderRole === "self" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2",
                      msg.senderRole === "self"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {msg.senderRole === "other" && (
                      <p className="text-xs font-medium mb-1">{msg.senderName}</p>
                    )}
                    <p className="text-sm">{msg.content}</p>
                    <p className={cn(
                      "text-[10px] mt-1",
                      msg.senderRole === "self" ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-2 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                className="h-9"
              />
              <Button size="icon" className="h-9 w-9" onClick={handleSendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Chat list view
        <ScrollArea className="flex-1 max-h-[400px]">
          <div className="p-2 space-y-1">
            {chats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No active chats</p>
              </div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  className={cn(
                    "p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors",
                    chat.unreadCount > 0 && "bg-primary/5"
                  )}
                  onClick={() => handleSelectChat(chat)}
                >
                  <div className="flex items-start gap-2">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs">
                        {chat.patientName.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{chat.patientName}</p>
                        {chat.unreadCount > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="h-5 min-w-5 p-0 flex items-center justify-center text-[10px]"
                          >
                            {chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {chat.providerName}
                      </p>
                      <p className="text-xs truncate mt-0.5">
                        {chat.lastMessage}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(chat.lastMessageTime), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

// Hook to manage chat sidebar state
export function useTelehealthChatSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [unreadCount, setUnreadCount] = useState(3); // Mock unread count

  const open = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  const close = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const toggleMinimize = () => {
    if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsMinimized(true);
    }
  };

  return {
    isOpen,
    isMinimized,
    unreadCount,
    open,
    close,
    toggleMinimize,
    setIsOpen,
    setIsMinimized,
  };
}
