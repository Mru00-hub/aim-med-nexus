import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  getCollabById,
  updateCollaboration,
  setCollabActiveStatus,
  UpdateCollabPayload,
  CollaborationDetails,
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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Users, ArrowLeft, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Skeleton } from '@/components/ui/skeleton';
import { Enums } from '@/types';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { SearchableMultiSelect } from '@/components/ui/searchable-multi-select';

const COLLAB_REQUIREMENTS = [
  { id: 'resume', label: 'Resume / CV' },
  { id: 'bio', label: 'Bio / About Section' },
  { id: 'work_experience', label: 'Work Experience History' },
  { id: 'education_history', label: 'Education History' },
  { id: 'skills', label: 'Skills List' },
  { id: 'location', label: 'Location Details' },
  { id: 'organization', label: 'Current Organization' },
  { id: 'position', label: 'Current Position' },
  // Application Data (Inputs) - No Current Salary, Renamed Expected
  { id: 'expected_salary', label: 'Expected Remuneration / Stipend' },
] as const;

const collabFormSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters.' }),
  description: z.string().min(20, { message: 'Description must be at least 20 characters.' }),
  collaboration_type: z.enum(['clinical_trial', 'research', 'advisory', 'other'], {
    required_error: 'Please select a collaboration type.',
  }),
  location_id: z.string().optional(),
  duration: z.string().optional(),
  specialization_ids: z.array(z.string()).optional(),
  required_profile_fields: z.array(z.string()).optional(),
});

type CollabFormData = z.infer<typeof collabFormSchema>;

export default function EditCollabPage() {
  const { collabId } = useParams<{ collabId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- Location Fetching Logic ---
  const [locations, setLocations] = useState<{ id: string; label: string }[]>([]);
  const [locationSearch, setLocationSearch] = useState("");
  const [isLocLoading, setIsLocLoading] = useState(false);
  const isLocMounted = useRef(false);

  useEffect(() => {
    const fetchSearchLocations = async () => {
      setIsLocLoading(true);
      const { data, error } = await supabase.from('locations').select('id, label')
        .neq('label', 'Other').or(`label.ilike.%${locationSearch}%`).order('label').limit(50);
      if (data) setLocations(data);
      if (error) console.error('Error fetching search locations:', error);
      setIsLocLoading(false);
    };
    const fetchInitialLocations = async () => {
       setIsLocLoading(true);
       const { data, error } = await supabase.from('locations').select('id, label')
        .neq('label', 'Other').order('label').limit(10);
       if (data) setLocations(data);
       if (error) console.error('Error fetching initial locations:', error);
       setIsLocLoading(false);
    };
    if (!isLocMounted.current) {
      isLocMounted.current = true;
      fetchInitialLocations();
      return;
    }
    const searchTimer = setTimeout(() => {
      if (locationSearch.length < 2) fetchInitialLocations();
      else fetchSearchLocations();
    }, 500);
    return () => clearTimeout(searchTimer);
  }, [locationSearch]);

  const locationOptions = useMemo(() => 
    locations.map(loc => ({ value: loc.id, label: loc.label })),
    [locations]
  );

  // --- Specialization Fetching Logic ---
  const [specializations, setSpecializations] = useState<{ id: string; label: string }[]>([]);
  const [specializationSearch, setSpecializationSearch] = useState("");
  const [isSpecLoading, setIsSpecLoading] = useState(false);
  const isSpecMounted = useRef(false);

  useEffect(() => {
    const fetchSearchSpecializations = async () => {
      setIsSpecLoading(true);
      const { data, error } = await supabase.from('specializations').select('id, label')
        .neq('label', 'Other').or(`label.ilike.%${specializationSearch}%`).order('label').limit(50);
      if (data) setSpecializations(data);
      if (error) console.error('Error fetching specializations:', error);
      setIsSpecLoading(false);
    };
    const fetchInitialSpecializations = async () => {
      setIsSpecLoading(true);
      const { data, error } = await supabase.from('specializations').select('id, label')
        .neq('label', 'Other').order('label').limit(10);
      if (data) setSpecializations(data);
      if (error) console.error('Error fetching initial specializations:', error);
      setIsSpecLoading(false);
    };
    if (!isSpecMounted.current) {
      isSpecMounted.current = true;
      fetchInitialSpecializations();
      return;
    }
    const searchTimer = setTimeout(() => {
      if (specializationSearch.length < 2) fetchInitialSpecializations();
      else fetchSearchSpecializations();
    }, 500);
    return () => clearTimeout(searchTimer);
  }, [specializationSearch]);

  const specializationOptions = useMemo(() =>
    specializations.map(spec => ({ value: spec.id, label: spec.label })),
    [specializations]
  );

  const form = useForm<CollabFormData>({
    resolver: zodResolver(collabFormSchema),
    defaultValues: {
      title: '',
      description: '',
      location_id: '',
      duration: '',
      specialization_ids: [],
      collaboration_type: 'other',
      required_profile_fields: ['resume'],
    },
  });

  const { data: collabData, isLoading: isLoadingCollab } = useQuery<CollaborationDetails, Error>({
    queryKey: ['collabDetails', collabId],
    queryFn: () => getCollabById(collabId!),
    enabled: !!collabId,
  });
  useEffect(() => {
    if (collabData) {
      form.reset({
        title: collabData.title,
        description: collabData.description,
        collaboration_type: collabData.collaboration_type as Enums<'collab_type_enum'>,
        location_id: collabData.location_id || '',
        duration: collabData.duration || '',
        specialization_ids: (collabData.specializations || []).map(s => s.id),
        required_profile_fields: collabData.required_profile_fields || ['resume'],
      });
    }
  }, [collabData, form.reset]);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateCollabPayload) => updateCollaboration(payload),
    onSuccess: () => {
      toast({ title: 'Collaboration Updated Successfully!' });
      queryClient.invalidateQueries({ queryKey: ['collabDetails', collabId] });
      queryClient.invalidateQueries({ queryKey: ['companyProfile', collabData?.company_id] });
      navigate(`/industryhub/dashboard/${collabData?.company_id}`); 
    },
    onError: (error) => {
      toast({ title: 'Error Updating Collaboration', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => setCollabActiveStatus(collabId!, false),
    onSuccess: () => {
      toast({ title: 'Collaboration Deactivated', description: 'The collaboration post has been archived.' });
      queryClient.invalidateQueries({ queryKey: ['collabDetails', collabId] });
      queryClient.invalidateQueries({ queryKey: ['companyProfile', collabData?.company_id] });
      navigate(`/industryhub/dashboard/${collabData?.company_id}`); 
    },
    onError: (error) => {
      toast({ title: 'Error Deleting Collaboration', description: error.message, variant: 'destructive' });
    },
  });

  const onSubmit = (data: CollabFormData) => {
    const payload: UpdateCollabPayload = {
      p_collab_id: collabId!,
      p_title: data.title,
      p_description: data.description,
      p_collaboration_type: data.collaboration_type,
      p_location_id: data.location_id || null,
      p_duration: data.duration || null,
      p_specialization_ids: data.specialization_ids,
      p_required_profile_fields: data.required_profile_fields,
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
          onClick={() => navigate(`/industryhub/dashboard/${collabData?.company_id}`)}
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
                    name="location_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location (Optional)</FormLabel>
                        <FormControl>
                          <SearchableSelect
                            value={field.value}
                            onValueChange={field.onChange}
                            options={locationOptions}
                            onSearchChange={setLocationSearch}
                            isLoading={isLocLoading}
                            placeholder="Select or search for a location..."
                            searchPlaceholder="Search locations..."
                            emptyMessage="No location found."
                          />
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
                  name="specialization_ids"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialties / Skills (Optional)</FormLabel>
                      <FormControl>
                        <SearchableMultiSelect
                          values={field.value || []}
                          onValuesChange={field.onChange}
                          options={specializationOptions}
                          onSearchChange={setSpecializationSearch}
                          isLoading={isSpecLoading}
                          placeholder="Select specialties..."
                          searchPlaceholder="Search specialties..."
                          emptyMessage="No specialties found."
                        />
                      </FormControl>
                      <FormDescription>
                        Select all skills or specialties that apply.
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

                <FormField
                  control={form.control}
                  name="required_profile_fields"
                  render={() => (
                    <FormItem className="rounded-md border p-4 bg-muted/10">
                      <div className="mb-4">
                        <FormLabel className="text-base font-semibold">Application Requirements</FormLabel>
                        <FormDescription>Select information candidates MUST provide.</FormDescription>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {COLLAB_REQUIREMENTS.map((item) => (
                          <FormField
                            key={item.id}
                            control={form.control}
                            name="required_profile_fields"
                            render={({ field }) => (
                              <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), item.id])
                                        : field.onChange(field.value?.filter((value) => value !== item.id))
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">{item.label}</FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
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
