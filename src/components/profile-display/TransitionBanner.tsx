import React from 'react';
import { CareerTransition } from '@/integrations/supabase/community.api';
import { Badge } from '@/components/ui/badge';
import { Target, MessageSquare, Handshake } from 'lucide-react';

type TransitionBannerProps = {
  transition: CareerTransition;
};

export const TransitionBanner: React.FC<TransitionBannerProps> = ({ transition }) => {
  return (
    <div className="p-4 sm:p-6 border-b border-t bg-gradient-to-r from-primary/5 to-accent/5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <span className="font-semibold capitalize">
            {transition.transition_status}
            {transition.target_industries && transition.target_industries.length > 0 &&
              ` to ${transition.target_industries[0]}`
            }
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {transition.open_to_opportunities && <Badge variant="default">Open to Opportunities</Badge>}
          {transition.seeking_mentorship && <Badge variant="outline"><MessageSquare className="h-3 w-3 mr-1.5"/>Seeking Mentorship</Badge>}
          {transition.offering_mentorship && <Badge variant="outline"><Handshake className="h-3 w-3 mr-1.5"/>Offering Mentorship</Badge>}
        </div>
      </div>
    </div>
  );
};
