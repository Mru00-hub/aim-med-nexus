import { supabase } from './client';
import type { Database, Tables, Enums, TablesInsert } from './types';

// --- Type Definitions for Industry Hub ---

export type Industry = Tables<'industries'>;
export type CompanyProfile = Tables<'company_profiles'>;
export type CompanyJob = Tables<'company_jobs'>;
export type Collaboration = Tables<'collaborations'>;
export type CompanyLink = Tables<'company_links'>;
export type JobApplication = Tables<'job_applications'>;

// MODIFIED: Renamed to match your SQL table name
export type CollaborationApplication = Tables<'collaboration_applications'>;

// Type for the 'get_all_active_jobs' RPC
export type JobListing = Database['public']['Functions']['get_all_active_jobs']['Returns'][number];

// Type for the 'get_all_active_collaborations' RPC
export type CollaborationListing = Database['public']['Functions']['get_all_active_collaborations']['Returns'][number];

// Type for the 'get_company_profile_details' RPC
export type CompanyProfileDetails = {
  profile: CompanyProfile & { industry_name?: string; location_name?: string };
  jobs: CompanyJob[];
  collaborations: Collaboration[];
  links: CompanyLink[];
  is_followed_by_viewer: boolean;
};

// Type for creating a new company profile
export type CreateCompanyPayload = {
  company_name: string;
  industry_id: string;
  location_id: string;
  description: string;
  website_url?: string;
};

// Type for creating a new job
export type CreateJobPayload = {
  p_company_id: string;
  p_title: string;
  p_description: string;
  p_job_type?: string;
  p_experience_level?: string;
  p_location_type?: string;
  p_location_text?: string;
  p_specialties_required?: string[];
  p_external_apply_url?: string;
};

// Type for creating a new collaboration
export type CreateCollaborationPayload = {
  p_company_id: string;
  p_title: string;
  p_collaboration_type: Enums<'collab_type_enum'>;
  p_description: string;
  p_required_specialty?: string[];
  p_location?: string;
  p_duration?: string;
};

// MODIFIED: This type now matches your 'apply_for_job' RPC arguments
export type ApplyJobPayload = {
  p_job_id: string;
  p_cover_letter: string | null;
};

// MODIFIED: This type now matches your 'apply_for_collaboration' RPC arguments
export type ApplyCollabPayload = {
  p_collab_id: string;
  p_cover_letter: string | null;
};

// --- ADDED: New types for your RPC return values ---

// Type for 'get_my_job_applications' RPC
export type MyJobApplication = Database['public']['Functions']['get_my_job_applications']['Returns'][number];

// Type for 'get_my_collaboration_applications' RPC
export type MyCollabApplication = Database['public']['Functions']['get_my_collaboration_applications']['Returns'][number];

// Type for 'get_job_applicants' and 'get_collaboration_applicants' RPCs
export type Applicant = Database['public']['Functions']['get_job_applicants']['Returns'][number];


// --- Helper: Enforce Authentication ---
const getSessionOrThrow = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  if (!session) throw new Error("Authentication required. Please log in.");
  return session;
};

// --- Public Read Functions (RPC) ---

/**
 * Fetches all industries for filter dropdowns.
 */
export const getIndustries = async (): Promise<Industry[]> => {
  const { data, error } = await supabase.rpc('get_industries');
  if (error) throw error;
  return data || [];
};

/**
 * Fetches a paginated list of all active jobs from all companies.
 */
export const getAllActiveJobs = async (page = 1, limit = 20): Promise<JobListing[]> => {
  const { data, error } = await supabase.rpc('get_all_active_jobs', {
    p_limit: limit,
    p_page: page
  });
  if (error) throw error;
  return data || [];
};

/**
 * Fetches a paginated list of all active collaborations.
 */
export const getAllActiveCollaborations = async (page = 1, limit = 20): Promise<CollaborationListing[]> => {
  const { data, error } = await supabase.rpc('get_all_active_collaborations', {
    p_limit: limit,
    p_page: page
  });
  if (error) throw error;
  return data || [];
};

/**
 * Fetches the complete, detailed profile for a single company.
 */
export const getCompanyProfileDetails = async (companyId: string): Promise<CompanyProfileDetails> => {
  const { data, error } = await supabase.rpc('get_company_profile_details', {
    p_company_id: companyId
  });
  if (error) throw error;
  return data as CompanyProfileDetails;
};

// --- Authenticated Write Functions (RPC) ---

/**
 * Creates a new company profile.
 * The creator is automatically made an 'owner' by the database trigger.
 */
export const createCompanyProfile = async (payload: CreateCompanyPayload): Promise<CompanyProfile> => {
  await getSessionOrThrow(); 
  const { data, error } = await supabase.rpc('create_company_profile', {
    p_company_name: payload.company_name,
    p_industry_id: payload.industry_id,
    p_location_id: payload.location_id,
    p_description: payload.description,
    p_website_url: payload.website_url || null
  });
  if (error) throw error;
  return data;
};

/**
 * Toggles following or unfollowing a company.
 * Returns true if the user is now following, false otherwise.
 */
export const toggleFollowCompany = async (companyId: string): Promise<boolean> => {
  await getSessionOrThrow();
  const { data, error } = await supabase.rpc('toggle_follow_company', {
    p_company_id: companyId
  });
  if (error) throw error;
  return data;
};

/**
 * Creates a new job posting. (Must be a manager).
 */
export const createCompanyJob = async (payload: CreateJobPayload): Promise<CompanyJob> => {
  await getSessionOrThrow();
  const { data, error } = await supabase.rpc('create_company_job', payload);
  if (error) throw error;
  return data;
};

/**
 * Creates a new collaboration posting. (Must be a manager).
 */
export const createCollaboration = async (payload: CreateCollaborationPayload): Promise<Collaboration> => {
  await getSessionOrThrow();
  const { data, error } = await supabase.rpc('create_collaboration', payload);
  if (error) throw error;
  return data;
};

/**
 * Applies for a job. (Authenticated users only).
 * MODIFIED: This function now correctly calls your RPC.
 */
export const applyForJob = async (payload: ApplyJobPayload): Promise<JobApplication> => {
  await getSessionOrThrow();
  const { data, error } = await supabase.rpc('apply_for_job', {
    p_job_id: payload.p_job_id,
    p_cover_letter: payload.p_cover_letter
  });
  
  if (error) throw new Error(JSON.parse(error.message).message); // Throw the user-friendly message
  
  // The RPC returns a JSON object, so we parse it
  const responseData = data as any;
  if (responseData.status >= 400) {
    throw new Error(responseData.message);
  }
  
  // The RPC response wraps the application_id in a JSON object.
  // We'll return a partial JobApplication for confirmation.
  return {
    id: responseData.application_id,
    job_id: payload.p_job_id
  } as JobApplication;
};

/**
 * Applies for a collaboration. (Authenticated users only).
 * MODIFIED: This function now correctly calls your RPC.
 */
export const applyForCollaboration = async (payload: ApplyCollabPayload): Promise<CollaborationApplication> => {
  await getSessionOrThrow();
  const { data, error } = await supabase.rpc('apply_for_collaboration', {
    p_collab_id: payload.p_collab_id,
    p_cover_letter: payload.p_cover_letter
  });
  
  if (error) throw new Error(JSON.parse(error.message).message);
  
  const responseData = data as any;
  if (responseData.status >= 400) {
    throw new Error(responseData.message);
  }

  return {
    id: responseData.application_id,
    collaboration_id: payload.p_collab_id
  } as CollaborationApplication;
};

/**
 * Uploads a file (logo or banner) to the company's asset folder.
 * (Must be a manager).
 */
export const uploadCompanyAsset = async (companyId: string, file: File): Promise<{ publicUrl: string }> => {
  await getSessionOrThrow();

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${companyId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('industry_hub_assets')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('industry_hub_assets')
    .getPublicUrl(filePath);

  return data;
};


// --- ADDED: New functions from your SQL script ---

/**
 * Fetches all job applications submitted by the current user.
 */
export const getMyJobApplications = async (): Promise<MyJobApplication[]> => {
  await getSessionOrThrow();
  const { data, error } = await supabase.rpc('get_my_job_applications');
  if (error) throw error;
  return data || [];
};

/**
 * Fetches all collaboration applications submitted by the current user.
 */
export const getMyCollabApplications = async (): Promise<MyCollabApplication[]> => {
  await getSessionOrThrow();
  const { data, error } = await supabase.rpc('get_my_collaboration_applications');
  if (error) throw error;
  return data || [];
};

/**
 * Fetches all applicants for a specific job. (Company admin only).
 */
export const getJobApplicants = async (jobId: string): Promise<Applicant[]> => {
  await getSessionOrThrow();
  const { data, error } = await supabase.rpc('get_job_applicants', {
    p_job_id: jobId
  });
  if (error) throw error;
  return data || [];
};

/**
 * Fetches all applicants for a specific collaboration. (Company admin only).
 */
export const getCollabApplicants = async (collabId: string): Promise<Applicant[]> => {
  await getSessionOrThrow();
  const { data, error } = await supabase.rpc('get_collaboration_applicants', {
    p_collab_id: collabId
  });
  if (error) throw error;
  return data || [];
};

/**
 * Updates the status of an application. (Company admin only).
 */
export const updateApplicationStatus = async (
  applicationId: string,
  newStatus: Enums<'application_status_enum'>,
  applicationType: 'job' | 'collaboration'
): Promise<any> => {
  await getSessionOrThrow();
  const { data, error } = await supabase.rpc('update_application_status', {
    p_application_id: applicationId,
    p_new_status: newStatus,
    p_application_type: applicationType
  });

  if (error) throw new Error(JSON.parse(error.message).message);

  const responseData = data as any;
  if (responseData.status >= 400) {
    throw new Error(responseData.message);
  }
  return responseData;
};
