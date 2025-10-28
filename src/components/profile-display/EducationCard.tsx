import React from 'react';
// Import the necessary types
import { FullProfile, EducationHistory } from '@/integrations/supabase/community.api';
import { GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Modify props to accept either profile (for current) or education (for history)
type EducationCardProps = {
  profile?: FullProfile['profile']; // Optional: For current education
  education?: EducationHistory;     // Optional: For history items
  isCurrent: boolean;               // Required: To differentiate
};

// Helper function to format the year range from history items
const formatYearRange = (start?: number | null, end?: number | null): string => {
    if (!start) return '';
    return `${start} - ${end || 'Present'}`; // Show 'Present' if end_year is null
}

export const EducationCard: React.FC<EducationCardProps> = ({ profile, education, isCurrent }) => {
  // Determine the data source based on isCurrent
  const institution = isCurrent ? profile?.institution : education?.institution_name;
  // Adjust field mapping based on your data structure (e.g., course vs. degree)
  const degree = isCurrent ? profile?.course : education?.degree;
  const fieldOfStudy = isCurrent ? profile?.specialization : education?.field_of_study; // Map specialization or field_of_study
  // Get year range differently for current vs. history
  const yearRange = isCurrent ? profile?.year_of_study : formatYearRange(education?.start_year, education?.end_year);
  // Get description only for history items
  const description = isCurrent ? null : education?.description;

  // Conditional rendering if no institution data exists
  if (!institution) {
    // For the current education section, show a placeholder if the section is meant to be displayed
    // For history items, simply render nothing if there's no institution
    return isCurrent ? <p className="text-sm text-muted-foreground">No current education details provided.</p> : null;
  }

  return (
    <div className="flex items-start gap-3 sm:gap-4">
      {/* Conditionally style the icon based on whether it's current */}
      <GraduationCap className={`h-5 w-5 ${isCurrent ? 'text-primary' : 'text-muted-foreground'} mt-1 flex-shrink-0`} />
      <div>
        {/* Display Institution Name */}
        <p className="font-semibold">{institution}</p>
        {/* Combine Degree and Field of Study if they exist */}
        {(degree || fieldOfStudy) && (
            <p className="text-sm text-muted-foreground">{[degree, fieldOfStudy].filter(Boolean).join(', ')}</p>
        )}
        {/* Display Year Range or Current Status Badge */}
        {yearRange && (
            <p className="text-xs text-muted-foreground mt-1">{yearRange}</p>
            // Alternative: Use a badge for current status if preferred
            {isCurrent && profile?.year_of_study && <Badge variant="outline" className="mt-2">{profile.year_of_study}</Badge>}
        )}
         {/* Display description for history items */}
         {description && (
           <p className="text-sm text-muted-foreground mt-2">{description}</p>
        )}
      </div>
    </div>
  );
};

