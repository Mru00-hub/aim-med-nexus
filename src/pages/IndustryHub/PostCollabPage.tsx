import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  createCollaboration,
  CreateCollaborationPayload,
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, Users, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Enums } from '@/types'; // Import your Enums type

// 1. Define the validation schema
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

export default function PostCollabPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 2. Fetch the Company ID of the current admin
  const {
    data: companyId,
    isLoading: isLoadingId,
    isError: isErrorId,
  } = useQuery<string | null, Error>({
    queryKey: ['myAdminCompanyId'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_admin_company_id');
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user,
  });

  // 3. Setup the form
  const form = useForm<CollabFormData>({
    resolver: zodResolver(collabFormSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      duration: '',
      required_specialty: '',
    },
  });

  // 4. Setup the mutation to create the collaboration
  const mutation = useMutation({
    mutationFn: (payload: CreateCollaborationPayload) => createCollaboration(payload),
    onSuccess: () => {
      toast({
        title: 'Collaboration Posted Successfully!',
        description: 'Your new post is now active on the opportunities board.',
      });
      // Invalidate company profile details to refetch the collabs list
      queryClient.invalidateQueries({ queryKey: ['companyProfile', companyId] });
      navigate('/industryhub/dashboard');
    },
    onError: (error) => {
      toast({
        title: 'Error Posting Collaboration',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // 5. Handle the form submission
  const onSubmit = (data: CollabFormData) => {
    if (!companyId) {
      toast({ title: 'Error', description: 'Could not find your company.', variant: 'destructive' });
      return;
    }

    const specialtiesArray = data.required_specialty
      ? data.required_specialty.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const payload: CreateCollaborationPayload = {
      p_company_id: companyId,
      p_title: data.title,
      p_description: data.description,
      p_collaboration_type: data.collaboration_type as Enums<'collab_type_enum'>,
      p_location: data.location || undefined,
      p_duration: data.duration || undefined,
      p_required_specialty: specialtiesArray,
    };
    
    mutation.mutate(payload);
  };

  // --- Render States ---
  if (isLoadingId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (isErrorId || !companyId) {
    if (!companyId && !isLoadingId) {
      toast({
        title: 'Access Denied',
        description: 'You must create a company profile to post.',
        variant: 'destructive',
      });
      navigate('/industryhub/create-company');
    }
    return null; // The redirect will handle this
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
              Post a New Collaboration
            </CardTitle>
            <CardDescription className="text-center text-lg">
              Fill out the details below to find partners and researchers.
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
                        <Input placeholder="e.g., Clinical Trial for New Cardiovascular Drug" {...field} />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          <Input placeholder="e.g., Delhi, IN or Remote" {...field} />
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
                          <Input placeholder="e.g., 6 Months" {...field} />
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
                        <Textarea
                          placeholder="e.g., Cardiology, Data Collection, Research"
                          {...field}
                        />
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
                        <Textarea
                          placeholder="Describe the project goals, responsibilities, and qualifications..."
                          rows={10}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit */}
                <div className="flex justify-end">
                  <Button type="submit" size="lg" disabled={mutation.isPending}>
                    {mutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Post Collaboration
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
