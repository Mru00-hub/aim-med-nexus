import { supabase } from './client';
import type { Database, Enums, Tables, TablesInsert, TablesUpdate } from "./types"; 

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
  follows_activity: boolean;
  direct_messages: boolean;
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
      'id, user_id, email_enabled, connection_requests, job_alerts, forum_updates, follows_activity, direct_messages'
    )
    .eq('user_id', user.id)
    .limit(1); // Expect one row per user

  if (error) {
    console.error('Error fetching notification preferences:', error);
    throw error;
  }

  if (!data) {
    // This should not happen if your user creation trigger is working
    throw new Error('No notification preferences found for this user.');
  }

  if (!data || data.length === 0) {
    // This should not happen if the trigger is working,
    // but it protects against old users.
    console.warn(`No preferences row found for user: ${user.id}. This might be an old account.`);
    throw new Error('No notification preferences found for this user. Please contact support if this issue persists.');
  }

  return data [0];
};

const getSessionOrThrow = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  if (!session) throw new Error("Authentication required. Please log in.");
  return session;
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

export type EditableAchievement = (TablesInsert<'academic_achievements'> | TablesUpdate<'academic_achievements'>) & { id?: string };
export type EditablePublication = (TablesInsert<'publications'> | TablesUpdate<'publications'>) & { id?: string };
export type EditableCertification = (TablesInsert<'certifications'> | TablesUpdate<'certifications'>) & { id?: string };
export type EditableAward = (TablesInsert<'awards'> | TablesUpdate<'awards'>) & { id?: string };
export type EditableTransition = (TablesInsert<'career_transitions'> | TablesUpdate<'career_transitions'>);
export type EditableVenture = (TablesInsert<'ventures'> | TablesUpdate<'ventures'>) & { id?: string };
export type EditableContent = (TablesInsert<'content_portfolio'> | TablesUpdate<'content_portfolio'>) & { id?: string };

/**
 * Fetches all academic achievements for the *currently logged-in user*.
 */
export const getMyAcademicAchievements = async (): Promise<Tables<'academic_achievements'>[]> => {
    const session = await getSessionOrThrow();
    const { data, error } = await supabase
        .from('academic_achievements')
        .select('*')
        .eq('profile_id', session.user.id)
        .order('year', { ascending: false, nulls: 'last' });
    if (error) throw error;
    return data || [];
};

/**
 * Fetches all publications for the *currently logged-in user*.
 */
export const getMyPublications = async (): Promise<Tables<'publications'>[]> => {
    const session = await getSessionOrThrow();
    const { data, error } = await supabase
        .from('publications')
        .select('*')
        .eq('profile_id', session.user.id)
        .order('publication_date', { ascending: false, nulls: 'last' });
    if (error) throw error;
    return data || [];
};

/**
 * Fetches all certifications for the *currently logged-in user*.
 */
export const getMyCertifications = async (): Promise<Tables<'certifications'>[]> => {
    const session = await getSessionOrThrow();
    const { data, error } = await supabase
        .from('certifications')
        .select('*')
        .eq('profile_id', session.user.id)
        .order('issue_date', { ascending: false, nulls: 'last' });
    if (error) throw error;
    return data || [];
};

/**
 * Fetches all awards for the *currently logged-in user*.
 */
export const getMyAwards = async (): Promise<Tables<'awards'>[]> => {
    const session = await getSessionOrThrow();
    const { data, error } = await supabase
        .from('awards')
        .select('*')
        .eq('profile_id', session.user.id)
        .order('date', { ascending: false, nulls: 'last' });
    if (error) throw error;
    return data || [];
};

/**
 * Fetches the career transition data for the *currently logged-in user*.
 */
export const getMyTransitionData = async (): Promise<Tables<'career_transitions'> | null> => {
    const session = await getSessionOrThrow();
    const { data, error } = await supabase
        .from('career_transitions')
        .select('*')
        .eq('profile_id', session.user.id)
        .maybeSingle(); // Use maybeSingle as it might not exist
    if (error) throw error;
    return data;
};

/**
 * Fetches all ventures for the *currently logged-in user*.
 */
export const getMyVentures = async (): Promise<Tables<'ventures'>[]> => {
    const session = await getSessionOrThrow();
    const { data, error } = await supabase
        .from('ventures')
        .select('*')
        .eq('profile_id', session.user.id)
        .order('start_date', { ascending: false, nulls: 'last' });
    if (error) throw error;
    return data || [];
};

/**
 * Fetches all content portfolio items for the *currently logged-in user*.
 */
export const getMyContentPortfolio = async (): Promise<Tables<'content_portfolio'>[]> => {
    const session = await getSessionOrThrow();
    const { data, error } = await supabase
        .from('content_portfolio')
        .select('*')
        .eq('profile_id', session.user.id)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

/**
 * This payload contains all the 1-to-many items to be saved.
 */
type SaveProfilePayload = {
    achievements: EditableAchievement[];
    publications: EditablePublication[];
    certifications: EditableCertification[];
    awards: EditableAward[];
    transitionData: EditableTransition | null;
    ventures: EditableVenture[];
    contentPortfolio: EditableContent[];
};

/**
 * This payload contains the IDs of items deleted in the UI.
 */
type DeletedItemsPayload = {
    academic_achievements: string[];
    publications: string[];
    certifications: string[];
    awards: string[];
    ventures: string[];
    content_portfolio: string[];
};

/**
 * Bundles all save/delete operations for the "Edit Profile" page
 * into a single API call.
 */
export const saveProfileDetails = async (payload: SaveProfilePayload, deletedItems: DeletedItemsPayload) => {
    const session = await getSessionOrThrow();
    const userId = session.user.id;

    // Helper to prepare data for upsert
    // Adds profile_id and converts empty strings to null
    const prepareUpsert = (list: any[]) => list.map(item => {
        const newItem = { ...item, profile_id: userId };
        Object.keys(newItem).forEach(key => {
            if (newItem[key] === '') newItem[key] = null;
        });
        // Special handling for authors string-to-array
        if ('authors' in newItem && typeof newItem.authors === 'string') {
            newItem.authors = (newItem.authors as string).split(',').map(s => s.trim()).filter(Boolean);
        }
        return newItem;
    });

    const prepareTransitionUpsert = (data: EditableTransition | null) => {
        if (!data) return null;
        const newItem = { ...data, profile_id: userId, updated_at: new Date().toISOString() };
        Object.keys(newItem).forEach(key => {
            if (newItem[key] === '') newItem[key] = null;
        });
        // Handle array fields
        if ('target_industries' in newItem && typeof newItem.target_industries === 'string') {
             newItem.target_industries = (newItem.target_industries as string).split(',').map(s => s.trim()).filter(Boolean);
        }
        return newItem;
    };
    
    const transitionUpsertData = prepareTransitionUpsert(payload.transitionData);

    // Run all database operations in parallel
    const [
        { error: achError },
        { error: pubError },
        { error: certError },
        { error: awardError },
        { error: ventureError },
        { error: contentError },
        transitionUpsertData ? supabase.from('career_transitions').upsert(transitionUpsertData) : Promise.resolve({ error: null }),
        // Deletion promises
        { error: delAchError },
        { error: delPubError },
        { error: delCertError },
        { error: delAwardError },
        { error: delVentureError },
        { error: delContentError },
    ] = await Promise.all([
        supabase.from('academic_achievements').upsert(prepareUpsert(payload.achievements)),
        supabase.from('publications').upsert(prepareUpsert(payload.publications)),
        supabase.from('certifications').upsert(prepareUpsert(payload.certifications)),
        supabase.from('awards').upsert(prepareUpsert(payload.awards)),
        supabase.from('ventures').upsert(prepareUpsert(payload.ventures)),
        supabase.from('content_portfolio').upsert(prepareUpsert(payload.contentPortfolio)),
        // Deletions
        supabase.from('academic_achievements').delete().in('id', deletedItems.academic_achievements),
        supabase.from('publications').delete().in('id', deletedItems.publications),
        supabase.from('certifications').delete().in('id', deletedItems.certifications),
        supabase.from('awards').delete().in('id', deletedItems.awards),
        supabase.from('ventures').delete().in('id', deletedItems.ventures),
        supabase.from('content_portfolio').delete().in('id', deletedItems.content_portfolio),
    ]);

    // Check for any errors
    const errors = [achError, pubError, certError, awardError,ventureError, contentError, delAchError, delPubError, delCertError, delAwardError, delVentureError, delContentError].filter(Boolean);
    if (errors.length > 0) {
        throw new Error(errors.map(e => e.message).join(', '));
    }
    
    return { success: true };
};

export const updateProfileMode = async (mode: 'clinical' | 'non_clinical') => {
    const session = await getSessionOrThrow();
    const { data, error } = await supabase
        .from('profiles')
        .update({ profile_mode: mode })
        .eq('id', session.user.id)
        .select('profile_mode')
        .single();
        
    if (error) throw error;
    return data;
};
