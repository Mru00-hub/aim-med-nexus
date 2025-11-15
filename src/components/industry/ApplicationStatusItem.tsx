import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building, ArrowRight } from 'lucide-react';
import { MyJobApplication, MyCollabApplication } from '@/integrations/supabase/industry.api';

// This component can accept either type
type ApplicationItemProps = {
  item: MyJobApplication | MyCollabApplication;
  type: 'job' | 'collaboration';
};

export const ApplicationStatusItem: React.FC<ApplicationItemProps> = ({ item, type }) => {
  // --- Type Guards to get the correct data ---
  const isJob = (item: any): item is MyJobApplication => type === 'job';
  
  const title = isJob(item) ? item.job_title : item.collab_title;
  const companyName = item.company_name;
  const logoUrl = item.company_logo_url;
  const status = item.status;
  const appliedAt = new Date(item.applied_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const detailUrl = isJob(item) 
    ? `/jobs/details/${item.job_id}` 
    : `/collabs/details/${item.collab_id}`;

  const getStatusBadgeVariant = (status: string | null) => {
    switch (status) {
      case 'viewed':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'hired':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="card-medical hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Avatar className="h-12 w-12 rounded-lg">
            <AvatarImage src={logoUrl || ''} alt={`${companyName} logo`} />
            <AvatarFallback className="rounded-lg">
              <Building className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">
              Applied to {companyName} on {appliedAt}
            </p>
          </div>

          <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:items-end">
            <Badge className={`font-medium ${getStatusBadgeVariant(status)}`}>
              {status ? status.replace('_', ' ').toUpperCase() : 'PENDING'}
            </Badge>
            <Button variant="ghost" size="sm" asChild>
              <Link to={detailUrl}>
                View Original Post
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
