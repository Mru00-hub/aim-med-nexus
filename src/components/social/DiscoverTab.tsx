import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Users, Search, Sparkles, UserPlus, MoreHorizontal, Ban } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { UserActionCard } from './UserActionCard';

export const DiscoverTab = ({ recommendations, loading, onSendRequest, onBlockUser }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecommendations = useMemo(() => {
    if (!searchTerm) return recommendations;
    return recommendations.filter(rec => rec.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [recommendations, searchTerm]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> People You May Know</CardTitle>
        <div className="relative pt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? <Skeleton className="h-20 w-full" /> : filteredRecommendations.map(rec => (
          <UserActionCard 
            key={rec.id} 
            // CHANGED: Passing more details from the 'rec' object
            user={{ 
              id: rec.id, 
              full_name: rec.full_name, 
              profile_picture_url: rec.profile_picture_url, 
              title: rec.specialization || rec.course,
              organization: rec.organization,
              location: rec.current_location,
              mutuals: rec.mutuals, 
            }}
          >
            <Button size="sm" onClick={() => onSendRequest(rec.id)}><UserPlus className="h-4 w-4 mr-2" />Connect</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal /></Button></DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => onBlockUser(rec.id)} className="text-destructive focus:bg-destructive/10 focus:text-destructive"><Ban className="h-4 w-4 mr-2" />Block User</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </UserActionCard>
        ))}
      </CardContent>
    </Card>
  );
};
