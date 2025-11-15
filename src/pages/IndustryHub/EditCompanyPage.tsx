import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  getCompanyProfileDetails,
  updateCompanyProfile,
  uploadCompanyAsset,
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

// --- Zod Schema ---
const companyFormSchema = z.object({
  company_name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  description: z.string().min(20, { message: 'Description must be at least 20 characters.' }),
  industry_id: z.string({ required_error: 'Industry is required.' }),
  location_id: z.string({ required_error: 'Location is required.' }),
  website_url: z.string().url({ message: 'Must be a valid URL.' }).optional().or(z.literal('')),
  company_size: z.string().optional(),
  founded_year: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companyFormSchema>;

export default function EditCompanyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  // 1. Fetch Company ID of the current admin (from PostJobPage logic)
  const { data: companyId } = useQuery<string | null, Error>({
    queryKey: ['myAdminCompanyId'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_admin_company_id');
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user,
  });

  // 2. Fetch the existing company profile data
  const { data: profileData, isLoading: isLoadingProfile, isError } = useQuery({
    queryKey: ['companyProfile', companyId],
    queryFn: () => getCompanyProfileDetails(companyId!),
    enabled: !!companyId,
    onSuccess: (data) => {
      if (data) {
        // 4. Pre-fill the form once data is loaded
        form.reset({
          company_name: data.profile.company_name,
          description: data.profile.description,
          industry_id: data.profile.industry_id,
          location_id: data.profile.location_id,
          website_url: data.profile.website_url || '',
          company_size: data.profile.company_size || '',
          founded_year: data.profile.founded_year ? String(data.profile.founded_year) : '',
        });
      }
    },
  });

  // 3. Fetch data for dropdowns
  const { data: industries } = useQuery({ queryKey: ['industries'], queryFn: getIndustries });
  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('locations').select('*');
      if (error) throw new Error(error.message);
      return data;
    },
  });

  // 4. Setup the form
  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      company_name: '',
      description: '',
      website_url: '',
    },
  });

  // 5. Setup the UPDATE mutation
  const updateMutation = useMutation({
    mutationFn: async ({ payload, newLogo, newBanner }: { payload: UpdateCompanyPayload, newLogo: File | null, newBanner: File | null }) => {
      if (!companyId) throw new Error("Company ID is missing.");
      
      let logoUrl = profileData?.profile.company_logo_url;
      let bannerUrl = profileData?.profile.company_banner_url;

      // Handle Logo Upload
      if (newLogo) {
        const logoUploadResult = await uploadCompanyAsset(companyId, newLogo);
        logoUrl = logoUploadResult.publicUrl;
      }
      
      // Handle Banner Upload
      if (newBanner) {
        const bannerUploadResult = await uploadCompanyAsset(companyId, newBanner);
        bannerUrl = bannerUploadResult.publicUrl;
      }

      // Merge URLs into the final payload
      const finalPayload: UpdateCompanyPayload = {
        ...payload,
        company_logo_url: logoUrl,
        company_banner_url: bannerUrl,
      };

      return updateCompanyProfile(companyId, finalPayload);
    },
    onSuccess: () => {
      toast({ title: 'Company Profile Updated Successfully!' });
      // Invalidate queries to refresh data on other pages
      queryClient.invalidateQueries({ queryKey: ['companyProfile', companyId] });
      navigate(`/industryhub/company/${companyId}`);
    },
    onError: (error) => {
      toast({ title: 'Error Updating Profile', description: error.message, variant: 'destructive' });
    },
  });

  // 6. Handle form submission
  const onSubmit = (data: CompanyFormData) => {
    const payload: UpdateCompanyPayload = {
      company_name: data.company_name,
      description: data.description,
      industry_id: data.industry_id,
      location_id: data.location_id,
      website_url: data.website_url || null,
      company_size: data.company_size || null,
      founded_year: data.founded_year ? parseInt(data.founded_year) : null,
    };
    
    updateMutation.mutate({ payload, newLogo: logoFile, newBanner: bannerFile });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files.length > 0) {
      setter(e.target.files[0]);
    }
  };

  if (isLoadingProfile || !companyId) {
    if (isError && !companyId) {
      return (
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="container-medical flex-1 py-12">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>
                You are not authorized to edit a company profile or your company ID could not be found.
              </AlertDescription>
            </Alert>
          </main>
          <Footer />
        </div>
      );
    }
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
                    {/* Logo Upload */}
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
                        {logoFile ? `New file selected: ${logoFile.name}` : profileData?.profile.company_logo_url ? 'Existing logo will be kept unless new file is selected.' : 'No logo uploaded yet.'}
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
                        {bannerFile ? `New file selected: ${bannerFile.name}` : profileData?.profile.company_banner_url ? 'Existing banner will be kept unless new file is selected.' : 'No banner uploaded yet.'}
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a location..." /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {locations?.map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
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
                            <SelectItem value="1-50">1-50 employees</SelectItem>
                            <SelectItem value="51-200">51-200 employees</SelectItem>
                            <SelectItem value="201-500">201-500 employees</SelectItem>
                            <SelectItem value="501-1000">501-1000 employees</SelectItem>
                            <SelectItem value="1000+">1000+ employees</SelectItem>
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
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
