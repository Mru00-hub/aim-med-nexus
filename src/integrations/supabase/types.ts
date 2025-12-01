export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      academic_achievements: {
        Row: {
          certificate_url: string | null
          created_at: string
          exam_name: string
          id: string
          percentile: number | null
          profile_id: string
          rank: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          certificate_url?: string | null
          created_at?: string
          exam_name: string
          id?: string
          percentile?: number | null
          profile_id: string
          rank?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          certificate_url?: string | null
          created_at?: string
          exam_name?: string
          id?: string
          percentile?: number | null
          profile_id?: string
          rank?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "academic_achievements_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_achievements_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          author_id: string | null
          body: string | null
          created_at: string | null
          id: string
          title: string
        }
        Insert: {
          author_id?: string | null
          body?: string | null
          created_at?: string | null
          id?: string
          title: string
        }
        Update: {
          author_id?: string | null
          body?: string | null
          created_at?: string | null
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      awards: {
        Row: {
          award_name: string
          created_at: string
          date: string | null
          description: string | null
          id: string
          issuing_org: string | null
          profile_id: string
          type: string
          updated_at: string
        }
        Insert: {
          award_name: string
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          issuing_org?: string | null
          profile_id: string
          type?: string
          updated_at?: string
        }
        Update: {
          award_name?: string
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          issuing_org?: string | null
          profile_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "awards_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "awards_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      career_transitions: {
        Row: {
          offering_mentorship: boolean | null
          open_to_opportunities: boolean | null
          profile_id: string
          seeking_mentorship: boolean | null
          target_industries: string[] | null
          transition_date: string | null
          transition_status: string | null
          transition_story: string | null
          updated_at: string | null
        }
        Insert: {
          offering_mentorship?: boolean | null
          open_to_opportunities?: boolean | null
          profile_id: string
          seeking_mentorship?: boolean | null
          target_industries?: string[] | null
          transition_date?: string | null
          transition_status?: string | null
          transition_story?: string | null
          updated_at?: string | null
        }
        Update: {
          offering_mentorship?: boolean | null
          open_to_opportunities?: boolean | null
          profile_id?: string
          seeking_mentorship?: boolean | null
          target_industries?: string[] | null
          transition_date?: string | null
          transition_status?: string | null
          transition_story?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "career_transitions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_transitions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          certification_name: string
          created_at: string
          credential_id: string | null
          credential_url: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuing_org: string | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          certification_name: string
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_org?: string | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          certification_name?: string
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_org?: string | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cocurriculars: {
        Row: {
          activity_date: string | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          profile_id: string
          title: string
          url: string | null
        }
        Insert: {
          activity_date?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          profile_id: string
          title: string
          url?: string | null
        }
        Update: {
          activity_date?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          profile_id?: string
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cocurriculars_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cocurriculars_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_applications: {
        Row: {
          applicant_email: string
          applicant_id: string
          applicant_resume_url: string | null
          collaboration_id: string
          company_id: string
          cover_letter: string | null
          created_at: string
          id: string
          status: Database["public"]["Enums"]["application_status_enum"]
          updated_at: string
        }
        Insert: {
          applicant_email: string
          applicant_id: string
          applicant_resume_url?: string | null
          collaboration_id: string
          company_id: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["application_status_enum"]
          updated_at?: string
        }
        Update: {
          applicant_email?: string
          applicant_id?: string
          applicant_resume_url?: string | null
          collaboration_id?: string
          company_id?: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["application_status_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_applications_collaboration_id_fkey"
            columns: ["collaboration_id"]
            isOneToOne: false
            referencedRelation: "collaborations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_applications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_specializations: {
        Row: {
          collaboration_id: string
          specialization_id: string
        }
        Insert: {
          collaboration_id: string
          specialization_id: string
        }
        Update: {
          collaboration_id?: string
          specialization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_specializations_collaboration_id_fkey"
            columns: ["collaboration_id"]
            isOneToOne: false
            referencedRelation: "collaborations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_specializations_specialization_id_fkey"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "specializations"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborations: {
        Row: {
          applicants_count: number
          collaboration_type: Database["public"]["Enums"]["collab_type_enum"]
          company_id: string
          created_at: string
          description: string
          duration: string | null
          external_apply_url: string | null
          id: string
          is_active: boolean
          location_id: string | null
          title: string
        }
        Insert: {
          applicants_count?: number
          collaboration_type: Database["public"]["Enums"]["collab_type_enum"]
          company_id: string
          created_at?: string
          description: string
          duration?: string | null
          external_apply_url?: string | null
          id?: string
          is_active?: boolean
          location_id?: string | null
          title: string
        }
        Update: {
          applicants_count?: number
          collaboration_type?: Database["public"]["Enums"]["collab_type_enum"]
          company_id?: string
          created_at?: string
          description?: string
          duration?: string | null
          external_apply_url?: string | null
          id?: string
          is_active?: boolean
          location_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_collaborations_company_id"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_followers: {
        Row: {
          company_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_followers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_followers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_followers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_jobs: {
        Row: {
          company_id: string
          created_at: string
          description: string
          experience_level: string | null
          external_apply_url: string | null
          id: string
          is_active: boolean
          job_type: string | null
          location_id: string | null
          location_type: string | null
          title: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description: string
          experience_level?: string | null
          external_apply_url?: string | null
          id?: string
          is_active?: boolean
          job_type?: string | null
          location_id?: string | null
          location_type?: string | null
          title: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string
          experience_level?: string | null
          external_apply_url?: string | null
          id?: string
          is_active?: boolean
          job_type?: string | null
          location_id?: string | null
          location_type?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_jobs_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_company_jobs_company_id"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_links: {
        Row: {
          company_id: string
          description: string | null
          id: string
          image_url: string | null
          link_type: Database["public"]["Enums"]["link_type_enum"]
          title: string
          url: string
        }
        Insert: {
          company_id: string
          description?: string | null
          id?: string
          image_url?: string | null
          link_type: Database["public"]["Enums"]["link_type_enum"]
          title: string
          url: string
        }
        Update: {
          company_id?: string
          description?: string | null
          id?: string
          image_url?: string | null
          link_type?: Database["public"]["Enums"]["link_type_enum"]
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_managers: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["company_manager_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["company_manager_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["company_manager_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_managers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_managers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_managers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_profiles: {
        Row: {
          collaboration_count: number
          company_banner_url: string | null
          company_logo_url: string | null
          company_name: string
          company_size: string | null
          created_at: string
          creator_id: string
          description: string
          followers_count: number
          founded_year: number | null
          id: string
          industry_id: string | null
          is_active: boolean
          is_verified: boolean
          job_count: number
          location_id: string | null
          tier: string | null
          website_url: string | null
        }
        Insert: {
          collaboration_count?: number
          company_banner_url?: string | null
          company_logo_url?: string | null
          company_name: string
          company_size?: string | null
          created_at?: string
          creator_id: string
          description: string
          followers_count?: number
          founded_year?: number | null
          id?: string
          industry_id?: string | null
          is_active?: boolean
          is_verified?: boolean
          job_count?: number
          location_id?: string | null
          tier?: string | null
          website_url?: string | null
        }
        Update: {
          collaboration_count?: number
          company_banner_url?: string | null
          company_logo_url?: string | null
          company_name?: string
          company_size?: string | null
          created_at?: string
          creator_id?: string
          description?: string
          followers_count?: number
          founded_year?: number | null
          id?: string
          industry_id?: string | null
          is_active?: boolean
          is_verified?: boolean
          job_count?: number
          location_id?: string | null
          tier?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_profiles_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_profiles_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_profiles_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_profiles_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      company_views: {
        Row: {
          company_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_views_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_portfolio: {
        Row: {
          content_type: string
          created_at: string | null
          description: string | null
          featured: boolean | null
          id: string
          platform_name: string | null
          profile_id: string
          thumbnail_url: string | null
          title: string
          url: string | null
        }
        Insert: {
          content_type: string
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          platform_name?: string | null
          profile_id: string
          thumbnail_url?: string | null
          title: string
          url?: string | null
        }
        Update: {
          content_type?: string
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          platform_name?: string | null
          profile_id?: string
          thumbnail_url?: string | null
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_portfolio_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_portfolio_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          encrypted_conversation_key: string | null
          is_starred: boolean
          user_id: string
        }
        Insert: {
          conversation_id: string
          encrypted_conversation_key?: string | null
          is_starred?: boolean
          user_id: string
        }
        Update: {
          conversation_id?: string
          encrypted_conversation_key?: string | null
          is_starred?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          master_encryption_key: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          master_encryption_key?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          master_encryption_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          id: string
          label: string
          value: string
        }
        Insert: {
          id?: string
          label: string
          value: string
        }
        Update: {
          id?: string
          label?: string
          value?: string
        }
        Relationships: []
      }
      direct_message_attachments: {
        Row: {
          created_at: string
          file_name: string | null
          file_size_bytes: number | null
          file_type: string | null
          file_url: string
          id: string
          iv: string | null
          message_id: number
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          iv?: string | null
          message_id: number
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          iv?: string | null
          message_id?: number
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_message_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_message_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_message_reactions: {
        Row: {
          created_at: string
          id: string
          message_id: number
          reaction_emoji: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: number
          reaction_emoji: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: number
          reaction_emoji?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          id: number
          is_edited: boolean
          is_read: boolean
          parent_message_id: number | null
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          id?: number
          is_edited?: boolean
          is_read?: boolean
          parent_message_id?: number | null
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          id?: number
          is_edited?: boolean
          is_read?: boolean
          parent_message_id?: number | null
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      education_history: {
        Row: {
          course_id: string | null
          created_at: string
          degree: string | null
          description: string | null
          end_year: number | null
          field_of_study: string | null
          id: string
          institution_id: string | null
          institution_name: string
          profile_id: string
          start_year: number | null
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          degree?: string | null
          description?: string | null
          end_year?: number | null
          field_of_study?: string | null
          id?: string
          institution_id?: string | null
          institution_name: string
          profile_id: string
          start_year?: number | null
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          degree?: string | null
          description?: string | null
          end_year?: number | null
          field_of_study?: string | null
          id?: string
          institution_id?: string | null
          institution_name?: string
          profile_id?: string
          start_year?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "education_history_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "education_history_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "education_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "education_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_queue: {
        Row: {
          created_at: string | null
          id: string
          notification_id: string | null
          payload: Json
          retry_count: number | null
          status: string | null
          user_email: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notification_id?: string | null
          payload: Json
          retry_count?: number | null
          status?: string | null
          user_email: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notification_id?: string | null
          payload?: Json
          retry_count?: number | null
          status?: string | null
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_levels: {
        Row: {
          label: string
          sort_order: number | null
          value: string
        }
        Insert: {
          label: string
          sort_order?: number | null
          value: string
        }
        Update: {
          label?: string
          sort_order?: number | null
          value?: string
        }
        Relationships: []
      }
      featured_videos: {
        Row: {
          author_channel_id: string | null
          author_name: string
          author_type: Database["public"]["Enums"]["video_author_type"]
          created_at: string
          description: string | null
          id: string
          title: string
          youtube_video_id: string
        }
        Insert: {
          author_channel_id?: string | null
          author_name: string
          author_type: Database["public"]["Enums"]["video_author_type"]
          created_at?: string
          description?: string | null
          id?: string
          title: string
          youtube_video_id: string
        }
        Update: {
          author_channel_id?: string | null
          author_name?: string
          author_type?: Database["public"]["Enums"]["video_author_type"]
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          youtube_video_id?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          category: string
          created_at: string
          description: string
          id: number
          rating: number
          status: string
          subject: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: number
          rating: number
          status?: string
          subject: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: number
          rating?: number
          status?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      global_engagement: {
        Row: {
          counter_name: string
          counter_value: number
          id: string
          updated_at: string
        }
        Insert: {
          counter_name: string
          counter_value?: number
          id?: string
          updated_at?: string
        }
        Update: {
          counter_name?: string
          counter_value?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      industries: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      institutions: {
        Row: {
          id: string
          label: string
          value: string
        }
        Insert: {
          id?: string
          label: string
          value: string
        }
        Update: {
          id?: string
          label?: string
          value?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          applicant_email: string
          applicant_id: string
          applicant_resume_url: string | null
          company_id: string
          cover_letter: string | null
          created_at: string
          id: string
          job_id: string
          status: Database["public"]["Enums"]["application_status_enum"]
          updated_at: string
        }
        Insert: {
          applicant_email: string
          applicant_id: string
          applicant_resume_url?: string | null
          company_id: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id: string
          status?: Database["public"]["Enums"]["application_status_enum"]
          updated_at?: string
        }
        Update: {
          applicant_email?: string
          applicant_id?: string
          applicant_resume_url?: string | null
          company_id?: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id?: string
          status?: Database["public"]["Enums"]["application_status_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "company_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      job_postings: {
        Row: {
          application_deadline: string | null
          benefits: string[] | null
          category_id: string | null
          company_name: string
          created_at: string | null
          description: string
          experience_required:
            | Database["public"]["Enums"]["experience_level"]
            | null
          id: string
          is_active: boolean | null
          job_type: Database["public"]["Enums"]["job_type"] | null
          location: string
          posted_by: string | null
          requirements: string[] | null
          salary_range: string | null
          specialization_required:
            | Database["public"]["Enums"]["specialization_type"]
            | null
          title: string
          updated_at: string | null
        }
        Insert: {
          application_deadline?: string | null
          benefits?: string[] | null
          category_id?: string | null
          company_name: string
          created_at?: string | null
          description: string
          experience_required?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          id?: string
          is_active?: boolean | null
          job_type?: Database["public"]["Enums"]["job_type"] | null
          location: string
          posted_by?: string | null
          requirements?: string[] | null
          salary_range?: string | null
          specialization_required?:
            | Database["public"]["Enums"]["specialization_type"]
            | null
          title: string
          updated_at?: string | null
        }
        Update: {
          application_deadline?: string | null
          benefits?: string[] | null
          category_id?: string | null
          company_name?: string
          created_at?: string | null
          description?: string
          experience_required?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          id?: string
          is_active?: boolean | null
          job_type?: Database["public"]["Enums"]["job_type"] | null
          location?: string
          posted_by?: string | null
          requirements?: string[] | null
          salary_range?: string | null
          specialization_required?:
            | Database["public"]["Enums"]["specialization_type"]
            | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "job_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_specializations: {
        Row: {
          job_id: string
          specialization_id: string
        }
        Insert: {
          job_id: string
          specialization_id: string
        }
        Update: {
          job_id?: string
          specialization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_specializations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "company_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_specializations_specialization_id_fkey"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "specializations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          id: string
          label: string
          value: string
        }
        Insert: {
          id?: string
          label: string
          value: string
        }
        Update: {
          id?: string
          label?: string
          value?: string
        }
        Relationships: []
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["membership_role"]
          space_id: string
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["membership_role"]
          space_id: string
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["membership_role"]
          space_id?: string
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size_bytes: number | null
          file_type: string | null
          file_url: string
          id: string
          message_id: number
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          message_id: number
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          message_id?: number
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "public_posts_feed"
            referencedColumns: ["first_message_id"]
          },
          {
            foreignKeyName: "message_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          id: string
          message_id: number
          reaction_emoji: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: number
          reaction_emoji: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: number
          reaction_emoji?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "public_posts_feed"
            referencedColumns: ["first_message_id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: number
          is_edited: boolean
          parent_message_id: number | null
          preview_description: string | null
          preview_image_url: string | null
          preview_title: string | null
          thread_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: never
          is_edited?: boolean
          parent_message_id?: number | null
          preview_description?: string | null
          preview_image_url?: string | null
          preview_title?: string | null
          thread_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: never
          is_edited?: boolean
          parent_message_id?: number | null
          preview_description?: string | null
          preview_image_url?: string | null
          preview_title?: string | null
          thread_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "public_posts_feed"
            referencedColumns: ["first_message_id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "public_posts_feed"
            referencedColumns: ["thread_id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          connection_requests: boolean | null
          created_at: string | null
          direct_messages: boolean | null
          email_enabled: boolean | null
          follows_activity: boolean | null
          forum_updates: boolean | null
          id: string
          job_alerts: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          connection_requests?: boolean | null
          created_at?: string | null
          direct_messages?: boolean | null
          email_enabled?: boolean | null
          follows_activity?: boolean | null
          forum_updates?: boolean | null
          id?: string
          job_alerts?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          connection_requests?: boolean | null
          created_at?: string | null
          direct_messages?: boolean | null
          email_enabled?: boolean | null
          follows_activity?: boolean | null
          forum_updates?: boolean | null
          id?: string
          job_alerts?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          announcement_id: string | null
          created_at: string
          email_status: string | null
          entity_id: string | null
          id: string
          is_read: boolean
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          announcement_id?: string | null
          created_at?: string
          email_status?: string | null
          entity_id?: string | null
          id?: string
          is_read?: boolean
          type: Database["public"]["Enums"]["notification_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actor_id?: string | null
          announcement_id?: string | null
          created_at?: string
          email_status?: string | null
          entity_id?: string | null
          id?: string
          is_read?: boolean
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_notifications_announcement"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_services: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          partner_id: string | null
          premium_discount: number | null
          regular_price: number | null
          service_name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          partner_id?: string | null
          premium_discount?: number | null
          regular_price?: number | null
          service_name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          partner_id?: string | null
          premium_discount?: number | null
          regular_price?: number | null
          service_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_services_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          contact_email: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          partner_type: string | null
          tenant_id: string | null
          user_id: string | null
          website_url: string | null
        }
        Insert: {
          contact_email?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          partner_type?: string | null
          tenant_id?: string | null
          user_id?: string | null
          website_url?: string | null
        }
        Update: {
          contact_email?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          partner_type?: string | null
          tenant_id?: string | null
          user_id?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partnership_proposals: {
        Row: {
          contact_name: string
          created_at: string
          description: string
          email: string
          id: string
          organization_name: string
          organization_type: string
          organization_type_other: string | null
          partnership_type: string
          partnership_type_other: string | null
          phone: string | null
          status: string
          website: string | null
        }
        Insert: {
          contact_name: string
          created_at?: string
          description: string
          email: string
          id?: string
          organization_name: string
          organization_type: string
          organization_type_other?: string | null
          partnership_type: string
          partnership_type_other?: string | null
          phone?: string | null
          status?: string
          website?: string | null
        }
        Update: {
          contact_name?: string
          created_at?: string
          description?: string
          email?: string
          id?: string
          organization_name?: string
          organization_type?: string
          organization_type_other?: string | null
          partnership_type?: string
          partnership_type_other?: string | null
          phone?: string | null
          status?: string
          website?: string | null
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          payment_gateway: string | null
          status: string | null
          subscription_id: string | null
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_gateway?: string | null
          status?: string | null
          subscription_id?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_gateway?: string | null
          status?: string | null
          subscription_id?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_analytics: {
        Row: {
          profile_id: string
          view_count: number
        }
        Insert: {
          profile_id: string
          view_count?: number
        }
        Update: {
          profile_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "profile_analytics_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_analytics_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_views: {
        Row: {
          created_at: string
          profile_id: string
          viewer_id: string
        }
        Insert: {
          created_at?: string
          profile_id: string
          viewer_id: string
        }
        Update: {
          created_at?: string
          profile_id?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          connection_count: number
          course_id: string | null
          course_other: string | null
          created_at: string | null
          current_position: string | null
          date_of_birth: string | null
          email: string
          encrypted_user_master_key: string | null
          encryption_salt: string | null
          experience_level_value: string | null
          follower_count: number
          following_count: number
          full_name: string | null
          id: string
          institution_id: string | null
          institution_other: string | null
          is_onboarded: boolean | null
          is_verified: boolean | null
          location_id: string | null
          location_other: string | null
          medical_license: string | null
          organization: string | null
          phone: string | null
          privacy_settings: Json | null
          profile_mode: string
          profile_picture_url: string | null
          resume_url: string | null
          role: string
          skills: string[] | null
          specialization_id: string | null
          specialization_other: string | null
          student_year_value: string | null
          updated_at: string | null
          user_role: Database["public"]["Enums"]["user_role"] | null
          work_experience: Json | null
        }
        Insert: {
          bio?: string | null
          connection_count?: number
          course_id?: string | null
          course_other?: string | null
          created_at?: string | null
          current_position?: string | null
          date_of_birth?: string | null
          email: string
          encrypted_user_master_key?: string | null
          encryption_salt?: string | null
          experience_level_value?: string | null
          follower_count?: number
          following_count?: number
          full_name?: string | null
          id?: string
          institution_id?: string | null
          institution_other?: string | null
          is_onboarded?: boolean | null
          is_verified?: boolean | null
          location_id?: string | null
          location_other?: string | null
          medical_license?: string | null
          organization?: string | null
          phone?: string | null
          privacy_settings?: Json | null
          profile_mode?: string
          profile_picture_url?: string | null
          resume_url?: string | null
          role?: string
          skills?: string[] | null
          specialization_id?: string | null
          specialization_other?: string | null
          student_year_value?: string | null
          updated_at?: string | null
          user_role?: Database["public"]["Enums"]["user_role"] | null
          work_experience?: Json | null
        }
        Update: {
          bio?: string | null
          connection_count?: number
          course_id?: string | null
          course_other?: string | null
          created_at?: string | null
          current_position?: string | null
          date_of_birth?: string | null
          email?: string
          encrypted_user_master_key?: string | null
          encryption_salt?: string | null
          experience_level_value?: string | null
          follower_count?: number
          following_count?: number
          full_name?: string | null
          id?: string
          institution_id?: string | null
          institution_other?: string | null
          is_onboarded?: boolean | null
          is_verified?: boolean | null
          location_id?: string | null
          location_other?: string | null
          medical_license?: string | null
          organization?: string | null
          phone?: string | null
          privacy_settings?: Json | null
          profile_mode?: string
          profile_picture_url?: string | null
          resume_url?: string | null
          role?: string
          skills?: string[] | null
          specialization_id?: string | null
          specialization_other?: string | null
          student_year_value?: string | null
          updated_at?: string | null
          user_role?: Database["public"]["Enums"]["user_role"] | null
          work_experience?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_experience_level"
            columns: ["experience_level_value"]
            isOneToOne: false
            referencedRelation: "experience_levels"
            referencedColumns: ["value"]
          },
          {
            foreignKeyName: "fk_profiles_student_year"
            columns: ["student_year_value"]
            isOneToOne: false
            referencedRelation: "student_years"
            referencedColumns: ["value"]
          },
          {
            foreignKeyName: "profiles_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_specialization_id_fkey"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "specializations"
            referencedColumns: ["id"]
          },
        ]
      }
      publications: {
        Row: {
          authors: string[] | null
          citation_count: number | null
          created_at: string
          description: string | null
          doi: string | null
          id: string
          journal_name: string | null
          profile_id: string
          publication_date: string | null
          title: string
          type: string
          updated_at: string
          url: string | null
        }
        Insert: {
          authors?: string[] | null
          citation_count?: number | null
          created_at?: string
          description?: string | null
          doi?: string | null
          id?: string
          journal_name?: string | null
          profile_id: string
          publication_date?: string | null
          title: string
          type: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          authors?: string[] | null
          citation_count?: number | null
          created_at?: string
          description?: string | null
          doi?: string | null
          id?: string
          journal_name?: string | null
          profile_id?: string
          publication_date?: string | null
          title?: string
          type?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "publications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          created_at: string
          creator_id: string | null
          description: string | null
          id: string
          join_level: Database["public"]["Enums"]["space_join_level"] | null
          name: string
          space_type: Database["public"]["Enums"]["space_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id?: string | null
          description?: string | null
          id?: string
          join_level?: Database["public"]["Enums"]["space_join_level"] | null
          name: string
          space_type: Database["public"]["Enums"]["space_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string | null
          description?: string | null
          id?: string
          join_level?: Database["public"]["Enums"]["space_join_level"] | null
          name?: string
          space_type?: Database["public"]["Enums"]["space_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spaces_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spaces_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      specializations: {
        Row: {
          id: string
          label: string
          value: string
        }
        Insert: {
          id?: string
          label: string
          value: string
        }
        Update: {
          id?: string
          label?: string
          value?: string
        }
        Relationships: []
      }
      student_years: {
        Row: {
          label: string
          sort_order: number | null
          value: string
        }
        Insert: {
          label: string
          sort_order?: number | null
          value: string
        }
        Update: {
          label?: string
          sort_order?: number | null
          value?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          duration_months: number
          features: string[] | null
          id: string
          is_active: boolean | null
          name: string
          price: number
        }
        Insert: {
          created_at?: string | null
          duration_months: number
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
        }
        Update: {
          created_at?: string | null
          duration_months?: number
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
        }
        Relationships: []
      }
      threads: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          id: string
          last_activity_at: string | null
          message_count: number
          space_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          last_activity_at?: string | null
          message_count?: number
          space_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          last_activity_at?: string | null
          message_count?: number
          space_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "threads_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_connections: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: Database["public"]["Enums"]["connection_status"]
          updated_at: string | null
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string | null
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_addressee"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_addressee"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_requester"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_requester"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_connections_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_connections_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_connections_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_connections_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_education: {
        Row: {
          college_id: string | null
          course_id: string | null
          created_at: string | null
          graduation_year: number | null
          id: string
          other_college_name: string | null
          percentage_or_cgpa: number | null
          user_id: string | null
        }
        Insert: {
          college_id?: string | null
          course_id?: string | null
          created_at?: string | null
          graduation_year?: number | null
          id?: string
          other_college_name?: string | null
          percentage_or_cgpa?: number | null
          user_id?: string | null
        }
        Update: {
          college_id?: string | null
          course_id?: string | null
          created_at?: string | null
          graduation_year?: number | null
          id?: string
          other_college_name?: string | null
          percentage_or_cgpa?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_education_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_education_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          followed_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string
          followed_id: string
          follower_id: string
        }
        Update: {
          created_at?: string
          followed_id?: string
          follower_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_followed_id_fkey"
            columns: ["followed_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_followed_id_fkey"
            columns: ["followed_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_professional_details: {
        Row: {
          certifications: string[] | null
          created_at: string | null
          current_workplace: string | null
          id: string
          job_title: string | null
          languages: string[] | null
          license_number: string | null
          other_specialization: string | null
          registration_council: string | null
          skills: string[] | null
          specialization:
            | Database["public"]["Enums"]["specialization_type"]
            | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          certifications?: string[] | null
          created_at?: string | null
          current_workplace?: string | null
          id?: string
          job_title?: string | null
          languages?: string[] | null
          license_number?: string | null
          other_specialization?: string | null
          registration_council?: string | null
          skills?: string[] | null
          specialization?:
            | Database["public"]["Enums"]["specialization_type"]
            | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          certifications?: string[] | null
          created_at?: string | null
          current_workplace?: string | null
          id?: string
          job_title?: string | null
          languages?: string[] | null
          license_number?: string | null
          other_specialization?: string | null
          registration_council?: string | null
          skills?: string[] | null
          specialization?:
            | Database["public"]["Enums"]["specialization_type"]
            | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_professional_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_professional_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_recommendations: {
        Row: {
          created_at: string | null
          id: string
          is_dismissed: boolean | null
          reason: string | null
          recommendee_id: string | null
          recommender_id: string | null
          score: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          reason?: string | null
          recommendee_id?: string | null
          recommender_id?: string | null
          score?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          reason?: string | null
          recommendee_id?: string | null
          recommender_id?: string | null
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_recommendations_recommended_user_id_fkey"
            columns: ["recommender_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_recommendations_recommended_user_id_fkey"
            columns: ["recommender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_recommendations_recommender_id_fkey"
            columns: ["recommender_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_recommendations_recommender_id_fkey"
            columns: ["recommender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_recommendations_user_id_fkey"
            columns: ["recommendee_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_recommendations_user_id_fkey"
            columns: ["recommendee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          is_active: boolean | null
          payment_id: string | null
          plan_id: string | null
          start_date: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          payment_id?: string | null
          plan_id?: string | null
          start_date: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          payment_id?: string | null
          plan_id?: string | null
          start_date?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ventures: {
        Row: {
          achievements: string[] | null
          created_at: string | null
          description: string | null
          end_date: string | null
          featured_image_url: string | null
          id: string
          name: string
          profile_id: string
          role: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          venture_type: string | null
          website_url: string | null
        }
        Insert: {
          achievements?: string[] | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          featured_image_url?: string | null
          id?: string
          name: string
          profile_id: string
          role?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          venture_type?: string | null
          website_url?: string | null
        }
        Update: {
          achievements?: string[] | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          featured_image_url?: string | null
          id?: string
          name?: string
          profile_id?: string
          role?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          venture_type?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ventures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_experiences: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          organization: string
          position: string
          profile_id: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          organization: string
          position: string
          profile_id: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          organization?: string
          position?: string
          profile_id?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_experiences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_experiences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      blocked_members: {
        Row: {
          blocked_at: string | null
          full_name: string | null
          id: string | null
          profile_picture_url: string | null
        }
        Relationships: []
      }
      public_posts_feed: {
        Row: {
          attachments: Json | null
          author: Json | null
          comment_count: number | null
          created_at: string | null
          first_message_body: string | null
          first_message_id: number | null
          first_message_user_reaction: string | null
          last_activity_at: string | null
          message_created_at: string | null
          message_user_id: string | null
          preview_description: string | null
          preview_image_url: string | null
          preview_title: string | null
          thread_creator_id: string | null
          thread_id: string | null
          thread_space_id: string | null
          thread_updated_at: string | null
          title: string | null
          total_reaction_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["message_user_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["message_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_space_id_fkey"
            columns: ["thread_space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sent_pending_requests: {
        Row: {
          addressee_id: string | null
          current_position: string | null
          full_name: string | null
          organization: string | null
          profile_picture_url: string | null
          request_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_addressee"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_addressee"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_connections_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_connections_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_company_link: {
        Args: {
          p_company_id: string
          p_description?: string
          p_image_url?: string
          p_link_type: Database["public"]["Enums"]["link_type_enum"]
          p_title: string
          p_url: string
        }
        Returns: Json
      }
      add_company_manager: {
        Args: {
          p_company_id: string
          p_role?: Database["public"]["Enums"]["company_manager_role"]
          p_user_id: string
        }
        Returns: Json
      }
      apply_for_collaboration: {
        Args: { p_collab_id: string; p_cover_letter?: string }
        Returns: Json
      }
      apply_for_job: {
        Args: { p_cover_letter?: string; p_job_id: string }
        Returns: Json
      }
      are_users_connected: {
        Args: { user_a: string; user_b: string }
        Returns: boolean
      }
      block_user: { Args: { blocked_user_id: string }; Returns: undefined }
      calculate_age: { Args: { birth_date: string }; Returns: number }
      can_send_direct_message: {
        Args: { other_user_id: string }
        Returns: boolean
      }
      can_view_field: {
        Args: { field_name: string; profile_id: string; viewer_id: string }
        Returns: boolean
      }
      can_view_thread: { Args: { p_thread_id: string }; Returns: boolean }
      create_collaboration: {
        Args: {
          p_collaboration_type: Database["public"]["Enums"]["collab_type_enum"]
          p_company_id: string
          p_description: string
          p_duration?: string
          p_location_id?: string
          p_specialization_ids?: string[]
          p_title: string
        }
        Returns: Json
      }
      create_company_job: {
        Args: {
          p_company_id: string
          p_description: string
          p_experience_level?: string
          p_external_apply_url?: string
          p_job_type?: string
          p_location_id?: string
          p_location_type?: string
          p_specialization_ids?: string[]
          p_title: string
        }
        Returns: Json
      }
      create_company_profile: {
        Args: {
          p_company_logo_url?: string
          p_company_name: string
          p_company_size?: string
          p_description: string
          p_founded_year?: number
          p_industry_id?: string
          p_industry_other?: string
          p_location_id?: string
          p_website_url?: string
        }
        Returns: Json
      }
      create_or_get_conversation: {
        Args: { other_user_id: string }
        Returns: string
      }
      create_thread: {
        Args: {
          p_attachments?: Database["public"]["CompositeTypes"]["attachment_input"][]
          p_body: string
          p_description?: string
          p_preview_description?: string
          p_preview_image_url?: string
          p_preview_title?: string
          p_space_id?: string
          p_title: string
        }
        Returns: string
      }
      deactivate_company_profile: {
        Args: { p_company_id: string }
        Returns: undefined
      }
      delete_company_link: { Args: { p_link_id: string }; Returns: Json }
      delete_company_profile: { Args: { p_company_id: string }; Returns: Json }
      delete_message: { Args: { p_message_id: number }; Returns: undefined }
      delete_own_user: { Args: never; Returns: undefined }
      delete_post: { Args: { p_thread_id: string }; Returns: undefined }
      delete_space: { Args: { p_space_id: string }; Returns: undefined }
      delete_thread: { Args: { p_thread_id: string }; Returns: undefined }
      get_all_active_collaborations: {
        Args: {
          p_industry_id?: string
          p_limit?: number
          p_location_id?: string
          p_page?: number
          p_search_query?: string
          p_specialization_ids?: string[]
        }
        Returns: {
          collab_id: string
          collaboration_type: Database["public"]["Enums"]["collab_type_enum"]
          company_id: string
          company_logo_url: string
          company_name: string
          company_tier: string
          created_at: string
          duration: string
          external_apply_url: string
          location_name: string
          specializations: Json
          title: string
        }[]
      }
      get_all_active_jobs: {
        Args: {
          p_industry_id?: string
          p_limit?: number
          p_location_id?: string
          p_page?: number
          p_search_query?: string
          p_specialization_ids?: string[]
        }
        Returns: {
          company_id: string
          company_logo_url: string
          company_name: string
          company_tier: string
          created_at: string
          experience_level: string
          external_apply_url: string
          job_id: string
          job_type: Database["public"]["Enums"]["job_type"]
          location_name: string
          location_type: string
          specializations: Json
          title: string
        }[]
      }
      get_all_companies: {
        Args: {
          p_industry_id?: string
          p_limit: number
          p_location_id?: string
          p_page: number
          p_search_query?: string
        }
        Returns: {
          company_logo_url: string
          company_name: string
          company_size: string
          description: string
          id: string
          industry_name: string
          location_name: string
          tier: Database["public"]["Enums"]["company_tier_enum"]
        }[]
      }
      get_collaboration_applicants: {
        Args: { p_collab_id: string }
        Returns: {
          applicant_avatar_url: string
          applicant_email: string
          applicant_headline: string
          applicant_id: string
          applicant_name: string
          applicant_resume_url: string
          application_id: string
          applied_at: string
          cover_letter: string
          status: Database["public"]["Enums"]["application_status_enum"]
        }[]
      }
      get_collaboration_details: {
        Args: { p_collab_id: string }
        Returns: {
          applicants_count: number
          collaboration_type: Database["public"]["Enums"]["collab_type_enum"]
          company_headline: string
          company_id: string
          company_logo_url: string
          company_name: string
          created_at: string
          description: string
          duration: string
          id: string
          is_active: boolean
          location_id: string
          location_name: string
          specializations: Json
          title: string
        }[]
      }
      get_company_profile_details: {
        Args: { p_company_id: string }
        Returns: Json
      }
      get_followers_with_status: {
        Args: { p_profile_id: string }
        Returns: Database["public"]["CompositeTypes"]["profile_with_status"][]
        SetofOptions: {
          from: "*"
          to: "profile_with_status"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_following_with_status: {
        Args: { p_profile_id: string }
        Returns: Database["public"]["CompositeTypes"]["profile_with_status"][]
        SetofOptions: {
          from: "*"
          to: "profile_with_status"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_job_applicants: {
        Args: { p_job_id: string }
        Returns: {
          applicant_avatar_url: string
          applicant_email: string
          applicant_headline: string
          applicant_id: string
          applicant_name: string
          applicant_resume_url: string
          application_id: string
          applied_at: string
          cover_letter: string
          status: Database["public"]["Enums"]["application_status_enum"]
        }[]
      }
      get_job_details: {
        Args: { p_job_id: string }
        Returns: {
          company_headline: string
          company_id: string
          company_logo_url: string
          company_name: string
          created_at: string
          description: string
          experience_level: string
          external_apply_url: string
          id: string
          is_active: boolean
          job_type: string
          location_id: string
          location_name: string
          location_type: string
          specializations: Json
          title: string
        }[]
      }
      get_job_recommendations: {
        Args: { target_user_id: string }
        Returns: {
          company_name: string
          experience_level: string
          job_id: string
          job_type: Database["public"]["Enums"]["job_type"]
          location_name: string
          match_score: number
          specializations: Json
          title: string
        }[]
      }
      get_messages: {
        Args: { p_thread_id: string }
        Returns: {
          body: string
          created_at: string
          email: string
          id: number
          is_edited: boolean
          user_id: string
        }[]
      }
      get_mutual_connections: {
        Args: { other_user_id: string }
        Returns: Database["public"]["CompositeTypes"]["profile_with_status"][]
        SetofOptions: {
          from: "*"
          to: "profile_with_status"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_my_admin_company_id: { Args: never; Returns: string }
      get_my_blocked_users: {
        Args: never
        Returns: {
          blocked_user_id: string
          connection_id: string
          current_position: string
          full_name: string
          profile_picture_url: string
        }[]
      }
      get_my_collaboration_applications: {
        Args: never
        Returns: {
          application_id: string
          applied_at: string
          collab_id: string
          collab_title: string
          company_logo_url: string
          company_name: string
          cover_letter: string
          status: Database["public"]["Enums"]["application_status_enum"]
        }[]
      }
      get_my_connections: {
        Args: never
        Returns: {
          current_position: string
          full_name: string
          id: string
          location_name: string
          organization: string
          profile_picture_url: string
          specialization_name: string
        }[]
      }
      get_my_connections_with_status: {
        Args: {
          page_number?: number
          page_size?: number
          search_query?: string
        }
        Returns: Database["public"]["CompositeTypes"]["profile_with_status"][]
        SetofOptions: {
          from: "*"
          to: "profile_with_status"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_my_inbox_conversations: {
        Args: never
        Returns: {
          conversation_id: string
          encrypted_conversation_key: string
          is_starred: boolean
          last_message_content: string
          last_message_created_at: string
          last_message_id: number
          last_message_sender_id: string
          master_encryption_key: string
          participant_avatar_url: string
          participant_full_name: string
          participant_id: string
          unread_count: number
        }[]
      }
      get_my_job_applications: {
        Args: never
        Returns: {
          application_id: string
          applied_at: string
          company_logo_url: string
          company_name: string
          cover_letter: string
          job_id: string
          job_title: string
          status: Database["public"]["Enums"]["application_status_enum"]
        }[]
      }
      get_my_notifications: { Args: never; Returns: Json[] }
      get_my_unread_inbox_count: { Args: never; Returns: number }
      get_pending_connection_requests: {
        Args: never
        Returns: {
          connection_id: string
          current_position: string
          full_name: string
          location_name: string
          organization: string
          profile_picture_url: string
          requested_at: string
          requester_id: string
          specialization_name: string
        }[]
      }
      get_pending_requests: {
        Args: { p_space_id: string }
        Returns: {
          current_position: string
          full_name: string
          location_name: string
          membership_id: string
          organization: string
          profile_picture_url: string
          requested_at: string
          specialization_name: string
          user_id: string
        }[]
      }
      get_profile_with_privacy: {
        Args: { profile_id: string; viewer_id?: string }
        Returns: {
          age: number
          bio: string
          connection_count: number
          course: string
          created_at: string
          current_location: string
          current_position: string
          date_of_birth: string
          email: string
          follower_count: number
          following_count: number
          full_name: string
          id: string
          institution: string
          is_onboarded: boolean
          is_verified: boolean
          medical_license: string
          organization: string
          phone: string
          privacy_settings: Json
          profile_mode: string
          profile_picture_url: string
          resume_url: string
          skills: string[]
          specialization: string
          updated_at: string
          user_role: Database["public"]["Enums"]["user_role"]
          work_experience: Json
          year_of_study: string
          years_experience: string
        }[]
      }
      get_public_space_id: { Args: never; Returns: string }
      get_space_details_by_id: {
        Args: { p_space_id: string }
        Returns: {
          created_at: string
          creator_full_name: string
          creator_id: string
          creator_organization: string
          creator_position: string
          creator_specialization: string
          description: string
          id: string
          join_level: Database["public"]["Enums"]["space_join_level"]
          moderators: Json
          name: string
          space_type: Database["public"]["Enums"]["space_type"]
        }[]
      }
      get_space_id_for_thread: {
        Args: { thread_id_to_check: string }
        Returns: string
      }
      get_spaces_with_details: {
        Args: {
          p_filter_type?: string
          p_limit?: number
          p_offset?: number
          p_search_query?: string
        }
        Returns: {
          created_at: string
          creator_full_name: string
          creator_id: string
          creator_organization: string
          creator_position: string
          creator_specialization: string
          description: string
          id: string
          join_level: Database["public"]["Enums"]["space_join_level"]
          moderators: Json
          name: string
          space_type: Database["public"]["Enums"]["space_type"]
        }[]
      }
      get_threads: {
        Args: {
          p_limit?: number
          p_page?: number
          p_search_query?: string
          p_space_id?: string
        }
        Returns: {
          attachments: Json
          comment_count: number
          created_at: string
          creator_full_name: string
          creator_id: string
          creator_organization: string
          creator_position: string
          creator_profile_picture_url: string
          creator_specialization: string
          first_message_body: string
          first_message_id: number
          first_message_reaction_count: number
          first_message_user_reaction: string
          id: string
          last_activity_at: string
          last_message_body: string
          space_id: string
          space_type: string
          title: string
          total_message_count: number
        }[]
      }
      get_total_partnership_proposals_count: { Args: never; Returns: number }
      get_total_spaces_count: { Args: never; Returns: number }
      get_total_users_count: { Args: never; Returns: number }
      get_user_recommendations: {
        Args: { target_user_id: string }
        Returns: {
          course: string
          current_location: string
          full_name: string
          id: string
          institution: string
          organization: string
          profile_picture_url: string
          similarity_score: number
          specialization: string
          student_year: string
          user_role: Database["public"]["Enums"]["user_role"]
          years_experience: string
        }[]
      }
      increment_global_counter: {
        Args: { counter_name_param: string }
        Returns: number
      }
      increment_profile_view: {
        Args: { p_profile_id: string }
        Returns: undefined
      }
      is_company_manager: { Args: { p_company_id: string }; Returns: boolean }
      is_space_member: { Args: { space_id_to_check: string }; Returns: boolean }
      is_space_moderator_or_admin: {
        Args: { p_space_id: string; p_user_id: string }
        Returns: boolean
      }
      is_thread_creator:
        | { Args: { p_thread_id: string; p_user_id: string }; Returns: boolean }
        | { Args: { p_thread_id: string }; Returns: boolean }
      join_space_as_member: {
        Args: { p_space_id: string }
        Returns: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["membership_role"]
          space_id: string
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "memberships"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      leave_space: { Args: { p_space_id: string }; Returns: undefined }
      lower: {
        Args: { val: Database["public"]["Enums"]["notification_type"] }
        Returns: string
      }
      mark_conversation_as_read: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      post_direct_message: {
        Args: {
          p_content: string
          p_conversation_id: string
          p_parent_message_id?: number
        }
        Returns: {
          content: string | null
          conversation_id: string
          created_at: string
          id: number
          is_edited: boolean
          is_read: boolean
          parent_message_id: number | null
          sender_id: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "direct_messages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      post_message_with_reply: {
        Args: {
          p_body: string
          p_parent_message_id?: number
          p_thread_id: string
        }
        Returns: {
          body: string
          created_at: string
          id: number
          is_edited: boolean
          parent_message_id: number | null
          preview_description: string | null
          preview_image_url: string | null
          preview_title: string | null
          thread_id: string
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "messages"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      purge_old_read_notifications: { Args: never; Returns: undefined }
      record_company_view: {
        Args: { company_id_input: string }
        Returns: undefined
      }
      remove_company_manager: {
        Args: { p_manager_record_id: string }
        Returns: Json
      }
      remove_connection: {
        Args: { user_to_remove_id: string }
        Returns: undefined
      }
      request_to_join_space: { Args: { p_space_id: string }; Returns: string }
      respond_to_connection_request: {
        Args: {
          requester_uuid: string
          response: Database["public"]["Enums"]["connection_status"]
        }
        Returns: undefined
      }
      send_connection_request: {
        Args: { addressee_uuid: string }
        Returns: undefined
      }
      send_system_update_to_all_users: {
        Args: { announcement_entity_id: string; system_actor_id: string }
        Returns: undefined
      }
      set_collaboration_active_status: {
        Args: { p_collab_id: string; p_is_active: boolean }
        Returns: Json
      }
      set_conversation_master_key_if_null: {
        Args: { p_conversation_id: string; p_new_key_jwk: string }
        Returns: string
      }
      set_job_active_status: {
        Args: { p_is_active: boolean; p_job_id: string }
        Returns: Json
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      toggle_follow: { Args: { p_followed_id: string }; Returns: undefined }
      toggle_follow_company: { Args: { p_company_id: string }; Returns: Json }
      toggle_reaction: {
        Args: { p_message_id: number; p_new_emoji: string }
        Returns: undefined
      }
      toggle_reaction_dm: {
        Args: { p_emoji: string; p_message_id: number }
        Returns: Json
      }
      transfer_space_ownership: {
        Args: { p_new_owner_id: string; p_space_id: string }
        Returns: undefined
      }
      unblock_user: { Args: { unblocked_user_id: string }; Returns: undefined }
      update_application_status: {
        Args: {
          p_application_id: string
          p_application_type: string
          p_new_status: Database["public"]["Enums"]["application_status_enum"]
        }
        Returns: Json
      }
      update_collaboration: {
        Args: {
          p_collab_id: string
          p_collaboration_type?: Database["public"]["Enums"]["collab_type_enum"]
          p_description?: string
          p_duration?: string
          p_location_id?: string
          p_specialization_ids?: string[]
          p_title?: string
        }
        Returns: Json
      }
      update_company_job: {
        Args: {
          p_description?: string
          p_experience_level?: string
          p_external_apply_url?: string
          p_job_id: string
          p_job_type?: string
          p_location_id?: string
          p_location_type?: string
          p_specialization_ids?: string[]
          p_title?: string
        }
        Returns: Json
      }
      update_company_link: {
        Args: {
          p_description?: string
          p_image_url?: string
          p_link_id: string
          p_link_type?: Database["public"]["Enums"]["link_type_enum"]
          p_title?: string
          p_url?: string
        }
        Returns: Json
      }
      update_company_manager_role: {
        Args: {
          p_manager_record_id: string
          p_new_role: Database["public"]["Enums"]["company_manager_role"]
        }
        Returns: Json
      }
      update_company_profile: {
        Args: {
          p_company_banner_url?: string
          p_company_id: string
          p_company_logo_url?: string
          p_company_name?: string
          p_company_size?: string
          p_description?: string
          p_founded_year?: number
          p_industry_id?: string
          p_industry_other?: string
          p_location_id?: string
          p_website_url?: string
        }
        Returns: Json
      }
      update_member_role: {
        Args: {
          p_membership_id: string
          p_new_role: Database["public"]["Enums"]["membership_role"]
        }
        Returns: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["membership_role"]
          space_id: string
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "memberships"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      update_membership_status: {
        Args: {
          p_membership_id: string
          p_new_status: Database["public"]["Enums"]["membership_status"]
        }
        Returns: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["membership_role"]
          space_id: string
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "memberships"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      update_message: {
        Args: { p_message_id: number; p_new_body: string }
        Returns: undefined
      }
      update_post: {
        Args: { p_thread_id: string; p_title: string }
        Returns: undefined
      }
      update_profile: {
        Args: {
          p_bio?: string
          p_course_id?: string
          p_course_other?: string
          p_current_position?: string
          p_date_of_birth?: string
          p_experience_level_value?: string
          p_full_name?: string
          p_institution_id?: string
          p_institution_other?: string
          p_is_onboarded?: boolean
          p_location_id?: string
          p_location_other?: string
          p_medical_license?: string
          p_organization?: string
          p_phone?: string
          p_profile_mode?: string
          p_profile_picture_url?: string
          p_resume_url?: string
          p_skills?: string[]
          p_specialization_id?: string
          p_specialization_other?: string
          p_student_year_value?: string
          p_user_role?: Database["public"]["Enums"]["user_role"]
        }
        Returns: undefined
      }
      update_thread: {
        Args: {
          p_new_description?: string
          p_new_title: string
          p_thread_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      application_status_enum:
        | "pending"
        | "viewed"
        | "in_progress"
        | "rejected"
        | "hired"
      collab_type_enum: "clinical_trial" | "research" | "advisory" | "other"
      company_manager_role: "ADMIN" | "MEMBER"
      company_tier_enum: "standard" | "premium" | "deluxe" | "basic"
      connection_status: "pending" | "accepted" | "blocked" | "ignored"
      connection_status_type:
        | "connected"
        | "pending_sent"
        | "pending_received"
        | "not_connected"
      experience_level:
        | "fresh"
        | "one_to_three"
        | "three_to_five"
        | "five_to_ten"
        | "ten_plus"
      forum_type: "PUBLIC" | "PRIVATE"
      job_type: "full_time" | "part_time" | "contract" | "internship" | "locum"
      link_type_enum: "product" | "social" | "url" | "linkedin"
      membership_role: "ADMIN" | "MODERATOR" | "MEMBER"
      membership_status: "ACTIVE" | "PENDING" | "BANNED"
      notification_type:
        | "new_connection_request"
        | "connection_accepted"
        | "new_thread"
        | "new_space"
        | "system_update"
        | "new_reply"
        | "job_application_update"
        | "new_public_post_by_followed_user"
        | "new_public_space_by_followed_user"
        | "new_reply_to_your_message"
        | "new_direct_message"
        | "new_job_posting"
        | "new_collaboration_posting"
        | "new_job_applicant"
        | "new_collaboration_applicant"
        | "space_join_request"
        | "new_reaction"
        | "new_follower"
        | "new_company"
        | "new_space_created"
        | "new_member_joined"
      space_join_level: "OPEN" | "INVITE_ONLY"
      space_type: "PUBLIC" | "COMMUNITY_SPACE" | "FORUM"
      specialization:
        | "general_medicine"
        | "cardiology"
        | "neurology"
        | "orthopedics"
        | "pediatrics"
        | "gynecology"
        | "dermatology"
        | "psychiatry"
        | "oncology"
        | "radiology"
        | "anesthesiology"
        | "pathology"
        | "surgery"
        | "emergency_medicine"
        | "internal_medicine"
        | "family_medicine"
        | "ophthalmology"
        | "ent"
        | "urology"
        | "gastroenterology"
        | "pulmonology"
        | "endocrinology"
        | "nephrology"
        | "rheumatology"
        | "infectious_disease"
        | "critical_care"
        | "plastic_surgery"
        | "neurosurgery"
        | "cardiac_surgery"
        | "other"
      specialization_type:
        | "cardiology"
        | "neurology"
        | "orthopedics"
        | "pediatrics"
        | "surgery"
        | "dermatology"
        | "psychiatry"
        | "radiology"
        | "anesthesiology"
        | "emergency_medicine"
        | "internal_medicine"
        | "obstetrics_gynecology"
        | "ophthalmology"
        | "pathology"
        | "urology"
        | "oncology"
        | "gastroenterology"
        | "pulmonology"
        | "nephrology"
        | "endocrinology"
        | "rheumatology"
        | "geriatrics"
        | "sports_medicine"
        | "plastic_surgery"
        | "other"
      user_role: "professional" | "premium" | "deluxe" | "student"
      video_author_type: "founder" | "partner"
    }
    CompositeTypes: {
      attachment_input: {
        file_url: string | null
        file_name: string | null
        file_type: string | null
        file_size_bytes: number | null
      }
      profile_with_status: {
        id: string | null
        full_name: string | null
        profile_picture_url: string | null
        current_position: string | null
        organization: string | null
        specialization_name: string | null
        location_name: string | null
        connection_status:
          | Database["public"]["Enums"]["connection_status_type"]
          | null
        is_viewer_following: boolean | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      application_status_enum: [
        "pending",
        "viewed",
        "in_progress",
        "rejected",
        "hired",
      ],
      collab_type_enum: ["clinical_trial", "research", "advisory", "other"],
      company_manager_role: ["ADMIN", "MEMBER"],
      company_tier_enum: ["standard", "premium", "deluxe", "basic"],
      connection_status: ["pending", "accepted", "blocked", "ignored"],
      connection_status_type: [
        "connected",
        "pending_sent",
        "pending_received",
        "not_connected",
      ],
      experience_level: [
        "fresh",
        "one_to_three",
        "three_to_five",
        "five_to_ten",
        "ten_plus",
      ],
      forum_type: ["PUBLIC", "PRIVATE"],
      job_type: ["full_time", "part_time", "contract", "internship", "locum"],
      link_type_enum: ["product", "social", "url", "linkedin"],
      membership_role: ["ADMIN", "MODERATOR", "MEMBER"],
      membership_status: ["ACTIVE", "PENDING", "BANNED"],
      notification_type: [
        "new_connection_request",
        "connection_accepted",
        "new_thread",
        "new_space",
        "system_update",
        "new_reply",
        "job_application_update",
        "new_public_post_by_followed_user",
        "new_public_space_by_followed_user",
        "new_reply_to_your_message",
        "new_direct_message",
        "new_job_posting",
        "new_collaboration_posting",
        "new_job_applicant",
        "new_collaboration_applicant",
        "space_join_request",
        "new_reaction",
        "new_follower",
        "new_company",
        "new_space_created",
        "new_member_joined",
      ],
      space_join_level: ["OPEN", "INVITE_ONLY"],
      space_type: ["PUBLIC", "COMMUNITY_SPACE", "FORUM"],
      specialization: [
        "general_medicine",
        "cardiology",
        "neurology",
        "orthopedics",
        "pediatrics",
        "gynecology",
        "dermatology",
        "psychiatry",
        "oncology",
        "radiology",
        "anesthesiology",
        "pathology",
        "surgery",
        "emergency_medicine",
        "internal_medicine",
        "family_medicine",
        "ophthalmology",
        "ent",
        "urology",
        "gastroenterology",
        "pulmonology",
        "endocrinology",
        "nephrology",
        "rheumatology",
        "infectious_disease",
        "critical_care",
        "plastic_surgery",
        "neurosurgery",
        "cardiac_surgery",
        "other",
      ],
      specialization_type: [
        "cardiology",
        "neurology",
        "orthopedics",
        "pediatrics",
        "surgery",
        "dermatology",
        "psychiatry",
        "radiology",
        "anesthesiology",
        "emergency_medicine",
        "internal_medicine",
        "obstetrics_gynecology",
        "ophthalmology",
        "pathology",
        "urology",
        "oncology",
        "gastroenterology",
        "pulmonology",
        "nephrology",
        "endocrinology",
        "rheumatology",
        "geriatrics",
        "sports_medicine",
        "plastic_surgery",
        "other",
      ],
      user_role: ["professional", "premium", "deluxe", "student"],
      video_author_type: ["founder", "partner"],
    },
  },
} as const
