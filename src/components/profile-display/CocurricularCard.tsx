import React from 'react';
import { Cocurricular } from '@/integrations/supabase/community.api';
import { Palette, LinkIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type CocurricularCardProps = {
  item: Cocurricular;
};

export const CocurricularCard: React.FC<CocurricularCardProps> = ({ item }) => {
  return (
    <div className="flex items-start gap-3 sm:gap-4 p-4 bg-muted/30 rounded-lg">
      <Palette className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
      <div>
        <h4 className="font-semibold">{item.title}</h4>
        <p className="text-sm text-muted-foreground">{item.description}</p>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge variant="secondary">{item.category}</Badge>
          {item.activity_date && <Badge variant="outline">{new Date(item.activity_date).getFullYear()}</Badge>}
          {item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
              View Link <LinkIcon className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
