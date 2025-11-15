import { supabase } from './client';
// Use the types from your main auto-generated file
import type { Database, Tables, Enums, TablesInsert, TablesUpdate } from '../../types'; 

// --- Type Definitions for Industry Hub ---

export type Industry = Tables<'industries'>;
export type CompanyProfile = Tables<'company_profiles'>;
export type CompanyJob = Tables<'company_jobs'>;
export type Collaboration = Tables<'collaborations'>;
export type CompanyLink = Tables<'company_links'>;
export type JobApplication = Tables<'job_applications'>;
export type CollaborationApplication = Tables<'collaboration_applications'>;

// Type for the 'get_all_active_jobs' RPC
export type JobListing = Database['public']['Functions']['get_all_active_jobs']['Returns'][number];

// Type for the 'get_all_active_collaborations' RPC
export type CollaborationListing = Database['public']['Functions']['get_all_active_collaborations']['Returns'][number];
// Type for the 'get_all_companies' RPC
export type CompanyListing = Database['public']['Functions']['get_all_companies']['Returns'][number];

// Type for the 'get_company_profile_details' RPC (assuming it exists)
// If not, we'll build this type on the client
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

// --- ADDED: Type for updating a company profile ---
export type UpdateCompanyPayload = TablesUpdate<'company_profiles'>;

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

// --- ADDED: Type for updating a job ---
export type UpdateJobPayload = TablesUpdate<'company_jobs'>;

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

// --- ADDED: Type for updating a collaboration ---
export type UpdateCollabPayload = TablesUpdate<'collaborations'>;


// Type for 'apply_for_job' RPC arguments
export type ApplyJobPayload = {
  p_job_id: string;
  p_cover_letter: string | null;
};

// Type for 'apply_for_collaboration' RPC arguments
export type ApplyCollabPayload = {
  p_collab_id: string;
  p_cover_letter: string | null;
};

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
 * (Assuming you have this RPC)
 */
export const getIndustries = async (): Promise<Industry[]> => {
  // @ts-ignore - Assuming get_industries RPC exists
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
 * Fetches a paginated and searchable list of all verified companies.
 */
export const getAllCompanies = async (payload: {
  page: number;
  limit: number;
  searchQuery?: string;
  industryId?: string;
  locationId?: string;
}): Promise<CompanyListing[]> => {
  const { data, error } = await supabase.rpc('get_all_companies', {
    p_limit: payload.limit,
    p_page: payload.page,
    p_search_query: payload.searchQuery || '',
    p_industry_id: payload.industryId || null,
    p_location_id: payload.locationId || null
  });

  if (error) throw error;
  return data || [];
};


/**
 * Fetches the complete, detailed profile for a single company.
 * (Assuming you have this RPC)
 */
export const getCompanyProfileDetails = async (companyId: string): Promise<CompanyProfileDetails> => {
  // @ts-ignore - Assuming get_company_profile_details RPC exists
  const { data, error } = await supabase.rpc('get_company_profile_details', {
    p_company_id: companyId
  });
  if (error) throw error;
  return data as CompanyProfileDetails;
};

// --- Authenticated Write Functions (RPC & Standard) ---

/**
 * Creates a new company profile.
 * The creator is automatically made an 'owner' by the database trigger.
 * (Assuming you have this RPC)
 */
export const createCompanyProfile = async (payload: CreateCompanyPayload): Promise<CompanyProfile> => {
  await getSessionOrThrow(); 
  // @ts-ignore - Assuming create_company_profile RPC exists
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
 * --- NEW: Updates a company's profile ---
 * (Must be a manager. Relies on RLS.)
 */
export const updateCompanyProfile = async (companyId: string, payload: UpdateCompanyPayload): Promise<CompanyProfile> => {
  await getSessionOrThrow();
  const { data, error } = await supabase
    .from('company_profiles')
    .update(payload)
    .eq('id', companyId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};


/**
 * Toggles following or unfollowing a company.
 * Returns true if the user is now following, false otherwise.
 * (Assuming you have this RPC)
 */
export const toggleFollowCompany = async (companyId: string): Promise<boolean> => {
  await getSessionOrThrow();
  // @ts-ignore - Assuming toggle_follow_company RPC exists
  const { data, error } = await supabase.rpc('toggle_follow_company', {
    p_company_id: companyId
  });
  if (error) throw error;
  return data;
};

/**
 * Creates a new job posting. (Must be a manager).
 * (Assuming you have this RPC)
 */
export const createCompanyJob = async (payload: CreateJobPayload): Promise<CompanyJob> => {
  await getSessionOrThrow();
  // @ts-ignore - Assuming create_company_job RPC exists
  const { data, error } = await supabase.rpc('create_company_job', payload);
  if (error) throw error;
  return data;
};

/**
 * --- NEW: Updates an existing job posting ---
 * (Must be a manager. Relies on RLS.)
 */
export const updateCompanyJob = async (jobId: string, payload: UpdateJobPayload): Promise<CompanyJob> => {
  await getSessionOrThrow();
  const { data, error } = await supabase
    .from('company_jobs')
    .update(payload)
    .eq('id', jobId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

/**
 * --- NEW: Soft-deletes a job posting (sets is_active = false) ---
 * (Must be a manager. Relies on RLS.)
 */
export const softDeleteCompanyJob = async (jobId: string): Promise<CompanyJob> => {
  await getSessionOrThrow();
  const { data, error } = await supabase
    .from('company_jobs')
    .update({ is_active: false })
    .eq('id', jobId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

/**
 * Creates a new collaboration posting. (Must be a manager).
 * (Assuming you have this RPC)
 */
export const createCollaboration = async (payload: CreateCollaborationPayload): Promise<Collaboration> => {
  await getSessionOrThrow();
  // @ts-ignore - Assuming create_collaboration RPC exists
  const { data, error } = await supabase.rpc('create_collaboration', payload);
  if (error) throw error;
  return data;
};

/**
 * --- NEW: Updates an existing collaboration ---
 * (Must be a manager. Relies on RLS.)
 */
export const updateCollaboration = async (collabId: string, payload: UpdateCollabPayload): Promise<Collaboration> => {
  await getSessionOrThrow();
  const { data, error } = await supabase
    .from('collaborations')
    .update(payload)
    .eq('id', collabId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

/**
 * --- NEW: Soft-deletes a collaboration (sets is_active = false) ---
 * (Must be a manager. Relies on RLS.)
 */
export const softDeleteCollaboration = async (collabId: string): Promise<Collaboration> => {
  await getSessionOrThrow();
  const { data, error } = await supabase
    .from('collaborations')
    .update({ is_active: false })
    .eq('id', collabId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};


/**
 * Applies for a job. (Authenticated users only).
 */
export const applyForJob = async (payload: ApplyJobPayload): Promise<any> => {
  await getSessionOrThrow();
  const { data, error } = await supabase.rpc('apply_for_job', {
    p_job_id: payload.p_job_id,
    p_cover_letter: payload.p_cover_letter
  });
  
  if (error) throw new Error(JSON.parse(error.message).message); // Throw the user-friendly message
  
  const responseData = data as any;
  if (responseData.status >= 400) {
    throw new Error(responseData.message);
  }
  
  return responseData;
};

/**
 * Applies for a collaboration. (Authenticated users only).
 */
export const applyForCollaboration = async (payload: ApplyCollabPayload): Promise<any> => {
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

  return responseData;
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

  // Assuming 'industry_hub_assets' is your bucket name
  const { error: uploadError } = await supabase.storage
    .from('industry_hub_assets')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('industry_hub_assets')
    .getPublicUrl(filePath);

  return data;
};


// --- Authenticated Read Functions (User-Specific) ---

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
  const { data, error } = await supabase.rpc('get_job_ applicants', {
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

/**
 * Fetches just the logo and name for a company.
 */
export const getCompanyHeaderData = async (companyId: string): Promise<{ company_logo_url: string | null, company_name: string } | null> => {
  const { data, error } = await supabase
    .from('company_profiles')
    .select('company_name, company_logo_url')
    .eq('id', companyId)
    .single();

  if (error) {
    console.error('Error fetching company header:', error);
    return null;
  }
  return data;
};
