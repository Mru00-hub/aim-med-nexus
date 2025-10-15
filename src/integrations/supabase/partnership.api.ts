import { supabase } from './client';

// Define the structure of the proposal data
export interface PartnershipProposal {
  organization_type: string;
  organization_type_other?: string;
  organization_name: string;
  website?: string;
  contact_name: string;
  email: string;
  phone?: string;
  partnership_type: string;
  partnership_type_other?: string;
  description: string;
}

/**
 * Submits a new partnership proposal to the database.
 * @param proposal The proposal data from the form.
 * @returns An object containing the submitted data and any potential error.
 */
export const submitPartnershipProposal = async (proposal: PartnershipProposal) => {
  const { data, error } = await supabase
    .from('partnership_proposals')
    .insert([proposal])
    .select()
    .single(); // .single() is useful to get the inserted row back or a clear error

  if (error) {
    console.error('Error submitting partnership proposal:', error);
    throw new Error(error.message);
  }

  return { data, error };
};
