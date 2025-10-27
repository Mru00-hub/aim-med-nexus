import React from 'react';
import { FullProfile } from '@/integrations/supabase/community.api';
import { GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type EducationCardProps = {
  profile: FullProfile['profile'];
};

export const EducationCard: React.FC<EducationCardProps> = ({ profile }) => {
  if (!profile.institution) {
    return <p className="text-sm text-muted-foreground">No education details provided.</p>;
  }

  return (
    <div className="flex items-start gap-3 sm:gap-4">
      <GraduationCap className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
      <div>
        <p className="font-semibold">{profile.course || 'Course'}</p>
        <p className="text-sm text-muted-foreground">{profile.institution}</p>
        {profile.year_of_study && (
          <Badge variant="outline" className="mt-2">{profile.year_of_study}</Badge>
        )}
      </div>
    </div>
  );
};
