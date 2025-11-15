import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  getCollabById,
  updateCollaboration,
  // [!code --] (softDeleteCollaboration does not exist in our API file)
  setCollabActiveStatus, // [!code ++] (This is the correct function)
  UpdateCollabPayload,
  Collaboration,
} from '@/integrations/supabase/industry.api';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
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
import { Loader2, Users, ArrowLeft, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Skeleton } from '@/components/ui/skeleton';
import { Enums } from '@/types';

const collabFormSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters.' }),
  description: z.string().min(20, { message: 'Description must be at least 20 characters.' }),
  collaboration_type: z.enum(['clinical_trial', 'research', 'advisory', 'other'], {
    required_error: 'Please select a collaboration type.',
  }),
  location: z.string().optional(),
  duration: z.string().optional(),
  required_specialty: z.string().optional(), // Comma-separated string
});

type CollabFormData = z.infer<typeof collabFormSchema>;

export default function EditCollabPage() {
  const { collabId } = useParams<{ collabId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CollabFormData>({
    resolver: zodResolver(collabFormSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      duration: '',
      required_specialty: '',
      collaboration_type: 'other',
    },
  });

  const { data: collabData, isLoading: isLoadingCollab } = useQuery<Collaboration, Error>({
    queryKey: ['collabDetails', collabId],
    queryFn: () => getCollabById(collabId!),
    enabled: !!collabId,
    onSuccess: (data) => {
      if (data) {
        form.reset({
          title: data.title,
          description: data.description,
          collaboration_type: data.collaboration_type as Enums<'collab_type_enum'>,
          location: data.location || '',
          duration: data.duration || '',
          required_specialty: (data.required_specialty || []).join(', '),
        });
      }
    },
  });

  // [!code --] (This was incorrect, the API fn takes one object)
  // const updateMutation = useMutation({
  //   mutationFn: (payload: UpdateCollabPayload) => updateCollaboration(collabId!, payload),
  // [!code ++] (FIX: The API function 'updateCollaboration' expects a single payload object)
  const updateMutation = useMutation({
    mutationFn: (payload: UpdateCollabPayload) => updateCollaboration(payload),
    onSuccess: () => {
      toast({ title: 'Collaboration Updated Successfully!' });
      queryClient.invalidateQueries({ queryKey: ['collabDetails', collabId] });
      // [!code ++] (Invalidate the company profile query, since collab_count may change)
      queryClient.invalidateQueries({ queryKey: ['companyProfile', collabData?.company_id] });
      navigate('/industryhub/dashboard');
    },
    onError: (error) => {
      toast({ title: 'Error Updating Collaboration', description: error.message, variant: 'destructive' });
    },
  });

  // [!code --] (This was incorrect, 'softDeleteCollaboration' does not exist in our API)
  // const deleteMutation = useMutation({
  //   mutationFn: () => softDeleteCollaboration(collabId!),
  // [!code ++] (FIX: Use the correct RPC 'setCollabActiveStatus' which also updates company counters)
  const deleteMutation = useMutation({
    mutationFn: () => setCollabActiveStatus(collabId!, false),
    onSuccess: () => {
      toast({ title: 'Collaboration Deactivated', description: 'The collaboration post has been archived.' });
      queryClient.invalidateQueries({ queryKey: ['collabDetails', collabId] });
      queryClient.invalidateQueries({ queryKey: ['companyProfile', collabData?.company_id] });
      navigate('/industryhub/dashboard');
    },
    onError: (error) => {
      toast({ title: 'Error Deleting Collaboration', description: error.message, variant: 'destructive' });
    },
  });

  const onSubmit = (data: CollabFormData) => {
    const specialtiesArray = data.required_specialty
      ? data.required_specialty.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    
    // [!code --] (This payload was missing the ID)
    // const payload: UpdateCollabPayload = {
    // [!code ++] (FIX: The payload must match our 'UpdateCollabPayload' type, including the ID)
    const payload: UpdateCollabPayload = {
      p_collab_id: collabId!,
      p_title: data.title,
      p_description: data.description,
      p_collaboration_type: data.collaboration_type,
      p_location: data.location || null,
      p_duration: data.duration || null,
      p_required_specialty: specialtiesArray,
    };
    updateMutation.mutate(payload);
  };

  if (isLoadingCollab) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container-medical flex-1 py-12">
          {/* Skeleton Loader */}
          <div className="mx-auto max-w-3xl space-y-6">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-16 w-1/2" />
            <div className="space-y-4 rounded-lg border p-6">
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-10 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-24 w-full" />
              <div className="flex justify-end">
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50/50">
      <Header />
      <main className="container-medical flex-1 py-12">
        <Button
          variant="ghost"
          onClick={() => navigate('/industryhub/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card className="mx-auto max-w-3xl shadow-lg">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-center text-3xl">
              Edit Collaboration Post
            </CardTitle>
            <CardDescription className="text-center text-lg">
              Update the details for your collaboration opportunity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Title *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Collaboration Type */}
                <FormField
                  control={form.control}
                  name="collaboration_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Collaboration Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="clinical_trial">Clinical Trial</SelectItem>
                          <SelectItem value="research">Research</SelectItem>
                          <SelectItem value="advisory">Advisory</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Location & Duration */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Specialties / Skills */}
                <FormField
                  control={form.control}
                  name="required_specialty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialties / Skills (Optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter a comma-separated list of required skills or specialties.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Description *</FormLabel>
                      <FormControl>
                        <Textarea rows={10} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit & Delete Buttons */}
                <div className="flex justify-between">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="destructive_outline">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Deactivate Post
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will deactivate the collaboration post and hide it from the public.
                          It will not permanently delete it.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => deleteMutation.mutate()}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Deactivate
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  <Button type="submit" size="lg" disabled={updateMutation.isPending}>
                    {updateMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
