import React from 'react';
import { Publication } from '@/integrations/supabase/community.api';
import { Badge } from '@/components/ui/badge';
import { LinkIcon } from 'lucide-react';

type PublicationCardProps = {
  pub: Publication;
};

export const PublicationCard: React.FC<PublicationCardProps> = ({ pub }) => {
  return (
    <div className="p-4 border rounded-lg bg-muted/30">
      <a 
        href={
          pub.url 
            ? pub.url 
            : pub.doi 
              ? `https://doi.org/${pub.doi}` 
              : undefined
        } 
        target="_blank" 
        rel="noopener noreferrer" 
        className="font-semibold hover:underline data-[disabled=true]:no-underline data-[disabled=true]:cursor-default" 
        data-disabled={!pub.url && !pub.doi}
      >
        {pub.title}
        {(pub.url || pub.doi) && <LinkIcon className="h-3 w-3 inline-block ml-1" />}
      </a>
      <p className="text-sm text-muted-foreground mt-1 italic">
        {pub.authors && pub.authors.length > 0 && `${pub.authors.join(', ')} `}
        {pub.publication_date && `(${new Date(pub.publication_date).getFullYear()})`}
      </p>
      <p className="text-sm text-muted-foreground">{pub.journal_name}</p>
      <div className="flex items-center gap-2 text-xs mt-2">
        {pub.citation_count != null && <Badge variant="outline">Citations: {pub.citation_count}</Badge>}
        <Badge variant="secondary" className="capitalize">{pub.type}</Badge>
      </div>
    </div>
  );
};
