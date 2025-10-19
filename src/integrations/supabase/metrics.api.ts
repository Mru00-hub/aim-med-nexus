import { supabase } from './client';

/**
 * Fetches the total count of all users from auth.users via an RPC.
 */
export const getUsersCount = async () => {
  const { data, error } = await supabase.rpc('get_total_users_count');

  if (error) {
    console.error('Error fetching user count:', error);
    throw new Error(error.message);
  }
  
  return data || 0; 
};

/**
 * Fetches the total count of all spaces (communities) via RPC.
 */
export const getSpacesCount = async () => {
  const { data, error } = await supabase.rpc('get_total_spaces_count');

  if (error) {
    console.error('Error fetching spaces count:', error);
    throw new Error(error.message);
  }
  
  return data || 0;
};

/**
 * Fetches the total count of all submitted partnership proposals via RPC.
 */
export const getPartnershipProposalsCount = async () => {
  const { data, error } = await supabase.rpc('get_total_partnership_proposals_count');

  if (error) {
    console.error('Error fetching partnership proposals count:', error);
    throw new Error(error.message);
  }
  
  return data || 0;
};
