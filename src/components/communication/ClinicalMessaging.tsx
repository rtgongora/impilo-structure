import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, Send, Phone, Video, Search, Plus, 
  Users, User, MoreVertical, Paperclip, Image, Smile
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  id: string;
  channel_id: string;
  sender_id: string;
  message_type: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    display_name: string;
    avatar_url?: string;
  };
}

interface Channel {
  id: string;
  channel_type: string;
  name: string | null;
  description?: string;
  last_message_at: string | null;
  unread_count?: number;
  members?: {
    user_id: string;
    display_name: string;
    avatar_url?: string;
  }[];
}

interface ClinicalMessagingProps {
  onStartCall?: (channelId: string, isVideo: boolean) => void;
}

export function ClinicalMessaging({ onStartCall }: ClinicalMessagingProps) {
  const { user, profile } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user's channels
  useEffect(() => {
    if (!user) return;

    const fetchChannels = async () => {
      const { data, error } = await supabase
        .from("channel_members")
        .select(`
          channel_id,
          message_channels (
            id, channel_type, name, description, last_message_at
          )
        `)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching channels:", error);
        return;
      }

      const channelList = data?.map((cm: any) => cm.message_channels).filter(Boolean) || [];
      setChannels(channelList);
    };

    fetchChannels();
  }, [user]);

  // Fetch messages for selected channel
  useEffect(() => {
    if (!selectedChannel) return;

    const fetchMessages = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("clinical_messages")
        .select("*")
        .eq("channel_id", selectedChannel.id)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) {
        console.error("Error fetching messages:", error);
      } else {
        setMessages(data || []);
      }
      setIsLoading(false);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages-${selectedChannel.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "clinical_messages",
          filter: `channel_id=eq.${selectedChannel.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChannel]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChannel || !user) return;

    const { error } = await supabase.from("clinical_messages").insert({
      channel_id: selectedChannel.id,
      sender_id: user.id,
      content: newMessage.trim(),
      message_type: "text",
    });

    if (error) {
      toast.error("Failed to send message");
      console.error("Error sending message:", error);
    } else {
      setNewMessage("");
    }
  };

  const getChannelName = (channel: Channel) => {
    if (channel.name) return channel.name;
    if (channel.channel_type === "direct") return "Direct Message";
    return "Group Chat";
  };

  const getChannelIcon = (channel: Channel) => {
    switch (channel.channel_type) {
      case "direct":
        return <User className="w-4 h-4" />;
      case "group":
      case "department":
        return <Users className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const filteredChannels = channels.filter((c) =>
    getChannelName(c).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden bg-background">
      {/* Channel List Sidebar */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-3 border-b space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Messages</h3>
            <Button size="icon" variant="ghost" className="h-8 w-8">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filteredChannels.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No conversations yet
            </div>
          ) : (
            filteredChannels.map((channel) => (
              <div
                key={channel.id}
                onClick={() => setSelectedChannel(channel)}
                className={`p-3 border-b cursor-pointer hover:bg-accent/50 transition-colors ${
                  selectedChannel?.id === channel.id ? "bg-accent" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {getChannelIcon(channel)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate">
                        {getChannelName(channel)}
                      </span>
                      {channel.last_message_at && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(channel.last_message_at), "HH:mm")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground capitalize">
                        {channel.channel_type}
                      </span>
                      {channel.unread_count && channel.unread_count > 0 && (
                        <Badge variant="default" className="h-5 w-5 p-0 text-xs justify-center">
                          {channel.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Message Area */}
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <>
            {/* Header */}
            <div className="p-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {getChannelIcon(selectedChannel)}
                </div>
                <div>
                  <h4 className="font-semibold">{getChannelName(selectedChannel)}</h4>
                  <span className="text-xs text-muted-foreground capitalize">
                    {selectedChannel.channel_type} • Active now
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onStartCall?.(selectedChannel.id, false)}
                >
                  <Phone className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onStartCall?.(selectedChannel.id, true)}
                >
                  <Video className="w-4 h-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Members</DropdownMenuItem>
                    <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
                    <DropdownMenuItem>Leave Channel</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isOwn = message.sender_id === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] ${
                            isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          } rounded-lg px-4 py-2`}
                        >
                          {!isOwn && (
                            <p className="text-xs font-medium mb-1 opacity-70">
                              {message.sender?.display_name || "User"}
                            </p>
                          )}
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            {format(new Date(message.created_at), "HH:mm")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t">
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" className="shrink-0">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="shrink-0">
                  <Image className="w-4 h-4" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1"
                />
                <Button size="icon" variant="ghost" className="shrink-0">
                  <Smile className="w-4 h-4" />
                </Button>
                <Button size="icon" onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <h3 className="font-medium mb-2">Select a conversation</h3>
              <p className="text-sm">Choose a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
