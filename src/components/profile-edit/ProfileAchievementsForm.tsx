import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';
import { EditableAchievement } from '@/integrations/supabase/user.api'; // Assuming you exported this type

type ProfileAchievementsFormProps = {
  items: (EditableAchievement & { client_id?: string })[]; // 1. Update item type
  onListChange: (listName: 'achievements', index: number, field: string, value: any) => void;
  onAddItem: (listName: 'achievements') => void;
  onRemoveItem: (id: string) => void; // 2. Update to expect 'id: string'
};

export const ProfileAchievementsForm: React.FC<ProfileAchievementsFormProps> = ({
  items,
  onListChange,
  onAddItem,
  onRemoveItem
}) => {
  return (
    <div className="p-1 pt-4 space-y-4">
      {items.map((ach, index) => (
        <div key={ach.id || ach.client_id} className="p-4 border rounded-lg space-y-4 relative bg-muted/30">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onRemoveItem( ach.id || ach.client_id!)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          
          <div className="space-y-2">
            <Label htmlFor={`ach-name-${index}`}>Exam Name *</Label>
            <Input
              id={`ach-name-${index}`}
              value={ach.exam_name || ''}
              onChange={(e) => onListChange('achievements', index, 'exam_name', e.target.value)}
              placeholder="e.g., NEET-PG 2023, USMLE Step 1"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`ach-rank-${index}`}>Rank / Score</Label>
              <Input
                id={`ach-rank-${index}`}
                value={ach.rank || ''}
                onChange={(e) => onListChange('achievements', index, 'rank', e.target.value)}
                placeholder="e.g., 120 or 265"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`ach-perc-${index}`}>Percentile</Label>
              <Input
                id={`ach-perc-${index}`}
                type="number"
                step="0.01"
                value={ach.percentile || ''}
                onChange={(e) => onListChange('achievements', index, 'percentile', e.target.valueAsNumber)}
                placeholder="e.g., 99.8"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`ach-year-${index}`}>Year</Label>
              <Input
                id={`ach-year-${index}`}
                type="number"
                value={ach.year || ''}
                onChange={(e) => onListChange('achievements', index, 'year', e.target.valueAsNumber)}
                placeholder="e.g., 2023"
              />
            </div>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => onAddItem('achievements')}
      >
        <Plus className="mr-2 h-4 w-4" /> Add Exam
      </Button>
    </div>
  );
};
