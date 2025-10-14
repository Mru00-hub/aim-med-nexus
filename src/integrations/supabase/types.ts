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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      conversation_participants: {
        Row: {
          conversation_id: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          user_id: string
        }
        Update: {
          conversation_id?: string
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
            referencedRelation: "inbox_conversations"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "my_connections"
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
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
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
      direct_message_attachments: {
        Row: {
          created_at: string
          file_name: string | null
          file_size_bytes: number | null
          file_type: string | null
          file_url: string
          id: string
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
            referencedRelation: "inbox_conversations"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "direct_message_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "my_connections"
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
            referencedRelation: "inbox_conversations"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "direct_message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "my_connections"
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
          content: string
          conversation_id: string
          created_at: string
          id: number
          is_edited: boolean
          is_read: boolean
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: number
          is_edited?: boolean
          is_read?: boolean
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: number
          is_edited?: boolean
          is_read?: boolean
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
            referencedRelation: "inbox_conversations"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "my_connections"
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
      institutions: {
        Row: {
          created_at: string | null
          established_year: number | null
          id: string
          location: string | null
          name: string
          value: string | null
        }
        Insert: {
          created_at?: string | null
          established_year?: number | null
          id?: string
          location?: string | null
          name: string
          value?: string | null
        }
        Update: {
          created_at?: string | null
          established_year?: number | null
          id?: string
          location?: string | null
          name?: string
          value?: string | null
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
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "inbox_conversations"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "job_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "my_connections"
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
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "inbox_conversations"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "job_postings_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "my_connections"
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
            referencedRelation: "inbox_conversations"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "my_connections"
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
            referencedRelation: "inbox_conversations"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "message_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "my_connections"
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
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: number
          is_edited: boolean
          parent_message_id: number | null
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
            referencedRelation: "inbox_conversations"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "my_connections"
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
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          entity_id: string | null
          id: string
          is_read: boolean
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          is_read?: boolean
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          is_read?: boolean
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
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
            referencedRelation: "inbox_conversations"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "my_connections"
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
            referencedRelation: "inbox_conversations"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "my_connections"
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
            referencedRelation: "inbox_conversations"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "partners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "my_connections"
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
            referencedRelation: "inbox_conversations"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "payment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "my_connections"
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
          connection_count: number
          course: string | null
          created_at: string | null
          current_location: string | null
          current_position: string | null
          email: string
          full_name: string | null
          id: string
          institution: string | null
          is_onboarded: boolean | null
          is_verified: boolean | null
          medical_license: string | null
          organization: string | null
          phone: string | null
          profile_picture_url: string | null
          resume_url: string | null
          skills: string[] | null
          specialization: string | null
          updated_at: string | null
          user_role: Database["public"]["Enums"]["user_role"] | null
          work_experience: Json | null
          year_of_study: string | null
          years_experience:
            | Database["public"]["Enums"]["experience_level"]
            | null
        }
        Insert: {
          bio?: string | null
          connection_count?: number
          course?: string | null
          created_at?: string | null
          current_location?: string | null
          current_position?: string | null
          email: string
          full_name?: string | null
          id?: string
          institution?: string | null
          is_onboarded?: boolean | null
          is_verified?: boolean | null
          medical_license?: string | null
          organization?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          resume_url?: string | null
          skills?: string[] | null
          specialization?: string | null
          updated_at?: string | null
          user_role?: Database["public"]["Enums"]["user_role"] | null
          work_experience?: Json | null
          year_of_study?: string | null
          years_experience?:
            | Database["public"]["Enums"]["experience_level"]
            | null
        }
        Update: {
          bio?: string | null
          connection_count?: number
          course?: string | null
          created_at?: string | null
          current_location?: string | null
          current_position?: string | null
          email?: string
          full_name?: string | null
          id?: string
          institution?: string | null
          is_onboarded?: boolean | null
          is_verified?: boolean | null
          medical_license?: string | null
          organization?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          resume_url?: string | null
          skills?: string[] | null
          specialization?: string | null
          updated_at?: string | null
          user_role?: Database["public"]["Enums"]["user_role"] | null
          work_experience?: Json | null
          year_of_study?: string | null
          years_experience?:
            | Database["public"]["Enums"]["experience_level"]
            | null
        }
        Relationships: []
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
        }
        Insert: {
          created_at?: string
          creator_id?: string | null
          description?: string | null
          id?: string
          join_level?: Database["public"]["Enums"]["space_join_level"] | null
          name: string
          space_type: Database["public"]["Enums"]["space_type"]
        }
        Update: {
          created_at?: string
          creator_id?: string | null
          description?: string | null
          id?: string
          join_level?: Database["public"]["Enums"]["space_join_level"] | null
          name?: string
          space_type?: Database["public"]["Enums"]["space_type"]
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
            referencedRelation: "inbox_conversations"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "spaces_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "my_connections"
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
            referencedRelation: "inbox_conversations"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "fk_addressee"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "my_connections"
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
            referencedRelation: "inbox_conversations"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "fk_requester"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "my_connections"
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
            referencedRelation: "inbox_conversations"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "user_connections_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "my_connections"
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
            referencedRelation: "inbox_conversations"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "user_connections_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "my_connections"
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
            referencedRelation: "institutions"
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
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_education_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "inbox_conversations"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "user_education_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "my_connections"
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
            referencedRelation: "blocked_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_professional_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "inbox_conversations"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "user_professional_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "my_connections"
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
            referencedRelation: "inbox_conversations"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "user_recommendations_recommended_user_id_fkey"
            columns: ["recommender_id"]
            isOneToOne: false
            referencedRelation: "my_connections"
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
            referencedRelation: "inbox_conversations"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "user_recommendations_recommender_id_fkey"
            columns: ["recommender_id"]
            isOneToOne: false
            referencedRelation: "my_connections"
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
            referencedRelation: "inbox_conversations"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "user_recommendations_user_id_fkey"
            columns: ["recommendee_id"]
            isOneToOne: false
            referencedRelation: "my_connections"
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
            referencedRelation: "inbox_conversations"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "my_connections"
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
      blocked_members: {
        Row: {
          blocked_at: string | null
          full_name: string | null
          id: string | null
          profile_picture_url: string | null
        }
        Relationships: []
      }
      inbox_conversations: {
        Row: {
          conversation_id: string | null
          last_message_at: string | null
          last_message_content: string | null
          participant_avatar_url: string | null
          participant_full_name: string | null
          participant_id: string | null
          unread_count: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      my_connections: {
        Row: {
          course: string | null
          current_location: string | null
          full_name: string | null
          id: string | null
          institution: string | null
          organization: string | null
          profile_picture_url: string | null
        }
        Relationships: []
      }
      pending_connection_requests: {
        Row: {
          course: string | null
          current_location: string | null
          full_name: string | null
          institution: string | null
          organization: string | null
          profile_picture_url: string | null
          request_date: string | null
          requester_id: string | null
        }
        Relationships: [
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
            referencedRelation: "inbox_conversations"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "fk_requester"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "my_connections"
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
            referencedRelation: "inbox_conversations"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "user_connections_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "my_connections"
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
    }
    Functions: {
      block_user: {
        Args: { blocked_user_id: string }
        Returns: undefined
      }
      can_view_thread: {
        Args: { p_thread_id: string }
        Returns: boolean
      }
      create_or_get_conversation: {
        Args: { other_user_id: string }
        Returns: string
      }
      create_thread: {
        Args: {
          p_body: string
          p_description?: string
          p_space_id?: string
          p_title: string
        }
        Returns: string
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
        Returns: {
          full_name: string
          id: string
          profile_picture_url: string
        }[]
      }
      get_pending_requests: {
        Args: { p_space_id: string }
        Returns: {
          full_name: string
          membership_id: string
          profile_picture_url: string
          requested_at: string
          user_id: string
        }[]
      }
      get_public_space_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_space_id_for_thread: {
        Args: { thread_id_to_check: string }
        Returns: string
      }
      get_spaces_with_details: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          creator_full_name: string
          creator_id: string
          description: string
          id: string
          join_level: Database["public"]["Enums"]["space_join_level"]
          moderators: Json
          name: string
          space_type: Database["public"]["Enums"]["space_type"]
        }[]
      }
      get_threads: {
        Args: { p_space_id?: string }
        Returns: {
          created_at: string
          creator_email: string
          creator_id: string
          id: string
          last_activity_at: string
          message_count: number
          title: string
        }[]
      }
      get_user_recommendations: {
        Args: { target_user_id: string }
        Returns: {
          course: string
          current_location: string
          full_name: string
          id: string
          institution: string
          organization: string
          similarity_score: number
          specialization: string
          years_experience: string
        }[]
      }
      increment_global_counter: {
        Args: { counter_name_param: string }
        Returns: number
      }
      is_space_member: {
        Args: { space_id_to_check: string }
        Returns: boolean
      }
      is_space_moderator_or_admin: {
        Args: { p_space_id: string; p_user_id: string }
        Returns: boolean
      }
      is_thread_creator: {
        Args: { thread_id_to_check: string }
        Returns: boolean
      }
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
      }
      mark_conversation_as_read: {
        Args: { p_conversation_id: string }
        Returns: undefined
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
          thread_id: string
          updated_at: string
          user_id: string
        }[]
      }
      remove_connection: {
        Args: { user_to_remove_id: string }
        Returns: undefined
      }
      request_to_join_space: {
        Args: { p_space_id: string }
        Returns: string
      }
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
      toggle_reaction_dm: {
        Args: { p_emoji: string; p_message_id: number }
        Returns: Json
      }
      unblock_user: {
        Args: { unblocked_user_id: string }
        Returns: undefined
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
      }
    }
    Enums: {
      connection_status: "pending" | "accepted" | "blocked" | "ignored"
      experience_level:
        | "fresh"
        | "one_to_three"
        | "three_to_five"
        | "five_to_ten"
        | "ten_plus"
      forum_type: "PUBLIC" | "PRIVATE"
      job_type: "full_time" | "part_time" | "contract" | "internship" | "locum"
      membership_role: "ADMIN" | "MODERATOR" | "MEMBER"
      membership_status: "ACTIVE" | "PENDING" | "BANNED"
      notification_type: "new_connection_request" | "connection_accepted"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      connection_status: ["pending", "accepted", "blocked", "ignored"],
      experience_level: [
        "fresh",
        "one_to_three",
        "three_to_five",
        "five_to_ten",
        "ten_plus",
      ],
      forum_type: ["PUBLIC", "PRIVATE"],
      job_type: ["full_time", "part_time", "contract", "internship", "locum"],
      membership_role: ["ADMIN", "MODERATOR", "MEMBER"],
      membership_status: ["ACTIVE", "PENDING", "BANNED"],
      notification_type: ["new_connection_request", "connection_accepted"],
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
    },
  },
} as const
