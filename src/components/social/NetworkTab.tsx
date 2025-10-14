import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { UserActionCard } from './UserActionCard';

export const NetworkTab = ({ myConnections, loading, onRemoveConnection }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConnections = useMemo(() => {
    if (!searchTerm) return myConnections;
    return myConnections.filter(conn => conn.full_name?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [myConnections, searchTerm]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Connections</CardTitle>
        <div className="relative pt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Filter by name..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? <Skeleton className="h-20 w-full" /> : filteredConnections.map(conn => (
          <UserActionCard 
            key={conn.id} 
            // CHANGED: Passing more details from the 'conn' object
            user={{ 
              id: conn.id, 
              full_name: conn.full_name, 
              profile_picture_url: conn.profile_picture_url, 
              title: conn.course, 
              organization: conn.organization, 
              location: conn.current_location 
            }}
          >
            <Button variant="outline" size="sm" onClick={() => onRemoveConnection(conn.id)}><UserX className="h-4 w-4 mr-2" />Remove</Button>
          </UserActionCard>
        ))}
      </CardContent>
    </Card>
  );
};
