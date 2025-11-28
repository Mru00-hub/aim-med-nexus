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
  Mail, // For DMs
  UserCheck, // For connection accepted
  Building2, // [!code ++] For Companies
  Heart,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  NotificationWithActor,
  NotificationType, // [!code ++] Import the full type
} from '@/integrations/supabase/notifications.api';
import { useSocialCounts } from '@/context/SocialCountsContext';
import { formatDistanceToNow } from 'date-fns';

// [!code ++]
// This function is now comprehensive for all notification types
const getNotificationDetails = (notification: NotificationWithActor) => {
  const { type, actor, space, thread, job, collaboration, job_application, collaboration_application, company } = notification;
  const actorName = actor?.full_name || 'Someone';
  const spaceName = space?.name || 'a space';
  const companyName = company?.name || 'a company';
  const jobCompany = job?.company_name || 'a company';
  const collabCompany = collaboration?.company_name || 'a company';

  let icon: React.ElementType = Bell;
  let title = 'New Notification';
  let description = 'You have a new update.';

  switch (type) {
    // --- System ---
    case 'system_update':
      icon = Star;
      title = notification.announcement?.title || 'System Update';
      description = notification.announcement?.body || 'Check out the latest features and announcements.';
      break;

    // --- Social ---
    case 'new_connection_request':
      icon = UserPlus;
      title = 'Connection Request';
      description = `${actorName} wants to connect with you.`;
      break;
    case 'connection_accepted':
      icon = UserCheck;
      title = 'Connection Accepted';
      description = `${actorName} accepted your connection request.`;
      break;
    case 'new_direct_message':
      icon = Mail;
      title = 'New Message';
      description = `${actorName} sent you a new direct message.`;
      break;
    case 'new_follower': // [!code ++]
      icon = UserPlus;
      title = 'New Follower';
      description = `${actorName} started following you.`;
      break;

    // --- Community / Forums ---
    case 'new_public_post_by_followed_user':
      icon = MessageSquare;
      title = 'New Post';
      description = `${actorName} (who you follow) posted: "${thread?.title || 'a new post'}".`;
      break;
    case 'new_public_space_by_followed_user':
      icon = Users;
      title = 'New Space';
      description = `${actorName} (who you follow) created a new space: "${space?.name || '...'}".`;
      break;
    case 'space_join_request':
      icon = UserPlus;
      title = 'Space Join Request';
      description = `${actorName} has requested to join the space "${spaceName}".`;
      break;
    case 'new_reply':
      icon = MessageSquare;
      title = 'New Thread Activity';
      // [!code change] Updated to match Email logic (Thread Title + Space Name)
      description = `${actorName} commented on "${thread?.title || 'your post'}" in ${spaceName}.`;
      break;
    case 'new_reply_to_your_message':
      icon = MessageSquare;
      title = 'New Reply';
      // [!code change] Updated to match Email logic (Context: Thread Title + Space Name)
      description = `${actorName} replied to your comment in "${thread?.title || 'a discussion'}" (${spaceName}).`;
      break;
    case 'new_reaction': // [!code ++]
      icon = Heart;
      title = 'New Reaction';
      description = `${actorName} reacted to your post.`;
      break;
    case 'new_thread':
      icon = MessageSquare;
      title = 'New Post in Space';
      description = `${actorName} posted "${thread?.title || 'a new post'}" in ${spaceName}.`;
      break;
    case 'new_space':
      icon = Users;
      title = 'Membership Approved';
      description = `Your request to join "${spaceName}" was approved.`;
      break;
    case 'new_member_joined':
      icon = UserPlus;
      title = 'New Member';
      description = `${actorName} joined the space "${spaceName}".`;
      break;

    // [!code ++] New Space Created (Broadcast)
    case 'new_space_created':
      icon = Users;
      title = 'New Space Alert';
      description = `${actorName} created a new space called "${spaceName}". Click to explore!`;
      break;
      
    // --- Jobs & Opportunities (Manager/Applicant) ---
    case 'job_application_update':
      icon = Briefcase;
      title = 'Application Update';
      description = `Your application for "${job_application?.job_title || 'a job'}" was updated to: ${job_application?.status || '...'}.`;
      break;
    case 'new_job_posting':
      icon = Briefcase;
      title = 'New Job Posting';
      description = `${actorName} posted a new job at ${jobCompany}: "${job?.title || '...'}".`;
      break;
    case 'new_collaboration_posting':
      icon = Construction;
      title = 'New Collaboration';
      description = `${actorName} posted a new collaboration at ${collabCompany}: "${collaboration?.title || '...'}".`;
      break;
    case 'new_job_applicant':
      icon = UserPlus;
      title = 'New Job Applicant';
      description = `${actorName} applied for your job: "${job_application?.job_title || '...'}".`;
      break;
    case 'new_collaboration_applicant':
      icon = UserPlus;
      title = 'New Collab Applicant';
      description = `${actorName} applied for your collaboration: "${collaboration_application?.collaboration_title || '...'}".`;
      break;
    case 'new_company': // [!code ++]
      icon = Building2;
      title = 'New Company Page';
      description = `${actorName} created a new company page: "${companyName}".`;
      break;

    // --- Fallback (Should not be reached) ---
    default:
      console.warn(`Unknown notification type: ${type}`);
      icon = AlertCircle;
      title = 'Unknown Notification';
      description = 'An unknown notification type was received.';
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
        onClick(notification);
      }}
    >
      
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${ 
              !notification.is_read ? 'bg-gradient-primary' : 'bg-muted'
            }`}
          >
            <Icon
              className={`h-4 w-4 ${ 
                !notification.is_read
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground'
              }`}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-1 gap-1 sm:gap-0"> 
              <h3
                className={`font-semibold text-base ${ 
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

            <p className="text-sm text-muted-foreground mb-2 break-words whitespace-normal">
              {description}
            </p>
            
            
            <div className="flex flex-wrap items-center gap-1">
              <Button
                size="xs"
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
                size="xs"
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
    <CardContent className="p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <Skeleton className="h-4 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function Notifications() {
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();
  const { refetchNotifCount } = useSocialCounts(); // [!code --] Removed unused markNotificationAsRead
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

  // [!code ++]
  // This logic is now updated to sort all 14 notification types
  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return notifications;
    if (activeTab === 'unread') return notifications.filter(n => !n.is_read);
    
    // "Updates" are content-based (posts, spaces, system)
    if (activeTab === 'updates') {
      return notifications.filter(
        n =>
          n.type === 'system_update' ||
          n.type === 'new_public_post_by_followed_user' ||
          n.type === 'new_public_space_by_followed_user' ||
          n.type === 'new_reply_to_your_message' ||
          n.type === 'new_thread' ||
          n.type === 'new_space' ||
          n.type === 'new_space_created' ||
          n.type === 'new_job_posting' ||
          n.type === 'new_collaboration_posting' ||
          n.type === 'new_company' || // [!code ++]
          n.type === 'new_reply'
      );
    }
    // "Social" is person-to-person (connections, DMs)
    if (activeTab === 'social') {
      return notifications.filter(
        n => 
          n.type === 'new_connection_request' ||
          n.type === 'connection_accepted' ||
          n.type === 'new_direct_message' ||
          n.type === 'new_follower' || // [!code ++]
          n.type === 'new_reaction' 
      );
    }
    // "Jobs" is application-related (for applicants or managers)
    if (activeTab === 'job') {
      return notifications.filter(
        n =>
          n.type === 'job_application_update' ||
          n.type === 'new_job_applicant' ||
          n.type === 'new_collaboration_applicant'
      );
    }
    return [];
  }, [notifications, activeTab]);

  const handleMarkAsRead = async (id: string) => {
    const previousState = [...notifications];
    setNotifications(current =>
      current.map(n => (n.id === id ? { ...n, is_read: true } : n))
    );
    try {
      await markNotificationAsRead(id);
      refetchNotifCount(); // [!code ++] Refresh count after marking read
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
    setNotifications(current => current.map(n => ({ ...n, is_read: true })));
    try {
      await markAllNotificationsAsRead();
      refetchNotifCount(); // [!code ++] Refresh count
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

  // [!code ++]
  // This handler is now comprehensive for all new types
  const handleNotificationClick = (notification: NotificationWithActor) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    const entityId = notification.entity_id;
    const actorId = notification.actor_id;

    switch (notification.type) {
      // --- System ---
      case 'system_update':
        if (notification.announcement_id) {
          toast({
            title: notification.announcement?.title || 'System Update',
            description: <div className="whitespace-pre-wrap">{notification.announcement?.body || ''}</div>,
            duration: 10000,
          });
          return;
        }
        break;

      // --- Community / Forums ---
      case 'new_public_post_by_followed_user':
      case 'new_reply_to_your_message':
      case 'new_thread':
      case 'new_reply':    // [!code ++]
      case 'new_reaction':
        if (entityId) {
          navigate(`/community/thread/${entityId}`); // Navigate to the post
          return;
        }
        break;

      case 'new_public_space_by_followed_user':
      case 'new_space':
      case 'new_space_created':
      case 'space_join_request':
        if (entityId) {
          navigate(`/community/space/${entityId}`); // Navigate to the space
          return;
        }
        break;

      // --- Social ---
      case 'new_connection_request':
      case 'connection_accepted':
      case 'new_follower':
        if (actorId) {
          navigate(`/profile/${actorId}`); // Navigate to the user's profile
          return;
        }
        break;
        
      case 'new_direct_message':
        navigate(`/inbox`); // Navigate to the inbox
        return;
        
      // --- Jobs & Opportunities ---
      case 'new_job_posting':
        if (entityId) {
          navigate(`/jobs/details/${entityId}`); // Correct path
          return;
        }
        break;
      case 'new_collaboration_posting':
        if (entityId) {
          navigate(`/collabs/details/${entityId}`); // Correct path
          return;
        }
        break;

      case 'new_company': // [!code ++]
        if (entityId) navigate(`/industryhub/company/${entityId}`);
        break;

      case 'job_application_update':
        navigate(`/industryhub/my-applications`); // Correct path
        break;

      case 'new_job_applicant':
      case 'new_collaboration_applicant': { // Added brackets for local scope
        // --- THIS IS THE FIX ---
        // Get the companyId from the application object on the notification
        const companyId = notification.job_application?.company_id || notification.collaboration_application?.company_id;

        if (entityId && companyId) {
          const tab = notification.type === 'new_job_applicant' ? 'job' : 'collab';
          
          // Navigate to the new dynamic route
          navigate(`/industryhub/dashboard/${companyId}?tab=applicants&type=${tab}&highlight=${entityId}`);
          return;
        }
        // If we're missing an ID, we'll fall through to the default toast
        break;
      }
    }
    // Fallback for any types without specific navigation
    toast({
      title: 'No Navigation',
      description: 'This notification is informational.',
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

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-6 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold mb-2">Notifications</h1>
            <p className="text-muted-foreground text-lg">
              All your platform and community activity in one place.
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
                {renderContent()}
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
