import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { socialApi } from '@/integrations/supabase/social.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Users,
  Building,
  Plus
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';

// Note: This component is partially functional. The "Profiles" tab uses live data.
// "Companies" and "Collaborations" use example data as their backend is not defined
// in the provided documentation.

type Profile = Database['public']['Functions']['get_user_recommendations']['Returns'][number] & { isConnected?: boolean };

const FunctionalNetworking = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profiles');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await socialApi.connections.getUserRecommendations(user.id);
      if (data) {
        setProfiles(data);
      }
      if(error) {
          console.error("Failed to fetch profiles:", error);
      }
      setLoading(false);
    };

    if (activeTab === 'profiles') {
      fetchProfiles();
    }
  }, [user, activeTab]);
  
  const handleSendRequest = async (addresseeId: string) => {
      const { error } = await socialApi.connections.sendRequest(addresseeId);
      if (error) {
          console.error("Failed to send request:", error);
      } else {
          // Optimistically update the UI to show 'Pending' or remove the button
          setProfiles(profiles.map(p => p.id === addresseeId ? { ...p, isConnected: true } : p));
      }
  };


  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-medical py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Networking</h1>
          <p className="text-muted-foreground text-lg">
            Connect with peers, discover companies, and collaborations.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-slide-up">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="profiles">Profiles</TabsTrigger>
            <TabsTrigger value="companies">Companies (Example)</TabsTrigger>
            <TabsTrigger value="collaborations">Collaborations (Example)</TabsTrigger>
          </TabsList>

          <TabsContent value="profiles" className="space-y-6">
            {/* Profiles List */}
            <div className="space-y-4">
              {loading ? (
                <>
                  <Skeleton className="h-40 w-full" />
                  <Skeleton className="h-40 w-full" />
                </>
              ) : profiles.map((profile) => (
                <Card key={profile.id} className="card-medical">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4 flex-1">
                        <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
                            {profile.full_name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-1">{profile.full_name}</h3>
                          <p className="text-primary font-medium mb-2">{profile.specialization}</p>
                          <p className="text-muted-foreground mb-3">
                            {profile.current_location} • {profile.organization}
                          </p>
                           <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{profile.years_experience} experience</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          className="btn-medical"
                          onClick={() => handleSendRequest(profile.id)}
                          disabled={profile.isConnected}
                        >
                          {profile.isConnected ? 'Request Sent' : 'Connect'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* NOTE: Companies and Collaborations tabs remain with placeholder data */}
          {/* ... existing placeholder code for other tabs ... */}
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default FunctionalNetworking;
