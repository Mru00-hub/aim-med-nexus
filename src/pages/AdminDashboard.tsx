// src/pages/AdminDashboard.tsx

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ShieldAlert, Send } from 'lucide-react';

// Get the System Actor ID from your .env file
const SYSTEM_ACTOR_ID = import.meta.env.VITE_SYSTEM_ACTOR_ID;

export default function AdminDashboard() {
  const { profile, loading } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendUpdate = async () => {
    if (!profile || !title) {
      toast({
        title: 'Error',
        description: 'You must provide a title.',
        variant: 'destructive',
      });
      return;
    }
    
    // Ensure the actor ID is set
    if (!SYSTEM_ACTOR_ID) {
       toast({
        title: 'Configuration Error',
        description: 'VITE_SYSTEM_ACTOR_ID is not set in your .env file.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);

    try {
      // --- Step 1: Create the announcement entry ---
      const { data: newAnnouncement, error: insertError } = await supabase
        .from('announcements')
        .insert({
          title: title,
          body: body,
          author_id: profile.id, // Your admin ID
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // --- Step 2: Call the SQL function to send notifications ---
      const { error: rpcError } = await supabase.rpc(
        'send_system_update_to_all_users',
        {
          system_actor_id: SYSTEM_ACTOR_ID,
          announcement_entity_id: newAnnouncement.id,
        }
      );

      if (rpcError) throw rpcError;

      toast({
        title: 'Success!',
        description: 'System update has been sent to all users.',
      });
      setTitle('');
      setBody('');
    } catch (err: any) {
      console.error('Error sending update:', err);
      toast({
        title: 'Send Failed',
        description: err.message || 'An unknown error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  // --- Page Content Rendering ---

  // 1. Show loader while auth state is resolving
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // 2. Show Access Denied if user is not an admin
  if (!profile || profile.role !== 'ADMIN') {
    return (
      <div className="flex h-screen flex-col">
        <Header />
        <main className="container-medical flex-grow py-10">
          <Alert variant="destructive" className="max-w-lg mx-auto">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You do not have permission to view this page.
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  // 3. Show the admin form
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container-medical flex-grow py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Admin Dashboard</CardTitle>
            <CardDescription>
              Send a system-wide announcement to all users.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="ann-title" className="text-sm font-medium">Title</label>
              <Input
                id="ann-title"
                placeholder="e.g., New Feature: Job Board"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="ann-body" className="text-sm font-medium">Body (Optional)</label>
              <Textarea
                id="ann-body"
                placeholder="Describe the update in more detail..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSendUpdate}
              disabled={isSending || !title.trim()}
              className="ml-auto"
            >
              {isSending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Update to All Users
            </Button>
          </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
