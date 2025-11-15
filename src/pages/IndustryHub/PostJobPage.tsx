import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  createCompanyJob,
  CreateJobPayload,
  getCompanyProfileDetails,
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
import { Loader2, AlertCircle, Briefcase, ArrowLeft } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 1. Define the validation schema with Zod
const jobFormSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters.' }),
  description: z.string().min(20, { message: 'Description must be at least 20 characters.' }),
  job_type: z.string({ required_error: 'Please select a job type.' }),
  experience_level: z.string({ required_error: 'Please select an experience level.' }),
  location_type: z.string({ required_error: 'Please select a location type.' }),
  location_text: z.string().min(2, { message: 'Location is required.' }),
  specialties_required: z.string().optional(), // We'll parse this string into an array
  external_apply_url: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
});

type JobFormData = z.infer<typeof jobFormSchema>;

export default function PostJobPage() {
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

  // 3. Fetch data for all dropdowns
  const { data: experienceLevels } = useQuery({
    queryKey: ['experienceLevels'],
    queryFn: async () => {
      const { data, error } = await supabase.from('experience_levels').select('*');
      if (error) throw error;
      return data;
    }
  });

  // 4. Setup the form
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

  // 5. Setup the mutation to create the job
  const mutation = useMutation({
    mutationFn: (payload: CreateJobPayload) => createCompanyJob(payload),
    onSuccess: () => {
      toast({
        title: 'Job Posted Successfully!',
        description: 'Your new job is now active on the job board.',
      });
      // Invalidate company profile details to refetch the jobs list
      queryClient.invalidateQueries({ queryKey: ['companyProfile', companyId] });
      navigate('/industryhub/dashboard');
    },
    onError: (error) => {
      toast({
        title: 'Error Posting Job',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // 6. Handle the form submission
  const onSubmit = (data: JobFormData) => {
    if (!companyId) {
      toast({ title: 'Error', description: 'Could not find your company.', variant: 'destructive' });
      return;
    }

    // Parse the comma-separated specialties into an array
    const specialtiesArray = data.specialties_required
      ? data.specialties_required.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const payload: CreateJobPayload = {
      p_company_id: companyId,
      p_title: data.title,
      p_description: data.description,
      p_job_type: data.job_type,
      p_experience_level: data.experience_level,
      p_location_type: data.location_type,
      p_location_text: data.location_text,
      p_specialties_required: specialtiesArray,
      p_external_apply_url: data.external_apply_url || undefined,
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
    // This case will redirect the user if they're not a company admin
    // We'll add a check to redirect them properly
    if (!companyId && !isLoadingId) {
      toast({
        title: 'Access Denied',
        description: 'You must create a company profile to post a job.',
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
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-center text-3xl">
              Post a New Job
            </CardTitle>
            <CardDescription className="text-center text-lg">
              Fill out the details below to find your next great hire.
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
                        <Input placeholder="e.g., Senior Consultant - Cardiology" {...field} />
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Input placeholder="e.g., Delhi, IN or Remote" {...field} />
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
                        <Textarea
                          placeholder="e.g., Cardiology, Python, Data Analysis"
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
                      <FormLabel>Job Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the role, responsibilities, and qualifications..."
                          rows={10}
                          {...field}
                        />
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
                        <Input placeholder="https://yourcompany.com/apply/123" {...field} />
                      </FormControl>
                      <FormDescription>
                        If provided, applicants will be sent to this URL instead of applying on-site.
                      </FormDescription>
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
                    Post Job
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
