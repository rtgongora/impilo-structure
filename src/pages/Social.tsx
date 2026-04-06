import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimelineFeed } from "@/components/social/TimelineFeed";
import { CommunitiesList } from "@/components/social/CommunitiesList";
import { ClubsList } from "@/components/social/ClubsList";
import { ProfessionalPages } from "@/components/social/ProfessionalPages";
import { CrowdfundingCampaigns } from "@/components/social/CrowdfundingCampaigns";
import { NewsFeedWidget } from "@/components/social/NewsFeedWidget";
import { 
  Newspaper, 
  Users, 
  Heart,
  ArrowLeft,
  Dumbbell,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

interface Club {
  id: string;
  name: string;
  slug: string;
  description: string;
  club_type: string;
  category: string;
  cover_image_url: string;
  avatar_url: string;
  privacy: string;
  has_events: boolean;
  has_challenges: boolean;
  has_leaderboard: boolean;
  member_count: number;
  is_verified: boolean;
  created_at: string;
  is_member?: boolean;
}

interface ProfessionalPage {
  id: string;
  owner_id: string;
  page_type: string;
  name: string;
  slug: string;
  bio: string;
  logo_url: string;
  cover_image_url: string;
  business_category: string;
  services: string[];
  contact_email: string;
  contact_phone: string;
  website: string;
  address: string;
  city: string;
  country: string;
  credentials: string[];
  specialties: string[];
  is_verified_provider: boolean;
  follower_count: number;
  review_count: number;
  average_rating: number;
  created_at: string;
  is_following?: boolean;
  is_owner?: boolean;
}

type DetailView = 
  | { type: "community"; data: Community }
  | { type: "club"; data: Club }
  | { type: "page"; data: ProfessionalPage }
  | null;

export default function Social() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "feed");
  const [detailView, setDetailView] = useState<DetailView>(null);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleSelectCommunity = (community: Community) => {
    setDetailView({ type: "community", data: community });
  };

  const handleSelectClub = (club: Club) => {
    setDetailView({ type: "club", data: club });
  };

  const handleSelectPage = (page: ProfessionalPage) => {
    setDetailView({ type: "page", data: page });
  };

  const handleBack = () => {
    setDetailView(null);
  };

  const renderDetailView = () => {
    if (!detailView) return null;

    switch (detailView.type) {
      case "community":
        return (
          <div className="space-y-4">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Communities
            </Button>
            <div className="bg-gradient-to-r from-primary/20 to-primary/5 rounded-lg p-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{detailView.data.name}</h2>
                  <p className="text-muted-foreground">{detailView.data.description}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {detailView.data.member_count} members
                  </p>
                </div>
              </div>
            </div>
            <TimelineFeed communityId={detailView.data.id} />
          </div>
        );

      case "club":
        return (
          <div className="space-y-4">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Clubs
            </Button>
            <div className="bg-gradient-to-r from-green-500/20 to-green-500/5 rounded-lg p-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Dumbbell className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{detailView.data.name}</h2>
                  <p className="text-muted-foreground">{detailView.data.description}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {detailView.data.member_count} members • {detailView.data.club_type}
                  </p>
                </div>
              </div>
            </div>
            <TimelineFeed clubId={detailView.data.id} />
          </div>
        );

      case "page":
        return (
          <div className="space-y-4">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Pages
            </Button>
            <div className="bg-gradient-to-r from-blue-500/20 to-blue-500/5 rounded-lg p-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{detailView.data.name}</h2>
                  <p className="text-muted-foreground">{detailView.data.bio}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span>{detailView.data.follower_count} followers</span>
                    {detailView.data.city && <span>• {detailView.data.city}</span>}
                  </div>
                </div>
              </div>
            </div>
            <TimelineFeed pageId={detailView.data.id} />
          </div>
        );
    }
  };

  return (
    <AppLayout>
      <div className="flex-1 flex min-h-0 overflow-auto">
        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Social Hub</h1>
            <p className="text-muted-foreground">
              Connect, share, and support your health community
            </p>
          </div>

          {detailView ? (
            renderDetailView()
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6 flex-wrap h-auto gap-1">
                <TabsTrigger value="feed" className="flex items-center gap-2">
                  <Newspaper className="h-4 w-4" />
                  Timeline
                </TabsTrigger>
                <TabsTrigger value="communities" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Communities
                </TabsTrigger>
                <TabsTrigger value="clubs" className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4" />
                  Clubs
                </TabsTrigger>
                <TabsTrigger value="pages" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Pages
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

              <TabsContent value="clubs">
                <ClubsList onSelectClub={handleSelectClub} />
              </TabsContent>

              <TabsContent value="pages">
                <ProfessionalPages onSelectPage={handleSelectPage} />
              </TabsContent>

              <TabsContent value="crowdfunding">
                <CrowdfundingCampaigns />
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Right Sidebar - Newsfeed Widget */}
        <div className="hidden xl:block w-80 border-l p-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Newspaper className="h-4 w-4" />
                Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NewsFeedWidget />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
