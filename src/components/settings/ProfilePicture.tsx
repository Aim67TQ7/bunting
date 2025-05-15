
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfilePictureProps {
  userId: string | undefined;
  avatarUrl: string | null;
  firstName?: string;
  email?: string;
  onAvatarUpdate: (url: string) => void;
}

export function ProfilePicture({ userId, avatarUrl, firstName, email, onAvatarUpdate }: ProfilePictureProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId || !event.target.files || event.target.files.length === 0) return;
    
    setIsUploading(true);
    try {
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar.${fileExt}`;
      
      // Upload image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);
      
      const newAvatarUrl = data.publicUrl;
      
      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: newAvatarUrl })
        .eq("id", userId);
      
      if (updateError) throw updateError;
      
      // Update UI
      onAvatarUpdate(newAvatarUrl);
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully",
      });
      
    } catch (err) {
      console.error("Error uploading avatar:", err);
      toast({
        title: "Error",
        description: "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Profile Picture</CardTitle>
        <CardDescription>
          Update your profile picture
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <Avatar className="h-24 w-24 border-2 border-primary/10">
          <AvatarImage src={avatarUrl || ""} alt={firstName || "User"} />
          <AvatarFallback>
            {firstName?.charAt(0) || email?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        
        <div>
          <label htmlFor="avatar-upload" className="cursor-pointer">
            <div className="flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md">
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Upload new picture</span>
                </>
              )}
            </div>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
