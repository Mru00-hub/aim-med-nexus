import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from 'lucide-react';
import { EditableVenture } from '@/integrations/supabase/user.api';

type ProfileVenturesFormProps = {
  items: (EditableVenture & { client_id?: string })[]; // 1. Update item type
  onListChange: (listName: 'ventures', index: number, field: string, value: any) => void;
  onAddItem: (listName: 'ventures') => void;
  onRemoveItem: (id: string) => void; // 2. Update to expect 'id: string'
};

export const ProfileVenturesForm: React.FC<ProfileVenturesFormProps> = ({
  items,
  onListChange,
  onAddItem,
  onRemoveItem
}) => {
  return (
    <div className="p-1 pt-4 space-y-4">
      {items.map((venture, index) => (
        <div key={venture.id || venture.client_id} className="p-4 border rounded-lg space-y-4 relative bg-muted/30">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onRemoveItem(venture.id || venture.client_id!)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <div className="space-y-2">
            <Label htmlFor={`venture-name-${index}`}>Venture / Project Name *</Label>
            <Input
              id={`venture-name-${index}`}
              value={venture.name || ''}
              onChange={(e) => onListChange('ventures', index, 'name', e.target.value)}
              placeholder="e.g., MedWrite Solutions, The Doctor's Pivot Podcast"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`venture-type-${index}`}>Type</Label>
              <Select
                value={venture.venture_type || ''}
                onValueChange={(val) => onListChange('ventures', index, 'venture_type', val)}
              >
                <SelectTrigger id={`venture-type-${index}`}><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">Business / Startup</SelectItem>
                  <SelectItem value="content">Content (Podcast, Blog, etc.)</SelectItem>
                  <SelectItem value="consulting">Consulting Practice</SelectItem>
                  <SelectItem value="education">Education / Course</SelectItem>
                  <SelectItem value="product">Product (App, SaaS)</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`venture-role-${index}`}>Your Role</Label>
              <Input
                id={`venture-role-${index}`}
                value={venture.role || ''}
                onChange={(e) => onListChange('ventures', index, 'role', e.target.value)}
                placeholder="e.g., Founder, Host, Advisor"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`venture-desc-${index}`}>Description</Label>
            <Textarea
              id={`venture-desc-${index}`}
              value={venture.description || ''}
              onChange={(e) => onListChange('ventures', index, 'description', e.target.value)}
              placeholder="What is it? What's the mission?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`venture-url-${index}`}>Website URL</Label>
            <Input
              id={`venture-url-${index}`}
              type="url"
              value={venture.website_url || ''}
              onChange={(e) => onListChange('ventures', index, 'website_url', e.target.value)}
              placeholder="https://myventure.com"
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => onAddItem('ventures')}
      >
        <Plus className="mr-2 h-4 w-4" /> Add Venture / Project
      </Button>
    </div>
  );
};
