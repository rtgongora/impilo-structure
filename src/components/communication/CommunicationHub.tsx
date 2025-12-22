import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Bell, Phone, Video, Settings } from "lucide-react";
import { ClinicalMessaging } from "./ClinicalMessaging";
import { ClinicalPaging } from "./ClinicalPaging";
import { VoiceCall } from "./VoiceCall";

interface CommunicationHubProps {
  defaultTab?: "messages" | "pages" | "calls";
}

export function CommunicationHub({ defaultTab = "messages" }: CommunicationHubProps) {
  const [activeCall, setActiveCall] = useState<{
    recipientId: string;
    recipientName: string;
    isVideo: boolean;
  } | null>(null);

  const [unreadMessages] = useState(3);
  const [pendingPages] = useState(1);

  const handleStartCall = (channelId: string, isVideo: boolean) => {
    // In production, resolve channel to recipient info
    setActiveCall({
      recipientId: channelId,
      recipientName: "Dr. Smith",
      isVideo,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Communication Hub</h1>
          <p className="text-muted-foreground">
            Messaging, paging, and voice calls for clinical teams
          </p>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Messages
            {unreadMessages > 0 && (
              <Badge variant="destructive" className="h-5 w-5 p-0 text-xs justify-center">
                {unreadMessages}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pages" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Pages
            {pendingPages > 0 && (
              <Badge variant="destructive" className="h-5 w-5 p-0 text-xs justify-center">
                {pendingPages}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="calls" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Calls
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-6">
          <ClinicalMessaging onStartCall={handleStartCall} />
        </TabsContent>

        <TabsContent value="pages" className="mt-6">
          <ClinicalPaging />
        </TabsContent>

        <TabsContent value="calls" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Voice & Video Calls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <div className="space-y-4">
                  <h3 className="font-medium">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Card
                      className="p-4 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() =>
                        setActiveCall({
                          recipientId: "on-call",
                          recipientName: "On-Call Physician",
                          isVideo: false,
                        })
                      }
                    >
                      <Phone className="w-8 h-8 text-primary mb-2" />
                      <p className="font-medium text-sm">Call On-Call</p>
                      <p className="text-xs text-muted-foreground">Reach physician</p>
                    </Card>
                    <Card
                      className="p-4 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() =>
                        setActiveCall({
                          recipientId: "pharmacy",
                          recipientName: "Pharmacy",
                          isVideo: false,
                        })
                      }
                    >
                      <Phone className="w-8 h-8 text-primary mb-2" />
                      <p className="font-medium text-sm">Pharmacy</p>
                      <p className="text-xs text-muted-foreground">Medication queries</p>
                    </Card>
                    <Card
                      className="p-4 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() =>
                        setActiveCall({
                          recipientId: "lab",
                          recipientName: "Laboratory",
                          isVideo: false,
                        })
                      }
                    >
                      <Phone className="w-8 h-8 text-primary mb-2" />
                      <p className="font-medium text-sm">Laboratory</p>
                      <p className="text-xs text-muted-foreground">Result inquiries</p>
                    </Card>
                    <Card
                      className="p-4 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() =>
                        setActiveCall({
                          recipientId: "radiology",
                          recipientName: "Radiology",
                          isVideo: false,
                        })
                      }
                    >
                      <Phone className="w-8 h-8 text-primary mb-2" />
                      <p className="font-medium text-sm">Radiology</p>
                      <p className="text-xs text-muted-foreground">Imaging support</p>
                    </Card>
                  </div>
                </div>

                {/* Recent Calls */}
                <div className="space-y-4">
                  <h3 className="font-medium">Recent Calls</h3>
                  <div className="space-y-2">
                    {[
                      { name: "Dr. Okonkwo", time: "10 mins ago", type: "outgoing", duration: "5:23" },
                      { name: "Lab", time: "1 hour ago", type: "incoming", duration: "2:15" },
                      { name: "Pharmacy", time: "2 hours ago", type: "missed", duration: null },
                    ].map((call, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              call.type === "missed" ? "bg-destructive/10" : "bg-primary/10"
                            }`}
                          >
                            <Phone
                              className={`w-4 h-4 ${
                                call.type === "missed" ? "text-destructive" : "text-primary"
                              }`}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{call.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {call.type === "incoming" ? "Incoming" : call.type === "outgoing" ? "Outgoing" : "Missed"}{" "}
                              • {call.time}
                            </p>
                          </div>
                        </div>
                        {call.duration && (
                          <Badge variant="secondary">{call.duration}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Active Call Overlay */}
      {activeCall && (
        <VoiceCall
          recipientId={activeCall.recipientId}
          recipientName={activeCall.recipientName}
          onEnd={() => setActiveCall(null)}
        />
      )}
    </div>
  );
}
