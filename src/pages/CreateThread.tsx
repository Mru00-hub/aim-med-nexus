import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { createThread } from '@/integrations/supabase/api';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const CreateThread = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError('Title and message body cannot be empty.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const newThreadId = await createThread(title, body, null); // Using null for a public thread
      
      toast({
        title: "Success!",
        description: "Your thread has been created.",
      });

      // Navigate to the new thread's detail page to see the messaging interface
      navigate(`/threads/${newThreadId}`);

    } catch (err: any) {
      setError(err.message || 'Failed to create thread. Please try again.');
      toast({
        title: "Error",
        description: err.message || 'Failed to create thread.',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-medical py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Start a New Thread</CardTitle>
            <CardDescription>
              Share your thoughts with the community. Please be respectful and constructive.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="title">Thread Title</Label>
                <Input 
                  id="title" 
                  placeholder="Enter a clear and concise title" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Your Message</Label>
                <Textarea
                  id="message"
                  placeholder="Write your main post here. You can add attachments later."
                  rows={10}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" className="btn-medical" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Posting...' : 'Post Thread'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default CreateThread;
