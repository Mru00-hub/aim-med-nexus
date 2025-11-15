import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  getJobById,
  // [!code --] (This function name was incorrect)
  // updateCompanyJob,
  // softDeleteCompanyJob,
  // [!code ++] (These are the correct function names from our API file)
  updateCompanyJob as updateCompanyJobRpc,
  setJobActiveStatus,
  UpdateJobPayload,
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
import { Loader2, Briefcase, ArrowLeft, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Skeleton } from '@/components/ui/skeleton';

const jobFormSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters.' }),
  description: z.string().min(20, { message: 'Description must be at least 20 characters.' }),
  job_type: z.string({ required_error: 'Please select a job type.' }),
  experience_level: z.string({ required_error: 'Please select an experience level.' }),
  location_type: z.string({ required_error: 'Please select a location type.' }),
  location_text: z.string().min(2, { message: 'Location is required.' }),
  specialties_required: z.string().optional(),
  external_apply_url: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
});

type JobFormData = z.infer<typeof jobFormSchema>;

export default function EditJobPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: experienceLevels } = useQuery({
    queryKey: ['experienceLevels'],
    queryFn: async () => {
      const { data, error } = await supabase.from('experience_levels').select('*');
      if (error) throw error;
      return data;
    }
  });

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: '',
      description: '',
      location_text: '',
      specialties_required: '',
      external_apply_url: '',
    },
  });

  const { data: jobData, isLoading: isLoadingJob } = useQuery({
    queryKey: ['jobDetails', jobId],
    queryFn: () => getJobById(jobId!),
    enabled: !!jobId,
    onSuccess: (data) => {
      if (data) {
        form.reset({
          title: data.title,
          description: data.description,
          job_type: data.job_type || undefined,
          experience_level: data.experience_level || undefined,
          location_type: data.location_type || undefined,
          location_text: data.location_text || '',
          specialties_required: (data.specialties_required || []).join(', '),
          external_apply_url: data.external_apply_url || '',
        });
      }
    },
  });

  // [!code --] (This was incorrect, the API fn takes one object)
  // const updateMutation = useMutation({
  //   mutationFn: (payload: UpdateJobPayload) => updateCompanyJob(jobId!, payload),
  // [!code ++] (FIX: The API function 'updateCompanyJobRpc' expects a single payload object)
  const updateMutation = useMutation({
    mutationFn: (payload: UpdateJobPayload) => updateCompanyJobRpc(payload),
    onSuccess: () => {
      toast({ title: 'Job Updated Successfully!' });
      queryClient.invalidateQueries({ queryKey: ['jobDetails', jobId] });
      queryClient.invalidateQueries({ queryKey: ['companyProfile', jobData?.company_id] });
      navigate('/industryhub/dashboard');
    },
    onError: (error) => {
      toast({ title: 'Error Updating Job', description: error.message, variant: 'destructive' });
    },
  });

  // [!code --] (This was incorrect, 'softDeleteCompanyJob' does not exist in our API)
  // const deleteMutation = useMutation({
  //   mutationFn: () => softDeleteCompanyJob(jobId!),
  // [!code ++] (FIX: Use the correct RPC 'setJobActiveStatus' which also updates company counters)
  const deleteMutation = useMutation({
    mutationFn: () => setJobActiveStatus(jobId!, false),
    onSuccess: () => {
      toast({ title: 'Job Deactivated', description: 'The job posting has been archived.' });
      queryClient.invalidateQueries({ queryKey: ['jobDetails', jobId] });
      queryClient.invalidateQueries({ queryKey: ['companyProfile', jobData?.company_id] });
      navigate('/industryhub/dashboard');
    },
    onError: (error) => {
      toast({ title: 'Error Deleting Job', description: error.message, variant: 'destructive' });
    },
  });

  const onSubmit = (data: JobFormData) => {
    const specialtiesArray = data.specialties_required
      ? data.specialties_required.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    
    // [!code --] (This payload was missing the ID)
    // const payload: UpdateJobPayload = {
    // [!code ++] (FIX: The payload must match our 'UpdateJobPayload' type, including the ID)
    const payload: UpdateJobPayload = {
      p_job_id: jobId!,
      p_title: data.title,
      p_description: data.description,
      p_job_type: data.job_type,
      p_experience_level: data.experience_level,
      p_location_type: data.location_type,
      p_location_text: data.location_text,
      p_specialties_required: specialtiesArray,
      p_external_apply_url: data.external_apply_url || null,
    };
    updateMutation.mutate(payload);
  };

  if (isLoadingJob) {
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
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-10 w-full" />
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
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-center text-3xl">
              Edit Job Posting
            </CardTitle>
            <CardDescription className="text-center text-lg">
              Update the details for your job posting.
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
                      <FormLabel>Job Title *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Job Type, Experience, Location Type */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="job_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="full_time">Full-time</SelectItem>
                            <SelectItem value="part_time">Part-time</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="internship">Internship</SelectItem>
                            <SelectItem value="locum">Locum</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="experience_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experience Level *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select level..." /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {experienceLevels?.map((level) => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="onsite">On-site</SelectItem>
                            <SelectItem value="remote">Remote</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Location Text */}
                <FormField
                  control={form.control}
                  name="location_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        This is the city or location text that will be displayed.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Specialties */}
                <FormField
                  control={form.control}
                  name="specialties_required"
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
                      <FormLabel>Job Description *</FormLabel>
                      <FormControl>
                        <Textarea rows={10} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* External URL */}
                <FormField
                  control={form.control}
                  name="external_apply_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>External Apply URL (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        If provided, applicants will be sent to this URL instead of applying on-site.
                      </FormDescription>
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
                        Deactivate Job
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will deactivate the job posting and hide it from the public.
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
