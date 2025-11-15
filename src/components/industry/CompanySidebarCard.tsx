import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getCompanyHeaderData } from '@/integrations/supabase/industry.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface CompanySidebarCardProps {
  companyId: string;
  companyName: string; // We get this from the job/collab data
}

export const CompanySidebarCard: React.FC<CompanySidebarCardProps> = ({ 
  companyId, 
  companyName 
}) => {
  const { data: company, isLoading } = useQuery({
    queryKey: ['companyHeader', companyId],
    queryFn: () => getCompanyHeaderData(companyId),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-12 w-12 rounded-lg">
          {isLoading ? (
            <Skeleton className="h-12 w-12 rounded-lg" />
          ) : (
            <>
              <AvatarImage 
                src={company?.company_logo_url || ''} 
                alt={`${companyName} logo`}
              />
              <AvatarFallback className="rounded-lg">
                <Building className="h-6 w-6" />
              </AvatarFallback>
            </>
          )}
        </Avatar>
        <div>
          <CardTitle className="text-lg">
            {companyName}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" className="w-full">
          <Link to={`/industryhub/company/${companyId}`}>
            View Company Profile
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};
