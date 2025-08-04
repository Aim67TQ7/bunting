import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserGuideProgress {
  has_seen_guide: boolean;
  completed_sections: string[];
  guide_version: string;
  last_guide_interaction: string | null;
}

interface UserGuideContextType {
  isGuideOpen: boolean;
  openGuide: () => void;
  closeGuide: () => void;
  progress: UserGuideProgress;
  updateProgress: (section: string) => void;
  markGuideAsSeen: () => void;
}

const UserGuideContext = createContext<UserGuideContextType | undefined>(undefined);

export function UserGuideProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [progress, setProgress] = useState<UserGuideProgress>({
    has_seen_guide: false,
    completed_sections: [],
    guide_version: '1.0',
    last_guide_interaction: null,
  });

  useEffect(() => {
    if (user) {
      loadUserGuideProgress();
    }
  }, [user]);

  const loadUserGuideProgress = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('user_guide_progress')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data?.user_guide_progress && typeof data.user_guide_progress === 'object') {
        const guideProgress = data.user_guide_progress as unknown as UserGuideProgress;
        setProgress(guideProgress);
        
        // Auto-open guide for first-time users
        if (!guideProgress.has_seen_guide) {
          setIsGuideOpen(true);
        }
      }
    } catch (error) {
      console.error('Error loading user guide progress:', error);
    }
  };

  const saveProgress = async (newProgress: UserGuideProgress) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({
          user_guide_progress: {
            ...newProgress,
            last_guide_interaction: new Date().toISOString(),
          }
        })
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving user guide progress:', error);
    }
  };

  const openGuide = () => setIsGuideOpen(true);

  const closeGuide = () => {
    setIsGuideOpen(false);
    if (!progress.has_seen_guide) {
      markGuideAsSeen();
    }
  };

  const updateProgress = (section: string) => {
    const newProgress = {
      ...progress,
      completed_sections: [...new Set([...progress.completed_sections, section])],
    };
    setProgress(newProgress);
    saveProgress(newProgress);
  };

  const markGuideAsSeen = () => {
    const newProgress = {
      ...progress,
      has_seen_guide: true,
    };
    setProgress(newProgress);
    saveProgress(newProgress);
  };

  return (
    <UserGuideContext.Provider
      value={{
        isGuideOpen,
        openGuide,
        closeGuide,
        progress,
        updateProgress,
        markGuideAsSeen,
      }}
    >
      {children}
    </UserGuideContext.Provider>
  );
}

export function useUserGuide() {
  const context = useContext(UserGuideContext);
  if (context === undefined) {
    throw new Error('useUserGuide must be used within a UserGuideProvider');
  }
  return context;
}