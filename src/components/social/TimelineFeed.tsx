import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Image as ImageIcon,
  Video,
  FileText,
  Send,
  Sparkles,
  Activity,
  Award,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Post {
  id: string;
  author_id: string;
  content: string;
  post_type: string;
  media_urls: string[];
  media_types: string[];
  visibility: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  health_data: any;
  created_at: string;
  author?: {
    display_name: string;
    avatar_url: string;
    role: string;
  };
  user_reacted?: boolean;
}

interface TimelineFeedProps {
  communityId?: string;
  clubId?: string;
  pageId?: string;
}

export function TimelineFeed({ communityId, clubId, pageId }: TimelineFeedProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState("");
  const [postType, setPostType] = useState<string>("standard");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        () => fetchPosts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId, clubId, pageId]);

  const fetchPosts = async () => {
    try {
      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (communityId) {
        query = query.eq('community_id', communityId);
      } else if (clubId) {
        query = query.eq('club_id', clubId);
      } else if (pageId) {
        query = query.eq('page_id', pageId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch author profiles
      const authorIds = [...new Set((data || []).map(p => p.author_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, role')
        .in('user_id', authorIds);

      // Fetch user reactions
      let userReactions: string[] = [];
      if (user) {
        const { data: reactions } = await supabase
          .from('post_reactions')
          .select('post_id')
          .eq('user_id', user.id);
        userReactions = (reactions || []).map(r => r.post_id);
      }

      const postsWithAuthors = (data || []).map(post => ({
        ...post,
        author: profiles?.find(p => p.user_id === post.author_id) || {
          display_name: 'Unknown User',
          avatar_url: '',
          role: 'user'
        },
        user_reacted: userReactions.includes(post.id)
      }));

      setPosts(postsWithAuthors);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('posts').insert({
        author_id: user.id,
        content: newPostContent,
        post_type: postType,
        community_id: communityId || null,
      });

      if (error) throw error;

      setNewPostContent("");
      setPostType("standard");
      toast({ title: "Post created successfully!" });
    } catch (error: any) {
      toast({ title: "Error creating post", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReaction = async (postId: string, hasReacted: boolean) => {
    if (!user) return;

    try {
      if (hasReacted) {
        await supabase.from('post_reactions').delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase.from('post_reactions').insert({
          post_id: postId,
          user_id: user.id,
          reaction_type: 'like'
        });
      }
      fetchPosts();
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'health_update': return <Activity className="h-4 w-4 text-success" />;
      case 'milestone': return <Award className="h-4 w-4 text-warning" />;
      case 'announcement': return <Sparkles className="h-4 w-4 text-primary" />;
      default: return null;
    }
  };

  const getPostTypeBadge = (type: string) => {
    switch (type) {
      case 'health_update': return <Badge className="bg-success/20 text-success">Health Update</Badge>;
      case 'milestone': return <Badge className="bg-warning/20 text-warning">Milestone</Badge>;
      case 'announcement': return <Badge className="bg-primary/20 text-primary">Announcement</Badge>;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Post */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Avatar>
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback>
                {profile?.display_name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="What's on your mind? Share updates, health milestones, or encourage others..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <ImageIcon className="h-4 w-4 mr-1" />
                    Photo
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4 mr-1" />
                    Video
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        {getPostTypeIcon(postType) || <FileText className="h-4 w-4" />}
                        <span className="ml-1 capitalize">{postType.replace('_', ' ')}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setPostType("standard")}>
                        Standard Post
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPostType("health_update")}>
                        <Activity className="h-4 w-4 mr-2 text-success" />
                        Health Update
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPostType("milestone")}>
                        <Award className="h-4 w-4 mr-2 text-warning" />
                        Milestone
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Button 
                  onClick={handleCreatePost} 
                  disabled={!newPostContent.trim() || submitting}
                >
                  <Send className="h-4 w-4 mr-1" />
                  Post
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      <ScrollArea className="h-[calc(100vh-400px)]">
        <div className="space-y-4 pr-4">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-1">No posts yet</h3>
                <p className="text-sm text-muted-foreground">
                  Be the first to share something with the community!
                </p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={post.author?.avatar_url || ""} />
                        <AvatarFallback>
                          {post.author?.display_name?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{post.author?.display_name}</span>
                          {post.post_type !== 'standard' && getPostTypeBadge(post.post_type)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="capitalize">{post.author?.role}</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Save Post</DropdownMenuItem>
                        <DropdownMenuItem>Copy Link</DropdownMenuItem>
                        {post.author_id === user?.id && (
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="whitespace-pre-wrap">{post.content}</p>
                  
                  {/* Media Preview */}
                  {post.media_urls && post.media_urls.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {post.media_urls.slice(0, 4).map((url, i) => (
                        <div key={i} className="aspect-video bg-muted rounded-lg overflow-hidden">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className={post.user_reacted ? "text-destructive" : ""}
                      onClick={() => handleReaction(post.id, !!post.user_reacted)}
                    >
                      <Heart className={`h-4 w-4 mr-1 ${post.user_reacted ? "fill-current" : ""}`} />
                      {post.likes_count > 0 && post.likes_count}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {post.comments_count > 0 && post.comments_count}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
