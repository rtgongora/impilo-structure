import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimelineFeed } from "@/components/social/TimelineFeed";
import { CommunitiesList } from "@/components/social/CommunitiesList";
import { CrowdfundingCampaigns } from "@/components/social/CrowdfundingCampaigns";
import { 
  Newspaper, 
  Users, 
  Heart,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  cover_image_url: string;
  avatar_url: string;
  privacy: string;
  is_verified: boolean;
  member_count: number;
  post_count: number;
  created_at: string;
  is_member?: boolean;
}

export default function Social() {
  const [activeTab, setActiveTab] = useState("feed");
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);

  const handleSelectCommunity = (community: Community) => {
    setSelectedCommunity(community);
    setActiveTab("community-detail");
  };

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Social Hub</h1>
          <p className="text-muted-foreground">
            Connect, share, and support your health community
          </p>
        </div>

        {selectedCommunity ? (
          // Community Detail View
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              onClick={() => {
                setSelectedCommunity(null);
                setActiveTab("communities");
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Communities
            </Button>
            
            {/* Community Header */}
            <div className="bg-gradient-to-r from-primary/20 to-primary/5 rounded-lg p-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedCommunity.name}</h2>
                  <p className="text-muted-foreground">{selectedCommunity.description}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedCommunity.member_count} members
                  </p>
                </div>
              </div>
            </div>

            {/* Community Feed */}
            <TimelineFeed communityId={selectedCommunity.id} />
          </div>
        ) : (
          // Main Social Hub Tabs
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="feed" className="flex items-center gap-2">
                <Newspaper className="h-4 w-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="communities" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Communities
              </TabsTrigger>
              <TabsTrigger value="crowdfunding" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Crowdfunding
              </TabsTrigger>
            </TabsList>

            <TabsContent value="feed">
              <TimelineFeed />
            </TabsContent>

            <TabsContent value="communities">
              <CommunitiesList onSelectCommunity={handleSelectCommunity} />
            </TabsContent>

            <TabsContent value="crowdfunding">
              <CrowdfundingCampaigns />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
