import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Search, 
  Plus, 
  Users, 
  Building2, 
  Stethoscope, 
  Star,
  MapPin,
  Phone,
  Globe,
  CheckCircle,
  UserPlus,
  UserMinus
} from "lucide-react";

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

interface ProfessionalPagesProps {
  onSelectPage: (page: ProfessionalPage) => void;
}

const pageTypes = [
  { value: "individual", label: "Individual", icon: Users },
  { value: "organization", label: "Organization", icon: Building2 },
  { value: "healthcare_provider", label: "Healthcare Provider", icon: Stethoscope },
];

export function ProfessionalPages({ onSelectPage }: ProfessionalPagesProps) {
  const { user } = useAuth();
  const [pages, setPages] = useState<ProfessionalPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("discover");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPage, setNewPage] = useState({
    name: "",
    bio: "",
    page_type: "individual",
    business_category: "",
    contact_email: "",
    contact_phone: "",
    website: "",
    address: "",
    city: "",
    country: "",
    specialties: [] as string[],
    credentials: [] as string[],
  });
  const [specialtyInput, setSpecialtyInput] = useState("");

  useEffect(() => {
    fetchPages();
  }, [user, selectedType, activeTab]);

  const fetchPages = async () => {
    try {
      let query = supabase.from("professional_pages").select("*").eq("is_active", true);

      if (selectedType) {
        query = query.eq("page_type", selectedType);
      }

      const { data, error } = await query.order("follower_count", { ascending: false });

      if (error) throw error;

      let pagesData: ProfessionalPage[] = (data || []).map(page => ({
        ...page,
        is_following: false,
        is_owner: false
      }));

      // Check following status and ownership
      if (user && pagesData.length > 0) {
        const { data: following } = await supabase
          .from("page_followers")
          .select("page_id")
          .eq("user_id", user.id);

        const followingPageIds = new Set(following?.map(f => f.page_id) || []);
        pagesData = pagesData.map(page => ({
          ...page,
          is_following: followingPageIds.has(page.id),
          is_owner: page.owner_id === user.id
        }));

        // Filter for "my pages" tab
        if (activeTab === "my-pages") {
          pagesData = pagesData.filter(page => page.is_owner);
        } else if (activeTab === "following") {
          pagesData = pagesData.filter(page => page.is_following);
        }
      }

      setPages(pagesData);
    } catch (error) {
      console.error("Error fetching pages:", error);
      toast.error("Failed to load pages");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePage = async () => {
    if (!user || !newPage.name.trim()) {
      toast.error("Please enter a page name");
      return;
    }

    try {
      const slug = newPage.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      const { error } = await supabase.from("professional_pages").insert({
        ...newPage,
        slug,
        owner_id: user.id,
        services: [],
      });

      if (error) throw error;

      toast.success("Professional page created successfully!");
      setShowCreateDialog(false);
      setNewPage({
        name: "",
        bio: "",
        page_type: "individual",
        business_category: "",
        contact_email: "",
        contact_phone: "",
        website: "",
        address: "",
        city: "",
        country: "",
        specialties: [],
        credentials: [],
      });
      fetchPages();
    } catch (error: any) {
      console.error("Error creating page:", error);
      toast.error(error.message || "Failed to create page");
    }
  };

  const handleFollow = async (pageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please sign in to follow pages");
      return;
    }

    try {
      await supabase.from("page_followers").insert({
        page_id: pageId,
        user_id: user.id,
      });

      toast.success("Following page!");
      fetchPages();
    } catch (error) {
      console.error("Error following page:", error);
      toast.error("Failed to follow page");
    }
  };

  const handleUnfollow = async (pageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    try {
      await supabase.from("page_followers")
        .delete()
        .eq("page_id", pageId)
        .eq("user_id", user.id);

      toast.success("Unfollowed page");
      fetchPages();
    } catch (error) {
      console.error("Error unfollowing page:", error);
      toast.error("Failed to unfollow page");
    }
  };

  const addSpecialty = () => {
    if (specialtyInput.trim() && !newPage.specialties.includes(specialtyInput.trim())) {
      setNewPage({
        ...newPage,
        specialties: [...newPage.specialties, specialtyInput.trim()]
      });
      setSpecialtyInput("");
    }
  };

  const removeSpecialty = (specialty: string) => {
    setNewPage({
      ...newPage,
      specialties: newPage.specialties.filter(s => s !== specialty)
    });
  };

  const getPageTypeIcon = (type: string) => {
    const pageType = pageTypes.find(t => t.value === type);
    const Icon = pageType?.icon || Users;
    return <Icon className="h-5 w-5" />;
  };

  const filteredPages = pages.filter(page =>
    page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.specialties?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <TabsList>
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
            <TabsTrigger value="my-pages">My Pages</TabsTrigger>
          </TabsList>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Page
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Professional Page</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Page Type</Label>
                  <Select
                    value={newPage.page_type}
                    onValueChange={(value) => setNewPage({ ...newPage, page_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pageTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newPage.name}
                    onChange={(e) => setNewPage({ ...newPage, name: e.target.value })}
                    placeholder="Your name or organization name"
                  />
                </div>
                <div>
                  <Label>Bio</Label>
                  <Textarea
                    value={newPage.bio}
                    onChange={(e) => setNewPage({ ...newPage, bio: e.target.value })}
                    placeholder="Tell people about yourself or your organization"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input
                    value={newPage.business_category}
                    onChange={(e) => setNewPage({ ...newPage, business_category: e.target.value })}
                    placeholder="e.g., Healthcare, Wellness, Fitness"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newPage.contact_email}
                      onChange={(e) => setNewPage({ ...newPage, contact_email: e.target.value })}
                      placeholder="contact@example.com"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={newPage.contact_phone}
                      onChange={(e) => setNewPage({ ...newPage, contact_phone: e.target.value })}
                      placeholder="+1 234 567 890"
                    />
                  </div>
                </div>
                <div>
                  <Label>Website</Label>
                  <Input
                    value={newPage.website}
                    onChange={(e) => setNewPage({ ...newPage, website: e.target.value })}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>City</Label>
                    <Input
                      value={newPage.city}
                      onChange={(e) => setNewPage({ ...newPage, city: e.target.value })}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label>Country</Label>
                    <Input
                      value={newPage.country}
                      onChange={(e) => setNewPage({ ...newPage, country: e.target.value })}
                      placeholder="Country"
                    />
                  </div>
                </div>
                
                {newPage.page_type === "healthcare_provider" && (
                  <div>
                    <Label>Specialties</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={specialtyInput}
                        onChange={(e) => setSpecialtyInput(e.target.value)}
                        placeholder="Add specialty"
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSpecialty())}
                      />
                      <Button type="button" onClick={addSpecialty} variant="secondary">
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {newPage.specialties.map((specialty) => (
                        <Badge
                          key={specialty}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeSpecialty(specialty)}
                        >
                          {specialty} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <Button onClick={handleCreatePage} className="w-full">
                  Create Page
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="w-full sm:w-auto whitespace-nowrap">
            <div className="flex gap-2">
              <Button
                variant={selectedType === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(null)}
              >
                All
              </Button>
              {pageTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={selectedType === type.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type.value)}
                  className="flex items-center gap-2"
                >
                  <type.icon className="h-4 w-4" />
                  {type.label}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <TabsContent value="discover" className="mt-0">
          <PagesGrid 
            pages={filteredPages} 
            onSelectPage={onSelectPage}
            onFollow={handleFollow}
            onUnfollow={handleUnfollow}
            getPageTypeIcon={getPageTypeIcon}
          />
        </TabsContent>

        <TabsContent value="following" className="mt-0">
          <PagesGrid 
            pages={filteredPages} 
            onSelectPage={onSelectPage}
            onFollow={handleFollow}
            onUnfollow={handleUnfollow}
            getPageTypeIcon={getPageTypeIcon}
          />
        </TabsContent>

        <TabsContent value="my-pages" className="mt-0">
          <PagesGrid 
            pages={filteredPages} 
            onSelectPage={onSelectPage}
            onFollow={handleFollow}
            onUnfollow={handleUnfollow}
            getPageTypeIcon={getPageTypeIcon}
            showOwnerBadge
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface PagesGridProps {
  pages: ProfessionalPage[];
  onSelectPage: (page: ProfessionalPage) => void;
  onFollow: (pageId: string, e: React.MouseEvent) => void;
  onUnfollow: (pageId: string, e: React.MouseEvent) => void;
  getPageTypeIcon: (type: string) => React.ReactNode;
  showOwnerBadge?: boolean;
}

function PagesGrid({ pages, onSelectPage, onFollow, onUnfollow, getPageTypeIcon, showOwnerBadge }: PagesGridProps) {
  if (pages.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No pages found</h3>
        <p className="text-muted-foreground">
          Create your professional page to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {pages.map((page) => (
        <Card
          key={page.id}
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onSelectPage(page)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <Avatar className="h-14 w-14">
                <AvatarImage src={page.logo_url} />
                <AvatarFallback className="text-lg">
                  {getPageTypeIcon(page.page_type)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg flex items-center gap-2 truncate">
                  {page.name}
                  {page.is_verified_provider && (
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {pageTypes.find(t => t.value === page.page_type)?.label}
                  </Badge>
                  {showOwnerBadge && page.is_owner && (
                    <Badge variant="outline" className="text-xs">Owner</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <CardDescription className="line-clamp-2">
              {page.bio || "No bio available"}
            </CardDescription>
            
            {page.specialties && page.specialties.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {page.specialties.slice(0, 3).map((specialty) => (
                  <Badge key={specialty} variant="outline" className="text-xs">
                    {specialty}
                  </Badge>
                ))}
                {page.specialties.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{page.specialties.length - 3}
                  </Badge>
                )}
              </div>
            )}
            
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {page.follower_count}
                </span>
                {page.average_rating > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {page.average_rating.toFixed(1)}
                  </span>
                )}
                {page.city && (
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3" />
                    {page.city}
                  </span>
                )}
              </div>
              
              {!page.is_owner && (
                page.is_following ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => onUnfollow(page.id, e)}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={(e) => onFollow(page.id, e)}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                )
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
