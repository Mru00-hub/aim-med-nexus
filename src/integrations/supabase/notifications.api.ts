// src/integrations/supabase/notifications.api.ts

import { supabase } from './client';

// 1. --- DEFINE TYPES ---
//
// This is the final list of notification types that
// your Notifications.tsx page will display.
//
export type NotificationType =
  | 'connection_accepted'
  | 'new_public_post_by_followed_user' // [!code --] | 'new_thread'
  | 'new_public_space_by_followed_user' // [!code --] | 'new_space'
  | 'new_reply_to_your_message' // [!code --] | 'new_reply'
  | 'new_direct_message' // [!code ++]
  | 'space_join_request' // [!code ++]
  | 'system_update'
  | 'job_application_update';

// This is the main type for a notification, joining the actor's profile info
export type NotificationWithActor = {
  id: string; // uuid
  user_id: string;
  actor_id: string;
  type: NotificationType;
  entity_id: string | null; // e.g., thread_id, user_id, job_id, space_id
  announcement_id: string | null;
  is_read: boolean;
  created_at: string;
  actor: {
    // Joined from profiles table (actor_id -> profiles.id)
    full_name: string | null;
    profile_picture_url: string | null;
  } | null;
  announcement: {
    title: string;
    body: string | null;
  } | null;
  space: { // [!code ++]
    // Joined from spaces table (entity_id -> spaces.id) // [!code ++]
    name: string | null; // [!code ++]
  } | null; // [!code ++]
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
    'connection_accepted',
    'new_public_post_by_followed_user',
    'new_public_space_by_followed_user',
    'new_reply_to_your_message',
    'new_direct_message',
    'space_join_request',
    'system_update',
    'job_application_update',
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
