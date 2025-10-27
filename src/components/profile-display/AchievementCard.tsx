import React from 'react';
import { AcademicAchievement } from '@/integrations/supabase/community.api';
import { FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type AchievementCardProps = {
  achievement: AcademicAchievement;
};

export const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
  return (
    <div className="flex items-start gap-3 sm:gap-4 p-4 bg-muted/30 rounded-lg">
      <FileText className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
      <div>
        <h4 className="font-semibold">{achievement.exam_name}</h4>
        <div className="flex flex-wrap gap-2 mt-1">
          {achievement.rank && <Badge variant="outline">Rank/Score: {achievement.rank}</Badge>}
          {achievement.percentile && <Badge variant="outline">Percentile: {achievement.percentile}%</Badge>}
          {achievement.year && <Badge variant="secondary">{achievement.year}</Badge>}
        </div>
      </div>
    </div>
  );
};
