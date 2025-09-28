// src/pages/CreateThread.tsx
import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const CreateThread = () => {
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
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Thread Title</Label>
                <Input id="title" placeholder="Enter a clear and concise title" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Your Message</Label>
                <Textarea
                  id="message"
                  placeholder="Write your main post here. You can add attachments later."
                  rows={10}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" className="btn-medical">
                  Post Thread
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
