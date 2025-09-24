import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
 * Multi-tier registration: Personal, Educational, Professional
 * Email verification with OTP system
 */
const Register = () => {
  const [step, setStep] = useState(1);
  const [registrationType, setRegistrationType] = useState('');
  const [formData, setFormData] = useState({
    // Personal Details
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    location: '',
    
    // Educational Details (for students)
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In real app, this would submit to API and send OTP
    console.log('Registration submitted:', formData);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-medical py-8">
        {/* Page Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-4">Join AIMedNet Today</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create your professional healthcare profile and connect with verified medical professionals worldwide
          </p>
        </div>

        {/* Registration Types */}
        {step === 1 && (
          <div className="max-w-4xl mx-auto animate-slide-up">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
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
                  description: 'For practicing healthcare professionals',
                  icon: Briefcase,
                  features: ['Complete profile', 'All forums access', 'Job opportunities', 'Priority support'],
                  price: '₹100/month (Premium)'
                },
                {
                  type: 'basic',
                  title: 'Basic Registration',
                  description: 'For healthcare industry professionals',
                  icon: User,
                  features: ['Basic profile', 'Limited forums', 'Networking', 'Job alerts'],
                  price: 'Free'
                }
              ].map((option) => (
                <Card 
                  key={option.type}
                  className={`card-medical cursor-pointer transition-all hover:shadow-hover ${
                    registrationType === option.type ? 'border-primary ring-2 ring-primary/20' : ''
                  }`}
                  onClick={() => setRegistrationType(option.type)}
                >
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <option.icon className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-xl">{option.title}</CardTitle>
                    <CardDescription>{option.description}</CardDescription>
                    <Badge variant={option.type === 'professional' ? 'default' : 'secondary'} className="mx-auto">
                      {option.price}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {option.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-success mr-2" />
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
                className="btn-medical px-8"
                disabled={!registrationType}
                onClick={handleNext}
              >
                Continue Registration
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Registration Form */}
        {(step === 2 || step === 3) && (
          <div className="max-w-2xl mx-auto animate-slide-up">
            <Card className="card-medical">
              <CardHeader>
                <CardTitle className="text-2xl">
                  {step === 2 ? 'Personal Information' : 'Professional Details'}
                </CardTitle>
                <CardDescription>
                  {step === 2 
                    ? 'Please provide your basic information' 
                    : registrationType === 'student' 
                      ? 'Educational background and current studies'
                      : 'Professional experience and credentials'
                  }
                </CardDescription>
                
                {/* Progress Indicator */}
                <div className="flex items-center gap-2 mt-4">
                  <div className="flex-1 h-2 bg-primary rounded-full"></div>
                  <div className={`flex-1 h-2 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
                  <span className="text-sm text-muted-foreground">Step {step} of 3</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {step === 2 && (
                    <>
                      <div className="grid md:grid-cols-2 gap-4">
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

                      <div className="grid md:grid-cols-2 gap-4">
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
                          <label className="block text-sm font-medium mb-2">Location *</label>
                          <Input 
                            value={formData.location}
                            onChange={(e) => handleInputChange('location', e.target.value)}
                            placeholder="City, State"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
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

                  {step === 3 && registrationType === 'student' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">Educational Institution *</label>
                        <Input 
                          value={formData.institution}
                          onChange={(e) => handleInputChange('institution', e.target.value)}
                          placeholder="Name of your college/university"
                          required
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Course/Program *</label>
                          <Select value={formData.course} onValueChange={(value) => handleInputChange('course', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your course" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mbbs">MBBS</SelectItem>
                              <SelectItem value="bds">BDS</SelectItem>
                              <SelectItem value="nursing">B.Sc Nursing</SelectItem>
                              <SelectItem value="pharmacy">B.Pharm</SelectItem>
                              <SelectItem value="physiotherapy">Physiotherapy</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Year of Study *</label>
                          <Select value={formData.yearOfStudy} onValueChange={(value) => handleInputChange('yearOfStudy', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Current year" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1st Year</SelectItem>
                              <SelectItem value="2">2nd Year</SelectItem>
                              <SelectItem value="3">3rd Year</SelectItem>
                              <SelectItem value="4">4th Year</SelectItem>
                              <SelectItem value="5">5th Year</SelectItem>
                              <SelectItem value="intern">Internship</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  )}

                  {step === 3 && registrationType === 'professional' && (
                    <>
                      <div className="grid md:grid-cols-2 gap-4">
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

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Specialization *</label>
                          <Select value={formData.specialization} onValueChange={(value) => handleInputChange('specialization', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select specialization" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cardiology">Cardiology</SelectItem>
                              <SelectItem value="pediatrics">Pediatrics</SelectItem>
                              <SelectItem value="emergency">Emergency Medicine</SelectItem>
                              <SelectItem value="surgery">Surgery</SelectItem>
                              <SelectItem value="nursing">Nursing</SelectItem>
                              <SelectItem value="pharmacy">Pharmacy</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Experience</label>
                          <Select value={formData.experience} onValueChange={(value) => handleInputChange('experience', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Years of experience" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0-1">0-1 years</SelectItem>
                              <SelectItem value="1-5">1-5 years</SelectItem>
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
                          placeholder="Brief description of your professional background and interests..."
                          className="min-h-24"
                        />
                      </div>
                    </>
                  )}

                  {step === 3 && registrationType === 'basic' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">Current Role</label>
                        <Input 
                          value={formData.currentPosition}
                          onChange={(e) => handleInputChange('currentPosition', e.target.value)}
                          placeholder="Your role in healthcare industry"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Organization</label>
                        <Input 
                          value={formData.organization}
                          onChange={(e) => handleInputChange('organization', e.target.value)}
                          placeholder="Company/Organization name"
                        />
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      {/* Subscription Options */}
                      {registrationType === 'professional' && (
                        <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
                          <h4 className="font-semibold mb-2">Premium Subscription</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Get priority listing, enhanced visibility, and premium support for ₹100/month
                          </p>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="premium"
                              checked={formData.subscriptionType === 'premium'}
                              onCheckedChange={(checked) => 
                                handleInputChange('subscriptionType', checked ? 'premium' : 'basic')
                              }
                            />
                            <label htmlFor="premium" className="text-sm">
                              Upgrade to Premium Profile (₹100/month)
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Terms and Conditions */}
                      <div className="space-y-4">
                        <div className="flex items-start space-x-2">
                          <Checkbox 
                            id="terms"
                            checked={formData.agreeToTerms}
                            onCheckedChange={(checked) => handleInputChange('agreeToTerms', !!checked)}
                            required
                          />
                          <label htmlFor="terms" className="text-sm">
                            I agree to the <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and{' '}
                            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                          </label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="updates"
                            checked={formData.receiveUpdates}
                            onCheckedChange={(checked) => handleInputChange('receiveUpdates', !!checked)}
                          />
                          <label htmlFor="updates" className="text-sm">
                            I want to receive updates about new features and networking opportunities
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-6 border-t border-border">
                    {step > 2 && (
                      <Button type="button" variant="outline" onClick={handleBack}>
                        Back
                      </Button>
                    )}
                    
                    <div className="ml-auto">
                      {step < 3 ? (
                        <Button type="button" onClick={handleNext} className="btn-medical">
                          Continue
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          type="submit" 
                          className="btn-medical"
                          disabled={!formData.agreeToTerms}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Create Account
                        </Button>
                      )}
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Login Link */}
            <div className="text-center mt-6">
              <p className="text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Register;