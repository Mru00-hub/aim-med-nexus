import React, { useState } from 'react'; // [!code ++]
import { Link } from 'react-router-dom';
// [!code ++] (Import mutation hooks and API functions)
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setCollabActiveStatus, Collaboration } from '@/integrations/supabase/industry.api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// [!code ++] (Import new icons and components)
import { Edit, Users, Eye, FlaskConical, Trash2, Loader2, AlertCircle } from 'lucide-react';
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
  const applicantCount = 0; // Placeholder
  // [!code ++] (Add state for dialog)
  const [isDeactivateAlertOpen, setIsDeactivateAlertOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // [!code ++] (Add mutation for deactivating)
  const deactivateMutation = useMutation({
    mutationFn: () => setCollabActiveStatus(collab.id, false),
    onSuccess: () => {
      toast({ title: 'Collaboration Deactivated' });
      // Refresh collab list and company profile (for collab_count)
      queryClient.invalidateQueries({ queryKey: ['companyCollabs', collab.company_id] });
      queryClient.invalidateQueries({ queryKey: ['companyProfile', collab.company_id] });
      setIsDeactivateAlertOpen(false);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <Card className="card-medical">
      <CardContent className="p-4">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{collab.title}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant={collab.is_active ? 'default' : 'outline'}>
                {collab.is_active ? 'Active' : 'Deactivated'}
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
            {/* [!code ++] (Add Deactivate Button and Dialog) */}
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
                    This action will update your company's total collaboration count.
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
