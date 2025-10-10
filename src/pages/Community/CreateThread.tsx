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

// Import our new API function
import { createThread } from '@/integrations/supabase/community.api';

// ----------------------------------------------------------------------
// REVISED PROPS - Removed the redundant 'spaceType'
// ----------------------------------------------------------------------
interface CreateThreadProps {
  // If null/undefined, the thread will be created in the special PUBLIC space (handled by the API)
  spaceId?: string | null; 
  // This callback is for when it's used as a modal
  onThreadCreated?: (newThreadId: string) => void;
}

export const CreateThreadForm: React.FC<CreateThreadProps> = ({ spaceId = null, onThreadCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
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
      // ----------------------------------------------------------------------
      // REVISED API CALL - Only needs title, body, and spaceId
      // ----------------------------------------------------------------------
      const newThreadId = await createThread({
          title,
          body,
          spaceId,
          description
      });
      
      toast({
        title: "Success!",
        description: "Your thread has been created.",
      });

      // If there's a callback (modal use-case), call it. Otherwise, navigate (page use-case).
      if (onThreadCreated) {
        onThreadCreated(newThreadId);
      } else {
        navigate(`/community/thread/${newThreadId}`);
      }

    } catch (err: any) {
      // NOTE: The RLS/API will throw an error here if the user doesn't have permission 
      // to post to the provided spaceId.
      const errorMessage = err.message.includes('permission denied') 
                           ? 'Permission Denied: You cannot post to this space.' 
                           : err.message || 'Failed to create thread. Please try again.';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
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
        <Label htmlFor="description">Introduction (Optional)</Label>
        <Textarea id="description" placeholder="Add a short intro or context for this thread." rows={3} value={description} onChange={(e) => setDescription(e.target.value)} disabled={isLoading} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Your First Message</Label>
        <Textarea
          id="message"
          placeholder="Write the opening post for the discussion."
          rows={8}
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
    console.log('%c[CreateThread.tsx] Rendering...', 'color: red; font-weight: bold;');
    // Determine the header/description text based on the public space
    const isPublic = true; // This page is always for public threads
    
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
                  {/* When spaceId is omitted, the API must default the thread to the PUBLIC space ID. */}
                  <CreateThreadForm spaceId={null} /> 
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      </AuthGuard>
    );
};

export default CreateThreadPage;
