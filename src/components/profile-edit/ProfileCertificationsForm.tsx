import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';
import { EditableCertification } from '@/integrations/supabase/user.api';

type ProfileCertificationsFormProps = {
  items: EditableCertification[];
  onListChange: (listName: 'certifications', index: number, field: string, value: any) => void;
  onAddItem: (listName: 'certifications') => void;
  onRemoveItem: (listName: 'certifications', index: number) => void;
};

export const ProfileCertificationsForm: React.FC<ProfileCertificationsFormProps> = ({
  items,
  onListChange,
  onAddItem,
  onRemoveItem
}) => {
  const today = new Date().toISOString().split('T')[0];
  return (
    <div className="p-1 pt-4 space-y-4">
      {items.map((cert, index) => (
        <div key={index} className="p-4 border rounded-lg space-y-4 relative bg-muted/30">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onRemoveItem('certifications', index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          
          <div className="space-y-2">
            <Label htmlFor={`cert-name-${index}`}>Certification Name *</Label>
            <Input
              id={`cert-name-${index}`}
              value={cert.certification_name || ''}
              onChange={(e) => onListChange('certifications', index, 'certification_name', e.target.value)}
              placeholder="e.g., Board Certified in Internal Medicine"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`cert-org-${index}`}>Issuing Organization</Label>
            <Input
              id={`cert-org-${index}`}
              value={cert.issuing_org || ''}
              onChange={(e) => onListChange('certifications', index, 'issuing_org', e.target.value)}
              placeholder="e.g., American Board of Internal Medicine (ABIM)"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`cert-issue-${index}`}>Issue Date</Label>
              <Input
                id={`cert-issue-${index}`}
                type="date"
                value={cert.issue_date || ''}
                onChange={(e) => onListChange('certifications', index, 'issue_date', e.target.value)}
                max={today}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`cert-expiry-${index}`}>Expiry Date (Optional)</Label>
              <Input
                id={`cert-expiry-${index}`}
                type="date"
                value={cert.expiry_date || ''}
                onChange={(e) => onListChange('certifications', index, 'expiry_date', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`cert-url-${index}`}>Credential URL (Optional)</Label>
            <Input
              id={`cert-url-${index}`}
              type="url"
              value={cert.credential_url || ''}
              onChange={(e) => onListChange('certifications', index, 'credential_url', e.target.value)}
              placeholder="https://www.creds.com/verify/..."
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => onAddItem('certifications')}
      >
        <Plus className="mr-2 h-4 w-4" /> Add Certification
      </Button>
    </div>
  );
};
