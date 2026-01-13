import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Image as ImageIcon,
  FileText,
  Mic,
  Video,
  Phone,
  MoreVertical,
  Search,
  Plus,
  Clock,
  CheckCheck,
  Lock,
  AlertCircle
} from "lucide-react";

interface Conversation {
  id: string;
  participant: {
    name: string;
    role: string;
    avatar?: string;
    facility?: string;
  };
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isEncounterLinked: boolean;
  encounterId?: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: "text" | "image" | "file" | "voice" | "video";
  fileName?: string;
  isRead: boolean;
  isSent: boolean;
}

export const PortalSecureMessaging = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const conversations: Conversation[] = [
    {
      id: "1",
      participant: {
        name: "Dr. Sarah Moyo",
        role: "General Practitioner",
        facility: "Parirenyatwa Hospital"
      },
      lastMessage: "Your lab results are ready. Please review them in the portal.",
      lastMessageTime: new Date(Date.now() - 30 * 60 * 1000),
      unreadCount: 2,
      isEncounterLinked: true,
      encounterId: "ENC-001"
    },
    {
      id: "2",
      participant: {
        name: "Nurse Tendai",
        role: "Registered Nurse",
        facility: "Harare Central Clinic"
      },
      lastMessage: "Remember to take your medication as prescribed.",
      lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      unreadCount: 0,
      isEncounterLinked: false
    },
    {
      id: "3",
      participant: {
        name: "Dr. James Chikwanda",
        role: "Cardiologist",
        facility: "Heart Care Centre"
      },
      lastMessage: "Your blood pressure readings look good. Keep up the monitoring.",
      lastMessageTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      unreadCount: 0,
      isEncounterLinked: true,
      encounterId: "ENC-002"
    }
  ];

  const messages: Message[] = [
    {
      id: "1",
      senderId: "provider",
      senderName: "Dr. Sarah Moyo",
      content: "Good morning! I've reviewed your recent test results.",
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      type: "text",
      isRead: true,
      isSent: true
    },
    {
      id: "2",
      senderId: "patient",
      senderName: "You",
      content: "Thank you, Doctor. Is everything okay?",
      timestamp: new Date(Date.now() - 55 * 60 * 1000),
      type: "text",
      isRead: true,
      isSent: true
    },
    {
      id: "3",
      senderId: "provider",
      senderName: "Dr. Sarah Moyo",
      content: "Yes, your results are within normal range. I've attached the full report for your records.",
      timestamp: new Date(Date.now() - 50 * 60 * 1000),
      type: "text",
      isRead: true,
      isSent: true
    },
    {
      id: "4",
      senderId: "provider",
      senderName: "Dr. Sarah Moyo",
      content: "",
      timestamp: new Date(Date.now() - 48 * 60 * 1000),
      type: "file",
      fileName: "Lab_Results_2024.pdf",
      isRead: true,
      isSent: true
    },
    {
      id: "5",
      senderId: "provider",
      senderName: "Dr. Sarah Moyo",
      content: "Your lab results are ready. Please review them in the portal.",
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      type: "text",
      isRead: false,
      isSent: true
    }
  ];

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // Handle sending message
      setMessageInput("");
    }
  };

  const selectedConvo = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="space-y-4">
      {/* Security Notice */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">End-to-End Encrypted</p>
              <p className="text-sm text-green-600">All messages are encrypted and HIPAA compliant</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4 h-[600px]">
        {/* Conversations List */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Messages</CardTitle>
              <Button size="icon" variant="ghost">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[450px]">
              {conversations.map((convo) => (
                <div
                  key={convo.id}
                  onClick={() => setSelectedConversation(convo.id)}
                  className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedConversation === convo.id ? "bg-muted" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarImage src={convo.participant.avatar} />
                      <AvatarFallback>
                        {convo.participant.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{convo.participant.name}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(convo.lastMessageTime)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{convo.participant.role}</p>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {convo.lastMessage}
                      </p>
                    </div>
                    {convo.unreadCount > 0 && (
                      <Badge className="bg-primary text-primary-foreground">
                        {convo.unreadCount}
                      </Badge>
                    )}
                  </div>
                  {convo.isEncounterLinked && (
                    <div className="mt-2 flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        Linked to visit
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="md:col-span-2">
          {selectedConvo ? (
            <>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={selectedConvo.participant.avatar} />
                      <AvatarFallback>
                        {selectedConvo.participant.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedConvo.participant.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedConvo.participant.role} • {selectedConvo.participant.facility}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0 flex flex-col h-[450px]">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === "patient" ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[80%] ${
                          message.senderId === "patient" 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted"
                        } rounded-lg p-3`}>
                          {message.type === "text" && (
                            <p className="text-sm">{message.content}</p>
                          )}
                          {message.type === "file" && (
                            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80">
                              <FileText className="h-5 w-5" />
                              <div>
                                <p className="text-sm font-medium">{message.fileName}</p>
                                <p className="text-xs opacity-80">Tap to download</p>
                              </div>
                            </div>
                          )}
                          <div className={`flex items-center justify-end gap-1 mt-1 ${
                            message.senderId === "patient" ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}>
                            <span className="text-xs">{formatMessageTime(message.timestamp)}</span>
                            {message.senderId === "patient" && message.isRead && (
                              <CheckCheck className="h-3 w-3" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex items-end gap-2">
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-9 w-9">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-9 w-9">
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-9 w-9">
                        <Mic className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      className="min-h-[40px] max-h-[120px] resize-none"
                      rows={1}
                    />
                    <Button 
                      size="icon" 
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="h-full flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a conversation to start messaging</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Response Time Notice */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Expected Response Time</p>
              <p className="text-sm text-muted-foreground">
                Providers typically respond within 24-48 hours during business days. 
                For urgent matters, please use the Emergency SOS feature or visit your nearest facility.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
