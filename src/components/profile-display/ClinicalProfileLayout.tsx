import React from 'react';
import { FullProfile } from '@/integrations/supabase/community.api';
import { ProfileHero } from './ProfileHero';
import { ProfileSection } from './ProfileSection';
import { StatCard } from './StatCard';
import { AchievementCard } from './AchievementCard';
import { AwardCard } from './AwardCard';
import { PublicationCard } from './PublicationCard';
import { ExperienceCard } from './ExperienceCard';
import { EducationCard } from './EducationCard';
import { CertificationCard } from './CertificationCard';
import { SkillBadge } from './SkillBadge';
import { CocurricularCard } from './CocurricularCard';
import { ActivitySection } from './ActivitySection';
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { BookOpen, BarChart, Briefcase, ShieldCheck, Award, Star, GraduationCap, Palette, ThumbsUp } from 'lucide-react';

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

// 🚀 PLAN: Helper to calculate completeness
const calculateCompleteness = (data: FullProfile) => {
  let score = 0;
  if (data.profile.bio) score += 20;
  if (data.profile.current_position) score += 20;
  if (data.profile.skills && data.profile.skills.length > 0) score += 15;
  if (data.academic_achievements.length > 0) score += 15;
  if (data.publications.length > 0) score += 15;
  if (data.certifications.length > 0) score += 15;
  return Math.min(score, 100);
};

export const ClinicalProfileLayout: React.FC<LayoutProps> = (props) => {
  const { data } = props;
  const profileCompleteness = calculateCompleteness(data);
  const citationCount = data.publications.reduce((acc, p) => acc + (p.citation_count || 0), 0);
  const hasPublications = data.publications.length > 0;
  const hasCitations = citationCount > 0;
  const hasExperience = data.profile.years_experience && data.profile.years_experience !== '0';
  const hasCertifications = data.certifications.length > 0;
  const hasAnyHighlights = hasPublications || hasCitations || hasExperience || hasCertifications;

  return (
    <Card className="card-medical max-w-4xl mx-auto rounded-none sm:rounded-lg shadow-none sm:shadow-md border-0 sm:border">
      <ProfileHero {...props} />

      <CardContent className="p-4 sm:p-6">
        
        {/* Profile Completeness (for own profile) */}
        {props.isOwnProfile && profileCompleteness < 100 && (
          <Card className="mb-6 bg-accent/50">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium">Profile Completeness</p>
                <p className="text-sm font-bold text-primary">{profileCompleteness}%</p>
              </div>
              <Progress value={profileCompleteness} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                <Link to="/complete-profile" className="font-medium text-primary hover:underline">Add missing details</Link> to increase your visibility.
              </p>
            </CardContent>
          </Card>
        )}

        {/* 1. Highlights Section */}
        <ProfileSection 
          title="Professional Highlights" 
          icon={Star} 
          hasData={hasAnyHighlights} // Only render section if there's data
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {hasPublications && <StatCard icon={BookOpen} label="Publications" value={data.publications.length} />}
            {hasCitations && <StatCard icon={BarChart} label="Total Citations" value={citationCount} />}
            {hasExperience && <StatCard icon={Briefcase} label="Experience" value={data.profile.years_experience || 'N/A'} isString />}
            {hasCertifications && <StatCard icon={ShieldCheck} label="Certifications" value={data.certifications.length} />}
          </div>
        </ProfileSection>

        {/* 2. Academic Excellence Section */}
        <ProfileSection 
          title="Academic Excellence" 
          icon={Award}
          items={[...data.academic_achievements, ...data.awards.filter(a => a.type === 'academic')]}
        >
          <div className="space-y-4">
            {data.awards.filter(a => a.type === 'academic').map(item => <AwardCard key={item.id} award={item} />)}
            {data.academic_achievements.map(item => <AchievementCard key={item.id} achievement={item} />)}
          </div>
        </ProfileSection>

        {/* 3. Research & Publications Section */}
        <ProfileSection title="Research & Publications" icon={BookOpen} items={data.publications}>
          <div className="space-y-4">
            {data.publications.map(item => <PublicationCard key={item.id} pub={item} />)}
          </div>
        </ProfileSection>

        {/* 4. Professional Experience Section */}
        <ProfileSection
          title="Professional Experience"
          icon={Briefcase}
          // Update items check to include history
          items={[
            (data.profile.current_position ? 1 : 0),
            ...data.work_experiences // Use new history array
          ]}
        >
          <div className="space-y-5">
            {/* Show Current Experience First */}
            <ExperienceCard profile={data.profile} isCurrent={true} />
            {/* Map over History */}
            {data.work_experiences.map((exp) => (
              <ExperienceCard key={exp.id} experience={exp} isCurrent={false} />
            ))}
          </div>
        </ProfileSection>

        {/* 5. Education & Certifications Section */}
        <ProfileSection
          title="Education & Certifications"
          icon={GraduationCap}
          // Update items check to include history
          items={[
              (data.profile.institution ? 1 : 0),
              ...data.education_history, // Use new history array
              ...data.certifications
          ]}
        >
          <h3 className="text-lg font-semibold mb-3">Education</h3>
          <div className="space-y-4 mb-6">
             {/* Show Current Education First */}
            <EducationCard profile={data.profile} isCurrent={true} />
             {/* Map over History */}
            {data.education_history.map((edu) => (
                <EducationCard key={edu.id} education={edu} isCurrent={false} />
            ))}
          </div>

          {/* Certifications part remains the same */}
          {data.certifications.length > 0 && (
            <>
              <h3 className="text-lg font-semibold mb-3 mt-6">Certifications</h3>
              <div className="space-y-4">
                {data.certifications.map(item => <CertificationCard key={item.id} cert={item} />)}
              </div>
            </>
          )}
        </ProfileSection>

        {/* 6. Professional Awards Section */}
        <ProfileSection title="Professional Awards & Honors" icon={Award} items={data.awards.filter(a => a.type === 'professional')}>
          <div className="space-y-4">
            {data.awards.filter(a => a.type === 'professional').map(item => <AwardCard key={item.id} award={item} />)}
          </div>
        </ProfileSection>

        {/* 7. Skills & Expertise Section */}
        <ProfileSection title="Skills & Expertise" icon={Star} items={data.profile.skills}>
          <div className="flex flex-wrap gap-2">
            {data.profile.skills?.map(skill => <SkillBadge key={skill} skill={skill} />)}
          </div>
        </ProfileSection>
        
        {/* 8. Cocurriculars Section */}
        <ProfileSection title="Cocurriculars & Organizing" icon={Palette} items={data.cocurriculars}>
          <div className="space-y-4">
            {data.cocurriculars.map(item => <CocurricularCard key={item.id} item={item} />)}
          </div>
        </ProfileSection>

        {/* 9. Activity Section */}
        <ProfileSection title="Activity & Engagement" icon={ThumbsUp} items={[...data.posts, ...data.spaces]}>
          <ActivitySection posts={data.posts} spaces={data.spaces} />
        </ProfileSection>

      </CardContent>
    </Card>
  );
};
