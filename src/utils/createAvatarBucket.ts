
import { supabase } from "@/integrations/supabase/client";

export async function createAvatarBucket() {
  try {
    // Check if the bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("Error listing buckets:", listError);
      return;
    }
    
    const avatarBucketExists = buckets?.some(bucket => bucket.name === "avatars");
    
    if (avatarBucketExists) {
      console.log("Avatars bucket already exists");
      return;
    }
    
    // Create the bucket if it doesn't exist
    const { error: createError } = await supabase.storage.createBucket("avatars", {
      public: true,
      fileSizeLimit: 1024 * 1024 * 2, // 2MB
    });
    
    if (createError) {
      console.error("Error creating avatar bucket:", createError);
      return;
    }
    
    console.log("Avatar bucket created successfully");
  } catch (error) {
    console.error("Error creating avatar bucket:", error);
  }
}
