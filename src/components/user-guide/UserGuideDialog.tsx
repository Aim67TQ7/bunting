import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check } from 'lucide-react';
import { useUserGuide } from './UserGuideProvider';

// Import guide sections
import { GuideOverview } from './sections/GuideOverview';
import { GuideChatSection } from './sections/GuideChatSection';
import { GuideCalculatorsSection } from './sections/GuideCalculatorsSection';
import { GuideSalesSection } from './sections/GuideSalesSection';
import { GuideAppsSection } from './sections/GuideAppsSection';
import { GuideDashboardSection } from './sections/GuideDashboardSection';
import { GuideQuickReference } from './sections/GuideQuickReference';

const guideSections = [
  { id: 'overview', label: 'Overview', component: GuideOverview },
  { id: 'chat', label: 'Chat Hub', component: GuideChatSection },
  { id: 'calculators', label: 'Calculators', component: GuideCalculatorsSection },
  { id: 'sales', label: 'Sales Tools', component: GuideSalesSection },
  { id: 'apps', label: 'Apps', component: GuideAppsSection },
  { id: 'dashboard', label: 'Dashboard', component: GuideDashboardSection },
  { id: 'reference', label: 'Quick Reference', component: GuideQuickReference },
];

export function UserGuideDialog() {
  const { isGuideOpen, closeGuide, progress, updateProgress } = useUserGuide();
  const [activeTab, setActiveTab] = useState('overview');

  const completedSections = progress.completed_sections.length;
  const totalSections = guideSections.length;
  const progressPercentage = (completedSections / totalSections) * 100;

  const handleSectionComplete = (sectionId: string) => {
    updateProgress(sectionId);
  };

  const isSectionCompleted = (sectionId: string) => {
    return progress.completed_sections.includes(sectionId);
  };

  return (
    <Dialog open={isGuideOpen} onOpenChange={closeGuide}>
      <DialogContent className="w-[92vw] max-w-6xl max-h-[90vh] resize overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div className="flex-1">
            <DialogTitle className="text-2xl font-bold">BuntingGPT User Guide</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Your complete guide to navigating and maximizing the platform
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Progress: {completedSections}/{totalSections} sections
            </div>
            <Progress value={progressPercentage} className="w-24" />
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full min-h-0 flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-7 mb-4">
            {guideSections.map((section) => (
              <TabsTrigger
                key={section.id}
                value={section.id}
                className="flex items-center gap-1 text-xs"
              >
                {section.label}
                {isSectionCompleted(section.id) && (
                  <Badge variant="secondary" className="ml-1 h-4 w-4 p-0">
                    <Check className="h-3 w-3" />
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <ScrollArea type="always" className="flex-1 min-h-0 pr-0">
            {guideSections.map((section) => {
              const SectionComponent = section.component;
              return (
                <TabsContent key={section.id} value={section.id} className="mt-0">
                  <SectionComponent
                    onComplete={() => handleSectionComplete(section.id)}
                    isCompleted={isSectionCompleted(section.id)}
                  />
                </TabsContent>
              );
            })}
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}