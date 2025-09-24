import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  MessageSquare, 
  Users, 
  Briefcase,
  CheckCircle,
  X,
  Settings,
  Mail,
  Smartphone,
  Calendar,
  Star,
  Heart,
  Reply
} from 'lucide-react';

/**
 * Notifications Page - Comprehensive notification center
 * Manages all platform notifications with preferences and filtering
 */
const Notifications = () => {
  const [activeTab, setActiveTab] = useState('all');
  
  // Example notifications - in real app this would come from API
  const notifications = [
    {
      id: 1,
      type: 'forum',
      icon: MessageSquare,
      title: 'New reply in "Best guidelines for AFib in 2025?"',
      description: 'Dr. Patel replied to your discussion in Global Cardiology forum',
      timestamp: '5 minutes ago',
      isRead: false,
      actionUrl: '/forums/thread/1'
    },
    {
      id: 2,
      type: 'connection',
      icon: Users,
      title: 'New connection request',
      description: 'Dr. Priya Sharma wants to connect with you',
      timestamp: '2 hours ago',
      isRead: false,
      actionUrl: '/social'
    },
    {
      id: 3,
      type: 'job',
      icon: Briefcase,
      title: 'Job application update',
      description: 'Your application for Clinical Data Analyst at CarePulse Labs has been reviewed',
      timestamp: '1 day ago',
      isRead: true,
      actionUrl: '/networking?tab=jobs'
    },
    {
      id: 4,
      type: 'forum',
      icon: Heart,
      title: 'Your post received reactions',
      description: '12 healthcare professionals liked your post about AI in diagnostics',
      timestamp: '2 days ago',
      isRead: true,
      actionUrl: '/forums'
    },
    {
      id: 5,
      type: 'system',
      icon: Star,
      title: 'Welcome to AIMedNet Premium!',
      description: 'Your premium subscription is now active. Enjoy enhanced features.',
      timestamp: '3 days ago',
      isRead: true,
      actionUrl: '/premium'
    },
    {
      id: 6,
      type: 'forum',
      icon: Reply,
      title: 'Tagged in discussion',
      description: 'Dr. Ahmed mentioned you in "AI triage in ER—real results"',
      timestamp: '1 week ago',
      isRead: true,
      actionUrl: '/forums/thread/3'
    }
  ];

  const notificationPreferences = [
    {
      category: 'Forum Discussions',
      description: 'Replies, mentions, and forum activity',
      email: true,
      push: true,
      mobile: false
    },
    {
      category: 'Connection Requests',
      description: 'New connection requests and acceptances',
      email: true,
      push: true,
      mobile: true
    },
    {
      category: 'Job Applications',
      description: 'Application updates and new job matches',
      email: true,
      push: false,
      mobile: false
    },
    {
      category: 'Messages',
      description: 'New private messages and conversations',
      email: false,
      push: true,
      mobile: true
    },
    {
      category: 'Platform Updates',
      description: 'New features, maintenance, and announcements',
      email: true,
      push: false,
      mobile: false
    }
  ];

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationsByType = (type: string) => {
    if (type === 'all') return notifications;
    if (type === 'unread') return notifications.filter(n => !n.isRead);
    return notifications.filter(n => n.type === type);
  };

  const markAsRead = (id: number) => {
    // In real app, this would update via API
    console.log('Marking notification as read:', id);
  };

  const markAllAsRead = () => {
    // In real app, this would update via API
    console.log('Marking all notifications as read');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-medical py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold mb-2">Notifications</h1>
            <p className="text-muted-foreground text-lg">
              Stay updated with your professional healthcare network activity.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-sm">{unreadCount} unread</Badge>
            <Button variant="outline" onClick={markAllAsRead}>
              Mark All Read
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Notifications */}
          <div className="lg:col-span-3 animate-slide-up">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">Unread</TabsTrigger>
                <TabsTrigger value="forum">Forums</TabsTrigger>
                <TabsTrigger value="connection">Social</TabsTrigger>
                <TabsTrigger value="job">Jobs</TabsTrigger>
              </TabsList>

              {['all', 'unread', 'forum', 'connection', 'job'].map((tabValue) => (
                <TabsContent key={tabValue} value={tabValue} className="space-y-4">
                  {getNotificationsByType(tabValue).length > 0 ? (
                    getNotificationsByType(tabValue).map((notification) => (
                      <Card 
                        key={notification.id} 
                        className={`card-medical cursor-pointer transition-all hover:shadow-hover ${
                          !notification.isRead ? 'border-l-4 border-l-primary bg-primary/5' : ''
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              !notification.isRead ? 'bg-gradient-primary' : 'bg-muted'
                            }`}>
                              <notification.icon className={`h-5 w-5 ${
                                !notification.isRead ? 'text-primary-foreground' : 'text-muted-foreground'
                              }`} />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className={`font-semibold ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {notification.title}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">{notification.timestamp}</span>
                                  {!notification.isRead && (
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                  )}
                                </div>
                              </div>
                              
                              <p className="text-muted-foreground mb-3">{notification.description}</p>
                              
                              <div className="flex items-center gap-3">
                                <Button size="sm" variant="outline" className="hover:bg-primary/5">
                                  View Details
                                </Button>
                                <Button size="sm" variant="ghost" onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  {notification.isRead ? 'Read' : 'Mark Read'}
                                </Button>
                                <Button size="sm" variant="ghost">
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="card-medical">
                      <CardContent className="p-12 text-center">
                        <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                        <p className="text-muted-foreground">
                          {tabValue === 'unread' 
                            ? "You're all caught up! No unread notifications."
                            : `No ${tabValue === 'all' ? '' : tabValue} notifications to show.`
                          }
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 animate-fade-in">
            {/* Quick Stats */}
            <Card className="card-medical">
              <CardHeader>
                <CardTitle>Activity Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Unread</span>
                  <Badge variant="destructive">{unreadCount}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Today</span>
                  <span className="text-sm text-muted-foreground">
                    {notifications.filter(n => n.timestamp.includes('ago') && 
                      (n.timestamp.includes('minutes') || n.timestamp.includes('hours'))).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">This week</span>
                  <span className="text-sm text-muted-foreground">
                    {notifications.length}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card className="card-medical">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Preferences
                </CardTitle>
                <CardDescription>
                  Manage how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {notificationPreferences.map((pref, index) => (
                  <div key={index} className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm">{pref.category}</h4>
                      <p className="text-xs text-muted-foreground">{pref.description}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Email</span>
                        </div>
                        <Switch defaultChecked={pref.email} />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Push</span>
                        </div>
                        <Switch defaultChecked={pref.push} />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Mobile</span>
                        </div>
                        <Switch defaultChecked={pref.mobile} />
                      </div>
                    </div>
                    
                    {index < notificationPreferences.length - 1 && (
                      <div className="border-t border-border pt-3" />
                    )}
                  </div>
                ))}
                
                <Button size="sm" className="w-full btn-medical">
                  Save Preferences
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
                  Schedule Digest
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Summary
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Advanced Settings
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

export default Notifications;