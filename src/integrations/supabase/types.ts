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
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          file_url: string | null
          id: string
          is_edited: boolean | null
          message_type: string | null
          room_id: string | null
          sender_id: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          file_url?: string | null
          id?: string
          is_edited?: boolean | null
          message_type?: string | null
          room_id?: string | null
          sender_id?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          file_url?: string | null
          id?: string
          is_edited?: boolean | null
          message_type?: string | null
          room_id?: string | null
          sender_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          id: string
          joined_at: string | null
          last_read_at: string | null
          room_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          room_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          room_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_group: boolean | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_group?: boolean | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_group?: boolean | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses_programs: {
        Row: {
          created_at: string | null
          degree_type: string | null
          duration_years: number | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          degree_type?: string | null
          duration_years?: number | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          degree_type?: string | null
          duration_years?: number | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      email_notifications: {
        Row: {
          content: string
          id: string
          metadata: Json | null
          sent_at: string | null
          status: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          content: string
          id?: string
          metadata?: Json | null
          sent_at?: string | null
          status?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          content?: string
          id?: string
          metadata?: Json | null
          sent_at?: string | null
          status?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      forum_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      forum_posts: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          parent_post_id: string | null
          thread_id: string | null
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          parent_post_id?: string | null
          thread_id?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          parent_post_id?: string | null
          thread_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_parent_post_id_fkey"
            columns: ["parent_post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_threads: {
        Row: {
          category_id: string | null
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_locked: boolean | null
          is_pinned: boolean | null
          last_activity_at: string | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          category_id?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          last_activity_at?: string | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          category_id?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          last_activity_at?: string | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_threads_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_threads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      job_applications: {
        Row: {
          applicant_id: string | null
          applied_at: string | null
          cover_letter: string | null
          id: string
          job_id: string | null
          resume_url: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          applicant_id?: string | null
          applied_at?: string | null
          cover_letter?: string | null
          id?: string
          job_id?: string | null
          resume_url?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          applicant_id?: string | null
          applied_at?: string | null
          cover_letter?: string | null
          id?: string
          job_id?: string | null
          resume_url?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_colleges: {
        Row: {
          created_at: string | null
          established_year: number | null
          id: string
          location: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          established_year?: number | null
          id?: string
          location?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          established_year?: number | null
          id?: string
          location?: string | null
          name?: string
        }
        Relationships: []
      }
      message_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          message_id: number
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          message_id: number
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          message_id?: number
          uploaded_by?: string | null
        }
        Relationships: []
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
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string | null
          id: number
          is_read: boolean | null
          sender_id: string
          thread_id: number
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: never
          is_read?: boolean | null
          sender_id: string
          thread_id: number
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: never
          is_read?: boolean | null
          sender_id?: string
          thread_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          connection_requests: boolean | null
          created_at: string | null
          email_enabled: boolean | null
          forum_updates: boolean | null
          id: string
          job_alerts: boolean | null
          message_notifications: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          connection_requests?: boolean | null
          created_at?: string | null
          email_enabled?: boolean | null
          forum_updates?: boolean | null
          id?: string
          job_alerts?: boolean | null
          message_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          connection_requests?: boolean | null
          created_at?: string | null
          email_enabled?: boolean | null
          forum_updates?: boolean | null
          id?: string
          job_alerts?: boolean | null
          message_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          current_location: string | null
          email: string
          full_name: string
          id: string
          is_verified: boolean | null
          phone: string | null
          profile_picture_url: string | null
          updated_at: string | null
          user_role: Database["public"]["Enums"]["user_role"] | null
          years_experience:
            | Database["public"]["Enums"]["experience_level"]
            | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          current_location?: string | null
          email: string
          full_name: string
          id?: string
          is_verified?: boolean | null
          phone?: string | null
          profile_picture_url?: string | null
          updated_at?: string | null
          user_role?: Database["public"]["Enums"]["user_role"] | null
          years_experience?:
            | Database["public"]["Enums"]["experience_level"]
            | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          current_location?: string | null
          email?: string
          full_name?: string
          id?: string
          is_verified?: boolean | null
          phone?: string | null
          profile_picture_url?: string | null
          updated_at?: string | null
          user_role?: Database["public"]["Enums"]["user_role"] | null
          years_experience?:
            | Database["public"]["Enums"]["experience_level"]
            | null
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
      thread_participants: {
        Row: {
          id: number
          joined_at: string | null
          role: string | null
          thread_id: number
          user_id: string
        }
        Insert: {
          id?: never
          joined_at?: string | null
          role?: string | null
          thread_id: number
          user_id: string
        }
        Update: {
          id?: never
          joined_at?: string | null
          role?: string | null
          thread_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_participants_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          created_at: string | null
          created_by: string
          id: number
          title: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: never
          title?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: never
          title?: string | null
        }
        Relationships: []
      }
      user_connections: {
        Row: {
          addressee_id: string | null
          created_at: string | null
          id: string
          requester_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          addressee_id?: string | null
          created_at?: string | null
          id?: string
          requester_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          addressee_id?: string | null
          created_at?: string | null
          id?: string
          requester_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
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
            foreignKeyName: "user_education_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "medical_colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_education_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses_programs"
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
          recommended_user_id: string | null
          score: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          reason?: string | null
          recommended_user_id?: string | null
          score?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          reason?: string | null
          recommended_user_id?: string | null
          score?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_recommendations_recommended_user_id_fkey"
            columns: ["recommended_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_recommendations_user_id_fkey"
            columns: ["user_id"]
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_user_connection: {
        Args: { addressee_id: string; requester_id: string }
        Returns: Json
      }
      get_job_recommendations: {
        Args: { target_user_id: string }
        Returns: {
          company_name: string
          experience_required: string
          job_id: string
          job_type: Database["public"]["Enums"]["job_type"]
          location: string
          match_score: number
          specialization_required: string
          title: string
        }[]
      }
      get_user_recommendations: {
        Args: { target_user_id: string }
        Returns: {
          current_location: string
          full_name: string
          similarity_score: number
          specialization: string
          user_id: string
          years_experience: string
        }[]
      }
      increment_global_counter: {
        Args: { counter_name_param: string }
        Returns: number
      }
    }
    Enums: {
      experience_level: "fresh" | "1-3" | "3-5" | "5-10" | "10+"
      job_type: "full_time" | "part_time" | "contract" | "internship" | "locum"
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
      user_role: "professional" | "premium" | "deluxe"
    }
    CompositeTypes: {
      [_ in never]: never
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
      experience_level: ["fresh", "1-3", "3-5", "5-10", "10+"],
      job_type: ["full_time", "part_time", "contract", "internship", "locum"],
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
      user_role: ["professional", "premium", "deluxe"],
    },
  },
} as const
