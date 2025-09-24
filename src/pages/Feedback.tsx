import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Star,
  Lightbulb,
  Bug,
  Heart,
  Send,
  CheckCircle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Feedback Page - User feedback and suggestions
 * Allows users to submit feedback, bug reports, and feature requests
 */
const Feedback = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    email: '',
    description: '',
    rating: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In real app, this would submit to API
    setIsSubmitted(true);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRating = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
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
            
            <h1 className="text-3xl font-bold mb-4">Thank You for Your Feedback!</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Your feedback is valuable to us and helps improve AIMedNet for all healthcare professionals. 
              We'll review your submission and may reach out if we need more details.
            </p>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Reference ID: <span className="font-mono font-bold">FB-{Date.now().toString().slice(-6)}</span>
              </p>
              
              <Button className="btn-medical" onClick={() => setIsSubmitted(false)}>
                Submit More Feedback
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
          <h1 className="text-4xl font-bold mb-4">We Value Your Feedback</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Help us improve AIMedNet by sharing your thoughts, suggestions, and experiences. 
            Your feedback shapes the future of healthcare professional networking.
          </p>
        </div>

        {/* Feedback Categories */}
        <div className="grid md:grid-cols-4 gap-6 mb-12 animate-slide-up">
          {[
            {
              icon: Star,
              title: 'General Feedback',
              description: 'Share your overall experience with the platform',
              color: 'text-warning'
            },
            {
              icon: Lightbulb,
              title: 'Feature Request',
              description: 'Suggest new features or improvements',
              color: 'text-accent'
            },
            {
              icon: Bug,
              title: 'Bug Report',
              description: 'Report technical issues or problems',
              color: 'text-destructive'
            },
            {
              icon: Heart,
              title: 'Appreciation',
              description: 'Let us know what you love about AIMedNet',
              color: 'text-success'
            }
          ].map((category, index) => (
            <Card key={index} className="card-medical text-center h-full">
              <CardContent className="pt-6">
                <div className={`w-12 h-12 mx-auto mb-4 bg-gradient-primary rounded-full flex items-center justify-center`}>
                  <category.icon className={`h-6 w-6 ${category.color === 'text-warning' ? 'text-primary-foreground' : 'text-primary-foreground'}`} />
                </div>
                <h3 className="font-semibold mb-2">{category.title}</h3>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feedback Form */}
        <div className="max-w-4xl mx-auto animate-slide-up">
          <Card className="card-premium border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Submit Your Feedback</CardTitle>
              <CardDescription className="text-lg">
                Your input helps us create a better platform for healthcare professionals
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Feedback Category *</label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select feedback category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Feedback</SelectItem>
                        <SelectItem value="feature-request">Feature Request</SelectItem>
                        <SelectItem value="bug-report">Bug Report</SelectItem>
                        <SelectItem value="appreciation">Appreciation</SelectItem>
                        <SelectItem value="forum-feedback">Forums & Communities</SelectItem>
                        <SelectItem value="networking-feedback">Jobs & Networking</SelectItem>
                        <SelectItem value="ui-ux">User Interface/Experience</SelectItem>
                        <SelectItem value="performance">Performance Issues</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address *</label>
                    <Input 
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="your.email@example.com"
                      type="email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Subject *</label>
                  <Input 
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="Brief summary of your feedback"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">How would you rate your overall experience? *</label>
                  <div className="flex gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRating(star)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          star <= formData.rating 
                            ? 'bg-warning text-warning-foreground' 
                            : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                        }`}
                      >
                        <Star className={`h-5 w-5 ${star <= formData.rating ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formData.rating === 5 && "Excellent! We're thrilled you love AIMedNet!"}
                    {formData.rating === 4 && "Great! We appreciate your positive feedback!"}
                    {formData.rating === 3 && "Good to know. We'll work on improvements!"}
                    {formData.rating === 2 && "We appreciate your honesty. Let us know how we can improve!"}
                    {formData.rating === 1 && "We're sorry to hear that. Your feedback will help us improve!"}
                    {formData.rating === 0 && "Please rate your experience from 1 to 5 stars"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Detailed Feedback *</label>
                  <Textarea 
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Please provide detailed feedback, suggestions, or describe any issues you've encountered. The more specific you are, the better we can help!"
                    className="min-h-32"
                    required
                  />
                </div>

                {/* Tips for better feedback */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold mb-2 text-primary">💡 Tips for Effective Feedback:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Be specific about what features or areas you're referring to</li>
                    <li>• Include steps to reproduce any issues you've encountered</li>
                    <li>• Mention your device/browser if reporting technical problems</li>
                    <li>• Suggest improvements or alternatives when possible</li>
                  </ul>
                </div>

                <div className="pt-6 border-t border-border">
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button type="submit" size="lg" className="btn-medical px-8 py-6 group">
                      <Send className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      Submit Feedback
                    </Button>
                    
                    <Button 
                      type="button"
                      variant="outline" 
                      size="lg"
                      className="px-8 py-6 border-primary text-primary hover:bg-primary/5"
                    >
                      Save as Draft
                    </Button>
                  </div>
                  
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    📧 For urgent issues: <a href="mailto:support@aimednet.com" className="text-primary hover:underline">support@aimednet.com</a>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Contact Information */}
        <div className="mt-16 text-center animate-fade-in">
          <Card className="card-medical max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold mb-4">Other Ways to Reach Us</h3>
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-medium mb-2">📧 Email Support</h4>
                  <p className="text-muted-foreground">
                    General: <a href="mailto:support@aimednet.com" className="text-primary hover:underline">support@aimednet.com</a><br />
                    Feedback: <a href="mailto:feedback@aimednet.com" className="text-primary hover:underline">feedback@aimednet.com</a>
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">📱 Phone Support</h4>
                  <p className="text-muted-foreground">
                    <a href="tel:+917094800291" className="text-primary hover:underline">+91 7094800291</a><br />
                    Mon-Fri: 9:00 AM - 6:00 PM IST
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Feedback;