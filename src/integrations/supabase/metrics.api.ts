import { supabase } from './client';

/**
 * Fetches the total count of all users from auth.users via an RPC.
 */
export const getUsersCount = async () => {
  // Call the SQL function 'get_total_users_count'
  const { data, error } = await supabase.rpc('get_total_users_count');

  if (error) {
    console.error('Error fetching user count:', error);
    throw new Error(error.message);
  }
  
  // With RPC, the number is returned directly in 'data'
  return data || 0; 
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
