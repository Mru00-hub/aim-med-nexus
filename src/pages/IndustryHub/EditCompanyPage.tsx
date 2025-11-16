import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams} from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  getCompanyProfileDetails,
  updateCompanyProfile,
  uploadCompanyAsset,
  uploadNewCompanyLogo, 
  UpdateCompanyPayload,
  getIndustries,
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
import { Loader2, Building, ArrowLeft, Upload, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchableSelect } from '@/components/ui/searchable-select';
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
import { Trash2 } from 'lucide-react';
import { deactivateCompanyProfile } from '@/integrations/supabase/industry.api';
function seedDropdownList<T extends { id: string }>(list: T[], item: T | null | undefined): T[] {
  if (!item) return list;
  if (list.find(i => i.id === item.id)) return list;
  return [item, ...list];
}

// --- Zod Schema ---
const companyFormSchema = z.object({
  company_name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  description: z.string().min(20, { message: 'Description must be at least 20 characters.' }),
  industry_id: z.string({ required_error: 'Industry is required.' }),
  industry_other: z.string().optional(),
  location_id: z.string({ required_error: 'Location is required.' }),
  website_url: z.string().url({ message: 'Must be a valid URL.' }).optional().or(z.literal('')),
  company_size: z.string().optional(),
  founded_year: z.preprocess(
    (arg) => (arg === "" ? undefined : arg), // Convert empty string to undefined
    z.coerce.number() // Try to convert the (non-empty) string to a number
      .int({ message: 'Year must be a whole number.' })
      .min(1800, { message: 'Year must be after 1800.' })
      .max(new Date().getFullYear(), { message: 'Year cannot be in the future.' })
      .optional()
  ),
});

type CompanyFormData = z.infer<typeof companyFormSchema>;

export default function EditCompanyPage() {
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const [locations, setLocations] = useState<{ id: string; label: string }[]>([]);
  const [locationSearch, setLocationSearch] = useState("");
  const [isLocLoading, setIsLocLoading] = useState(false);
  const isMounted = useRef(false);

  useEffect(() => {
    const fetchSearchLocations = async () => {
      setIsLocLoading(true);
      const { data, error } = await supabase
        .from('locations')
        .select('id, label') // We only need id and label
        .neq('label', 'Other') // Assuming 'Other' is a label
        .or(`label.ilike.%${locationSearch}%`)
        .order('label')
        .limit(50);
      
      if (data) setLocations(data);
      if (error) console.error('Error fetching search locations:', error);
      setIsLocLoading(false);
    };

    const fetchInitialLocations = async () => {
       let currentLoc = null;
       if (profileData?.location_id && profileData.location_id !== 'other') {
          const { data } = await supabase
            .from('locations')
            .select('id, label')
            .eq('id', profileData.location_id)
            .single();
          currentLoc = data;
       }
       const { data, error } = await supabase
        .from('locations')
        .select('id, label')
        .neq('label', 'Other')
        .order('label')
        .limit(10); // Fetch top 10
      
       if (data) setLocations(seedDropdownList(data, currentLoc)); 
       if (error) console.error('Error fetching initial locations:', error);
       setIsLocLoading(false);
    };

    if (!isMounted.current) {
      isMounted.current = true;
      fetchInitialLocations();
      return;
    }

    const searchTimer = setTimeout(() => {
      if (locationSearch.length < 2) {
        fetchInitialLocations();
      } else {
        fetchSearchLocations();
      }
    }, 500); // 500ms debounce
    
    return () => clearTimeout(searchTimer);

  }, [locationSearch, profileData]);

  const locationOptions = useMemo(() => 
    locations.map(loc => ({ value: loc.id, label: loc.label })),
    [locations]
  );

  const { data: profileData, isLoading: isLoadingProfile, isError } = useQuery({
    queryKey: ['companyProfile', companyId],
    queryFn: () => getCompanyProfileDetails(companyId!),
    enabled: !!companyId,
  });

  // 3. Fetch data for dropdowns
  const { data: industries } = useQuery({
    queryKey: ['industries', profileData?.industry_id], 
    queryFn: async () => {
      let currentIndustry = null;
      if (profileData?.industry_id && profileData.industry_id !== 'other') {
        const { data } = await supabase
          .from('industries')
          .select('id, name')
          .eq('id', profileData.industry_id)
          .single();
        currentIndustry = data ? { id: data.id, name: data.name } : null;
      }

      const allIndustries = await getIndustries();
      return seedDropdownList(allIndustries, currentIndustry);
    },
    enabled: !!profileData, // <-- Only run after profileData is loaded
  });

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      company_name: '',
      description: '',
      website_url: '',
      industry_other: '',
      industry_id: undefined,
      location_id: undefined,
      company_size: undefined,
      founded_year: undefined,
    },
  });

  useEffect(() => {
    // When the query data comes in, reset the form
    if (profileData) {
      form.reset({
        company_name: profileData.company_name,
        description: profileData.description,
        industry_id: profileData.industry_id || undefined,
        location_id: profileData.location_id || undefined,
        website_url: profileData.website_url || '',
        company_size: profileData.company_size || undefined,
        founded_year: profileData.founded_year || undefined, // Pass the number directly
      });
    }
  }, [profileData, form.reset]);

  const watchedIndustryId = form.watch('industry_id');

  // 5. Setup the UPDATE mutation
  const updateMutation = useMutation({
    mutationFn: async ({ payload, newLogo, newBanner }: { payload: UpdateCompanyPayload, newLogo: File | null, newBanner: File | null }) => {
      if (!companyId) throw new Error("Company ID is missing.");
      
      let logoUrl = profileData?.company_logo_url;
      let bannerUrl = profileData?.company_banner_url;

      if (newLogo) {
        const logoUploadResult = await uploadCompanyAsset(companyId, newLogo);
        logoUrl = logoUploadResult.publicUrl;
      }
      
      if (newBanner) {
        const bannerUploadResult = await uploadCompanyAsset(companyId, newBanner);
        bannerUrl = bannerUploadResult.publicUrl;
      }

      // [!code ++] (FIX: Add the p_company_id to the payload, as required by the RPC)
      const finalPayload: UpdateCompanyPayload = {
        ...payload,
        p_company_id: companyId, // [!code ++]
        p_company_logo_url: logoUrl,
        p_company_banner_url: bannerUrl,
      };

      return updateCompanyProfile(finalPayload);
    },
    onSuccess: () => {
      toast({ title: 'Company Profile Updated Successfully!' });
      queryClient.invalidateQueries({ queryKey: ['companyProfile', companyId] });
      navigate(`/industryhub/company/${companyId}`);
    },
    onError: (error) => {
      toast({ title: 'Error Updating Profile', description: error.message, variant: 'destructive' });
    },
  });

  // 6. Handle form submission
  const onSubmit = (data: CompanyFormData) => {
    
    const payload: Omit<UpdateCompanyPayload, 'p_company_id'> = { // [!code ++]
      p_company_name: data.company_name,
      p_description: data.description,
      p_industry_id: data.industry_id === 'other' ? undefined : data.industry_id, 
      p_industry_other: data.industry_id === 'other' ? data.industry_other : undefined,
      p_location_id: data.location_id,
      p_website_url: data.website_url || null,
      p_company_size: data.company_size || null,
      p_founded_year: data.founded_year || null,
    };
    
    updateMutation.mutate({ payload, newLogo: logoFile, newBanner: bannerFile });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files.length > 0) {
      setter(e.target.files[0]);
    }
  };

  const deactivateMutation = useMutation({
    mutationFn: () => deactivateCompanyProfile(companyId!),
    onSuccess: () => {
      toast({ title: 'Company Profile Deactivated' });
      // Invalidate all company queries
      queryClient.invalidateQueries({ queryKey: ['myAdminCompanyId'] });
      queryClient.invalidateQueries({ queryKey: ['companyProfile', companyId] });
      // Send user away from the dashboard, as they are no longer an admin
      navigate('/industryhub'); 
    },
    onError: (error) => {
      toast({ title: 'Error Deactivating Profile', description: error.message, variant: 'destructive' });
    },
  });

  if (isLoadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !profileData) {
     // This catches both query errors and cases where 'companyId' is missing
     return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container-medical flex-1 py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Profile</AlertTitle>
            <AlertDescription>
              The company profile could not be loaded. Please ensure you have
              the correct URL and are authorized to edit this company.
            </AlertDescription>
          </Alert>
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
          onClick={() => navigate(`/industryhub/company/${companyId}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profile
        </Button>

        <Card className="mx-auto max-w-4xl shadow-lg">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Building className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-center text-3xl">
              Edit Company Profile
            </CardTitle>
            <CardDescription className="text-center text-lg">
              Update your public-facing information and assets.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                {/* --- Asset Uploads --- */}
                <Card className="p-4 bg-gray-50">
                  <CardTitle className="mb-4 text-xl">Assets</CardTitle>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormItem>
                      <FormLabel>Company Logo (Square)</FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleFileChange(e, setLogoFile)} 
                          className="file:text-primary"
                        />
                      </FormControl>
                      <FormDescription>
                        {logoFile ? `New file selected: ${logoFile.name}` : profileData?.company_logo_url ? 'Existing logo will be kept unless new file is selected.' : 'No logo uploaded yet.'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>

                    {/* Banner Upload */}
                    <FormItem>
                      <FormLabel>Company Banner (Wide)</FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleFileChange(e, setBannerFile)}
                          className="file:text-primary"
                        />
                      </FormControl>
                      <FormDescription>
                        {bannerFile ? `New file selected: ${bannerFile.name}` : profileData?.company_banner_url ? 'Existing banner will be kept unless new file is selected.' : 'No banner uploaded yet.'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  </div>
                </Card>

                {/* Company Name */}
                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Industry & Location */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="industry_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select an industry..." /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {industries?.map((industry) => (
                              <SelectItem key={industry.id} value={industry.id}>
                                {industry.name}
                              </SelectItem>
                            ))}
                            <SelectItem value="other">Other</SelectItem> 
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location *</FormLabel>
                        <SearchableSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          options={locationOptions}
                          onSearchChange={setLocationSearch}
                          isLoading={isLocLoading}
                          placeholder="Select your location..."
                          searchPlaceholder="Search locations... (min 2 chars)"
                          emptyMessage="No location found."
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {watchedIndustryId === 'other' && (
                  <FormField
                    control={form.control}
                    name="industry_other"
                    rules={{ required: 'Industry name is required when "Other" is selected' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Please specify industry *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Medical Device Manufacturing" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {/* Size & Year */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="company_size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Size (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select size..." /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1-10 employees">1-10 employees</SelectItem>
                            <SelectItem value="11-50 employees">11-50 employees</SelectItem>
                            <SelectItem value="51-200 employees">51-200 employees</SelectItem>
                            <SelectItem value="201-500 employees">201-500 employees</SelectItem>
                            <SelectItem value="501-1,000 employees">501-1,000 employees</SelectItem>
                            <SelectItem value="1,001-5,000 employees">1,001-5,000 employees</SelectItem>
                            <SelectItem value="5,001-10,000 employees">5,001-10,000 employees</SelectItem>
                            <SelectItem value="10,001+ employees">10,001+ employees</SelectItem>
                          </SelectContent>

                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="founded_year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Founded Year (Optional)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 2015" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Website URL */}
                <FormField
                  control={form.control}
                  name="website_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://yourcompany.com" {...field} />
                      </FormControl>
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
                      <FormLabel>Company Description *</FormLabel>
                      <FormControl>
                        <Textarea rows={10} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button type="submit" size="lg" disabled={updateMutation.isPending}>
                    {updateMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Profile Changes
                  </Button>
                </div>
                <Card className="border-destructive bg-destructive/5">
                  <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription className="text-destructive/80">
                      Deactivating your company will unpublish all jobs, collaborations,
                      and remove all manager access. This action is irreversible.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" type="button">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Deactivate This Company
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently deactivate your company, unpublish all
                            its jobs and collaborations, and remove all managers.
                            This action cannot be undone.
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
                            Yes, Deactivate Company
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
