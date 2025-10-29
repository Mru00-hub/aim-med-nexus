import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from 'lucide-react';
import { EditablePublication } from '@/integrations/supabase/user.api';

type ProfilePublicationsFormProps = {
  // 1. UPDATE PROP TYPE for 'items'
  items: (EditablePublication & { client_id?: string })[];
  onListChange: (listName: 'publications', index: number, field: string, value: any) => void;
  onAddItem: (listName: 'publications') => void;
  // 2. UPDATE PROP TYPE for 'onRemoveItem'
  onRemoveItem: (listName: 'publications', id: string) => void;
};

export const ProfilePublicationsForm: React.FC<ProfilePublicationsFormProps> = ({
  items,
  onListChange,
  onAddItem,
  onRemoveItem
}) => {
  return (
    <div className="p-1 pt-4 space-y-4">
      {items.map((pub, index) => (
        <div key={item.id || item.client_id} className="p-4 border rounded-lg space-y-4 relative bg-muted/30">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onRemoveItem('publications', item.id || item.client_id!)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`pub-type-${index}`}>Type *</Label>
              <Select
                value={pub.type || 'journal'}
                onValueChange={(val) => onListChange('publications', index, 'type', val)}
              >
                <SelectTrigger id={`pub-type-${index}`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="journal">Journal Article</SelectItem>
                  <SelectItem value="book">Book / Chapter</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="patent">Patent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`pub-date-${index}`}>Publication Date</Label>
              <Input
                id={`pub-date-${index}`}
                type="date"
                value={pub.publication_date || ''}
                onChange={(e) => onListChange('publications', index, 'publication_date', e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`pub-title-${index}`}>Title *</Label>
            <Input
              id={`pub-title-${index}`}
              value={pub.title || ''}
              onChange={(e) => onListChange('publications', index, 'title', e.target.value)}
              placeholder="e.g., Novel Approaches to Cardiovascular Risk..."
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`pub-authors-${index}`}>Authors (comma-separated)</Label>
            <Input
              id={`pub-authors-${index}`}
              value={Array.isArray(pub.authors) ? pub.authors.join(', ') : ''}
              onChange={(e) => onListChange('publications', index, 'authors', e.target.value)}
              placeholder="e.g., Author A, Author B, Author C"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`pub-journal-${index}`}>Journal / Conference / Publisher</Label>
            <Input
              id={`pub-journal-${index}`}
              value={pub.journal_name || ''}
              onChange={(e) => onListChange('publications', index, 'journal_name', e.target.value)}
              placeholder="e.g., New England Journal of Medicine"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`pub-url-${index}`}>URL / DOI</Label>
            <Input
              id={`pub-url-${index}`}
              type="url"
              value={pub.url || ''}
              onChange={(e) => onListChange('publications', index, 'url', e.target.value)}
              placeholder="e.g., https://doi.org/..."
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => onAddItem('publications')}
      >
        <Plus className="mr-2 h-4 w-4" /> Add Publication
      </Button>
    </div>
  );
};
