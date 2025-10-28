import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Plus } from 'lucide-react';
import { WorkExperienceItem } from '@/pages/CompleteProfile'; // Import the type

type ProfileWorkExperienceFormProps = {
  items: WorkExperienceItem[];
  onListChange: (index: number, field: string, value: any) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
};

export const ProfileWorkExperienceForm: React.FC<ProfileWorkExperienceFormProps> = ({
  items,
  onListChange,
  onAddItem,
  onRemoveItem,
}) => {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <Card key={item.id || index}> 
          <CardContent className="p-4 space-y-3 relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={() => onRemoveItem(index)}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Position *</label>
                <Input
                  value={item.position || ''}
                  onChange={(e) => onListChange(index, 'position', e.target.value)}
                  placeholder="e.g., Senior Resident"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Organization *</label>
                <Input
                  value={item.organization || ''}
                  onChange={(e) => onListChange(index, 'organization', e.target.value)}
                  placeholder="e.g., General Hospital"
                  required
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <Input
                  type="date"
                  value={item.start_date || ''}
                  onChange={(e) => onListChange(index, 'start_date', e.target.value || null)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date (leave blank if current)</label>
                <Input
                  type="date"
                  value={item.end_date || ''}
                  onChange={(e) => onListChange(index, 'end_date', e.target.value || null)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                value={item.description || ''}
                onChange={(e) => onListChange(index, 'description', e.target.value)}
                placeholder="Describe your responsibilities and achievements (optional)"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      ))}
      <Button type="button" variant="outline" onClick={onAddItem}>
        <Plus className="h-4 w-4 mr-2" /> Add Work Experience
      </Button>
    </div>
  );
};
