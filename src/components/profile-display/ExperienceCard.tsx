import React from 'react';
import { FullProfile } from '@/integrations/supabase/community.api';
import { Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type WorkExperience = { title: string; company: string; years: string; };
type ExperienceCardProps = {
  profile?: FullProfile['profile'];
  experience?: WorkExperience;
  isCurrent: boolean;
};

export const ExperienceCard: React.FC<ExperienceCardProps> = ({ profile, experience, isCurrent }) => {
  const item = isCurrent ? {
    title: profile?.current_position,
    company: profile?.organization,
    years: profile?.years_experience
  } : experience;

  if (!item?.title) return null;

  return (
    <div className="flex items-start gap-3 sm:gap-4">
      <Briefcase className={`h-5 w-5 ${isCurrent ? 'text-primary' : 'text-muted-foreground'} mt-1 flex-shrink-0`} />
      <div>
        <h4 className="font-semibold">{item.title}</h4>
        <p className="text-sm text-muted-foreground">{item.company}</p>
        {item.years && (
          <Badge variant={isCurrent ? "outline" : "secondary"} className="mt-2">
            {item.years}
          </Badge>
        )}
      </div>
    </div>
  );
};
