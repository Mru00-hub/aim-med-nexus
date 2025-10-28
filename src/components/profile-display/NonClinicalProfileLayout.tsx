import React from 'react';
import { FullProfile } from '@/integrations/supabase/community.api';
import { ProfileHero } from './ProfileHero';
import { ProfileSection } from './ProfileSection';
import { TransitionBanner } from './TransitionBanner';
import { VentureCard } from './VentureCard';
import { ContentCard } from './ContentCard';
import { SkillBadge } from './SkillBadge';
import { CocurricularCard } from './CocurricularCard';
import { ActivitySection } from './ActivitySection';
import { ClinicalBackground } from './ClinicalBackground';
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, Megaphone, Star, Palette, ThumbsUp, HeartHandshake, Briefcase} from 'lucide-react';

type LayoutProps = {
  data: FullProfile;
  isOwnProfile: boolean;
  connectionStatus: 'connected' | 'pending_sent' | 'pending_received' | 'not_connected';
  isFollowLoading: boolean;
  isConnectionLoading: boolean;
  onFollow: () => void;
  onConnect: () => void;
  onMessage: () => void;
  onShare: () => void;
  onShowList: (title: 'Followers' | 'Following' | 'Connections') => void;
};

export const NonClinicalProfileLayout: React.FC<LayoutProps> = (props) => {
  const { data } = props;

  return (
    <Card className="card-medical max-w-4xl mx-auto rounded-none sm:rounded-lg shadow-none sm:shadow-md border-0 sm:border">
      {/* 1. Hero Section (Shared) */}
      <ProfileHero {...props} />

      {/* 2. Transition Banner (Non-Clinical Only) */}
      {data.career_transition && (
        <TransitionBanner transition={data.career_transition} />
      )}

      <CardContent className="p-4 sm:p-6">
        
        {/* 3. My Story Section */}
        <ProfileSection 
          title="My Transition Journey" 
          icon={HeartHandshake}
          hasData={!!data.career_transition?.transition_story}
        >
          <div className="prose prose-sm sm:prose-base max-w-none text-muted-foreground">
            {/* We can render markdown here in the future */}
            <p>{data.career_transition?.transition_story}</p>
          </div>
        </ProfileSection>

        {/* 4. Current Ventures Section */}
        <ProfileSection title="Current Ventures & Projects" icon={Lightbulb} items={data.ventures}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.ventures.map(item => <VentureCard key={item.id} venture={item} />)}
          </div>
        </ProfileSection>

        {/* 5. Content & Media Section */}
        <ProfileSection title="Content & Media Portfolio" icon={Megaphone} items={data.content_portfolio}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.content_portfolio.map(item => <ContentCard key={item.id} content={item} />)}
          </div>
        </ProfileSection>

        {/* 6. Skills & Expertise Section */}
        <ProfileSection title="Expertise & Skills" icon={Star} items={data.profile.skills}>
          <div className="flex flex-wrap gap-2">
            {data.profile.skills?.map(skill => <SkillBadge key={skill} skill={skill} />)}
          </div>
        </ProfileSection>
        
        {/* 7. Cocurriculars Section */}
        <ProfileSection title="Cocurriculars & Organizing" icon={Palette} items={data.cocurriculars}>
          <div className="space-y-4">
            {data.cocurriculars.map(item => <CocurricularCard key={item.id} item={item} />)}
          </div>
        </ProfileSection>

        {/* 8. Clinical Background (Collapsible) */}
        <ProfileSection
          title="Clinical Background"
          icon={Briefcase} // Changed from Briefcase
          items={[...data.academic_achievements, ...data.publications, ...data.certifications, ...data.awards]}
          isCollapsible={true}
          defaultOpen={false}
        >
          <ClinicalBackground data={data} />
        </ProfileSection>

        {/* 9. Activity Section */}
        <ProfileSection title="Activity & Engagement" icon={ThumbsUp} items={[...data.posts, ...data.spaces]}>
          <ActivitySection posts={data.posts} spaces={data.spaces} />
        </ProfileSection>

      </CardContent>
    </Card>
  );
};
