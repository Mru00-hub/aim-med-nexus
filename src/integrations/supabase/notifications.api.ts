// src/integrations/supabase/notifications.api.ts

import { supabase } from './client';
import type { Database, Tables, Enums } from '../../types'; 

// 1. --- DEFINE TYPES ---
//
// This is the final list of notification types that
// your Notifications.tsx page will display.
//
export type NotificationType =
  | 'new_connection_request' // [!code ++]
  | 'connection_accepted'
  | 'new_thread' // [!code ++] (For space members)
  | 'new_space' // [!code ++] (For membership approval / new joins)
  | 'new_space_created'
  | 'space_join_request'
  | 'new_reply'
  | 'system_update'
  | 'new_reply_to_your_message'
  | 'job_application_update'
  | 'new_public_post_by_followed_user'
  | 'new_public_space_by_followed_user'
  | 'new_direct_message'
  // --- New Types We Just Added ---
  | 'new_job_posting' // [!code ++]
  | 'new_collaboration_posting' // [!code ++]
  | 'new_job_applicant' // [!code ++]
  | 'new_collaboration_applicant'
  | 'new_company'
  | 'new_follower'
  | 'new_reaction';

// This is the main type for a notification, joining the actor's profile info
export type NotificationWithActor = {
  id: string; // uuid
  user_id: string;
  actor_id: string;
  type: NotificationType;
  entity_id: string | null;
  announcement_id: string | null;
  is_read: boolean;
  created_at: string;
  
  // Joined from profiles
  actor: {
    full_name: string | null;
    profile_picture_url: string | null;
  } | null;
  
  // Joined from announcements
  announcement: {
    title: string;
    body: string | null;
  } | null;
  
  // Joined from spaces
  space: {
    name: string | null;
  } | null;

  // --- NEW OBJECTS FROM UPDATED RPC ---
  // [!code ++]
  // Joined from threads
  thread: {
    title: string;
    space_id: string;
  } | null;

  // [!code ++]
  // Joined from company_jobs
  job: {
    title: string;
    company_id: string;
    company_name?: string;
  } | null;

  company: {
    name: string;
  } | null;

  // [!code ++]
  // Joined from collaborations
  collaboration: {
    title: string;
    company_id: string;
    company_name?: string;
  } | null;

  // [!code ++]
  // Joined from job_applications (and its related job title)
  job_application: {
    id: string;
    status: Enums<'application_status_enum'>;
    job_title: string;
  } | null;

  // [!code ++]
  // Joined from collaboration_applications (and its related collab title)
  collaboration_application: {
    id: string;
    status: Enums<'application_status_enum'>;
    collaboration_title: string;
  } | null;
};

// 2. --- API FUNCTIONS ---

/**
 * Fetches all notifications for the current user,
 * joining the actor's profile details.
 */
export const getNotifications = async (): Promise<NotificationWithActor[]> => {
  // Call the database function we just created
  const { data, error } = await supabase.rpc('get_my_notifications');

  if (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }

  // The RPC returns the data as JSON, which already matches our type.
  // We just need to cast it.
  const allData = data as NotificationWithActor[];

  // This filter list is still necessary
  const knownTypes: NotificationType[] = [
    'new_connection_request',
    'connection_accepted',
    'new_thread',
    'new_space',
    'new_space_created',
    'system_update',
    'space_join_request',
    'new_reply',
    'new_reply_to_your_message',
    'job_application_update',
    'new_public_post_by_followed_user',
    'new_public_space_by_followed_user',
    'new_direct_message',
    'new_job_posting',
    'new_collaboration_posting',
    'new_job_applicant',
    'new_collaboration_applicant',
    'new_company',
    'new_follower',
    'new_reaction'
  ];

  // Return only the data that matches our known types
  return allData.filter(n => n.type && knownTypes.includes(n.type));
};

/**
 * Marks a single notification as read by its ID.
 */
export const markNotificationAsRead = async (id: string): Promise<any> => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error marking as read:', error);
    throw error;
  }
  return data;
};

/**
 * Marks all of the user's unread notifications as read.
 */
export const markAllNotificationsAsRead = async (): Promise<any> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('User not found');

  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all as read:', error);
    throw error;
  }
  return data;
};

/**
 * Deletes a single notification by its ID.
 */
export const deleteNotification = async (id: string): Promise<any> => {
  const { data, error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
  return data;
};
