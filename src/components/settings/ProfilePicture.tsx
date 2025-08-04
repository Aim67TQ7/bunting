
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

  // Handle avatar upload with enhanced error handling and validation
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId || !event.target.files || event.target.files.length === 0) return;
    
    setIsUploading(true);
    const maxRetries = 3;
    let attempts = 0;
    
    try {
      const file = event.target.files[0];
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size must be less than 5MB");
      }
      
      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error("Please upload a valid image file (PNG, JPG, GIF, or WebP)");
      }
      
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const filePath = `${userId}/avatar.${fileExt}`;
      
      console.log("Starting avatar upload:", { userId, filePath, fileSize: file.size, fileType: file.type });
      
      // Upload with retry logic
      let uploadError: any = null;
      while (attempts < maxRetries) {
        attempts++;
        console.log(`Upload attempt ${attempts}/${maxRetries}`);
        
        const { error } = await supabase.storage
          .from("avatars")
          .upload(filePath, file, { upsert: true });
        
        if (!error) {
          uploadError = null;
          break;
        }
        
        uploadError = error;
        console.error(`Upload attempt ${attempts} failed:`, error);
        
        if (attempts < maxRetries) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
      
      if (uploadError) {
        console.error("All upload attempts failed:", uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      
      console.log("Upload successful, getting public URL");
      
      // Get public URL
      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);
      
      const newAvatarUrl = data.publicUrl;
      console.log("Generated public URL:", newAvatarUrl);
      
      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: newAvatarUrl })
        .eq("id", userId);
      
      if (updateError) {
        console.error("Profile update failed:", updateError);
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }
      
      console.log("Profile updated successfully");
      
      // Update UI
      onAvatarUpdate(newAvatarUrl);
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully",
      });
      
    } catch (err: any) {
      console.error("Error uploading avatar:", err);
      const errorMessage = err.message || "Failed to upload profile picture";
      toast({
        title: "Upload Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (event.target) {
        event.target.value = "";
      }
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
