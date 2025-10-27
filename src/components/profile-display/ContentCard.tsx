import React from 'react';
import { ContentPortfolio } from '@/integrations/supabase/community.api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LinkIcon, Book, Mic, Youtube, Newspaper, GraduationCap, Megaphone } from 'lucide-react';

type ContentCardProps = {
  content: ContentPortfolio;
};

const getIcon = (type: string) => {
  switch (type) {
    case 'book': return Book;
    case 'podcast': return Mic;
    case 'youtube': return Youtube;
    case 'blog': return Newspaper;
    case 'newsletter': return Newspaper;
    case 'course': return GraduationCap;
    case 'speaking': return Megaphone;
    default: return LinkIcon;
  }
};

export const ContentCard: React.FC<ContentCardProps> = ({ content }) => {
  const Icon = getIcon(content.content_type);
  
  return (
    <a href={content.url} target="_blank" rel="noopener noreferrer" className="group">
      <Card className="h-full transition-all group-hover:shadow-md bg-muted/30">
        <CardContent className="p-4 flex gap-4">
          {content.thumbnail_url ? (
            <img
              src={content.thumbnail_url}
              alt={content.title}
              className="w-20 h-20 object-cover rounded-md flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-md flex-shrink-0 bg-muted flex items-center justify-center">
              <Icon className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          <div className="flex flex-col justify-center min-w-0">
            <Badge variant="secondary" className="w-fit capitalize mb-1">{content.content_type}</Badge>
            <h4 className="font-semibold truncate group-hover:text-primary">{content.title}</h4>
            <p className="text-xs text-muted-foreground truncate">
              {content.platform_name || content.url}
            </p>
          </div>
        </CardContent>
      </Card>
    </a>
  );
};
