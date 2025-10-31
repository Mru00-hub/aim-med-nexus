import { supabase } from './client';
import type { Database, Enums, Tables, TablesInsert, TablesUpdate } from "./types"; 
import { WorkExperience, EducationHistory } from './supabase/integrations/community.api';
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
export type EditableCocurricular = (TablesInsert<'cocurriculars'> | TablesUpdate<'cocurriculars'>) & { id?: string };
export type EditableWorkExperience = (TablesInsert<'work_experiences'> | TablesUpdate<'work_experiences'>) & { id?: string };
export type EditableEducationHistory = (TablesInsert<'education_history'> | TablesUpdate<'education_history'>) & { id?: string };
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
 * Fetches all cocurricular items for the *currently logged-in user*.
 */
export const getMyCocurriculars = async (): Promise<Tables<'cocurriculars'>[]> => {
    const session = await getSessionOrThrow();
    const { data, error } = await supabase
        .from('cocurriculars')
        .select('*')
        .eq('profile_id', session.user.id)
        .order('activity_date', { ascending: false, nulls: 'last' });
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
    cocurriculars: EditableCocurricular[];
    workExperiences: EditableWorkExperience[];   // <-- ADDED
    educationHistory: EditableEducationHistory[];
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
    cocurriculars: string[];
    work_experiences: string[];   // <-- ADDED
    education_history: string[];
};

/**
 * Bundles all save/delete operations for the "Edit Profile" page
 * into a single API call.
 */
export const saveProfileDetails = async (payload: SaveProfilePayload, deletedItems: DeletedItemsPayload) => {
    const session = await getSessionOrThrow();
    const userId = session.user.id;

    const prepareUpsert = (list: any[]) => list.map(item => {
        const { client_id, ...rest } = item; 
        const newItem = { ...rest, profile_id: userId };
        Object.keys(newItem).forEach(key => {
            if (newItem[key] === '' && !Array.isArray(item[key])) {
                // Handle potential empty date strings specifically if necessary
                if (key.includes('date') || key.includes('year')) {
                     newItem[key] = null; // Ensure empty dates become NULL
                } else {
                     newItem[key] = null;
                }
            }
        });
        // Special handling for authors string-to-array
        if ('authors' in newItem && typeof newItem.authors === 'string') {
            newItem.authors = (newItem.authors as string).split(',').map(s => s.trim()).filter(Boolean);
        }
        // Special handling for achievements array
         if ('achievements' in newItem && typeof newItem.achievements === 'string') {
            newItem.achievements = (newItem.achievements as string).split(',').map(s => s.trim()).filter(Boolean);
        }
        return newItem;
    });

    // Helper for the single transition data row
    const prepareTransitionUpsert = (data: EditableTransition | null) => {
        if (!data) return null;
        // Ensure profile_id exists before proceeding
        const profileId = data.profile_id || userId;
        const newItem = { ...data, profile_id: profileId, updated_at: new Date().toISOString() };
        Object.keys(newItem).forEach(key => {
            if (newItem[key] === '' && !Array.isArray(data[key as keyof EditableTransition])) {
                 newItem[key as keyof EditableTransition] = null;
             }
        });
        // Handle array fields specifically
        if ('target_industries' in newItem && typeof newItem.target_industries === 'string') {
             newItem.target_industries = (newItem.target_industries as string).split(',').map(s => s.trim()).filter(Boolean);
        } else if (!('target_industries' in newItem) || newItem.target_industries === null){
             newItem.target_industries = []; // Ensure it's an empty array if null/undefined/empty string
        }
        return newItem;
    };

    const transitionUpsertData = prepareTransitionUpsert(payload.transitionData);

    // 🚀 FIX: Separate the conditional promise
    const transitionUpsertPromise = transitionUpsertData
        ? supabase.from('career_transitions').upsert(transitionUpsertData).select().single()
        : Promise.resolve({ data: null, error: null }); // Resolve immediately if no data

    // Run array-based database operations in parallel
    const arrayOpsPromises = [
        // Upserts
        supabase.from('academic_achievements').upsert(prepareUpsert(payload.achievements)),
        supabase.from('publications').upsert(prepareUpsert(payload.publications)),
        supabase.from('certifications').upsert(prepareUpsert(payload.certifications)),
        supabase.from('awards').upsert(prepareUpsert(payload.awards)),
        supabase.from('ventures').upsert(prepareUpsert(payload.ventures)),
        supabase.from('content_portfolio').upsert(prepareUpsert(payload.contentPortfolio)),
        supabase.from('cocurriculars').upsert(prepareUpsert(payload.cocurriculars)),
        supabase.from('work_experiences').upsert(prepareUpsert(payload.workExperiences)),   // <-- ADDED
        supabase.from('education_history').upsert(prepareUpsert(payload.educationHistory)),
        // Deletions (only run if there are IDs to delete)
        deletedItems.academic_achievements.length > 0 ? supabase.from('academic_achievements').delete().in('id', deletedItems.academic_achievements) : Promise.resolve({ error: null }),
        deletedItems.publications.length > 0 ? supabase.from('publications').delete().in('id', deletedItems.publications) : Promise.resolve({ error: null }),
        deletedItems.certifications.length > 0 ? supabase.from('certifications').delete().in('id', deletedItems.certifications) : Promise.resolve({ error: null }),
        deletedItems.awards.length > 0 ? supabase.from('awards').delete().in('id', deletedItems.awards) : Promise.resolve({ error: null }),
        deletedItems.ventures.length > 0 ? supabase.from('ventures').delete().in('id', deletedItems.ventures) : Promise.resolve({ error: null }),
        deletedItems.content_portfolio.length > 0 ? supabase.from('content_portfolio').delete().in('id', deletedItems.content_portfolio) : Promise.resolve({ error: null }),
        deletedItems.cocurriculars.length > 0 ? supabase.from('cocurriculars').delete().in('id', deletedItems.cocurriculars) : Promise.resolve({ error: null }),
        deletedItems.work_experiences.length > 0 ? supabase.from('work_experiences').delete().in('id', deletedItems.work_experiences) : Promise.resolve({ error: null }),     // <-- ADDED
        deletedItems.education_history.length > 0 ? supabase.from('education_history').delete().in('id', deletedItems.education_history) : Promise.resolve({ error: null }),
    ];

    // Await all parallel operations
    const results = await Promise.all(arrayOpsPromises);
    const transitionResult = await transitionUpsertPromise; // Await the separate promise

    // Check for any errors
    const errors = results.map(r => r.error).filter(Boolean);
    if (transitionResult.error) {
        errors.push(transitionResult.error);
    }

    if (errors.length > 0) {
        console.error("Errors saving profile details:", errors);
        // Combine multiple error messages if needed, or just throw the first one
        throw new Error(errors.map(e => e?.message || 'Unknown error').join('; '));
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

/**
 * Fetches all work experiences for the *currently logged-in user*.
 */
export const getMyWorkExperiences = async (): Promise<WorkExperience[]> => {
    const session = await getSessionOrThrow();
    const { data, error } = await supabase
        .from('work_experiences')
        .select('*')
        .eq('profile_id', session.user.id)
        .order('start_date', { ascending: false, nulls: 'last' }); // Or order by end_date
    if (error) throw error;
    return data || [];
};

/**
 * Fetches all education history for the *currently logged-in user*.
 */
export const getMyEducationHistory = async (): Promise<EducationHistory[]> => {
    const session = await getSessionOrThrow();
    const { data, error } = await supabase
        .from('education_history')
        .select('*')
        .eq('profile_id', session.user.id)
        .order('start_year', { ascending: false, nulls: 'last' }); // Or order by end_year
    if (error) throw error;
    return data || [];
};
