import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Heart,
  Plus,
  Search,
  Target,
  Users,
  Clock,
  Share2,
  ExternalLink,
  Sparkles,
  Building2,
  Stethoscope,
  FlaskConical,
  Package,
} from "lucide-react";

interface Campaign {
  id: string;
  organizer_id: string;
  title: string;
  slug: string;
  description: string;
  story: string;
  category: string;
  cover_image_url: string;
  goal_amount: number;
  raised_amount: number;
  currency: string;
  donor_count: number;
  status: string;
  is_verified: boolean;
  is_featured: boolean;
  is_urgent: boolean;
  end_date: string;
  location: string;
  medical_condition: string;
  created_at: string;
  organizer?: {
    display_name: string;
    avatar_url: string;
  };
}

interface CrowdfundingCampaignsProps {
  onSelectCampaign?: (campaign: Campaign) => void;
}

export function CrowdfundingCampaigns({ onSelectCampaign }: CrowdfundingCampaignsProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDonateDialog, setShowDonateDialog] = useState<Campaign | null>(null);
  const [creating, setCreating] = useState(false);
  const [donating, setDonating] = useState(false);
  const [donationAmount, setDonationAmount] = useState("");
  const [donationMessage, setDonationMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    title: "",
    description: "",
    story: "",
    category: "medical",
    goal_amount: "",
    location: "",
    medical_condition: "",
  });

  const categories = [
    { id: "all", label: "All Causes", icon: Heart },
    { id: "medical", label: "Medical Bills", icon: Stethoscope },
    { id: "community", label: "Community Health", icon: Building2 },
    { id: "equipment", label: "Equipment", icon: Package },
    { id: "research", label: "Research", icon: FlaskConical },
  ];

  useEffect(() => {
    fetchCampaigns();
    
    // Subscribe to donation updates
    const channel = supabase
      .channel('donations-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'campaign_donations' },
        () => fetchCampaigns()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCategory]);

  const fetchCampaigns = async () => {
    try {
      let query = supabase
        .from('crowdfunding_campaigns')
        .select('*')
        .in('status', ['active', 'completed'])
        .order('created_at', { ascending: false });

      if (selectedCategory !== "all") {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch organizer profiles
      const organizerIds = [...new Set((data || []).map(c => c.organizer_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', organizerIds);

      const campaignsWithOrganizers = (data || []).map(campaign => ({
        ...campaign,
        organizer: profiles?.find(p => p.user_id === campaign.organizer_id)
      }));

      setCampaigns(campaignsWithOrganizers);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.title.trim() || !newCampaign.goal_amount || !user) return;

    setCreating(true);
    try {
      const slug = newCampaign.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
      
      const { error } = await supabase.from('crowdfunding_campaigns').insert({
        organizer_id: user.id,
        title: newCampaign.title,
        slug,
        description: newCampaign.description,
        story: newCampaign.story,
        category: newCampaign.category,
        goal_amount: parseFloat(newCampaign.goal_amount),
        location: newCampaign.location,
        medical_condition: newCampaign.medical_condition,
        status: 'active',
      });

      if (error) throw error;

      toast({ title: "Campaign created successfully!" });
      setShowCreateDialog(false);
      setNewCampaign({
        title: "",
        description: "",
        story: "",
        category: "medical",
        goal_amount: "",
        location: "",
        medical_condition: "",
      });
      fetchCampaigns();
    } catch (error: any) {
      toast({ title: "Error creating campaign", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleDonate = async () => {
    if (!showDonateDialog || !donationAmount || !user) return;

    setDonating(true);
    try {
      const { error } = await supabase.from('campaign_donations').insert({
        campaign_id: showDonateDialog.id,
        donor_id: user.id,
        amount: parseFloat(donationAmount),
        currency: showDonateDialog.currency,
        is_anonymous: isAnonymous,
        donor_name: isAnonymous ? "Anonymous" : profile?.display_name,
        message: donationMessage,
        payment_status: 'completed', // In production, integrate with payment gateway
      });

      if (error) throw error;

      toast({ title: "Thank you for your donation!" });
      setShowDonateDialog(null);
      setDonationAmount("");
      setDonationMessage("");
      setIsAnonymous(false);
      fetchCampaigns();
    } catch (error: any) {
      toast({ title: "Error processing donation", description: error.message, variant: "destructive" });
    } finally {
      setDonating(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat?.icon || Heart;
  };

  const filteredCampaigns = campaigns.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <Skeleton className="h-40 rounded-t-lg" />
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Crowdfunding</h2>
          <p className="text-sm text-muted-foreground">
            Support health causes and medical needs in your community
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Start Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Start a Fundraising Campaign</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4 pr-4">
                <div>
                  <Input
                    placeholder="Campaign title"
                    value={newCampaign.title}
                    onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="Brief description"
                    value={newCampaign.description}
                    onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="Tell your story in detail..."
                    value={newCampaign.story}
                    onChange={(e) => setNewCampaign({ ...newCampaign, story: e.target.value })}
                    className="min-h-[100px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Fundraising Goal</label>
                    <Input
                      type="number"
                      placeholder="Amount in USD"
                      value={newCampaign.goal_amount}
                      onChange={(e) => setNewCampaign({ ...newCampaign, goal_amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Category</label>
                    <Select
                      value={newCampaign.category}
                      onValueChange={(v) => setNewCampaign({ ...newCampaign, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="medical">Medical Bills</SelectItem>
                        <SelectItem value="community">Community Health</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="research">Research</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Input
                    placeholder="Location (City, Country)"
                    value={newCampaign.location}
                    onChange={(e) => setNewCampaign({ ...newCampaign, location: e.target.value })}
                  />
                </div>
                <div>
                  <Input
                    placeholder="Medical condition (if applicable)"
                    value={newCampaign.medical_condition}
                    onChange={(e) => setNewCampaign({ ...newCampaign, medical_condition: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreateCampaign} disabled={creating} className="w-full">
                  {creating ? "Creating..." : "Launch Campaign"}
                </Button>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat.id)}
            className="shrink-0"
          >
            <cat.icon className="h-4 w-4 mr-1" />
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Campaigns Grid */}
      <ScrollArea className="h-[calc(100vh-400px)]">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pr-4">
          {filteredCampaigns.length === 0 ? (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="py-12 text-center">
                <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-1">No campaigns found</h3>
                <p className="text-sm text-muted-foreground">
                  Start a campaign to raise funds for a health cause
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredCampaigns.map((campaign) => {
              const CategoryIcon = getCategoryIcon(campaign.category);
              const progressPercent = campaign.goal_amount > 0 
                ? Math.min(100, (campaign.raised_amount / campaign.goal_amount) * 100) 
                : 0;

              return (
                <Card 
                  key={campaign.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Cover Image */}
                  <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 relative">
                    {campaign.cover_image_url ? (
                      <img 
                        src={campaign.cover_image_url} 
                        alt={campaign.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <CategoryIcon className="h-12 w-12 text-primary/30" />
                      </div>
                    )}
                    {campaign.is_urgent && (
                      <Badge className="absolute top-2 left-2 bg-destructive">Urgent</Badge>
                    )}
                    {campaign.is_verified && (
                      <Badge className="absolute top-2 right-2 bg-success">Verified</Badge>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="capitalize">
                        {campaign.category}
                      </Badge>
                      {campaign.location && (
                        <span className="text-xs text-muted-foreground">{campaign.location}</span>
                      )}
                    </div>

                    <h3 className="font-semibold line-clamp-2 mb-2">{campaign.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {campaign.description}
                    </p>

                    {/* Progress */}
                    <div className="space-y-2 mb-4">
                      <Progress value={progressPercent} className="h-2" />
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-primary">
                          {formatCurrency(campaign.raised_amount, campaign.currency)}
                        </span>
                        <span className="text-muted-foreground">
                          of {formatCurrency(campaign.goal_amount, campaign.currency)}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {campaign.donor_count} donors
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1"
                        onClick={() => setShowDonateDialog(campaign)}
                      >
                        <Heart className="h-4 w-4 mr-1" />
                        Donate
                      </Button>
                      <Button variant="outline" size="icon">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Donate Dialog */}
      <Dialog open={!!showDonateDialog} onOpenChange={() => setShowDonateDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Support: {showDonateDialog?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Donation Amount</label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[10, 25, 50, 100].map(amount => (
                  <Button
                    key={amount}
                    variant={donationAmount === String(amount) ? "default" : "outline"}
                    onClick={() => setDonationAmount(String(amount))}
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                placeholder="Or enter custom amount"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
              />
            </div>
            <div>
              <Textarea
                placeholder="Leave a message of support (optional)"
                value={donationMessage}
                onChange={(e) => setDonationMessage(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              <label htmlFor="anonymous" className="text-sm">Donate anonymously</label>
            </div>
            <Button onClick={handleDonate} disabled={donating || !donationAmount} className="w-full">
              {donating ? "Processing..." : `Donate ${donationAmount ? `$${donationAmount}` : ""}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
