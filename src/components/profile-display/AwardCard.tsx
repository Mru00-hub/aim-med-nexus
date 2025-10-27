import React from 'react';
import { Award } from '@/integrations/supabase/community.api';
import { Award as AwardIcon } from 'lucide-react';

type AwardCardProps = {
  award: Award;
};

export const AwardCard: React.FC<AwardCardProps> = ({ award }) => {
  return (
    <div className="flex items-start gap-3 sm:gap-4 p-4 bg-muted/30 rounded-lg">
      <AwardIcon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
      <div>
        <h4 className="font-semibold">{award.award_name}</h4>
        <p className="text-sm text-muted-foreground">{award.issuing_org}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {award.date ? new Date(award.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : ''}
        </p>
      </div>
    </div>
  );
};
