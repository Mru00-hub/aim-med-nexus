import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowRight, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap,
  Briefcase,
  Shield,
  CheckCircle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Registration Page for AIMedNet
 * Multi-tier registration: Student, Professional, Premium
 * Email verification with OTP system
 */
const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp } = useAuth();
  const [step, setStep] = useState(1);
  const [registrationType, setRegistrationType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    // Personal Details
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    location: '',
    
    // Educational Details (required for all)
    institution: '',
    course: '',
    yearOfStudy: '',
    
    // Professional Details
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
    
    // Preferences
    subscriptionType: 'basic',
    agreeToTerms: false,
    receiveUpdates: true
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!formData.agreeToTerms) {
      setError('You must agree to the terms and conditions.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      // Step 1: ONLY sign up the user. All profile insertion logic is removed.
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        // Let the catch block handle any signup errors (e.g., user already exists)
        throw error;
      }

      // Step 2: On success, redirect to a new "please verify" page.
      navigate('/please-verify', { replace: true, state: { email: formData.email } });

    } catch (err: any) {
      // The catch block will now only show errors from the signUp process.
      // The alert we added for debugging can be removed from here if you like.
      console.error('Registration failed:', err);
      alert('REGISTRATION FAILED:\n\n' + err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-medical py-4 sm:py-8 px-4 sm:px-6">
        {/* Page Header */}
        <div className="text-center mb-6 sm:mb-8 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Join AIMedNet Today</h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Create your professional healthcare profile and connect with verified medical professionals worldwide
          </p>
        </div>

        {/* Registration Types */}
        {step === 1 && (
          <div className="max-w-4xl mx-auto animate-slide-up">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
              {[
                {
                  type: 'student',
                  title: 'Student Registration',
                  description: 'For medical, nursing, and allied health students',
                  icon: GraduationCap,
                  features: ['Basic profile', 'Educational forums', 'Student networking', 'Career guidance'],
                  price: 'Free'
                },
                {
                  type: 'professional', 
                  title: 'Professional Registration',
                  description: 'For all healthcare industry professionals (free)',
                  icon: Briefcase,
                  features: ['Unlimited forums access', 'Full networking capabilities', 'Job alerts & opportunities', 'Career upskilling resources'],
                  price: 'Free'
                },
                {
                  type: 'premium',
                  title: 'Premium Registration', 
                  description: 'For practicing medical & allied healthcare professionals',
                  icon: User,
                  features: ['Priority access & listing', 'Enhanced profile visibility', 'Priority customer support', 'Special partner discounts'],
                  price: '₹100/month'
                }
              ].map((option) => (
                <Card 
                  key={option.type}
                  className={`card-medical cursor-pointer transition-all hover:shadow-hover ${
                    registrationType === option.type ? 'border-primary ring-2 ring-primary/20' : ''
                  }`}
                  onClick={() => setRegistrationType(option.type)}
                >
                  <CardHeader className="text-center p-4 sm:p-6">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <option.icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl">{option.title}</CardTitle>
                    <CardDescription className="text-sm sm:text-base">{option.description}</CardDescription>
                    <Badge variant={option.type === 'premium' ? 'default' : 'secondary'} className="mx-auto">
                      {option.price}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <ul className="space-y-2">
                      {option.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-xs sm:text-sm">
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button 
                size="lg" 
                className="btn-medical px-6 sm:px-8 text-sm sm:text-base"
                disabled={!registrationType}
                onClick={handleNext}
              >
                Continue Registration
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Registration Form */}
        {(step === 2 || step === 3) && (
          <div className="max-w-2xl mx-auto animate-slide-up">
            <Card className="card-medical">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-xl sm:text-2xl">
                  {step === 2 ? 'Personal Information' : 
                   registrationType === 'student' ? 'Educational Details' : 'Professional Details'}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  {step === 2 
                    ? 'Please provide your basic information' 
                    : registrationType === 'student' 
                      ? 'Educational background and current studies (required for all registrations)'
                      : 'Professional experience and credentials'
                  }
                </CardDescription>
                
                {/* Progress Indicator */}
                <div className="flex items-center gap-2 mt-4">
                  <div className="flex-1 h-2 bg-primary rounded-full"></div>
                  <div className={`flex-1 h-2 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
                  <span className="text-xs sm:text-sm text-muted-foreground">Step {step} of 3</span>
                </div>
              </CardHeader>
              
              <CardContent className="p-4 sm:p-6 pt-0">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  {step === 2 && (
                    <>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">First Name *</label>
                          <Input 
                            value={formData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            placeholder="Enter your first name"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Last Name *</label>
                          <Input 
                            value={formData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            placeholder="Enter your last name"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Email Address *</label>
                        <Input 
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="your.email@example.com"
                          required
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Phone Number</label>
                          <Input 
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="+91 XXXXX XXXXX"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Current Location *</label>
                          <Select value={formData.location} onValueChange={(value) => handleInputChange('location', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your city/town" />
                            </SelectTrigger>
                            <SelectContent className="max-h-48 overflow-y-auto">
                              <SelectItem value="mumbai">Mumbai, Maharashtra</SelectItem>
                              <SelectItem value="delhi">New Delhi</SelectItem>
                              <SelectItem value="bangalore">Bangalore, Karnataka</SelectItem>
                              <SelectItem value="hyderabad">Hyderabad, Telangana</SelectItem>
                              <SelectItem value="chennai">Chennai, Tamil Nadu</SelectItem>
                              <SelectItem value="kolkata">Kolkata, West Bengal</SelectItem>
                              <SelectItem value="pune">Pune, Maharashtra</SelectItem>
                              <SelectItem value="ahmedabad">Ahmedabad, Gujarat</SelectItem>
                              <SelectItem value="jaipur">Jaipur, Rajasthan</SelectItem>
                              <SelectItem value="lucknow">Lucknow, Uttar Pradesh</SelectItem>
                              <SelectItem value="kanpur">Kanpur, Uttar Pradesh</SelectItem>
                              <SelectItem value="nagpur">Nagpur, Maharashtra</SelectItem>
                              <SelectItem value="indore">Indore, Madhya Pradesh</SelectItem>
                              <SelectItem value="thane">Thane, Maharashtra</SelectItem>
                              <SelectItem value="bhopal">Bhopal, Madhya Pradesh</SelectItem>
                              <SelectItem value="visakhapatnam">Visakhapatnam, Andhra Pradesh</SelectItem>
                              <SelectItem value="pimpri">Pimpri-Chinchwad, Maharashtra</SelectItem>
                              <SelectItem value="patna">Patna, Bihar</SelectItem>
                              <SelectItem value="vadodara">Vadodara, Gujarat</SelectItem>
                              <SelectItem value="ghaziabad">Ghaziabad, Uttar Pradesh</SelectItem>
                              <SelectItem value="ludhiana">Ludhiana, Punjab</SelectItem>
                              <SelectItem value="agra">Agra, Uttar Pradesh</SelectItem>
                              <SelectItem value="nashik">Nashik, Maharashtra</SelectItem>
                              <SelectItem value="faridabad">Faridabad, Haryana</SelectItem>
                              <SelectItem value="meerut">Meerut, Uttar Pradesh</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          {formData.location === 'other' && (
                            <div className="mt-2">
                              <Input
                                value={formData.otherLocation}
                                onChange={(e) => handleInputChange('otherLocation', e.target.value)}
                                placeholder="Please specify your location"
                                required
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Password *</label>
                          <Input 
                            type="password"
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            placeholder="Create a strong password"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Confirm Password *</label>
                          <Input 
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                            placeholder="Confirm your password"
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Educational Details - Required for ALL registration types */}
                  {step === 3 && (
                    <>
                      <div className="bg-muted/30 p-4 rounded-lg mb-6">
                        <h4 className="font-semibold text-primary mb-2">Educational Background (Required)</h4>
                        <p className="text-sm text-muted-foreground">
                          All members must provide educational details to maintain our professional community standards.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Educational Institution *</label>
                        <Select value={formData.institution} onValueChange={(value) => handleInputChange('institution', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your college/university" />
                          </SelectTrigger>
                          <SelectContent className="max-h-48 overflow-y-auto">
                            <SelectItem value="aiims-delhi">AIIMS New Delhi</SelectItem>
                            <SelectItem value="aiims-mumbai">AIIMS Mumbai</SelectItem>
                            <SelectItem value="aiims-jodhpur">AIIMS Jodhpur</SelectItem>
                            <SelectItem value="aiims-bhopal">AIIMS Bhopal</SelectItem>
                            <SelectItem value="aiims-patna">AIIMS Patna</SelectItem>
                            <SelectItem value="aiims-raipur">AIIMS Raipur</SelectItem>
                            <SelectItem value="aiims-bhubaneswar">AIIMS Bhubaneswar</SelectItem>
                            <SelectItem value="aiims-rishikesh">AIIMS Rishikesh</SelectItem>
                            <SelectItem value="kgmu">KGMU Lucknow</SelectItem>
                            <SelectItem value="bhu">BHU Varanasi</SelectItem>
                            <SelectItem value="jipmer">JIPMER Puducherry</SelectItem>
                            <SelectItem value="cmc-vellore">CMC Vellore</SelectItem>
                            <SelectItem value="afmc">AFMC Pune</SelectItem>
                            <SelectItem value="maulana-azad">Maulana Azad Medical College, Delhi</SelectItem>
                            <SelectItem value="grant-medical">Grant Medical College, Mumbai</SelectItem>
                            <SelectItem value="seth-gs">Seth GS Medical College, Mumbai</SelectItem>
                            <SelectItem value="stanley-medical">Stanley Medical College, Chennai</SelectItem>
                            <SelectItem value="madras-medical">Madras Medical College, Chennai</SelectItem>
                            <SelectItem value="bangalore-medical">Bangalore Medical College</SelectItem>
                            <SelectItem value="mysore-medical">Mysore Medical College</SelectItem>
                            <SelectItem value="osmania-medical">Osmania Medical College, Hyderabad</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        {formData.institution === 'other' && (
                          <div className="mt-2">
                            <Input
                              value={formData.otherInstitution}
                              onChange={(e) => handleInputChange('otherInstitution', e.target.value)}
                              placeholder="Please specify your institution"
                              required
                            />
                          </div>
                        )}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Course/Program *</label>
                          <Select value={formData.course} onValueChange={(value) => handleInputChange('course', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your course" />
                            </SelectTrigger>
                            <SelectContent className="max-h-48 overflow-y-auto">
                              <SelectItem value="mbbs">MBBS (Bachelor of Medicine and Bachelor of Surgery)</SelectItem>
                              <SelectItem value="bds">BDS (Bachelor of Dental Surgery)</SelectItem>
                              <SelectItem value="bams">BAMS (Bachelor of Ayurvedic Medicine and Surgery)</SelectItem>
                              <SelectItem value="bhms">BHMS (Bachelor of Homoeopathic Medicine and Surgery)</SelectItem>
                              <SelectItem value="bums">BUMS (Bachelor of Unani Medicine and Surgery)</SelectItem>
                              <SelectItem value="bsc-nursing">B.Sc Nursing</SelectItem>
                              <SelectItem value="gnm">GNM (General Nursing and Midwifery)</SelectItem>
                              <SelectItem value="anm">ANM (Auxiliary Nurse Midwife)</SelectItem>
                              <SelectItem value="bpharm">B.Pharm (Bachelor of Pharmacy)</SelectItem>
                              <SelectItem value="dpharm">D.Pharm (Diploma in Pharmacy)</SelectItem>
                              <SelectItem value="bpt">BPT (Bachelor of Physiotherapy)</SelectItem>
                              <SelectItem value="mpt">MPT (Master of Physiotherapy)</SelectItem>
                              <SelectItem value="bot">BOT (Bachelor of Occupational Therapy)</SelectItem>
                              <SelectItem value="boptometry">B.Optometry</SelectItem>
                              <SelectItem value="bmlt">BMLT (Bachelor of Medical Laboratory Technology)</SelectItem>
                              <SelectItem value="dmlt">DMLT (Diploma in Medical Laboratory Technology)</SelectItem>
                              <SelectItem value="brt">BRT (Bachelor of Radiography Technology)</SelectItem>
                              <SelectItem value="baslp">BASLP (Bachelor of Audiology and Speech Language Pathology)</SelectItem>
                              <SelectItem value="bperfusion">B.Perfusion Technology</SelectItem>
                              <SelectItem value="md">MD (Doctor of Medicine)</SelectItem>
                              <SelectItem value="ms">MS (Master of Surgery)</SelectItem>
                              <SelectItem value="mds">MDS (Master of Dental Surgery)</SelectItem>
                              <SelectItem value="msc-nursing">M.Sc Nursing</SelectItem>
                              <SelectItem value="mpharm">M.Pharm (Master of Pharmacy)</SelectItem>
                              <SelectItem value="fellowship">Fellowship Programs</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          {formData.course === 'other' && (
                            <div className="mt-2">
                              <Input
                                value={formData.otherCourse}
                                onChange={(e) => handleInputChange('otherCourse', e.target.value)}
                                placeholder="Please specify your course"
                                required
                              />
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Year/Status *</label>
                          <Select value={formData.yearOfStudy} onValueChange={(value) => handleInputChange('yearOfStudy', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Current year/status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1st Year</SelectItem>
                              <SelectItem value="2">2nd Year</SelectItem>
                              <SelectItem value="3">3rd Year</SelectItem>
                              <SelectItem value="4">4th Year</SelectItem>
                              <SelectItem value="5">5th Year</SelectItem>
                              <SelectItem value="intern">Internship</SelectItem>
                              <SelectItem value="graduated">Graduated</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Professional Details for non-student registrations */}
                      {registrationType === 'professional' && (
                        <>
                          <div className="bg-muted/30 p-4 rounded-lg mb-4">
                            <h4 className="font-semibold text-primary mb-2">Professional Information</h4>
                            <p className="text-sm text-muted-foreground">
                              Details about your current role in the healthcare industry.
                            </p>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">Current Position *</label>
                              <Input 
                                value={formData.currentPosition}
                                onChange={(e) => handleInputChange('currentPosition', e.target.value)}
                                placeholder="e.g., Business Analyst, Sales Manager"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">Organization *</label>
                              <Input 
                                value={formData.organization}
                                onChange={(e) => handleInputChange('organization', e.target.value)}
                                placeholder="Company/Organization name"
                                required
                              />
                            </div>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">Field/Domain *</label>
                              <Select value={formData.specialization} onValueChange={(value) => handleInputChange('specialization', value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your field" />
                                </SelectTrigger>
                                <SelectContent className="max-h-48 overflow-y-auto">
                                  <SelectItem value="healthcare-service">Healthcare Service</SelectItem>
                                  <SelectItem value="healthcare-administration">Healthcare Administration</SelectItem>
                                  <SelectItem value="medical-devices">Medical Devices</SelectItem>
                                  <SelectItem value="pharmaceuticals">Pharmaceuticals</SelectItem>
                                  <SelectItem value="health-insurance">Health Insurance</SelectItem>
                                  <SelectItem value="healthcare-consulting">Healthcare Consulting</SelectItem>
                                  <SelectItem value="health-technology">Health Technology</SelectItem>
                                  <SelectItem value="medical-writing">Medical Writing</SelectItem>
                                  <SelectItem value="clinical-research">Clinical Research</SelectItem>
                                  <SelectItem value="regulatory-affairs">Regulatory Affairs</SelectItem>
                                  <SelectItem value="medical-sales">Medical Sales</SelectItem>
                                  <SelectItem value="health-marketing">Health Marketing</SelectItem>
                                  <SelectItem value="biomedical-engineering">Biomedical Engineering</SelectItem>
                                  <SelectItem value="health-informatics">Health Informatics</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              {formData.specialization === 'other' && (
                                <div className="mt-2">
                                  <Input
                                    value={formData.otherSpecialization}
                                    onChange={(e) => handleInputChange('otherSpecialization', e.target.value)}
                                    placeholder="Please specify your specialization"
                                    required
                                  />
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">Experience*</label>
                              <Select value={formData.experience} onValueChange={(value) => handleInputChange('experience', value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Years of experience" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="fresh">0-1 years</SelectItem>
                                  <SelectItem value="1-3">1-3 years</SelectItem>
                                  <SelectItem value="3-5">3-5 years</SelectItem>
                                  <SelectItem value="5-10">5-10 years</SelectItem>
                                  <SelectItem value="10+">10+ years</SelectItem>
                                </SelectContent>
                               </Select>
                             </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Professional Bio</label>
                            <Textarea 
                              value={formData.bio}
                              onChange={(e) => handleInputChange('bio', e.target.value)}
                              placeholder="Brief description of your professional background in healthcare industry..."
                              rows={3}
                            />
                          </div>
                        </>
                      )}

                      {/* Premium Registration Additional Details */}
                      {registrationType === 'premium' && (
                        <>
                          <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg mb-4">
                            <h4 className="font-semibold text-primary mb-2">Premium Member Benefits</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              As a premium member, you'll receive priority access, enhanced visibility, and special partner discounts.
                            </p>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">Current Position *</label>
                              <Input 
                                value={formData.currentPosition}
                                onChange={(e) => handleInputChange('currentPosition', e.target.value)}
                                placeholder="e.g., Senior Consultant"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">Organization *</label>
                              <Input 
                                value={formData.organization}
                                onChange={(e) => handleInputChange('organization', e.target.value)}
                                placeholder="Hospital/Clinic name"
                                required
                              />
                            </div>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">Specialization *</label>
                              <Select value={formData.specialization} onValueChange={(value) => handleInputChange('specialization', value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select specialization" />
                                </SelectTrigger>
                                <SelectContent className="max-h-48 overflow-y-auto">
                                  <SelectItem value="general-physician">General Physician</SelectItem>
                                  <SelectItem value="cardiology">Cardiology</SelectItem>
                                  <SelectItem value="dermatology">Dermatology</SelectItem>
                                  <SelectItem value="endocrinology">Endocrinology</SelectItem>
                                  <SelectItem value="gastroenterology">Gastroenterology</SelectItem>
                                  <SelectItem value="hematology">Hematology</SelectItem>
                                  <SelectItem value="nephrology">Nephrology</SelectItem>
                                  <SelectItem value="neurology">Neurology</SelectItem>
                                  <SelectItem value="oncology">Oncology</SelectItem>
                                  <SelectItem value="pediatrics">Pediatrics</SelectItem>
                                  <SelectItem value="psychiatry">Psychiatry</SelectItem>
                                  <SelectItem value="pulmonology">Pulmonology</SelectItem>
                                  <SelectItem value="rheumatology">Rheumatology</SelectItem>
                                  <SelectItem value="emergency">Emergency Medicine</SelectItem>
                                  <SelectItem value="family-medicine">Family Medicine</SelectItem>
                                  <SelectItem value="internal-medicine">Internal Medicine</SelectItem>
                                  <SelectItem value="anesthesiology">Anesthesiology</SelectItem>
                                  <SelectItem value="radiology">Radiology</SelectItem>
                                  <SelectItem value="pathology">Pathology</SelectItem>
                                  <SelectItem value="forensic">Forensic Medicine</SelectItem>
                                  <SelectItem value="community-medicine">Community Medicine</SelectItem>
                                  <SelectItem value="general-surgery">General Surgery</SelectItem>
                                  <SelectItem value="orthopedics">Orthopedics</SelectItem>
                                  <SelectItem value="neurosurgery">Neurosurgery</SelectItem>
                                  <SelectItem value="cardiac-surgery">Cardiac Surgery</SelectItem>
                                  <SelectItem value="plastic-surgery">Plastic Surgery</SelectItem>
                                  <SelectItem value="ophthalmology">Ophthalmology</SelectItem>
                                  <SelectItem value="ent">ENT (Otorhinolaryngology)</SelectItem>
                                  <SelectItem value="obstetrics-gynecology">Obstetrics & Gynecology</SelectItem>
                                  <SelectItem value="urology">Urology</SelectItem>
                                  <SelectItem value="dentistry">General Dentistry</SelectItem>
                                  <SelectItem value="oral-surgery">Oral & Maxillofacial Surgery</SelectItem>
                                  <SelectItem value="orthodontics">Orthodontics</SelectItem>
                                  <SelectItem value="periodontics">Periodontics</SelectItem>
                                  <SelectItem value="nursing">Nursing</SelectItem>
                                  <SelectItem value="critical-care-nursing">Critical Care Nursing</SelectItem>
                                  <SelectItem value="pediatric-nursing">Pediatric Nursing</SelectItem>
                                  <SelectItem value="psychiatric-nursing">Psychiatric Nursing</SelectItem>
                                  <SelectItem value="pharmacy">Pharmacy</SelectItem>
                                  <SelectItem value="clinical-pharmacy">Clinical Pharmacy</SelectItem>
                                  <SelectItem value="hospital-pharmacy">Hospital Pharmacy</SelectItem>
                                  <SelectItem value="physiotherapy">Physiotherapy</SelectItem>
                                  <SelectItem value="occupational-therapy">Occupational Therapy</SelectItem>
                                  <SelectItem value="medical-lab-technology">Medical Laboratory Technology</SelectItem>
                                  <SelectItem value="radiology-technology">Radiology Technology</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              {formData.specialization === 'other' && (
                                <div className="mt-2">
                                  <Input
                                    value={formData.otherSpecialization}
                                    onChange={(e) => handleInputChange('otherSpecialization', e.target.value)}
                                    placeholder="Please specify your specialization"
                                    required
                                  />
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">Experience*</label>
                              <Select value={formData.experience} onValueChange={(value) => handleInputChange('experience', value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Years of experience" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="fresh">0-1 years</SelectItem>
                                  <SelectItem value="1-3">1-3 years</SelectItem>
                                  <SelectItem value="3-5">3-5 years</SelectItem>
                                  <SelectItem value="5-10">5-10 years</SelectItem>
                                  <SelectItem value="10+">10+ years</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Medical License Number</label>
                            <Input 
                              value={formData.medicalLicense}
                              onChange={(e) => handleInputChange('medicalLicense', e.target.value)}
                              placeholder="License/Registration number (optional)"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Professional Bio</label>
                            <Textarea 
                              value={formData.bio}
                              onChange={(e) => handleInputChange('bio', e.target.value)}
                              placeholder="Brief description of your professional background..."
                              rows={3}
                            />
                          </div>
                        </>
                      )}

                      {/* Terms and Conditions */}
                      <div className="space-y-4">
                        <div className="flex items-start space-x-2">
                          <Checkbox 
                            id="terms"
                            checked={formData.agreeToTerms}
                            onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked as boolean)}
                          />
                          <label htmlFor="terms" className="text-sm text-muted-foreground leading-5">
                            I agree to the <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and{' '}
                            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                          </label>
                        </div>

                        <div className="flex items-start space-x-2">
                          <Checkbox 
                            id="updates"
                            checked={formData.receiveUpdates}
                            onCheckedChange={(checked) => handleInputChange('receiveUpdates', checked as boolean)}
                          />
                          <label htmlFor="updates" className="text-sm text-muted-foreground leading-5">
                            I want to receive updates about new features and opportunities
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Form Navigation */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6">
                    {step > 2 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleBack}
                        className="order-2 sm:order-1"
                      >
                        Back
                      </Button>
                    )}

                    {step === 2 ? (
                      <Button 
                        type="button" 
                        size="lg" 
                        className="btn-medical order-1 sm:order-2 sm:ml-auto"
                        onClick={handleNext}
                      >
                        Next: Educational Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        type="submit" 
                        size="lg" 
                        className="btn-medical order-1 sm:order-2 sm:ml-auto"
                        disabled={!formData.agreeToTerms}
                      >
                        {registrationType === 'premium' ? 'Proceed to Payment' : 'Create Account'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <div className="text-center mt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in here</Link>
              </p>
              
              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Need Help?</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Our team is here to assist you with registration and account setup.
                </p>
                <p className="text-xs text-muted-foreground">
                  📧 Contact: <a href="mailto:mrudulabhalke75917@gmail.com" className="text-primary hover:underline">mrudulabhalke75917@gmail.com</a>
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Register;
