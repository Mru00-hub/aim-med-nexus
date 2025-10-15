import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Building2, 
  Handshake, 
  Globe, 
  Send,
  CheckCircle,
  Users,
  Loader2, // Import loader icon for button
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner'; // Using sonner for toasts, as seen in your ui folder
import { submitPartnershipProposal, PartnershipProposal } from '@/integrations/supabase/partnership.api';

// Initial form state
const initialFormData = {
  organizationType: '',
  organizationName: '',
  contactName: '',
  email: '',
  phone: '',
  partnershipType: '',
  description: '',
  website: ''
};

const Partnerships = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  
  // State for the "Other" input fields
  const [otherOrganizationType, setOtherOrganizationType] = useState('');
  const [otherPartnershipType, setOtherPartnershipType] = useState('');
  
  // A unique ID for the submission success page
  const [submissionId, setSubmissionId] = useState('');

  const handleInputChange = (field: keyof typeof initialFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const resetForm = () => {
      setFormData(initialFormData);
      setOtherOrganizationType('');
      setOtherPartnershipType('');
      setIsSubmitted(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation for "Other" fields
    if (formData.organizationType === 'other' && !otherOrganizationType.trim()) {
        toast.error('Please specify your organization type.');
        return;
    }
    if (formData.partnershipType === 'other' && !otherPartnershipType.trim()) {
        toast.error('Please specify your partnership type.');
        return;
    }

    setIsLoading(true);

    const proposalData: PartnershipProposal = {
      organization_type: formData.organizationType,
      organization_type_other: formData.organizationType === 'other' ? otherOrganizationType : undefined,
      organization_name: formData.organizationName,
      website: formData.website || undefined,
      contact_name: formData.contactName,
      email: formData.email,
      phone: formData.phone || undefined,
      partnership_type: formData.partnershipType,
      partnership_type_other: formData.partnershipType === 'other' ? otherPartnershipType : undefined,
      description: formData.description,
    };

    try {
      const { data } = await submitPartnershipProposal(proposalData);
      setSubmissionId(data.id.slice(0, 8).toUpperCase());
      setIsSubmitted(true);
      toast.success('Proposal submitted successfully!');
    } catch (error) {
      toast.error('Submission failed. Please try again later.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container-medical py-16">
          <div className="max-w-2xl mx-auto text-center animate-scale-in">
            <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-primary-foreground" />
            </div>
            
            <h1 className="text-3xl font-bold mb-4">Partnership Proposal Submitted!</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Thank you for your interest in partnering with AIMedNet. Our team will review your proposal 
              and get back to you within 3-5 business days.
            </p>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Reference ID: <span className="font-mono font-bold">AIMEDNET-{submissionId}</span>
              </p>
              
              <Button className="btn-medical" onClick={resetForm}>
                Submit Another Proposal
              </Button>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-medical py-8">
        {/* Page Header remains the same */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold mb-4">Partnership Opportunities</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join us in building the future of healthcare professional networking. 
            Partner with AIMedNet to reach verified healthcare professionals.
          </p>
        </div>

        {/* Partnership Types section remains the same */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 animate-slide-up">
         {[
            {
              icon: Building2,
              title: 'Healthcare Organizations',
              description: 'Hospitals, clinics, and healthcare systems partnering for staff networking and professional development.',
              benefits: ['Staff networking platform', 'Continued education support', 'Talent acquisition access']
            },
            {
              icon: Handshake,
              title: 'Medical Education Partners',
              description: 'Medical schools and training institutions bridging education and professional practice.',
              benefits: ['Student-professional mentorship', 'Career placement support', 'Educational content partnership']
            },
            {
              icon: Globe,
              title: 'Healthcare Technology',
              description: 'Technology companies serving healthcare professionals with innovative solutions.',
              benefits: ['Verified professional access', 'Product feedback loops', 'Innovation showcasing']
            },
            {
              icon: Users,
              title: 'Medical Associations & Clubs',
              description: 'Medical associations, clubs, and societies for conferences, CME programs, event management, and elections.',
              benefits: ['Conference management', 'CME registration system', 'Online/offline events', 'Elections management']
            }
          ].map((partnership, index) => (
            <Card key={index} className="card-medical h-full">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                  <partnership.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl">{partnership.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {partnership.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-primary">Key Benefits:</h4>
                  <ul className="space-y-2">
                    {partnership.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3 flex-shrink-0"></div>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Partnership Form */}
        <div className="max-w-4xl mx-auto animate-slide-up">
          <Card className="card-premium border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Submit Partnership Proposal</CardTitle>
              <CardDescription className="text-lg">
                Tell us about your organization and how we can collaborate
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Organization Type */}
                  <div className="space-y-2">
                    <label htmlFor="orgType" className="block text-sm font-medium">Organization Type *</label>
                    <Select value={formData.organizationType} onValueChange={(value) => handleInputChange('organizationType', value)} required>
                      <SelectTrigger id="orgType">
                        <SelectValue placeholder="Select organization type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hospital">Hospital/Healthcare System</SelectItem>
                        <SelectItem value="medical-school">Medical School/College</SelectItem>
                        <SelectItem value="medical-association">Medical Association/Club</SelectItem>
                        <SelectItem value="technology">Healthcare Technology</SelectItem>
                        <SelectItem value="pharmaceutical">Pharmaceutical Company</SelectItem>
                        <SelectItem value="research">Research Institution</SelectItem>
                        <SelectItem value="nonprofit">Non-profit Organization</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.organizationType === 'other' && (
                        <Input
                            placeholder="Please specify organization type"
                            value={otherOrganizationType}
                            onChange={(e) => setOtherOrganizationType(e.target.value)}
                            required
                            className="mt-2 animate-fade-in"
                        />
                    )}
                  </div>

                  {/* Partnership Type */}
                  <div className="space-y-2">
                    <label htmlFor="partnerType" className="block text-sm font-medium">Partnership Type *</label>
                    <Select value={formData.partnershipType} onValueChange={(value) => handleInputChange('partnershipType', value)} required>
                      <SelectTrigger id="partnerType">
                        <SelectValue placeholder="Select partnership type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="platform-integration">Platform Integration</SelectItem>
                        <SelectItem value="content-partnership">Content Partnership</SelectItem>
                        <SelectItem value="education">Educational Collaboration</SelectItem>
                        <SelectItem value="conference-management">Conference Management</SelectItem>
                        <SelectItem value="cme-registration">CME Registration System</SelectItem>
                        <SelectItem value="event-management">Online/Offline Event Management</SelectItem>
                        <SelectItem value="elections-management">Elections Management</SelectItem>
                        <SelectItem value="recruitment">Talent Recruitment</SelectItem>
                        <SelectItem value="technology">Technology Partnership</SelectItem>
                        <SelectItem value="sponsorship">Sponsorship</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.partnershipType === 'other' && (
                         <Input
                            placeholder="Please specify partnership type"
                            value={otherPartnershipType}
                            onChange={(e) => setOtherPartnershipType(e.target.value)}
                            required
                            className="mt-2 animate-fade-in"
                        />
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="orgName" className="block text-sm font-medium mb-2">Organization Name *</label>
                    <Input id="orgName" value={formData.organizationName} onChange={(e) => handleInputChange('organizationName', e.target.value)} placeholder="Enter your organization name" required />
                  </div>
                  <div>
                    <label htmlFor="website" className="block text-sm font-medium mb-2">Website</label>
                    <Input id="website" value={formData.website} onChange={(e) => handleInputChange('website', e.target.value)} placeholder="https://yourorganization.com" type="url" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="contactName" className="block text-sm font-medium mb-2">Contact Name *</label>
                    <Input id="contactName" value={formData.contactName} onChange={(e) => handleInputChange('contactName', e.target.value)} placeholder="Your full name" required />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium mb-2">Phone Number</label>
                    <Input id="phone" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" type="tel" />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">Email Address *</label>
                  <Input id="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder="contact@yourorganization.com" type="email" required />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-2">Partnership Description *</label>
                  <Textarea id="description" value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Describe your partnership proposal, objectives, and how it would benefit the healthcare professional community..." className="min-h-32" required />
                </div>

                <div className="pt-6 border-t border-border">
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button type="submit" size="lg" className="btn-medical px-8 py-6 group" disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      )}
                      {isLoading ? 'Submitting...' : 'Submit Partnership Proposal'}
                    </Button>
                  </div>
                  
                  {/* UPDATED CONTACT DETAILS */}
                  <div className="text-sm text-muted-foreground text-center mt-4 space-x-4">
                    <span>📞 Phone: <a href="tel:8610475917" className="text-primary hover:underline">8610475917</a></span>
                    <span>|</span>
                    <span>📧 Mail: <a href="mailto:mrudulabhalke75917@gmail.com" className="text-primary hover:underline">mrudulabhalke75917@gmail.com</a></span>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Partnerships;
