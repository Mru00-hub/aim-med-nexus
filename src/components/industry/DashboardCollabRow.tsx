import React from 'react';
import { Link } from 'react-router-dom';
import { Collaboration } from '@/integrations/supabase/industry.api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Users, Eye, FlaskConical } from 'lucide-react';

interface DashboardCollabRowProps {
  collab: Collaboration;
}

// Helper to format text
const toTitleCase = (str: string | null | undefined) => {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

export const DashboardCollabRow: React.FC<DashboardCollabRowProps> = ({ collab }) => {
  // We'll add this logic when we build the applicants tab
  const applicantCount = 0; // Placeholder

  return (
    <Card className="card-medical">
      <CardContent className="p-4">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{collab.title}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant={collab.is_active ? 'default' : 'outline'}>
                {collab.is_active ? 'Active' : 'Draft'}
              </Badge>
              <Badge variant="secondary" className="flex items-center">
                <FlaskConical className="mr-1.5 h-3 w-3" />
                {toTitleCase(collab.collaboration_type)}
              </Badge>
            </div>
          </div>
          <div className="flex w-full flex-shrink-0 gap-2 sm:w-auto">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/industryhub/dashboard/applicants/collab/${collab.id}`}>
                <Users className="mr-2 h-4 w-4" />
                Applicants ({applicantCount})
              </Link>
            </Button>
            <Button variant="outline" size="icon" asChild>
              <Link to={`/collabs/details/${collab.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="icon" asChild>
              <Link to={`/industryhub/dashboard/edit-collab/${collab.id}`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
