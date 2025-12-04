import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Youtube, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuizLeaguePage = () => {
  const navigate = useNavigate();
  const pdfUrl = "https://kkghalgyuxgzktcaxzht.supabase.co/storage/v1/object/public/public-assets/DOC-20251204-WA0017..pdf";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 md:py-12 space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4 animate-fade-in">
          <h1 className="text-3xl md:text-5xl font-bold text-primary">
            India's 1st Beyond the Clinics
            <span className="block text-accent mt-2">National Healthcare Quiz League</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join the premier academic competition for healthcare professionals. 
            Connect, Learn, Compete, and Win.
          </p>
          
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column: Instructions */}
          <div className="space-y-6">
            <Card className="border-l-4 border-l-primary shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Steps to Sign Up
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ol className="list-decimal list-inside space-y-2 text-foreground/80">
                  <li>Go to the <strong>Sign in Button</strong> on the top / in the menu section (3 horizontal lines).</li>
                  <li>Sign in With <strong>Google</strong> in 2 steps.</li>
                  <li>Press <strong>Go to Community</strong> button on Home Page.</li>
                  <li>Join the <strong>Forums</strong>, sit back and wait.</li>
                  <li>
                    Don't forget to update your profile in the <strong>Profile &rarr; Edit Profile</strong> section, 
                    especially the Student/Professional mode and institution details.
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-accent shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                  Already Signed In?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/80">
                  1. Wait for the notifications on creation of Forums to join them.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/5 to-transparent border-dashed">
              <CardHeader>
                <CardTitle>How to Get Referral Bonus</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <ul className="list-disc list-inside space-y-2 text-foreground/80">
                  <li>Ask your friends to sign up on the website.</li>
                  <li>Wait for the quiz day to get your referral code that they can enter.</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm font-semibold text-primary">
                    We'll update you with more information through email notifications!
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-center md:justify-start pt-4">
               <Button size="lg" onClick={() => navigate('/community')} className="w-full md:w-auto">
                 Go to Community <ArrowRight className="ml-2 w-4 h-4" />
               </Button>
            </div>
          </div>

          {/* Right Column: Media (PDF & Video) */}
          <div className="space-y-6">
            {/* YouTube Embed */}
            <Card className="overflow-hidden shadow-hover">
              <CardHeader className="bg-muted/30 pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Youtube className="w-5 h-5 text-red-600" />
                  Video Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative pb-[56.25%] h-0">
                  <iframe 
                    className="absolute top-0 left-0 w-full h-full"
                    src="https://www.youtube.com/embed/YOUR_VIDEO_ID_HERE" 
                    title="Quiz Teaser"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>
              </CardContent>
            </Card>

            {/* PDF Embed */}
            <Card className="h-[500px] flex flex-col shadow-hover">
              <CardHeader className="bg-muted/30 pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Quiz Brochure (PDF)
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0 relative bg-slate-100">
                <object 
                  data={pdfUrl}
                  type="application/pdf" 
                  className="w-full h-full"
                >
                  <div className="flex flex-col items-center justify-center h-full space-y-4 p-6 text-center">
                    <p className="text-muted-foreground">Your browser does not support PDF previews.</p>
                    <Button variant="outline" asChild>
                      <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                        Download Brochure
                      </a>
                    </Button>
                  </div>
                </object>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
