import { supabase } from './client';

/**
 * Fetches the total count of all users in the auth.users table.
 */
export const getUsersCount = async () => {
  const { count, error } = await supabase
    .from('users') // Note: Supabase RLS on 'profiles' might be slow. Counting 'users' is faster.
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error fetching user count:', error);
    throw new Error(error.message);
  }
  return count || 0;
};

/**
 * Fetches the total count of all spaces (communities).
 */
export const getSpacesCount = async () => {
  const { count, error } = await supabase
    .from('spaces')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error fetching spaces count:', error);
    throw new Error(error.message);
  }
  return count || 0;
};

/**
 * Fetches the total count of all submitted partnership proposals.
 */
export const getPartnershipProposalsCount = async () => {
  const { count, error } = await supabase
    .from('partnership_proposals')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error fetching partnership proposals count:', error);
    throw new Error(error.message);
  }
  return count || 0;
};
