import React from 'react';
import { FullProfile, WorkExperience } from '@/integrations/supabase/community.api'; // Import WorkExperience type
import { Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns'; // For formatting dates

type ExperienceCardProps = {
  profile?: FullProfile['profile']; // For current experience
  experience?: WorkExperience;      // For history items
  isCurrent: boolean;
};

// Helper to format date ranges
const formatDateRange = (start?: string | null, end?: string | null): string => {
  if (!start) return '';
  const startDate = format(parseISO(start), 'MMM yyyy');
  const endDate = end ? format(parseISO(end), 'MMM yyyy') : 'Present';
  // You might want to calculate duration here too if needed
  return `${startDate} - ${endDate}`;
};

export const ExperienceCard: React.FC<ExperienceCardProps> = ({ profile, experience, isCurrent }) => {
  // Determine which data source to use
  const position = isCurrent ? profile?.current_position : experience?.position;
  const organization = isCurrent ? profile?.organization : experience?.organization;
  const description = isCurrent ? profile?.bio : experience?.description; // Or keep bio separate?
  const dateRange = isCurrent ? profile?.years_experience : formatDateRange(experience?.start_date, experience?.end_date); // Use years_experience for current

  if (!position) return null;

  return (
    <div className="flex items-start gap-3 sm:gap-4">
      <Briefcase className={`h-5 w-5 ${isCurrent ? 'text-primary' : 'text-muted-foreground'} mt-1 flex-shrink-0`} />
      <div>
        <h4 className="font-semibold">{position}</h4>
        <p className="text-sm text-muted-foreground">{organization}</p>
        {dateRange && (
          <p className="text-xs text-muted-foreground mt-1">
            {dateRange}
          </p>
        )}
        {description && !isCurrent && ( // Only show description for history items maybe?
           <p className="text-sm text-muted-foreground mt-2">{description}</p>
        )}
      </div>
    </div>
  );
};

