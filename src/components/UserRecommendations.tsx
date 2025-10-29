import React, { useState, useEffect, useMemo} from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage, AvatarProfile} from '@/components/ui/avatar';
import { Users, MapPin, Briefcase, UserPlus, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface UserRecommendation {
  user_id: string;
  full_name: string;
  current_location: string;
  specialization: string;
  years_experience: string;
  similarity_score: number;
}

const UserRecommendations: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<UserRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('get-recommendations', {
        body: { type: 'people' }
      });

      if (error) {
        console.error('Error fetching recommendations:', error);
        toast({
          title: "Error",
          description: "Failed to load recommendations.",
          variant: "destructive",
        });
        return;
      }

      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendConnectionRequest = async (targetUserId: string, targetName: string) => {
    if (!user) return;
    
    setConnecting(targetUserId);
    try {
      const { data, error } = await supabase
        .rpc('create_user_connection', {
          requester_id: user.id,
          addressee_id: targetUserId,
        });

      if (error || (data && typeof data === 'object' && 'error' in data)) {
        const errorMsg = (data as any)?.error || error?.message || "Failed to send connection request.";
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Connection Request Sent",
        description: `Your connection request to ${targetName} has been sent.`,
      });

      // Send notification
      await supabase.functions.invoke('send-notification', {
        body: {
          userId: targetUserId,
          type: 'connection_request',
          title: 'New Connection Request',
          content: `${user.email} wants to connect with you on AIMedNet.`
        }
      });

      // Remove from recommendations
      setRecommendations(prev => prev.filter(rec => rec.user_id !== targetUserId));

    } catch (error) {
      console.error('Error sending connection request:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConnecting(null);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className="card-medical">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            People You May Know
          </CardTitle>
          <CardDescription>
            Discover and connect with healthcare professionals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Complete your profile to get personalized recommendations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-medical">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          People You May Know
        </CardTitle>
        <CardDescription>
          Based on your specialization, location, and experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.slice(0, 5).map((recommendation) => {
            // Create profile object inside map
            const recProfile: AvatarProfile = {
              id: recommendation.user_id,
              full_name: recommendation.full_name,
              profile_picture_url: null // This data doesn't have it, so we pass null
            };

            return (
              <div 
                key={recommendation.user_id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Apply smart avatar */}
                  <Avatar profile={recProfile} className="h-12 w-12">
                    <AvatarImage alt={recommendation.full_name} />
                    <AvatarFallback />
                  </Avatar>
                  
                  <div className="flex-1">
                    <h4 className="font-medium">{recommendation.full_name}</h4>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      {recommendation.specialization && (
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          <span className="capitalize">
                            {recommendation.specialization.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                      
                      {recommendation.current_location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{recommendFendation.current_location}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      {recommendation.years_experience && (
                        <Badge variant="secondary" className="text-xs">
                          {recommendation.years_experience.replace('_', '-')} years
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {Math.round(recommendation.similarity_score)}% match
                      </Badge>
                    </div>
                  </div>
                </div>

                <Button 
                  size="sm"
                  onClick={() => sendConnectionRequest(recommendation.user_id, recommendation.full_name)}
                  disabled={connecting === recommendation.user_id}
                  className="btn-medical"
                >
                  {connecting === recommendation.user_id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-1" />
                      Connect
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {recommendations.length > 5 && (
          <div className="text-center mt-4">
            <Button variant="outline" size="sm">
              View All Recommendations ({recommendations.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserRecommendations;
