// components/forums/SpaceCreator.tsx

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Enums } from '@/integrations/supabase/types'; // Import Enums for type safety

// Define the component's props
interface SpaceCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description?: string;
    space_type: Enums<'space_type'>;
    join_level: Enums<'space_join_level'>;
  }) => void;
}

export const SpaceCreator: React.FC<SpaceCreatorProps> = ({ isOpen, onClose, onSubmit }) => {
  const [type, setType] = useState<'FORUM' | 'COMMUNITY_SPACE'>('FORUM');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [forumType, setForumType] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const dataToSubmit = {
      name,
      description,
      space_type: type,
      // Logic to determine the correct join_level based on the selected type
      join_level: type === 'COMMUNITY_SPACE' ? 'INVITE_ONLY' : (forumType === 'PUBLIC' ? 'OPEN' : 'REQUEST_TO_JOIN')) as Enums<'space_join_level'>,
    };

    // The parent (Forums.tsx) will handle the actual API call.
    await onSubmit(dataToSubmit);
    setIsSubmitting(false);
    // Optional: Reset form and close on successful submission if desired
    // onClose(); 
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
            <Select value={type} onValueChange={(v) => setType(v as 'FORUM' | 'COMMUNITY_SPACE')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
          
          {/* This section now ONLY shows if the selected type is a Forum */}
          {type === 'FORUM' && (
            <div className="space-y-2">
              <Label>Forum Privacy</Label>
              <Select value={forumType} onValueChange={(v) => setForumType(v as 'PUBLIC' | 'PRIVATE')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">Public (Anyone can join)</SelectItem>
                  <SelectItem value="PRIVATE">Private (Requires approval to join)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Space
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
