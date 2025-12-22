import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VendorRatingProps {
  vendorId: string;
  vendorName: string;
  fulfillmentRequestId?: string;
  onRated?: () => void;
}

export function VendorRating({ vendorId, vendorName, fulfillmentRequestId, onRated }: VendorRatingProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");

  const submitRating = useMutation({
    mutationFn: async () => {
      if (!user || rating === 0) throw new Error("Invalid rating");

      const { error } = await supabase.from("vendor_ratings").insert({
        vendor_id: vendorId,
        fulfillment_request_id: fulfillmentRequestId || null,
        rated_by: user.id,
        rating,
        review: review.trim() || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-ratings"] });
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast({ title: "Rating submitted", description: "Thank you for your feedback!" });
      setOpen(false);
      setRating(0);
      setReview("");
      onRated?.();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const displayRating = hoverRating || rating;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Star className="h-4 w-4 mr-2" />
          Rate Vendor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate {vendorName}</DialogTitle>
          <DialogDescription>Share your experience with this vendor</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "h-8 w-8 transition-colors",
                    star <= displayRating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  )}
                />
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {displayRating === 0 && "Select a rating"}
            {displayRating === 1 && "Poor"}
            {displayRating === 2 && "Fair"}
            {displayRating === 3 && "Good"}
            {displayRating === 4 && "Very Good"}
            {displayRating === 5 && "Excellent"}
          </p>

          <Textarea
            placeholder="Share details of your experience (optional)"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={4}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => submitRating.mutate()}
            disabled={rating === 0 || submitRating.isPending}
          >
            {submitRating.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Rating"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface VendorRatingDisplayProps {
  averageRating: number;
  totalRatings: number;
  size?: "sm" | "md" | "lg";
}

export function VendorRatingDisplay({ averageRating, totalRatings, size = "md" }: VendorRatingDisplayProps) {
  const starSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              starSizes[size],
              star <= Math.round(averageRating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30"
            )}
          />
        ))}
      </div>
      <span className={cn("font-medium", textSizes[size])}>
        {averageRating.toFixed(1)}
      </span>
      <span className={cn("text-muted-foreground", textSizes[size])}>
        ({totalRatings})
      </span>
    </div>
  );
}
