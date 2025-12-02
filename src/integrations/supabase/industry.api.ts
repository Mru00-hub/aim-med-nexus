import { supabase } from './client';
// Use the types from your main auto-generated file
import type { Database, Tables, Enums, TablesInsert, TablesUpdate } from '../../types'; 

// --- Type Definitions for Industry Hub ---

export type Industry = Tables<'industries'>;
export type CompanyProfile = Tables<'company_profiles'>;

// Based on the 'get_job_details' RPC
export type CompanyJobDetails = {
  id: string;
  company_id: string;
  // --- Data from company_profiles ---
  company_name: string;
  company_logo_url: string | null;
  company_headline: string | null;
  // --- Data from company_jobs ---
  title: string;
  description: string;
  job_type: string;
  experience_level: string;
  location_type: string;
  location_id: string | null; // Changed
  location_name: string | null; // Added
  specializations: { id: string; label: string }[]; // Changed
  external_apply_url: string | null;
  is_active: boolean;
  created_at: string;
  required_profile_fields?: string[];
};

// Based on the 'get_collaboration_details' RPC
export type CollaborationDetails = {
  id: string;
  title: string;
  company_id: string;
  // --- Data from company_profiles ---
  company_name: string;
  company_logo_url: string | null;
  company_headline: string | null;
  // --- Data from collaborations ---
  collaboration_type: Enums<'collab_type_enum'>;
  description: string;
  specializations: { id: string; label: string }[]; // Changed
  location_id: string | null; // Changed
  location_name: string | null; // Added
  duration: string;
  is_active: boolean;
  applicants_count: number;
  created_at: string;
  required_profile_fields?: string[];
};

export type CompanyManager = Tables<'company_managers'>;
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
  // Basic company data
  id: string;
  company_name: string;
  description: string;
  company_logo_url: string | null;
  company_banner_url: string | null;
  website_url: string | null;
  company_size: string | null;
  founded_year: number | null;
  created_at: string;
  creator_id: string;
  
  // Our custom fields
  is_owner: boolean;
  follower_count: number;
  job_count: number;
  collaboration_count: number;
  is_following: boolean; // Renamed from 'is_followed_by_viewer'

  // Nested JSON arrays from the RPC
  jobs: CompanyJob[]; // Assumes CompanyJob matches 'company_jobs' table
  collaborations: Collaboration[]; // Assumes Collaboration matches 'collaborations' table
  links: CompanyLink[];
};

// Type for creating a new company profile
export type CreateCompanyPayload = {
  company_name: string;
  industry_id?: string;
  industry_other?: string;
  location_id: string;
  description: string;
  website_url?: string;
  company_size?: string;
  founded_year?: number;
  company_logo_url?: string; 
};

// --- ADDED: Type for updating a company profile ---
export type UpdateCompanyPayload = {
  p_company_id: string; // The UUID of the company to update
  p_company_name?: string | null;
  p_description?: string | null;
  p_website_url?: string | null;
  p_company_logo_url?: string | null;
  p_company_banner_url?: string | null;
  p_company_size?: string | null;
  p_founded_year?: number | null;
  p_industry_id?: string | null;
  p_industry_other?: string | null;
  p_location_id?: string | null;
};

// Type for creating a new job
export type CreateJobPayload = {
  p_company_id: string;
  p_title: string;
  p_description: string;
  p_job_type?: string;
  p_experience_level?: string;
  p_location_type?: string;
  p_location_id?: string; // Changed
  p_specialization_ids?: string[]; // Changed
  p_external_apply_url?: string;
  p_required_profile_fields?: string[];
};

// --- ADDED: Type for updating a job ---
export type UpdateJobPayload = {
  p_job_id: string; // The UUID of the job to update
  p_title?: string | null;
  p_description?: string | null;
  p_specialization_ids?: string[] | null; // Changed
  p_job_type?: string | null;
  p_location_type?: string | null;
  p_location_id?: string | null; // Changed
  p_experience_level?: string | null;
  p_external_apply_url?: string | null;
  p_required_profile_fields?: string[];
};

// Type for creating a new collaboration
export type CreateCollaborationPayload = {
  p_company_id: string;
  p_title: string;
  p_collaboration_type: Enums<'collab_type_enum'>;
  p_description: string;
  p_specialization_ids?: string[]; // Changed
  p_location_id?: string; // Changed
  p_duration?: string;
  p_required_profile_fields?: string[];
};

// --- ADDED: Type for updating a collaboration ---
export type UpdateCollabPayload = {
  p_collab_id: string; // The UUID of the collaboration to update
  p_title?: string | null;
  p_description?: string | null;
  p_collaboration_type?: Enums<'collab_type_enum'> | null;
  p_specialization_ids?: string[] | null; // Changed
  p_duration?: string | null;
  p_location_id?: string | null; // Changed
  p_required_profile_fields?: string[];
};

// Type for 'apply_for_job' RPC arguments
export type ApplyJobPayload = {
  p_job_id: string;
  p_cover_letter: string | null;
  p_current_salary?: string | null;  // NEW
  p_expected_salary?: string | null; // NEW
};

// Type for 'apply_for_collaboration' RPC arguments
export type ApplyCollabPayload = {
  p_collab_id: string;
  p_cover_letter: string | null;
  p_current_salary?: string | null;  // NEW
  p_expected_salary?: string | null; // NEW
};
export type AddManagerPayload = {
  p_company_id: string;
  p_user_id: string;
  p_role: 'ADMIN' | 'MEMBER';
};

export type UpdateManagerRolePayload = {
  p_manager_record_id: string;
  p_new_role: 'ADMIN' | 'MEMBER';
};

export type RemoveManagerPayload = {
  p_manager_record_id: string;
};
export type AddLinkPayload = {
  p_company_id: string;
  p_link_type: Enums<'link_type_enum'>;
  p_title: string;
  p_url: string;
  p_description?: string | null;
  p_image_url?: string | null;
};

export type UpdateLinkPayload = {
  p_link_id: string;
  p_link_type?: Enums<'link_type_enum'> | null;
  p_title?: string | null;
  p_url?: string | null;
  p_description?: string | null;
  p_image_url?: string | null;
};

export type DeleteLinkPayload = {
  p_link_id: string;
};
// Type for 'get_my_job_applications' RPC
export type MyJobApplication = Database['public']['Functions']['get_my_job_applications']['Returns'][number];

// Type for 'get_my_collaboration_applications' RPC
export type MyCollabApplication = Database['public']['Functions']['get_my_collaboration_applications']['Returns'][number];

// Type for 'get_job_applicants' and 'get_collaboration_applicants' RPCs
export type Applicant = Database['public']['Functions']['get_job_applicants']['Returns'][number];

export type CompanyManagerWithProfile = CompanyManager & {
  profile: {
    full_name: string | null;
    profile_picture_url: string | null;
  } | null;
};

// --- ADD THIS TYPE DEFINITION ---
export type Collaboration = {
  id: string;
  company_id: string;
  title: string;
  collaboration_type: Enums<'collab_type_enum'>;
  description: string;
  duration: string | null;
  location_id: string | null;
  is_active: boolean;
  applicants_count: number;
  created_at: string;
  location_name: string | null;
  specializations: { id: string; label: string }[];
};
// --- END OF NEW TYPE ---
// --- ADD THIS TYPE DEFINITION ---
export type CompanyJob = {
  id: string;
  company_id: string;
  title: string;
  job_type: string;
  experience_level: string;
  location_type: string;
  location_id: string | null;
  is_active: boolean;
  created_at: string;
  location_name: string | null;
  applicants_count: number; // This is the new field you added
  specializations: { id: string; label: string }[];
};

export type ProfileRequirement = 'resume' | 'bio' | 'work_experience' | 'education_history' | 'skills' | 'location';

// --- END OF NEW TYPE ---
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
  const { data, error } = await supabase
    .from('industries')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
};

/**
 * Fetches a paginated list of all active jobs from all companies.
 */
export const getAllActiveJobs = async (
  page: number = 1,
  limit: number = 12,
  filters: {
    industryId?: string;
    locationId?: string;
    searchQuery?: string;
    specializationIds?: string[];
  }
): Promise<JobListing[]> => {
  const { data, error } = await supabase.rpc('get_all_active_jobs', {
    p_limit: limit,
    p_page: page,
    p_industry_id: filters.industryId || null,
    p_location_id: filters.locationId || null,
    p_search_query: filters.searchQuery || '',
    p_specialization_ids: filters.specializationIds || [],
  });
  if (error) {
    console.error("Error in getAllActiveJobs:", error); // <-- ADD THIS
    throw error;
  }
  return data || [];
};

/**
 * Fetches a paginated list of all active collaborations.
 */
export const getAllActiveCollaborations = async (
  page: number = 1,
  limit: number = 12,
  filters: {
    industryId?: string;
    locationId?: string;
    searchQuery?: string;
    specializationIds?: string[];
  }
): Promise<CollaborationListing[]> => {
  const { data, error } = await supabase.rpc('get_all_active_collaborations', {
    p_limit: limit,
    p_page: page,
    p_industry_id: filters.industryId || null,
    p_location_id: filters.locationId || null,
    p_search_query: filters.searchQuery || '',
    p_specialization_ids: filters.specializationIds || [],
  });
  if (error) {
    console.error("Error in getAllActiveCollaborations:", error); // <-- ADD THIS
    throw error;
  }
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

  if (error) {
  // Log the full error to the console for you to see
  console.error(`Error in ${'getAllCompanies'}:`, error.message); 
  // Throw a real Error so React Query can catch it
  throw new Error(error.message); 
  }
  return data || [];
};


/**
 * Fetches the complete, detailed profile for a single company.
 * (Assuming you have this RPC)
 */
export const getCompanyProfileDetails = async (companyId: string): Promise<CompanyProfileDetails> => {
  const { data, error } = await supabase.rpc('get_company_profile_details', {
    p_company_id: companyId
  });
  if (error) throw error;
  return data as CompanyProfileDetails;
};

/**
 * Fetches a single job's details, including the company's info,
 * by calling the get_job_details RPC.
 *
 * NOTE: You must update your 'get_job_details' RPC to JOIN with
 * 'locations' and 'job_specializations' -> 'specializations'
 * to match the 'CompanyJobDetails' type.
 */
export const getJobById = async (jobId: string): Promise<CompanyJobDetails> => {
  const { data, error } = await supabase
    .rpc('get_job_details', {
      p_job_id: jobId 
    })
    .single();

  if (error) {
    console.error("Error in getJobById:", error); // <-- ADD THIS
    throw error;
  }
  if (!data) throw new Error('Job not found');
  
  return data;
};

/**
 * Fetches a single collab's details, including the company's info,
 * by calling the get_collaboration_details RPC.
 *
 * NOTE: You must update your 'get_collaboration_details' RPC to JOIN
 * with 'locations' and 'collaboration_specializations' -> 'specializations'
 * to match the 'CollaborationDetails' type.
 */
export const getCollabById = async (collabId: string): Promise<CollaborationDetails> => {
  const { data, error } = await supabase
    .rpc('get_collaboration_details', {
      p_collab_id: collabId 
    })
    .single();

  if (error) {
    console.error("Error in getCollabById:", error); // <-- ADD THIS
    throw error;
  }
  if (!data) throw new Error('Collaboration not found');
  
  return data;
};

// --- Authenticated Write Functions (RPC & Standard) ---

/**
 * Creates a new company profile.
 */
export const createCompanyProfile = async (payload: CreateCompanyPayload): Promise<CompanyProfile> => {
  await getSessionOrThrow();
  
  const { data, error } = await supabase.rpc('create_company_profile', {
    p_company_name: payload.company_name,
    p_description: payload.description,
    p_website_url: payload.website_url || null,
    p_company_size: payload.company_size || null,
    p_founded_year: payload.founded_year || null,
    p_industry_id: payload.industry_id || null,
    p_location_id: payload.location_id,
    p_industry_other: payload.industry_other || null,
    p_company_logo_url: payload.company_logo_url || null
  });
  
  if (error) throw error;
  return data;
};

/**
 * Updates a company's profile.
 */
export const updateCompanyProfile = async (
  payload: UpdateCompanyPayload
): Promise<CompanyProfile> => {
  await getSessionOrThrow();
  
  // The payload's keys (p_company_id, etc.) directly match the RPC args
  const { data, error } = await supabase
    .rpc('update_company_profile', payload)
    .single();
    
  if (error) throw error;
  return data;
};


/**
 * Toggles following or unfollowing a company.
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
 * Creates a new job posting.
 */
export const createCompanyJob = async (payload: CreateJobPayload): Promise<CompanyJob> => {
  await getSessionOrThrow();
  
  // Payload keys match RPC arguments
  const { data, error } = await supabase.rpc('create_company_job', payload);
  if (error) throw error;
  return data;
};

/**
 * Updates an existing job posting.
 */
export const updateCompanyJob = async (
  payload: UpdateJobPayload
): Promise<CompanyJob> => {
  await getSessionOrThrow();
  
  // Payload keys match RPC arguments
  const { data, error } = await supabase
    .rpc('update_company_job', payload)
    .single();
    
  if (error) throw error;
  return data;
};

export const setJobActiveStatus = async (
  jobId: string, 
  isActive: boolean
): Promise<{ job_id: string; is_active: boolean }> => {
  await getSessionOrThrow();
  const { data, error } = await supabase
    .rpc('set_job_active_status', {
      p_job_id: jobId,
      p_is_active: isActive
    })
    .single();
    
  if (error) throw error;
  return data;
};

/**
 * Creates a new collaboration posting.
 */
export const createCollaboration = async (payload: CreateCollaborationPayload): Promise<Collaboration> => {
  await getSessionOrThrow();
  
  // Payload keys match RPC arguments
  const { data, error } = await supabase.rpc('create_collaboration', payload);
  if (error) throw error;
  return data;
};

/**
 * Updates an existing collaboration.
 */
export const updateCollaboration = async (
  payload: UpdateCollabPayload
): Promise<Collaboration> => {
  await getSessionOrThrow();
  
  // Payload keys match RPC arguments
  const { data, error } = await supabase
    .rpc('update_collaboration', payload)
    .single();
    
  if (error) throw error;
  return data;
};

/**
 * Soft-deletes a collaboration (sets is_active = false)
 */
export const setCollabActiveStatus = async (
  collabId: string,
  isActive: boolean
): Promise<{ collaboration_id: string; is_active: boolean }> => {
  await getSessionOrThrow();
  const { data, error } = await supabase
    .rpc('set_collaboration_active_status', {
      p_collab_id: collabId,
      p_is_active: isActive
    })
    .single();
    
  if (error) throw error;
  return data;
};


/**
 * Applies for a job.
 */
export const applyForJob = async (payload: ApplyJobPayload): Promise<any> => {
  await getSessionOrThrow();
  const { data, error } = await supabase.rpc('apply_for_job', {
    p_job_id: payload.p_job_id,
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
 * Applies for a collaboration.
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
 * Fetches all applicants for a specific job.
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
 * Fetches all applicants for a specific collaboration.
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
 * Updates the status of an application.
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
export const addCompanyManager = async (payload: AddManagerPayload): Promise<CompanyManager> => {
  await getSessionOrThrow();
  const { data, error } = await supabase
    .rpc('add_company_manager', payload)
    .single();
    
  if (error) throw error;
  return data;
};
export const updateCompanyManagerRole = async (payload: UpdateManagerRolePayload): Promise<CompanyManager> => {
  await getSessionOrThrow();
  const { data, error } = await supabase
    .rpc('update_company_manager_role', payload)
    .single();
    
  if (error) throw error;
  return data;
};
export const removeCompanyManager = async (payload: RemoveManagerPayload): Promise<{ status: string; manager_record_id: string }> => {
  await getSessionOrThrow();
  const { data, error } = await supabase
    .rpc('remove_company_manager', payload)
    .single();
    
  if (error) throw error;
  return data;
};

export const addCompanyLink = async (payload: AddLinkPayload): Promise<CompanyLink> => {
  await getSessionOrThrow();
  const { data, error } = await supabase
    .rpc('add_company_link', payload)
    .single();
    
  if (error) throw error;
  return data;
};

export const updateCompanyLink = async (payload: UpdateLinkPayload): Promise<CompanyLink> => {
  await getSessionOrThrow();
  const { data, error } = await supabase
    .rpc('update_company_link', payload)
    .single();
    
  if (error) throw error;
  return data;
};

export const deleteCompanyLink = async (payload: DeleteLinkPayload): Promise<{ status: string; link_id: string }> => {
  await getSessionOrThrow();
  const { data, error } = await supabase
    .rpc('delete_company_link', payload)
    .single();
    
  if (error) throw error;
  return data;
};

export const getCompanyManagers = async (companyId: string): Promise<CompanyManagerWithProfile[]> => {
  if (!companyId) return [];
  const { data, error } = await supabase
    .from('company_managers')
    .select(`
      *,
      profile:profiles (
        full_name,
        profile_picture_url
      )
    `)
    .eq('company_id', companyId)
    .eq('is_active', true);
  
  if (error) {
    console.error('Error fetching company managers:', error);
    throw error;
  }
  return data as CompanyManagerWithProfile[];
};

export const uploadNewCompanyLogo = async (file: File): Promise<{ publicUrl: string }> => {
  const session = await getSessionOrThrow();
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  
  // Uploads to the user_id folder, which our new RLS policy allows
  const filePath = `${session.user.id}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('industry_hub_assets')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('industry_hub_assets')
    .getPublicUrl(filePath);

  return data;
};

/**
 * Deactivates a company profile and all its postings.
 * (Must be an ADMIN).
 */
export const deactivateCompanyProfile = async (companyId: string): Promise<void> => {
  await getSessionOrThrow();
  
  const { error } = await supabase.rpc('deactivate_company_profile', {
    p_company_id: companyId
  });

  if (error) throw error;
  return;
};
