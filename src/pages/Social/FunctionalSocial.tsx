import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { socialApi } from '@/integrations/supabase/social.api';
import type { Tables } from '@/integrations/supabase/types';
import { 
  Users, 
  MessageCircle, 
  UserPlus,
  Search,
  Filter,
  Calendar,
  Sparkles
} from 'lucide-react';

// Define more specific types for our data
type ConnectionRequest = Tables<'pending_connection_requests'>;
type UserRecommendation = Database['public']['Functions']['get_user_recommendations']['Returns'][number];


const FunctionalSocial = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [recommendations, setRecommendations] = useState<UserRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [requestsRes, recommendationsRes] = await Promise.all([
          socialApi.connections.getPendingRequests(),
          socialApi.connections.getUserRecommendations(user.id)
        ]);

        if (requestsRes.data) {
          setRequests(requestsRes.data);
        }
        if (recommendationsRes.data) {
          setRecommendations(recommendationsRes.data);
        }
      } catch (error) {
        console.error("Failed to fetch social data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleRespondRequest = async (requesterId: string, response: 'accepted' | 'ignored') => {
    const originalRequests = [...requests];
    // Optimistically update UI
    setRequests(requests.filter(req => req.requester_id !== requesterId));
    
    const { error } = await socialApi.connections.respondToRequest(requesterId, response);
    if (error) {
      console.error(`Failed to ${response} request:`, error);
      // Revert on error
      setRequests(originalRequests);
      // Add toast notification here
    }
  };
  
  const handleSendRequest = async (addresseeId: string) => {
      const originalRecs = [...recommendations];
      setRecommendations(recommendations.filter(rec => rec.id !== addresseeId));

      const { error } = await socialApi.connections.sendRequest(addresseeId);
      if (error) {
          console.error("Failed to send request:", error);
          setRecommendations(originalRecs);
      }
  };


  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-medical py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Social Networking</h1>
          <p className="text-muted-foreground text-lg">
            Manage your professional connections and discover new healthcare professionals to network with.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6 animate-slide-up">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Connection Requests</h2>
              <Badge variant="secondary" className="text-sm">
                {requests.length} pending
              </Badge>
            </div>

            {loading ? (
              <Card><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
            ) : requests.length > 0 ? (
              <div className="space-y-4">
                {requests.map((request) => (
                  <Card key={request.requester_id} className="card-medical">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4 flex-1">
                          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
                            <img src={request.profile_picture_url || '/api/placeholder/64/64'} alt={request.full_name} className="rounded-full w-full h-full object-cover" />
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-1">{request.full_name}</h3>
                            <p className="text-primary font-medium mb-1">{request.organization || 'Organization not specified'}</p>
                            <p className="text-muted-foreground text-sm mb-2">
                              {request.current_location}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Sent on {new Date(request.request_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          <Button size="sm" className="btn-medical" onClick={() => handleRespondRequest(request.requester_id, 'accepted')}>
                            Accept
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleRespondRequest(request.requester_id, 'ignored')}>
                            Ignore
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="card-medical">
                <CardContent className="p-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
                  <p className="text-muted-foreground">
                    You're all caught up!
                  </p>
                </CardContent>
              </Card>
            )}
            
          </div>

          <div className="space-y-6 animate-fade-in">
            <Card className="card-medical">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  People You May Know
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 {loading ? (
                    <Skeleton className="h-20 w-full" />
                 ) : recommendations.length > 0 ? (
                    recommendations.slice(0, 5).map((rec) => (
                      <div key={rec.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                         <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                           <span className="text-white font-semibold text-sm">
                             {rec.full_name.split(' ').map(n => n[0]).join('')}
                           </span>
                         </div>
                        
                         <div className="flex-1 min-w-0">
                           <h4 className="font-medium text-sm truncate">{rec.full_name}</h4>
                           <p className="text-xs text-muted-foreground truncate">{rec.specialization}</p>
                           <p className="text-xs text-primary">{rec.current_location}</p>
                           <p className="text-xs text-muted-foreground">Score: {Math.round(rec.similarity_score * 100)}</p>
                          
                           <Button size="sm" className="mt-2 h-7 text-xs" onClick={() => handleSendRequest(rec.id)}>
                             <UserPlus className="h-3 w-3 mr-1" />
                             Connect
                           </Button>
                         </div>
                       </div>
                    ))
                 ) : (
                    <p className="text-sm text-muted-foreground text-center">No recommendations right now.</p>
                 )}
                
                <Button variant="outline" size="sm" className="w-full">
                  See More Suggestions
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FunctionalSocial;
