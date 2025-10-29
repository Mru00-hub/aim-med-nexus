import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from 'lucide-react';
import { EditableAward } from '@/integrations/supabase/user.api';

type ProfileAwardsFormProps = {
  items: EditableAward[];
  onListChange: (listName: 'awards', index: number, field: string, value: any) => void;
  onAddItem: (listName: 'awards') => void;
  onRemoveItem: (listName: 'awards', index: number) => void;
};

export const ProfileAwardsForm: React.FC<ProfileAwardsFormProps> = ({
  items,
  onListChange,
  onAddItem,
  onRemoveItem
}) => {
  const today = new Date().toISOString().split('T')[0];
  return (
    <div className="p-1 pt-4 space-y-4">
      {items.map((award, index) => (
        <div key={index} className="p-4 border rounded-lg space-y-4 relative bg-muted/30">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onRemoveItem('awards', index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`award-type-${index}`}>Type *</Label>
              <Select
                value={award.type || 'professional'}
                onValueChange={(val) => onListChange('awards', index, 'type', val)}
              >
                <SelectTrigger id={`award-type-${index}`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional Award</SelectItem>
                  <SelectItem value="academic">Academic Award / Honor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`award-date-${index}`}>Date Awarded</Label>
              <Input
                id={`award-date-${index}`}
                type="date"
                value={award.date || ''}
                onChange={(e) => onListChange('awards', index, 'date', e.target.value)}
                max={today}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`award-name-${index}`}>Award Name *</Label>
            <Input
              id={`award-name-${index}`}
              value={award.award_name || ''}
              onChange={(e) => onListChange('awards', index, 'award_name', e.target.value)}
              placeholder={award.type === 'academic' ? 'e.g., University Gold Medal' : 'e.g., Top Doctor 2024'}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`award-org-${index}`}>Issuing Organization</Label>
            <Input
              id={`award-org-${index}`}
              value={award.issuing_org || ''}
              onChange={(e) => onListChange('awards', index, 'issuing_org', e.target.value)}
              placeholder={award.type === 'academic' ? 'e.g., AIIMS New Delhi' : 'e.g., American Medical Association'}
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => onAddItem('awards')}
      >
        <Plus className="mr-2 h-4 w-4" /> Add Award
      </Button>
    </div>
  );
};
