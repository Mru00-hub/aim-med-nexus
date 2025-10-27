import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from 'lucide-react';
import { EditableCocurricular } from '@/integrations/supabase/user.api';

type ProfileCocurricularsFormProps = {
  items: EditableCocurricular[];
  onListChange: (listName: 'cocurriculars', index: number, field: string, value: any) => void;
  onAddItem: (listName: 'cocurriculars') => void;
  onRemoveItem: (listName: 'cocurriculars', index: number) => void;
};

export const ProfileCocurricularsForm: React.FC<ProfileCocurricularsFormProps> = ({
  items,
  onListChange,
  onAddItem,
  onRemoveItem
}) => {
  return (
    <div className="p-1 pt-4 space-y-4">
      {items.map((item, index) => (
        <div key={index} className="p-4 border rounded-lg space-y-4 relative bg-muted/30">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onRemoveItem('cocurriculars', index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`cocurr-category-${index}`}>Category *</Label>
              <Select
                value={item.category || ''}
                onValueChange={(val) => onListChange('cocurriculars', index, 'category', val)}
                required
              >
                <SelectTrigger id={`cocurr-category-${index}`}><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Organizational">Organizational (Fests, etc.)</SelectItem>
                  <SelectItem value="Debating/Speaking">Debating / Public Speaking</SelectItem>
                  <SelectItem value="Quizzing">Quizzing</SelectItem>
                  <SelectItem value="Arts">Arts (Music, Drama, Dance)</SelectItem>
                  <SelectItem value="Tech">Tech (Hackathons, Coding)</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`cocurr-date-${index}`}>Date (Optional)</Label>
              <Input
                id={`cocurr-date-${index}`}
                type="date"
                value={item.activity_date || ''}
                onChange={(e) => onListChange('cocurriculars', index, 'activity_date', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`cocurr-title-${index}`}>Title / Achievement *</Label>
            <Input
              id={`cocurr-title-${index}`}
              value={item.title || ''}
              onChange={(e) => onListChange('cocurriculars', index, 'title', e.target.value)}
              placeholder="e.g., Co-Organizer, Synapse 2023"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`cocurr-desc-${index}`}>Description (Optional)</Label>
            <Textarea
              id={`cocurr-desc-${index}`}
              value={item.description || ''}
              onChange={(e) => onListChange('cocurriculars', index, 'description', e.target.value)}
              placeholder="e.g., Managed logistics for a 3-day fest with 5000+ attendees."
              rows={2}
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => onAddItem('cocurriculars')}
      >
        <Plus className="mr-2 h-4 w-4" /> Add Activity
      </Button>
    </div>
  );
};
