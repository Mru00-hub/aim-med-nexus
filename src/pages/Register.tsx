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
import { ArrowRight, Eye, EyeOff } from 'lucide-react';

// Step Components
import { RegistrationTypeStep } from '@/components/register/RegistrationTypeStep';
import { PersonalDetailsStep } from '@/components/register/PersonalDetailsStep';
import { ProfessionalDetailsStep } from '@/components/register/ProfessionalDetailsStep';

// Initial state for the form
const initialFormData = {
  firstName: '',
  lastName: '',
  email: '',
  date_of_birth: '',
  phone: '',
  password: '',
  confirmPassword: '',
  location_id: '',
  institution_id: '',
  course_id: '',
  student_year_value: '',
  currentPosition: '',
  organization: '',
  specialization_id: '',
  experience_level_value: '',
  medicalLicense: '',
  bio: '',
  location_other: '',
  institution_other: '',
  course_other: '',
  specialization_other: '',
  agreeToTerms: false,
  receiveUpdates: true,
};

const validatePassword = (password: string) => {
  if (!password) return "Password is required.";
  if (password.length < 6) return "Must be at least 6 characters long.";
  if (!/[A-Z]/.test(password)) return "Must include one uppercase letter.";
  if (!/[0-9]/.test(password)) return "Must include one number.";
  if (!/[!@#$%^&*]/.test(password)) return "Must include one special character (e.g., !@#$).";
  return ""; // Valid
};

const validatePhone = (phone: string) => {
  if (!phone) return ""; // It's optional, so empty is fine.
  
  // Simple regex: must start with '+' and be followed by 9 to 15 digits.
  // This covers international formats like +91xxxxxxxxxx or +1xxxxxxxxxx
  const phoneRegex = /^\+[0-9]{9,15}$/;
  
  if (!phoneRegex.test(phone)) {
    return "Phone number must be in international format (e.g., +91XXXXXXXXXX).";
  }
  return ""; // Valid
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
  const [passwordError, setPasswordError] = useState('');
  const [passwordFormatError, setPasswordFormatError] = useState('');
  const [phoneFormatError, setPhoneFormatError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'password') {
      const formatError = validatePassword(String(value));
      setPasswordFormatError(formatError); // Set format error in real-time
      
      // Also check for match if confirmPassword already has a value
      if (formData.confirmPassword && String(value) !== formData.confirmPassword) {
        setPasswordError("Passwords do not match.");
      } else {
        setPasswordError(''); // Clear match error if it's now correct
      }
    }
    
    if (field === 'confirmPassword') {
      // Check for match
      if (formData.password !== String(value)) {
        setPasswordError("Passwords do not match.");
      } else {
        setPasswordError('');
      }
    }
    if (field === 'phone') {
      // Validate in real-time as the user types
      setPhoneFormatError(validatePhone(String(value)));
    }
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

  const validateStep = (stepToValidate: number) => {
    if (stepToValidate === 2) {
      const { firstName, lastName, email, date_of_birth, location_id, password, confirmPassword } = formData;
      if (!firstName || !lastName || !email || !date_of_birth || !location_id || !password || !confirmPassword) return "Please fill in all required personal information fields.";
      const phoneError = validatePhone(phone);
      if (phoneError) return phoneError;
      // Use the validation function
      const formatError = validatePassword(password);
      if (formatError) return formatError; // Return the specific format error

      if (password !== confirmPassword) return "Passwords do not match.";
      // No need to check passwordError state, just check the data directly
    }
    if (stepToValidate === 3) {
      const { institution_id, course_id, student_year_value, currentPosition, organization, specialization_id, experience_level_value, agreeToTerms } = formData;
      if (!institution_id || !course_id) return "Educational institution and course are required.";
      if (registrationType === 'student' && !student_year_value) return "Please select your year of study.";
      if (registrationType === 'professional' && (!currentPosition || !organization || !specialization_id || !experience_level_value)) return "Please fill in all required professional fields.";
      if (!agreeToTerms) return "You must agree to the terms and conditions.";
    }
    return ''; // No errors
  };

  const handleNext = () => {
    const validationError = validateStep(step); 
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
    const step2Error = validateStep(2);
    if (step2Error) {
      toast({ title: "Submission Error", description: step2Error, variant: "destructive" });
      setStep(2); // Send the user back to Step 2
      return;
    }
    
    const step3Error = validateStep(3);
    if (step3Error) {
      toast({ title: "Submission Error", description: step3Error, variant: "destructive" });
      return; // Already on Step 3, just stop
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
    const cleanUUID = (id: string | undefined | null): string | null => {
      // Basic check: is it a falsy value, "other", or clearly not a UUID?
      if (!id || id === 'other' || id.length < 36) { 
        return null;
      }
      return id; // Assume it's a valid UUID
    };
    const cleanDate = (dateStr: string | undefined | null): string | null => {
      if (!dateStr) return null; // Handles "", null, undefined
      
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) { // Check for "Invalid Date" (e.g., from "garbage" text)
        return null;
      }
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    };
    
    const metadataForSupabase = {
      full_name: `${formData.firstName} ${formData.lastName}`.trim(),
      date_of_birth: cleanDate(formData.date_of_birth),
      phone: formData.phone || null,
      user_role: registrationType,
      location_id: formData.location_id === 'other' ? null : formData.location_id,
      location_other: formData.location_id === 'other' ? formData.location_other : null,
      institution_id: formData.institution_id === 'other' ? null : formData.institution_id,
      institution_other: formData.institution_id === 'other' ? formData.institution_other : null,
      course_id: formData.course_id === 'other' ? null : formData.course_id,
      course_other: formData.course_id === 'other' ? formData.course_other : null,
      student_year_value: formData.student_year_value || null,
      current_position: formData.currentPosition || null,
      organization: formData.organization || null,
      specialization_id: formData.specialization_id === 'other' ? null : formData.specialization_id,
      specialization_other: formData.specialization_id === 'other' ? formData.specialization_other : null,
      experience_level_value: formData.experience_level_value || null,
      medical_license: formData.medicalLicense || null,
      bio: formData.bio || null,
      profile_picture_url: profilePictureUrl,
      encryption_salt: encryptionSalt,
    };
    console.log("Submitting this metadata:", metadataForSupabase);
    
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
              
              {step === 2 && (
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-4 sm:space-y-6">
                    <PersonalDetailsStep
                      formData={formData}
                      handleInputChange={handleInputChange}
                      avatarPreview={avatarPreview}
                      handleAvatarChange={handleAvatarChange}
                      removeAvatar={removeAvatar}
                      passwordError={passwordError}
                      passwordFormatError={passwordFormatError}
                      phoneFormatError={phoneFormatError}
                      showPassword={showPassword}
                      setShowPassword={setShowPassword}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6">
                    {/* Back button is always type="button" */}
                    <Button type="button" variant="outline" onClick={handleBack} className="order-2 sm:order-1">
                      Back
                    </Button>
                    {/* Next button is type="button" and not in a form */}
                    <Button type="button" size="lg" className="btn-medical order-1 sm:order-2 sm:ml-auto" onClick={handleNext}>
                      Next: Educational Details <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              )}

              {step === 3 && (
                // ✅ FIX 3: The <form> tag starts here, only for step 3
                <form onSubmit={handleSubmit}> 
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="space-y-4 sm:space-y-6">
                      <ProfessionalDetailsStep
                        formData={formData}
                        handleInputChange={handleInputChange}
                        registrationType={registrationType}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6">
                      {/* Back button is type="button" */}
                      <Button type="button" variant="outline" onClick={handleBack} className="order-2 sm:order-1">
                        Back
                      </Button>
                      {/* Submit button is type="submit" and is now correctly inside the form */}
                      <Button type="submit" size="lg" className="btn-medical order-1 sm:order-2 sm:ml-auto" disabled={isLoading}>
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </form>
              )}
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
      <main className="py-4 sm:py-8">
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
