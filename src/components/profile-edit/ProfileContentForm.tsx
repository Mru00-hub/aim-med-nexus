import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from 'lucide-react';
import { EditableContent } from '@/integrations/supabase/user.api';

type ProfileContentFormProps = {
  items: (EditableContent & { client_id?: string })[]; // 1. Update item type
  onListChange: (listName: 'contentPortfolio', index: number, field: string, value: any) => void;
  onAddItem: (listName: 'contentPortfolio') => void;
  onRemoveItem: ( id: string) => void; // 2. Update to expect 'id: string'
};

export const ProfileContentForm: React.FC<ProfileContentFormProps> = ({
  items,
  onListChange,
  onAddItem,
  onRemoveItem
}) => {
  return (
    <div className="p-1 pt-4 space-y-4">
      {items.map((content, index) => (
        <div key={content.id || content.client_id} className="p-4 border rounded-lg space-y-4 relative bg-muted/30">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onRemoveItem(content.id || content.client_id!)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`content-type-${index}`}>Content Type *</Label>
              <Select
                value={content.content_type || ''}
                onValueChange={(val) => onListChange('contentPortfolio', index, 'content_type', val)}
                required
              >
                <SelectTrigger id={`content-type-${index}`}><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="book">Book</SelectItem>
                  <SelectItem value="podcast">Podcast</SelectItem>
                  <SelectItem value="youtube">YouTube Channel / Video</SelectItem>
                  <SelectItem value="blog">Blog / Newsletter</SelectItem>
                  <SelectItem value="speaking">Speaking Engagement</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`content-platform-${index}`}>Platform</Label>
              <Input
                id={`content-platform-${index}`}
                value={content.platform_name || ''}
                onChange={(e) => onListChange('contentPortfolio', index, 'platform_name', e.target.value)}
                placeholder="e.g., Amazon, Spotify, YouTube"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`content-title-${index}`}>Title *</Label>
            <Input
              id={`content-title-${index}`}
              value={content.title || ''}
              onChange={(e) => onListChange('contentPortfolio', index, 'title', e.target.value)}
              placeholder="e.g., The Clinical to Content Career"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`content-url-${index}`}>URL *</Label>
            <Input
              id={`content-url-${index}`}
              type="url"
              value={content.url || ''}
              onChange={(e) => onListChange('contentPortfolio', index, 'url', e.target.value)}
              placeholder="https://amazon.com/my-book"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`content-thumb-${index}`}>Thumbnail URL (Optional)</Label>
            <Input
              id={`content-thumb-${index}`}
              type="url"
              value={content.thumbnail_url || ''}
              onChange={(e) => onListChange('contentPortfolio', index, 'thumbnail_url', e.target.value)}
              placeholder="https://images.com/my-cover.png"
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => onAddItem('contentPortfolio')}
      >
        <Plus className="mr-2 h-4 w-4" /> Add Content Item
      </Button>
    </div>
  );
};
