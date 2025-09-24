import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Handshake, 
  Globe, 
  Send,
  CheckCircle,
  Users
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Partnerships Page - Form submission and partnership opportunities
 * Allows organizations to submit partnership proposals
 */
const Partnerships = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    organizationType: '',
    organizationName: '',
    contactName: '',
    email: '',
    phone: '',
    partnershipType: '',
    description: '',
    website: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In real app, this would submit to API
    setIsSubmitted(true);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
                Reference ID: <span className="font-mono font-bold">AIMEDNET-{Date.now().toString().slice(-6)}</span>
              </p>
              
              <Button className="btn-medical" onClick={() => setIsSubmitted(false)}>
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
        {/* Page Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold mb-4">Partnership Opportunities</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join us in building the future of healthcare professional networking. 
            Partner with AIMedNet to reach verified healthcare professionals.
          </p>
        </div>

        {/* Partnership Types */}
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
                  <div>
                    <label className="block text-sm font-medium mb-2">Organization Type *</label>
                    <Select value={formData.organizationType} onValueChange={(value) => handleInputChange('organizationType', value)}>
                      <SelectTrigger>
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Partnership Type *</label>
                    <Select value={formData.partnershipType} onValueChange={(value) => handleInputChange('partnershipType', value)}>
                      <SelectTrigger>
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
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Organization Name *</label>
                    <Input 
                      value={formData.organizationName}
                      onChange={(e) => handleInputChange('organizationName', e.target.value)}
                      placeholder="Enter your organization name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Website</label>
                    <Input 
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://yourorganization.com"
                      type="url"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Contact Name *</label>
                    <Input 
                      value={formData.contactName}
                      onChange={(e) => handleInputChange('contactName', e.target.value)}
                      placeholder="Your full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <Input 
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      type="tel"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email Address *</label>
                  <Input 
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="contact@yourorganization.com"
                    type="email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Partnership Description *</label>
                  <Textarea 
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your partnership proposal, objectives, and how it would benefit the healthcare professional community..."
                    className="min-h-32"
                    required
                  />
                </div>

                <div className="pt-6 border-t border-border">
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button type="submit" size="lg" className="btn-medical px-8 py-6 group">
                      <Send className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      Submit Partnership Proposal
                    </Button>
                    
                    <Button 
                      type="button"
                      variant="outline" 
                      size="lg"
                      className="px-8 py-6 border-primary text-primary hover:bg-primary/5"
                    >
                      Schedule a Call
                    </Button>
                  </div>
                  
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    📧 For direct inquiries: <a href="mailto:partnerships@aimednet.com" className="text-primary hover:underline">partnerships@aimednet.com</a>
                  </p>
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