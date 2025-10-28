import React from 'react';
import { FullProfile } from '@/integrations/supabase/community.api';
import { ProfileSection } from './ProfileSection';
import { AchievementCard } from './AchievementCard';
import { AwardCard } from './AwardCard';
import { PublicationCard } from './PublicationCard';
import { ExperienceCard } from './ExperienceCard';
import { EducationCard } from './EducationCard';
import { CertificationCard } from './CertificationCard';
import { BookOpen, Briefcase, Award, GraduationCap } from 'lucide-react';

type ClinicalBackgroundProps = {
  data: FullProfile;
};

// 🚀 PLAN: This component groups all clinical sections for collapsibility
export const ClinicalBackground: React.FC<ClinicalBackgroundProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* 1. Professional Experience Section */}
      <ProfileSection
        title="Professional Experience"
        icon={Briefcase}
        // Update items check
        items={[
            (data.profile.current_position ? 1 : 0),
            ...data.work_experiences
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

      {/* 2. Education & Certifications Section */}
      <ProfileSection
        title="Education & Certifications"
        icon={GraduationCap}
        // Update items check
        items={[
            (data.profile.institution ? 1 : 0),
             ...data.education_history,
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
        
        {data.certifications.length > 0 && (
          <>
            <h3 className="text-lg font-semibold mb-3 mt-6">Certifications</h3>
            <div className="space-y-4">
              {data.certifications.map(item => <CertificationCard key={item.id} cert={item} />)}
            </div>
          </>
        )}
      </ProfileSection>

      {/* 3. Academic Excellence Section */}
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

      {/* 4. Research & Publications Section */}
      <ProfileSection title="Research & Publications" icon={BookOpen} items={data.publications}>
        <div className="space-y-4">
          {data.publications.map(item => <PublicationCard key={item.id} pub={item} />)}
        </div>
      </ProfileSection>
    </div>
  );
};
