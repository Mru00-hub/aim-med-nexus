import React from 'react';
import { Button } from '@/components/ui/button';

type SkillBadgeProps = {
  skill: string;
};

export const SkillBadge: React.FC<SkillBadgeProps> = ({ skill }) => {
  // 🚀 PLAN: In the future, this button can be clicked to endorse the skill
  return (
    <Button variant="secondary" className="px-3 py-1 h-auto text-sm capitalize" asChild>
      <div>
        {skill}
        {/* TODO: Add endorsement count when data model supports it */}
        {/* <span className="ml-1.5 font-bold text-primary">{endorsementCount}</span> */}
      </div>
    </Button>
  );
};
