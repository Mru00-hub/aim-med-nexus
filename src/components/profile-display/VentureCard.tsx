import React from 'react';
import { Venture } from '@/integrations/supabase/community.api';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LinkIcon } from 'lucide-react';

type VentureCardProps = {
  venture: Venture;
};

export const VentureCard: React.FC<VentureCardProps> = ({ venture }) => {
  return (
    <Card className="flex flex-col justify-between h-full bg-muted/30">
      {venture.featured_image_url && (
        <img
          src={venture.featured_image_url}
          alt={venture.name}
          className="w-full h-32 object-cover rounded-t-lg"
        />
      )}
      <CardHeader>
        <CardTitle className="text-lg">{venture.name}</CardTitle>
        <Badge variant="secondary" className="w-fit capitalize">{venture.role || venture.venture_type}</Badge>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {venture.description}
        </p>
      </CardContent>
      <CardFooter>
        {venture.website_url && (
          <a
            href={venture.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1 font-medium"
          >
            Visit Website <LinkIcon className="h-4 w-4" />
          </a>
        )}
      </CardFooter>
    </Card>
  );
};
