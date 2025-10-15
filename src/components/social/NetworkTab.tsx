// src/components/social/NetworkTab.tsx

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserX, MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { UserActionCard } from './UserActionCard';
// FIX: Import the specific, standalone function we need.
import { createOrGetConversation } from '@/integrations/supabase/social.api';
import { useToast } from '@/components/ui/use-toast';

// The props are passed correctly from FunctionalSocial.tsx
export const NetworkTab = ({ myConnections, loading, onRemoveConnection }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  // FIX: This function now uses the new standalone API function and a try...catch block.
  const handleStartConversation = async (connection) => {
    toast({ title: "Opening conversation..." });
    try {
      const conversationId = await createOrGetConversation(connection.id);
      // Navigate to the inbox and pass the conversationId and participant details in the state
      navigate('/inbox', {
        state: {
          conversationId: conversationId,
          participant: {
            id: connection.id,
            full_name: connection.full_name,
            profile_picture_url: connection.profile_picture_url,
          }
        }
      });
    } catch (error: any) {
      toast({ title: "Error", description: "Could not start conversation.", variant: "destructive" });
    }
  };

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
            user={{
              id: conn.id,
              full_name: conn.full_name,
              profile_picture_url: conn.profile_picture_url,
              title: conn.course,
              organization: conn.organization,
              location: conn.current_location
            }}
          >
            <Button variant="ghost" size="icon" onClick={() => handleStartConversation(conn)}>
                <MessageSquare className="h-5 w-5" />
            </Button>
            {/* This correctly uses the prop passed down from FunctionalSocial.tsx */}
            <Button variant="outline" size="sm" onClick={() => onRemoveConnection(conn.id)}><UserX className="h-4 w-4 mr-2" />Remove</Button>
          </UserActionCard>
        ))}
      </CardContent>
    </Card>
  );
};
