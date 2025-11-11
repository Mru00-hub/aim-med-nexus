import { supabase } from './client';
import { z } from 'zod';

// Define a Zod schema for server-side validation
const PartnershipProposalSchema = z.object({
  organization_type: z.string().min(1, { message: "Organization type is required." }),
  organization_type_other: z.string().optional(),
  organization_name: z.string().min(1, { message: "Organization name is required." }),
  website: z.string().url({ message: "Invalid URL format." }).optional().or(z.literal('')),
  contact_name: z.string().min(1, { message: "Contact name is required." }),
  email: z.string().email({ message: "A valid email is required." }),
  phone: z.string().optional(),
  partnership_type: z.string().min(1, { message: "Partnership type is required." }),
  partnership_type_other: z.string().optional(),
  description: z.string().min(10, { message: "Description is required (min 10 characters)." }),
});

// Infer the TypeScript type directly from the Zod schema
export type PartnershipProposal = z.infer<typeof PartnershipProposalSchema>;

/**
 * Validates and submits a new partnership proposal to the database.
 * @param proposal The proposal data from the form.
 * @returns The newly created proposal object.
 * @throws An error if validation or the database insert fails.
 */
export const submitPartnershipProposal = async (proposal: PartnershipProposal) => {
  try {
    // 1. Validate the incoming data against the schema
    const validatedProposal = PartnershipProposalSchema.parse(proposal);

    // 2. Perform the database insertion with validated data
    const { data, error } = await supabase
      .from('partnership_proposals')
      .insert([validatedProposal]);

    // Handle potential database errors
    if (error) {
      console.error('Supabase submission error:', error);
      throw new Error(error.message);
    }
    
    // 3. On success, return only the data
    return { data, error };

  } catch (error) {
    // Catches both Zod validation errors and any other exceptions
    console.error('Failed to submit partnership proposal:', error);
    
    // Re-throw the error to be handled by the calling function (e.g., UI component)
    // This makes the error message available to the UI.
    throw error; 
  }
};
