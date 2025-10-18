import { supabase } from './client';

/**
 * Calls the 'delete_own_user' RPC function in Supabase
 * to securely delete the currently authenticated user.
 */
export const deleteCurrentUser = async (); => {
  const { error } = await supabase.rpc('delete_own_user');

  if (error) {
    console.error('Error deleting user:', error);
    throw new Error(error.message);
  }

  return { success: true };
};
