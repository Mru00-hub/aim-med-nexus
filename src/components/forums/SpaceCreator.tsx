import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { SpaceType, JoinMechanism } from '@/types/forum';

interface SpaceCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    type: SpaceType;
    name: string;
    description: string;
    joinMechanism: JoinMechanism;
    isPrivate: boolean;
    institutionId?: string;
  }) => void;
}

export const SpaceCreator: React.FC<SpaceCreatorProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [type, setType] = useState<SpaceType>('forum');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [joinMechanism, setJoinMechanism] = useState<JoinMechanism>('open');
  const [isPrivate, setIsPrivate] = useState(false);
  const [institutionId, setInstitutionId] = useState<string>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type,
      name,
      description,
      joinMechanism,
      isPrivate,
      institutionId,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Space</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as SpaceType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="forum">Forum</SelectItem>
                <SelectItem value="community_space">Community Space</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Join Mechanism</Label>
            <Select
              value={joinMechanism}
              onValueChange={(v) => setJoinMechanism(v as JoinMechanism)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open Join</SelectItem>
                <SelectItem value="moderator_approval">Moderator Approval</SelectItem>
                <SelectItem value="admin_approval">Admin Approval Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Privacy</Label>
            <Select
              value={isPrivate ? 'private' : 'public'}
              onValueChange={(v) => setIsPrivate(v === 'private')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(type === 'community' || type === 'community_space') && (
            <div className="space-y-2">
              <Label>Institution</Label>
              <Select
                value={institutionId}
                onValueChange={setInstitutionId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select institution..." />
                </SelectTrigger>
                <SelectContent>
                  {/* Institution options will be populated dynamically */}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
