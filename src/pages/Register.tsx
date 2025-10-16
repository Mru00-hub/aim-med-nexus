import React, { useState, ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generateSalt } from '@/lib/utils';

// Layout & UI Components
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

// Step Components
import { RegistrationTypeStep } from '@/components/register/RegistrationTypeStep';
import { PersonalDetailsStep } from '@/components/register/PersonalDetailsStep';
import { ProfessionalDetailsStep } from '@/components/register/ProfessionalDetailsStep';

// Initial state for the form
const initialFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  location: '',
  institution: '',
  course: '',
  yearOfStudy: '',
  currentPosition: '',
  organization: '',
  specialization: '',
  experience: '',
  medicalLicense: '',
  bio: '',
  otherLocation: '',
  otherInstitution: '',
  otherCourse: '',
  otherSpecialization: '',
  agreeToTerms: false,
  receiveUpdates: true,
};

const Register = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [registrationType, setRegistrationType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  
  const [formData, setFormData] = useState(initialFormData);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ title: "Image Too Large", description: "Please select an image smaller than 2MB.", variant: "destructive" });
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };
  
  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
  };

  const validateStep = () => {
    if (step === 2) {
      const { firstName, lastName, email, location, password, confirmPassword } = formData;
      if (!firstName || !lastName || !email || !location || !password || !confirmPassword) return "Please fill in all required personal information fields.";
      if (password.length < 6) return "Password must be at least 6 characters long.";
      if (password !== confirmPassword) return "Passwords do not match.";
    }
    if (step === 3) {
      const { institution, course, yearOfStudy, currentPosition, organization, specialization, experience, agreeToTerms } = formData;
      if (!institution || !course) return "Educational institution and course are required.";
      if (registrationType === 'student' && !yearOfStudy) return "Please select your year of study.";
      if (registrationType === 'professional' && (!currentPosition || !organization || !specialization || !experience)) return "Please fill in all required professional fields.";
      if (!agreeToTerms) return "You must agree to the terms and conditions.";
    }
    return ''; // No errors
  };

  const handleNext = () => {
    const validationError = validateStep();
    if (validationError) {
      toast({ title: "Missing Information", description: validationError, variant: "destructive" });
      return;
    }
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateStep();
    if (validationError) {
      toast({ title: "Submission Error", description: validationError, variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    let profilePictureUrl: string | null = null;
    
    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `public/${fileName}`; 
      
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, avatarFile);

      if (uploadError) {
        toast({ title: "Upload Failed", description: uploadError.message, variant: "destructive" });
        setIsLoading(false);
        return;
      }
      
      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      profilePictureUrl = publicUrlData.publicUrl;
    }
    
    const encryptionSalt = generateSalt();
    
    const metadataForSupabase = {
      full_name: `${formData.firstName} ${formData.lastName}`.trim(),
      phone: formData.phone,
      user_role: registrationType,
      current_location: formData.location === 'other' ? formData.otherLocation : formData.location,
      institution: formData.institution === 'other' ? formData.otherInstitution : formData.institution,
      course: formData.course === 'other' ? formData.otherCourse : formData.course,
      year_of_study: formData.yearOfStudy,
      current_position: formData.currentPosition,
      organization: formData.organization,
      specialization: formData.specialization === 'other' ? formData.otherSpecialization : formData.specialization,
      years_experience: formData.experience,
      medical_license: formData.medicalLicense,
      bio: formData.bio,
      profile_picture_url: profilePictureUrl,
      encryption_salt: encryptionSalt,
    };
    
    const { data, error: signUpError } = await signUp(formData.email, formData.password, metadataForSupabase);

    setIsLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      toast({ title: "Registration Failed", description: signUpError.message, variant: "destructive" });
    } else if (data.user) {
      toast({ title: "Success!", description: "Please check your email to verify your account." });
      navigate('/please-verify', { replace: true, state: { email: formData.email } });
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return <RegistrationTypeStep registrationType={registrationType} setRegistrationType={setRegistrationType} onNext={handleNext} />;
      case 2:
      case 3:
        return (
          <div className="max-w-2xl mx-auto animate-slide-up">
            <Card className="card-medical">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-xl sm:text-2xl">
                  {step === 2 ? 'Personal Information' : registrationType === 'student' ? 'Educational Details' : 'Professional Details'}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  {step === 2 ? 'Please provide your basic information' : 'Complete your profile to join our network'}
                </CardDescription>
                
                <div className="flex items-center gap-2 mt-4">
                  <div className="flex-1 h-2 bg-primary rounded-full"></div>
                  <div className={`flex-1 h-2 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
                  <span className="text-xs sm:text-sm text-muted-foreground">Step {step} of 3</span>
                </div>
              </CardHeader>
              
              <CardContent className="p-4 sm:p-6 pt-0">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  {step === 2 && (
                    <PersonalDetailsStep
                      formData={formData}
                      handleInputChange={handleInputChange}
                      avatarPreview={avatarPreview}
                      handleAvatarChange={handleAvatarChange}
                      removeAvatar={removeAvatar}
                    />
                  )}

                  {step === 3 && (
                    <ProfessionalDetailsStep
                      formData={formData}
                      handleInputChange={handleInputChange}
                      registrationType={registrationType}
                    />
                  )}

                  <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6">
                    {step > 1 && (
                      <Button type="button" variant="outline" onClick={handleBack} className="order-2 sm:order-1">
                        Back
                      </Button>
                    )}

                    {step === 2 ? (
                      <Button type="button" size="lg" className="btn-medical order-1 sm:order-2 sm:ml-auto" onClick={handleNext}>
                        Next: Educational Details <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button type="submit" size="lg" className="btn-medical order-1 sm:order-2 sm:ml-auto" disabled={isLoading}>
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="text-center mt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in here</Link>
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-medical py-4 sm:py-8 px-4 sm:px-6">
        <div className="text-center mb-6 sm:mb-8 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Join AIMedNet Today</h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Create your professional healthcare profile and connect with verified medical professionals worldwide
          </p>
        </div>
        {renderStepContent()}
      </main>
      <Footer />
    </div>
  );
};

export default Register;
