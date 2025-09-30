// src/pages/community/CreateThread.tsx

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
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthGuard from '@/components/AuthGuard';

// Import our new API function and types
import { createThread } from '@/integrations/supabase/community.api';

// STEP 1: Define props to make the component reusable
interface CreateThreadProps {
  // These will be provided when used as a modal inside a space
  spaceId?: string | null;
  spaceType?: 'FORUM' | 'COMMUNITY_SPACE' | null;
  // This callback is for when it's used as a modal
  onThreadCreated?: (newThreadId: string) => void;
}

// We've wrapped the form logic into its own component
export const CreateThreadForm: React.FC<CreateThreadProps> = ({ spaceId = null, spaceType = null, onThreadCreated }) => {
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
      // STEP 2: Update handleSubmit to use the props
      const newThreadId = await createThread({
          title,
          body,
          spaceId,
          spaceType
      });
      
      toast({
        title: "Success!",
        description: "Your thread has been created.",
      });

      // If there's a callback, use it (for modals). Otherwise, navigate (for the page).
      if (onThreadCreated) {
        onThreadCreated(newThreadId);
      } else {
        navigate(`/community/thread/${newThreadId}`);
      }

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
          placeholder="Write your main post here."
          rows={10}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Posting...' : 'Post Thread'}
        </Button>
      </div>
    </form>
  )
}

// The page component now just provides the layout and renders the form
const CreateThreadPage = () => {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-8 px-4">
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle>Start a New Public Thread</CardTitle>
              <CardDescription>
                This thread will be visible to everyone in the main Community Hub.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <CreateThreadForm />
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    </AuthGuard>
  );
};

export default CreateThreadPage;
