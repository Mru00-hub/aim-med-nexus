import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Handshake, Globe, ArrowRight } from 'lucide-react';

/**
 * Partnership Section Component for AIMedNet
 * Showcases partnership opportunities with healthcare organizations
 * Includes call-to-action for partnership form submission
 */
export const PartnershipSection = () => {
  const partnershipTypes = [
    {
      icon: Building2,
      title: 'Healthcare Organizations',
      description: 'Partner with hospitals, clinics, and healthcare systems to provide networking opportunities for their staff and enhance professional development.',
      benefits: ['Staff networking platform', 'Continued education support', 'Talent acquisition access']
    },
    {
      icon: Handshake,
      title: 'Medical Education Partners',
      description: 'Collaborate with medical schools, nursing colleges, and training institutions to bridge the gap between education and professional practice.',
      benefits: ['Student-professional mentorship', 'Career placement support', 'Educational content partnership']
    },
    {
      icon: Globe,
      title: 'Healthcare Technology',
      description: 'Technology companies serving healthcare can reach verified medical professionals and showcase innovations that improve patient care.',
      benefits: ['Verified professional access', 'Product feedback loops', 'Innovation showcasing']
    }
  ];

  return (
    <section className="section-medical bg-gradient-hero">
      <div className="container-medical">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Partnership
            <span className="text-primary block">Opportunities</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join us in building the future of healthcare professional networking. 
            Partner with AIMedNet to reach verified healthcare professionals and 
            contribute to better patient outcomes through collaboration.
          </p>
        </div>

        {/* Partnership Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16 animate-slide-up">
          {partnershipTypes.map((partnership, index) => (
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

        {/* Partnership CTA */}
        <div className="max-w-4xl mx-auto text-center animate-scale-in">
          <Card className="card-premium border-primary/20">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl md:text-3xl">
                Ready to Partner with AIMedNet?
              </CardTitle>
              <CardDescription className="text-lg">
                Let's discuss how we can work together to advance healthcare 
                professional networking and improve patient care outcomes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">50,000+</div>
                  <div className="text-sm text-muted-foreground">Verified Professionals</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">1,000+</div>
                  <div className="text-sm text-muted-foreground">Healthcare Organizations</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-success">95%</div>
                  <div className="text-sm text-muted-foreground">Partnership Satisfaction</div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="btn-medical px-8 py-6 group">
                  Submit Partnership Proposal
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="px-8 py-6 border-primary text-primary hover:bg-primary/5"
                >
                  Schedule a Call
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground">
                📧 For partnership inquiries: <a href="mailto:partnerships@aimednet.com" className="text-primary hover:underline">partnerships@aimednet.com</a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};