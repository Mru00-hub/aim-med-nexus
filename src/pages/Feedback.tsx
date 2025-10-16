// pages/feedback.tsx OR components/pages/Feedback.tsx

import React, { useState, useEffect } from 'react';
import { useUser } from '@supabase/auth-helpers-react'; // Essential hook for user data
import { submitFeedback, FeedbackFormInput } from '@/integrations/supabase/feedback.api';

// ShadCN UI Components
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/components/ui/use-toast"; // Import toast hook
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MessageSquare, Star, Lightbulb, Bug, Heart, Send } from 'lucide-react';

const Feedback = () => {
  const user = useUser(); // Get the authenticated user
  const { toast } = useToast(); // Initialize toast

  const [isLoading, setIsLoading] = useState(false);
  // Use the inferred type for strong typing
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<FeedbackFormInput>({
    category: '',
    subject: '',
    description: '',
    rating: 0,
  });
  
  // State for user email, to be pre-filled
  const [userEmail, setUserEmail] = useState('');

  // Effect to pre-fill the user's email once the user object is available
  useEffect(() => {
    if (user?.email) {
      setUserEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.rating === 0) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please rate your experience before submitting.",
      });
      return;
    }
    if (!formData.category) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select a feedback category.",
      });
      return;
    }

    setIsLoading(true);
    try {
      await submitFeedback(formData);
      
      toast({
        title: "Feedback Submitted!",
        description: "Thank you for helping us improve.",
      });

      setIsSubmitted(true); // Show the thank you screen
      setFormData({ // Reset the form for the next time
        category: '',
        subject: '',
        description: '',
        rating: 0,
      });

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FeedbackFormInput, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRating = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  if (isSubmitted) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-medical flex items-center justify-center py-16" style={{ minHeight: 'calc(100vh - 160px)' }}>
        <div className="max-w-2xl mx-auto text-center animate-scale-in">
          <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-primary-foreground"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Your feedback is valuable to us. We'll review your submission and may reach out if we need more details.
          </p>
          <Button className="btn-medical" onClick={() => setIsSubmitted(false)}>
            Submit Another Feedback
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
  }

  // The rest of your JSX remains largely the same, with a few key changes:
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-medical py-8">
        {/* ... (Your existing header and category cards section - no changes needed here) ... */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold mb-4">We Value Your Feedback</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Help us improve AIMedNet by sharing your thoughts, suggestions, and experiences. 
            Your feedback shapes the future of healthcare professional networking.
          </p>
        </div>
        
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
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select feedback category" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Values must match the CHECK constraint in your SQL table */}
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
                        aria-label={`Rate ${star} out of 5 stars`}
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
                    placeholder="Please provide detailed feedback..."
                    className="min-h-32"
                    required
                  />
                </div>
                
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
                    <Button type="submit" size="lg" className="btn-medical px-8 py-6 group" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                          Submit Feedback
                        </>
                      )}
                    </Button>
                    {/* Removed "Save as Draft" for simplicity */}
                  </div>
                  {/* UPDATE THE CONTACT EMAIL AS PER PREVIOUS INSTRUCTIONS */}
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    For urgent issues, email us at <a href="mailto:mrudulabhalke75917@gmail.com" className="text-primary hover:underline">mrudulabhalke75917@gmail.com</a> or call <a href="tel:+918610475917" className="text-primary hover:underline">8610475917</a>.
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
export default Feedback;
