import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, Building2 } from 'lucide-react';

interface ForumsNavProps {
  activeTab: 'forums' | 'community';
  onTabChange: (tab: 'forums' | 'community') => void;
  onCreateNew: () => void;
  isAuthenticated: boolean;
}

export const ForumsNav: React.FC<ForumsNavProps> = ({
  activeTab,
  onTabChange,
  onCreateNew,
  isAuthenticated
}) => {
  return (
    <Card className="p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as 'forums' | 'community')}>
          <TabsList>
            <TabsTrigger value="forums" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Forums
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Community Spaces
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        {isAuthenticated ? (
          <Button onClick={onCreateNew} className="btn-medical">
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        ) : (
          <Button variant="outline">
            Sign in to create
          </Button>
        )}
      </div>
    </Card>
  );
};
