import React, { useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Camera, Loader2, User, Trash2 } from 'lucide-react';

interface AvatarUploadProps {
  onUploadComplete?: () => void;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({ onUploadComplete }) => {
  const { user, profile, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Delete existing avatar if present
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/').slice(-2).join('/');
        await supabase.storage.from('avatars').remove([oldPath]);
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      toast.success('Avatar updated successfully!');
      onUploadComplete?.();
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast.error('Failed to upload avatar: ' + error.message);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user || !profile?.avatar_url) return;

    setDeleting(true);

    try {
      // Extract path from URL
      const urlParts = profile.avatar_url.split('/');
      const filePath = `${user.id}/${urlParts[urlParts.length - 1]}`;

      // Remove from storage
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      toast.success('Avatar removed');
      onUploadComplete?.();
    } catch (error: any) {
      console.error('Avatar delete error:', error);
      toast.error('Failed to remove avatar');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-6">
      <div className="relative group">
        <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
          <AvatarImage 
            src={profile?.avatar_url || undefined} 
            alt={profile?.display_name || 'User'} 
          />
          <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
            {profile?.display_name ? getInitials(profile.display_name) : <User className="w-8 h-8" />}
          </AvatarFallback>
        </Avatar>
        
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || deleting}
        >
          <Camera className="w-4 h-4 mr-2" />
          {profile?.avatar_url ? 'Change Photo' : 'Upload Photo'}
        </Button>

        {profile?.avatar_url && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemoveAvatar}
            disabled={uploading || deleting}
            className="text-destructive hover:text-destructive"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Remove
          </Button>
        )}

        <p className="text-xs text-muted-foreground">
          JPG, PNG or WebP. Max 5MB.
        </p>
      </div>
    </div>
  );
};
