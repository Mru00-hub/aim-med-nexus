// components/forums/SpaceCreator.tsx

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Enums } from '@/integrations/supabase/types';

// Define the component's props
interface SpaceCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  // IMPROVEMENT: onSubmit now returns a Promise, so the child can await it.
  onSubmit: (data: {
    name: string;
    description?: string;
    space_type: Enums<'space_type'>;
    join_level: Enums<'space_join_level'>;
  }) => Promise<void>; // Changed to return a Promise
}

export const SpaceCreator: React.FC<SpaceCreatorProps> = ({ isOpen, onClose, onSubmit }) => {
  const [type, setType] = useState<Enums<'space_type'>>('FORUM');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [forumPrivacy, setForumPrivacy] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setType('FORUM');
    setName('');
    setDescription('');
    setForumPrivacy('PUBLIC');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // --- THIS IS THE MAIN LOGIC FIX ---
    // Correctly determine the join_level based on valid ENUM values.
    const joinLevel: Enums<'space_join_level'> = 
      type === 'COMMUNITY_SPACE' 
        ? 'INVITE_ONLY' 
        : (forumPrivacy === 'PUBLIC' ? 'OPEN' : 'INVITE_ONLY');

    try {
      // The parent (Forums.tsx) will handle the actual API call. We await it.
      await onSubmit({
        name,
        description,
        space_type: type,
        join_level: joinLevel, // Use the safe, calculated variable
      });

      // On success, close the dialog and reset the form for the next use.
      onClose();
      resetForm();

    } catch (error) {
      // The parent component is responsible for showing toast errors.
      // This child component just needs to stop its loading state.
      console.error("Failed to create space:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create a New Space</DialogTitle>
          <DialogDescription>Choose a type and provide details for your new community space or forum.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Space Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as Enums<'space_type'>)}>
              <SelectTrigger><SelectValue /></SelectValue>
              <SelectContent>
                <SelectItem value="FORUM">Forum (Topic-based discussions)</SelectItem>
                <SelectItem value="COMMUNITY_SPACE">Community Space (Private, group-focused)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Cardiology Fellows Network" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is the purpose of this space?" required />
          </div>
          
          {type === 'FORUM' && (
            <div className="space-y-2">
              <Label>Forum Privacy</Label>
              <Select value={forumPrivacy} onValueChange={(v) => setForumPrivacy(v as 'PUBLIC' | 'PRIVATE')}>
                <SelectTrigger><SelectValue /></SelectValue>
                <SelectContent>
                  <SelectItem value="PUBLIC">Public (Anyone can join)</SelectItem>
                  <SelectItem value="PRIVATE">Private (Approval required)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={!name || !description || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Space
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
