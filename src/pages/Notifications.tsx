import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell,
  MessageSquare,
  Users,
  Briefcase,
  CheckCircle,
  X,
  Star,
  Construction,
  AlertCircle,
  CheckSquare,
  Loader2,
  UserPlus, 
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  NotificationWithActor,
} from '@/integrations/supabase/notifications.api';
import { useSocialCounts } from '@/context/SocialCountsContext'; 
import { formatDistanceToNow } from 'date-fns';

const getNotificationDetails = (notification: NotificationWithActor) => {
  const { type, actor, space } = notification; // [!code ++] (add space)
  const actorName = actor?.full_name || 'Someone';
  const spaceName = space?.name || 'your space'; // [!code ++]

  let icon: React.ElementType = Bell;
  let title = 'New Notification';
  let description = 'You have a new update.';

  switch (type) {
    case 'system_update':
      icon = Star;
      title = notification.announcement?.title || 'System Update';
      description = notification.announcement?.body || 'Check out the latest features and announcements.';
      break;
    case 'new_public_post_by_followed_user': // <-- Keep this
      icon = MessageSquare;
      title = 'New Post';
      description = `${actorName} (who you follow) created a new post.`;
      break;
    case 'new_public_space_by_followed_user': // <-- Keep this
      icon = Users;
      title = 'New Space';
      description = `${actorName} (who you follow) created a new space.`;
      break;
    case 'connection_accepted':
      icon = CheckSquare;
      title = 'Connection Accepted';
      description = `${actorName} accepted your connection request.`;
      break;
    case 'job_application_update':
      icon = Briefcase;
      title = 'Job Application Update';
      description = `Your application for a job has been updated.`;
      break;
    case 'new_reply_to_your_message':
      icon = MessageSquare;
      title = 'New Reply';
      description = `${actorName} replied to your message on a post / thread.`;
      break;
    case 'new_direct_message': // This is for DMs
      icon = Users; // Use 'Users' icon to distinguish from public posts
      title = 'New Message';
      description = `${actorName} sent you a new direct message.`;
      break;
    case 'space_join_request': // [!code ++]
      icon = UserPlus; // [!code ++]
      title = 'Pending Request'; // [!code ++]
      description = `${actorName} requested to join ${spaceName}.`; // [!code ++]
      break; // [!code ++]
    default:
      console.warn(`Unknown notification type: ${type}`);
  }

  return { icon, title, description };
};

const NotificationCard = ({
  notification,
  onClick,
  onMarkRead,
  onDelete,
}: {
  notification: NotificationWithActor;
  onClick: (notification: NotificationWithActor) => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const { icon: Icon, title, description } = getNotificationDetails(notification);

  return (
    <Card
      key={notification.id}
      className={`card-medical cursor-pointer transition-all hover:shadow-hover ${
        !notification.is_read ? 'border-l-4 border-l-primary bg-primary/5' : ''
      }`}
      onClick={() => {
        if (notification.type !== 'system_update') {
          onClick(notification);
        }
      }}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div
            className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
              !notification.is_read ? 'bg-gradient-primary' : 'bg-muted'
            }`}
          >
            <Icon
              className={`h-5 w-5 ${
                !notification.is_read
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground'
              }`}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 gap-1 sm:gap-0">
              <h3
                className={`font-semibold truncate ${
                  !notification.is_read
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {title}
              </h3>
              <div className="flex items-center gap-2 flex-shrink-0 ml-0 sm:ml-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true,
                  })}
                </span>
                {!notification.is_read && (
                  <div
                    className="w-2 h-2 bg-primary rounded-full"
                    title="Unread"
                  ></div>
                )}
              </div>
            </div>

            {notification.type === 'system_update' ? (
              <p className="text-muted-foreground mb-3 mt-2 whitespace-pre-wrap"> 
                {description}
              </p>
            ) : (
              <p className="text-muted-foreground mb-3">{description}</p> 
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead(notification.id);
                }}
                disabled={notification.is_read}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark Read
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const NotificationSkeleton = () => (
  <Card className="card-medical">
    <CardContent className="p-6">
      <div className="flex items-start gap-4">
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <Skeleton className="h-4 w-3/4" />
          <div className="flex gap-3">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function Notifications() {
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();
  const { refetchNotifCount, markNotificationAsRead } = useSocialCounts();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationWithActor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getNotifications();
        setNotifications(data);
        refetchNotifCount();
      } catch (err: any) {
        setError('Failed to load notifications. Please try again later.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotifications();
  }, [refetchNotifCount]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return notifications;
    if (activeTab === 'unread') return notifications.filter(n => !n.is_read);
    
    if (activeTab === 'updates') {
      return notifications.filter(
        n =>
          n.type === 'system_update' ||
          n.type === 'new_public_post_by_followed_user' || 
          n.type === 'new_public_space_by_followed_user' ||
          n.type === 'new_reply_to_your_message' // Replies to posts
      );
    }
    if (activeTab === 'social') {
      return notifications.filter(
        n => 
          n.type === 'connection_accepted' ||
          n.type === 'new_direct_message' // DMs are social
      );
    }
    return [];
  }, [notifications, activeTab]);

  const handleMarkAsRead = async (id: string) => {
    const previousState = [...notifications];

    // Optimistically update UI state immediately
    setNotifications(current =>
      current.map(n => (n.id === id ? { ...n, is_read: true } : n))
    );

    try {
      await markNotificationAsRead(id);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to mark as read.',
        variant: 'destructive',
      });
      setNotifications(previousState);
    }
  };

  const handleMarkAllAsRead = async () => {
    const previousState = [...notifications];
    const previousUnreadCount = unreadCount;

    setNotifications(current => current.map(n => ({ ...n, is_read: true })));

    try {
      await markAllNotificationsAsRead();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to mark all as read.',
        variant: 'destructive',
      });
      setNotifications(previousState);
    }
  };

  const handleDelete = async (id: string) => {
    const previousState = [...notifications];
    const notificationToDelete = previousState.find(n => n.id === id);
    const wasUnread = notificationToDelete && !notificationToDelete.is_read;

    setNotifications(current => current.filter(n => n.id !== id));

    try {
      await deleteNotification(id);
      toast({ title: 'Deleted', description: 'Notification removed.' });
      refetchNotifCount();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete notification.',
        variant: 'destructive',
      });
      setNotifications(previousState);
    }
  };

  const handleNotificationClick = (notification: NotificationWithActor) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    if (notification.type === 'system_update') {
      return; // No navigation
    }

    const entityId = (notification as any).entity_id;
    const actorId = notification.actor_id;

    switch (notification.type) {
      // Post/Space related
      case 'new_public_post_by_followed_user':
      case 'new_reply_to_your_message':
        if (entityId) {
          navigate(`/post/${entityId}`); // Navigate to the post
          return;
        }
        break;

      case 'new_public_space_by_followed_user':
        if (entityId) {
          navigate(`/space/${entityId}`); // Navigate to the space
          return;
        }
        break;

      // Social related
      case 'connection_accepted':
        if (actorId) {
          navigate(`/profile/${actorId}`); // Navigate to the user's profile
          return;
        }
        break;
        
      case 'new_direct_message':
        if (entityId) {
          navigate(`/messages/${entityId}`); // Navigate to the conversation
          return;
        }
        break;

      case 'space_join_request': // [!code ++]
        if (entityId) { // [!code ++]
          navigate(`/space/${entityId}/members`); // Navigate to the space's member management page [!code ++]
          return; // [!code ++]
        } // [!code ++]
        break;

      // 'job_application_update' will fall through to the toast
    }

    // Fallback for types without navigation
    toast({
      title: 'Navigation Not Yet Implemented',
      description: 'You will soon be able to click this to see the content.',
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <NotificationSkeleton />
          <NotificationSkeleton />
          <NotificationSkeleton />
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (filteredNotifications.length > 0) {
      return (
        <div className="space-y-4">
          {filteredNotifications.map(notification => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onClick={handleNotificationClick}
              onMarkRead={handleMarkAsRead}
              onDelete={handleDelete}
            />
          ))}
        </div>
      );
    }

    return (
      <Card className="card-medical">
        <CardContent className="p-12 text-center">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No notifications</h3>
          <p className="text-muted-foreground">
            {activeTab === 'unread'
              ? "You're all caught up!"
              : `No ${activeTab} notifications to show.`}
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="container-medical flex-grow py-8">
        <Alert className="mb-8 border-primary/50">
          <Construction className="h-5 w-5" />
          <AlertTitle className="font-bold text-lg">
            Notifications Hub
          </AlertTitle>
          <AlertDescription className="text-base">
            This is your new feed for all platform and community updates. Job
            alerts are coming soon!
          </AlertDescription>
        </Alert>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-6 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold mb-2">Notifications</h1>
            <p className="text-muted-foreground text-lg">
              Stay updated with your community and platform activity.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-sm whitespace-nowrap px-4 py-2 justify-center">
                {unreadCount} Unread
              </Badge>
            )}
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0 || isLoading}
              className="w-full sm:w-auto"
            >
              Mark All Read
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-3 animate-slide-up">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full mb-6 overflow-x-auto justify-start">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">Unread</TabsTrigger>
                <TabsTrigger value="updates">Updates</TabsTrigger>
                <TabsTrigger value="social">Social</TabsTrigger>
                <TabsTrigger value="job">Jobs</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {renderContent()}
              </TabsContent>
              <TabsContent value="unread" className="space-y-4">
                {renderContent()}
              </TabsContent>
              <TabsContent value="updates" className="space-y-4">
                {renderContent()}
              </TabsContent>
              <TabsContent value="social" className="space-y-4">
                {renderContent()}
              </TabsContent>

              <TabsContent value="job" className="space-y-4">
                <Card className="card-medical">
                  <CardContent className="p-12 text-center">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      Job Notifications Coming Soon
                    </h3>
                    <p className="text-muted-foreground">
                      We're building a dedicated job board. Soon, you'll get
                      updates on applications and new job matches right here.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6 animate-fade-in md:col-span-1">
            <Card className="card-medical">
              <CardHeader>
                <CardTitle>Activity Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Unread</span>
                  <Badge variant={unreadCount > 0 ? 'destructive' : 'secondary'}>
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      unreadCount
                    )}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total</span>
                  <span className="text-sm text-muted-foreground">
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      notifications.length
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
