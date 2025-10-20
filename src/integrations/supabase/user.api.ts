import { supabase } from './client';

/**
 * Calls the 'delete_own_user' RPC function in Supabase
 * to securely delete the currently authenticated user.
 */
export const deleteCurrentUser = async () => {
  const { error } = await supabase.rpc('delete_own_user');

  if (error) {
    console.error('Error deleting user:', error);
    throw new Error(error.message);
  }

  return { success: true };
};

/**
 * Type definition for the user's notification preferences.
 * This should match the columns in your 'notification_preferences' table.
 */
export type NotificationPreferences = {
  id: string;
  user_id: string;
  email_enabled: boolean;
  connection_requests: boolean;
  job_alerts: boolean;
  forum_updates: boolean;
  message_notifications: boolean;
};

/**
 * Type definition for the payload to update preferences.
 * All fields are optional.
 */
export type UpdatePreferencesPayload = Partial<
  Omit<NotificationPreferences, 'id' | 'user_id'>
>;

/**
 * Fetches the notification preferences for the currently authenticated user.
 */
export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  // 1. Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('User not found');

  // 2. Fetch their preferences row
  const { data, error } = await supabase
    .from('notification_preferences')
    .select(
      'id, user_id, email_enabled, connection_requests, job_alerts, forum_updates, message_notifications'
    )
    .eq('user_id', user.id)
    .single(); // Expect one row per user

  if (error) {
    console.error('Error fetching notification preferences:', error);
    throw error;
  }

  if (!data) {
    // This should not happen if your user creation trigger is working
    throw new Error('No notification preferences found for this user.');
  }

  return data;
};

/**
 * Updates the notification preferences for the currently authenticated user.
 *
 * @param preferences An object containing the preferences to update.
 * @returns The updated preferences object.
 */
export const updateNotificationPreferences = async (
  preferences: UpdatePreferencesPayload
): Promise<NotificationPreferences> => {
  // 1. Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('User not found');

  // 2. Update the preferences row and set the 'updated_at' timestamp
  const { data, error } = await supabase
    .from('notification_preferences')
    .update({
      ...preferences,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .select() // Return the newly updated row
    .single();

  if (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }

  return data;
};
