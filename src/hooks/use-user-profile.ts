import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { UserProfileData } from '@/types/profile';

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (!user?.id) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      try {
        // First try to get from profiles table
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setProfile({
            email: user.email,
            first_name: profileData.first_name,
            call_name: profileData.first_name, // Use first_name as call_name for now
            avatar_url: profileData.avatar_url,
            department: undefined,
            jobTitle: undefined,
            officeLocation: undefined,
            city: undefined,
            state: undefined,
            country: undefined,
          });
        } else {
          // Fallback to auth user data
          setProfile({
            email: user.email,
            first_name: user.user_metadata?.first_name,
            call_name: user.user_metadata?.call_name || user.user_metadata?.first_name,
            avatar_url: user.user_metadata?.avatar_url,
            department: undefined,
            jobTitle: undefined,
            officeLocation: undefined,
            city: undefined,
            state: undefined,
            country: undefined,
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Fallback to auth user data
        setProfile({
          email: user.email,
          first_name: user.user_metadata?.first_name,
          call_name: user.user_metadata?.call_name || user.user_metadata?.first_name,
          avatar_url: user.user_metadata?.avatar_url,
          department: undefined,
          jobTitle: undefined,
          officeLocation: undefined,
          city: undefined,
          state: undefined,
          country: undefined,
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [user]);

  return { profile, isLoading };
}