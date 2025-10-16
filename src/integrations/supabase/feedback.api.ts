import { supabase } from './client';
import { z } from 'zod';

// 1. Zod schema for validation. Note: user_id is handled on the server.
const FeedbackSchema = z.object({
  category: z.string().min(1, { message: "Category is required." }),
  subject: z.string().min(3, { message: "Subject must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  rating: z.number().int().min(1, "Rating is required.").max(5),
});

// Infer the type for use in the frontend component
export type FeedbackFormInput = z.infer<typeof FeedbackSchema>;

/**
 * Submits user feedback after validation.
 * @param feedbackData The feedback data from the form.
 * @returns The newly created feedback object.
 * @throws An error if user is not authenticated, validation fails, or DB insert fails.
 */
export const submitFeedback = async (feedbackData: FeedbackFormInput) => {
  // First, get the current authenticated user. This is a secure way to get user_id.
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("You must be logged in to submit feedback.");
  }
  
  try {
    // 1. Validate the incoming data against the schema
    const validatedData = FeedbackSchema.parse(feedbackData);
    
    // 2. Combine validated data with the secure user_id
    const submissionData = {
      ...validatedData,
      user_id: user.id,
    };

    // 3. Perform the database insertion
    const { data, error } = await supabase
      .from('feedback')
      .insert([submissionData])
      .select()
      .single();

    if (error) {
      console.error('Supabase feedback submission error:', error);
      throw new Error(error.message || 'Failed to submit feedback to the database.');
    }

    return data;

  } catch (error) {
    // This catches Zod validation errors and other exceptions
    console.error('Failed to process feedback submission:', error);
    // Re-throw to be handled by the UI
    throw error;
  }
};
