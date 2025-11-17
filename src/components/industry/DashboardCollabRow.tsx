import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setCollabActiveStatus } from '@/integrations/supabase/industry.api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Users, Eye, FlaskConical, Trash2, Loader2, MapPin, Share2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

// This type should match the 'collaborations' object from the get_company_profile_details RPC
type CollabFromRPC = {
  id: string;
  title: string;
  is_active: boolean;
  collaboration_type: string;
  location_name: string | null;
  specializations: { id: string; label: string }[];
  company_id: string;
  applicants_count: number;
};

interface DashboardCollabRowProps {
  collab: CollabFromRPC;
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
  const applicantCount = collab.applicants_count;
  const [isDeactivateAlertOpen, setIsDeactivateAlertOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deactivateMutation = useMutation({
    mutationFn: () => setCollabActiveStatus(collab.id, false),
    onSuccess: () => {
      toast({ title: 'Collaboration Deactivated' });
      // Refresh collab list and company profile (for collab_count)
      queryClient.invalidateQueries({ queryKey: ['companyProfile', collab.company_id] });
      setIsDeactivateAlertOpen(false);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleShare = () => {
    const url = `${window.location.origin}/collabs/details/${collab.id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: "Public collaboration link copied to clipboard",
    });
  };

  return (
    <Card className="card-medical">
      <CardContent className="p-4">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{collab.title}</h3>
            {/* Badges for Status, Type, and Location */}
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant={collab.is_active ? 'default' : 'outline'}>
                {collab.is_active ? 'Active' : 'Deactivated'}
              </Badge>
              <Badge variant="secondary" className="flex items-center">
                <FlaskConical className="mr-1.5 h-3 w-3" />
                {toTitleCase(collab.collaboration_type)}
              </Badge>
              {collab.location_name && (
                <Badge variant="secondary" className="flex items-center">
                  <MapPin className="mr-1.5 h-3 w-3" />
                  {collab.location_name}
                </Badge>
              )}
            </div>
            {/* Badges for Specializations */}
            {collab.specializations.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {collab.specializations.map((spec) => (
                  <Badge key={spec.id} variant="secondary" className="font-normal">
                    {spec.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex w-full flex-shrink-0 gap-2 sm:w-auto">
            <Button variant="outline" size="icon" onClick={handleShare} title="Share Public Link">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/industryhub/dashboard/${collab.company_id}?tab=applicants`}>
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
              <Link to={`/industryhub/dashboard/${collab.company_id}/edit-collab/${collab.id}`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
            
            <AlertDialog open={isDeactivateAlertOpen} onOpenChange={setIsDeactivateAlertOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive_outline"
                  size="icon"
                  disabled={!collab.is_active}
                  title="Deactivate Collaboration"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will deactivate the collaboration post and hide it from the public.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => deactivateMutation.mutate()}
                    disabled={deactivateMutation.isPending}
                  >
                    {deactivateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Deactivate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
