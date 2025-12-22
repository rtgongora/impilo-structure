import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, MessageCircle, Share2, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Post {
  id: string;
  content: string;
  post_type: string;
  media_urls: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  author_id: string;
  author?: {
    display_name: string;
    avatar_url: string;
  };
  hasLiked?: boolean;
}

export function NewsFeedWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [user]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles!posts_author_id_fkey(display_name, avatar_url)
        `)
        .is("community_id", null)
        .is("club_id", null)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      const postsWithProfiles = data?.map((post: any) => ({
        ...post,
        author: post.profiles,
      })) || [];

      // Check user reactions
      if (user && postsWithProfiles.length > 0) {
        const { data: reactions } = await supabase
          .from("post_reactions")
          .select("post_id")
          .eq("user_id", user.id)
          .in("post_id", postsWithProfiles.map(p => p.id));

        const likedPostIds = new Set(reactions?.map(r => r.post_id) || []);
        postsWithProfiles.forEach(post => {
          post.hasLiked = likedPostIds.has(post.id);
        });
      }

      setPosts(postsWithProfiles);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (postId: string, hasLiked: boolean) => {
    if (!user) return;

    try {
      if (hasLiked) {
        await supabase
          .from("post_reactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("post_reactions")
          .insert({ post_id: postId, user_id: user.id });
      }

      setPosts(posts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              hasLiked: !hasLiked,
              likes_count: hasLiked ? post.likes_count - 1 : post.likes_count + 1
            }
          : post
      ));
    } catch (error) {
      console.error("Error toggling reaction:", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 border rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Latest Updates</h3>
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ExternalLink className="h-3 w-3 mr-1" />
          View All
        </Button>
      </div>
      
      <ScrollArea className="h-[400px]">
        <div className="space-y-3 pr-2">
          {posts.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              No posts yet. Be the first to share!
            </p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="p-3 border rounded-lg space-y-2 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={post.author?.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {post.author?.display_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs truncate">
                      {post.author?.display_name || "Anonymous"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                <p className="text-xs line-clamp-2">{post.content}</p>
                
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() => handleReaction(post.id, post.hasLiked || false)}
                    className={`flex items-center gap-1 text-xs transition-colors ${
                      post.hasLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                    }`}
                  >
                    <Heart className={`h-3 w-3 ${post.hasLiked ? "fill-current" : ""}`} />
                    {post.likes_count}
                  </button>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageCircle className="h-3 w-3" />
                    {post.comments_count}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
