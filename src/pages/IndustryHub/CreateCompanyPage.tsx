import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  createCompanyProfile,
  getIndustries,
  CreateCompanyPayload,
  uploadNewCompanyLogo,
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, Building, Info } from 'lucide-react';

// We'll use react-hook-form for validation, assuming it's in the project
// based on the src/components/ui/form.tsx
import { useForm, Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';

type FormData = {
  company_name: string;
  industry_id: string;
  industry_other: string;
  location_id: string;
  description: string;
  website_url: string;
  company_size: string; // Add this
  founded_year: string; 
};

export default function CreateCompanyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // --- Data for Form Selects ---
  const { data: industries, isLoading: isLoadingIndustries } = useQuery({
    queryKey: ['industries'],
    queryFn: getIndustries,
  });

  const { data: locations, isLoading: isLoadingLocations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('locations').select('*');
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const companySizeOptions = [
    '1-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-500 employees',
    '501-1,000 employees',
    '1,001-5,000 employees',
    '5,001-10,000 employees',
    '10,001+ employees',
  ];

  // --- Form Handling ---
  const {
    control,
    handleSubmit,
    watch, 
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      company_name: '',
      industry_id: '',
      industry_other: '',
      location_id: '',
      description: '',
      website_url: '',
      company_size: '', // Add this
      founded_year: '',
    },
  });

  const watchedIndustryId = watch('industry_id');

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setLogoFile(null);
      setLogoPreview(null);
    }
  };

  // --- API Mutation ---
  const mutation = useMutation({
    mutationFn: (newCompany: CreateCompanyPayload) => createCompanyProfile(newCompany),
    onSuccess: (data) => {
      toast({
        title: 'Company Profile Created!',
        description: 'You can now manage your new company page.',
      });
      // Navigate to the dashboard for the new company
      navigate(`/industryhub/dashboard`);
    },
    onError: (error) => {
      toast({
        title: 'Error Creating Profile',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

    const onSubmit = async (data: FormData) => {
    let logoUrl: string | undefined = undefined;
    
    try {
      // Step 1: Upload logo if it exists
      if (logoFile) {
        setIsUploading(true);
        const { publicUrl } = await uploadNewCompanyLogo(logoFile);
        logoUrl = publicUrl;
        setIsUploading(false);
      }

      // Step 2: Prepare final payload
      const payload: CreateCompanyPayload = {
        company_name: data.company_name,
        description: data.description,
        location_id: data.location_id,
        website_url: data.website_url || undefined,
        industry_id: data.industry_id === 'other' ? undefined : data.industry_id,
        industry_other: data.industry_id === 'other' ? data.industry_other : undefined,
        company_size: data.company_size || undefined,
        founded_year: data.founded_year ? parseInt(data.founded_year, 10) : undefined,
        company_logo_url: logoUrl,
      };

      // Step 3: Call the mutation
      mutation.mutate(payload);

    } catch (error: any) {
      setIsUploading(false);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to upload logo. Please try again.",
        variant: "destructive" 
      });
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col bg-gray-50/50">
      <Header />
      <main className="container-medical flex-1 py-12">
        <Card className="mx-auto max-w-3xl shadow-lg">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Building className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-center text-3xl">
              Create Your Company Profile
            </CardTitle>
            <CardDescription className="text-center text-lg">
              Establish your presence on AIMedNet to post jobs and find collaborators.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>One Profile per User</AlertTitle>
              <AlertDescription>
                You can create and manage one company profile per account. This
                profile will be linked to you ({user?.email}).
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Controller
                  name="company_name"
                  control={control}
                  rules={{ required: 'Company name is required' }}
                  render={({ field }) => (
                    <Input id="company_name" placeholder="e.g., Apollo Hospitals" {...field} />
                  )}
                />
                {errors.company_name && (
                  <p className="text-sm text-red-600">{errors.company_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_logo">Company Logo (Optional)</Label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="h-20 w-20 rounded-full object-cover" 
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200">
                      <Building className="h-8 w-8 text-gray-500" />
                    </div>
                  )}
                  <Input
                    id="company_logo"
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleLogoChange}
                    className="file:text-primary-foreground"
                    disabled={isUploading || mutation.isPending}
                  />
                </div>
              </div>

              {/* Industry & Location */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="industry_id">Industry *</Label>
                  <Controller
                    name="industry_id"
                    control={control}
                    rules={{ required: 'Industry is required' }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="industry_id">
                          <SelectValue placeholder="Select an industry..." />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingIndustries ? (
                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                          ) : (
                            <> 
                            {industries?.map((industry) => (
                              <SelectItem key={industry.id} value={industry.id}>
                                {industry.name}
                              </SelectItem>
                            ))}
                            <SelectItem value="other">Other</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.industry_id && (
                    <p className="text-sm text-red-600">{errors.industry_id.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location_id">Location *</Label>
                  <Controller
                    name="location_id"
                    control={control}
                    rules={{ required: 'Location is required' }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="location_id">
                          <SelectValue placeholder="Select a location..." />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingLocations ? (
                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                          ) : (
                            locations?.map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.label}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.location_id && (
                    <p className="text-sm text-red-600">{errors.location_id.message}</p>
                  )}
                </div>
              </div>

              {watchedIndustryId === 'other' && (
                <div className="space-y-2">
                  <Label htmlFor="industry_other">Please specify industry *</Label>
                  <Controller
                    name="industry_other"
                    control={control}
                    rules={{ required: 'Industry name is required when "Other" is selected' }}
                    render={({ field }) => (
                      <Input
                        id="industry_other"
                        placeholder="e.g., Medical Device Manufacturing"
                        {...field}
                      />
                    )}
                  />
                  {errors.industry_other && (
                    <p className="text-sm text-red-600">{errors.industry_other.message}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company_size">Company Size *</Label>
                  <Controller
                    name="company_size"
                    control={control}
                    rules={{ required: 'Company size is required' }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="company_size">
                          <SelectValue placeholder="Select company size..." />
                        </SelectTrigger>
                        <SelectContent>
                          {companySizeOptions.map((size) => (
                            <SelectItem key={size} value={size}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.company_size && (
                    <p className="text-sm text-red-600">{errors.company_size.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="founded_year">Founded Year *</Label>
                  <Controller
                    name="founded_year"
                    control={control}
                    rules={{ 
                      required: 'Founded year is required',
                      min: { value: 1800, message: 'Must be a valid year' },
                      max: { value: new Date().getFullYear(), message: 'Year cannot be in the future' }
                    }}
                    render={({ field }) => (
                      <Input
                        id="founded_year"
                        type="number"
                        placeholder={`e.g., ${new Date().getFullYear() - 5}`}
                        {...field}
                      />
                    )}
                  />
                  {errors.founded_year && (
                    <p className="text-sm text-red-600">{errors.founded_year.message}</p>
                  )}
                </div>
              </div>

              {/* Website URL */}
              <div className="space-y-2">
                <Label htmlFor="website_url">Website (Optional)</Label>
                <Controller
                  name="website_url"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="website_url"
                      placeholder="https://yourcompany.com"
                      {...field}
                    />
                  )}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Company Description *</Label>
                <Controller
                  name="description"
                  control={control}
                  rules={{ required: 'Description is required' }}
                  render={({ field }) => (
                    <Textarea
                      id="description"
                      placeholder="Describe your company's mission, vision, and values..."
                      rows={6}
                      {...field}
                    />
                  )}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Submit */}
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={isUploading || mutation.isPending}
                >
                  {(isUploading || mutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isUploading ? 'Uploading Logo...' : (mutation.isPending ? 'Creating...' : 'Create Profile')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
