import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  MessageCircle, 
  UserPlus,
  Search,
  Filter,
  Calendar,
  Sparkles
} from 'lucide-react';

/**
 * Social Page - Profile connections and networking
 * Displays connection requests, profile search, and social features
 */
const Social = () => {
  // Example connection requests - in real app this would come from API
  const connectionRequests = [
    {
      id: 1,
      name: 'Dr. Priya Sharma',
      title: 'Pediatric Cardiologist',
      location: 'Mumbai, IN',
      mutualConnections: 12,
      requestDate: '2 days ago',
      message: 'I noticed we both work in pediatric cardiology and would love to connect and share insights.',
      profileImage: '/api/placeholder/64/64'
    },
    {
      id: 2,
      name: 'Dr. Rajesh Kumar',
      title: 'Emergency Medicine Physician',
      location: 'Delhi, IN',
      mutualConnections: 8,
      requestDate: '1 week ago',
      message: 'Hi! I saw your posts about trauma protocols and would appreciate connecting with you.',
      profileImage: '/api/placeholder/64/64'
    },
    {
      id: 3,
      name: 'Sarah Johnson',
      title: 'Healthcare Data Analyst',
      location: 'Bangalore, IN',
      mutualConnections: 5,
      requestDate: '3 days ago',
      message: 'Hello! I\'m interested in your work with healthcare analytics. Let\'s connect!',
      profileImage: '/api/placeholder/64/64'
    }
  ];

  const suggestedConnections = [
    {
      id: 4,
      name: 'Dr. Amit Patel',
      title: 'Interventional Cardiologist',
      location: 'Pune, IN',
      mutualConnections: 15,
      reason: 'Similar specialty and location'
    },
    {
      id: 5,
      name: 'Dr. Lisa Wong',
      title: 'Pediatric Surgeon',
      location: 'Chennai, IN',
      mutualConnections: 23,
      reason: 'Colleagues from Global Pediatrics forum'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-medical py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Social Networking</h1>
          <p className="text-muted-foreground text-lg">
            Manage your professional connections and discover new healthcare professionals to network with.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Connection Requests */}
          <div className="lg:col-span-2 space-y-6 animate-slide-up">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Connection Requests</h2>
              <Badge variant="secondary" className="text-sm">
                {connectionRequests.length} pending
              </Badge>
            </div>

            {connectionRequests.length > 0 ? (
              <div className="space-y-4">
                {connectionRequests.map((request) => (
                  <Card key={request.id} className="card-medical">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4 flex-1">
                          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-lg">
                              {request.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-1">{request.name}</h3>
                            <p className="text-primary font-medium mb-1">{request.title}</p>
                            <p className="text-muted-foreground text-sm mb-2">
                              {request.location} • {request.mutualConnections} mutual connections
                            </p>
                            
                            {request.message && (
                              <div className="p-3 bg-muted/30 rounded-lg mb-3">
                                <p className="text-sm italic">"{request.message}"</p>
                              </div>
                            )}
                            
                            <p className="text-xs text-muted-foreground">
                              Sent {request.requestDate}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          <Button size="sm" className="btn-medical">
                            Accept
                          </Button>
                          <Button variant="outline" size="sm">
                            Ignore
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MessageCircle className="h-4 w-4" />
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
                    You're all caught up! New connection requests will appear here.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* My Network Summary */}
            <Card className="card-medical">
              <CardHeader>
                <CardTitle>Your Network Summary</CardTitle>
                <CardDescription>
                  Your professional healthcare network overview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">487</div>
                    <div className="text-sm text-muted-foreground">Connections</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-accent">23</div>
                    <div className="text-sm text-muted-foreground">Forums Joined</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-success">156</div>
                    <div className="text-sm text-muted-foreground">Discussions</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 animate-fade-in">
            {/* Search Professionals */}
            <Card className="card-medical">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Find Professionals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="btn-medical w-full">
                  Advanced Search
                </Button>
                <Button variant="outline" className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  Browse by Specialty
                </Button>
              </CardContent>
            </Card>

            {/* Suggested Connections */}
            <Card className="card-medical">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  People You May Know
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {suggestedConnections.map((suggestion) => (
                  <div key={suggestion.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">
                        {suggestion.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{suggestion.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">{suggestion.title}</p>
                      <p className="text-xs text-primary">{suggestion.mutualConnections} mutual</p>
                      <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
                      
                      <Button size="sm" className="mt-2 h-7 text-xs">
                        <UserPlus className="h-3 w-3 mr-1" />
                        Connect
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button variant="outline" size="sm" className="w-full">
                  See More Suggestions
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="card-medical">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Upcoming Events
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Recent Messages
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  My Communities
                </Button>
              </CardContent>
            </Card>

            {/* Coming Soon */}
            <Card className="card-premium border-premium/20">
              <CardHeader>
                <CardTitle className="text-premium">Coming Soon</CardTitle>
                <CardDescription>
                  Enhanced social features for healthcare professionals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-1.5 h-1.5 bg-premium rounded-full"></div>
                  Share professional updates
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-1.5 h-1.5 bg-premium rounded-full"></div>
                  Achievement showcasing
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-1.5 h-1.5 bg-premium rounded-full"></div>
                  Professional timeline
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-1.5 h-1.5 bg-premium rounded-full"></div>
                  Interest-based matching
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Social;
