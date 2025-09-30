


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "website_admin";


ALTER SCHEMA "website_admin" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."experience_level" AS ENUM (
    'fresh',
    '1-3',
    '3-5',
    '5-10',
    '10+'
);


ALTER TYPE "public"."experience_level" OWNER TO "postgres";


CREATE TYPE "public"."job_type" AS ENUM (
    'full_time',
    'part_time',
    'contract',
    'internship',
    'locum'
);


ALTER TYPE "public"."job_type" OWNER TO "postgres";


CREATE TYPE "public"."member_role" AS ENUM (
    'admin',
    'moderator',
    'member'
);


ALTER TYPE "public"."member_role" OWNER TO "postgres";


CREATE TYPE "public"."space_type" AS ENUM (
    'FORUM',
    'COMMUNITY_SPACE',
    'PUBLIC'
);


ALTER TYPE "public"."space_type" OWNER TO "postgres";


CREATE TYPE "public"."specialization" AS ENUM (
    'general_medicine',
    'cardiology',
    'neurology',
    'orthopedics',
    'pediatrics',
    'gynecology',
    'dermatology',
    'psychiatry',
    'oncology',
    'radiology',
    'anesthesiology',
    'pathology',
    'surgery',
    'emergency_medicine',
    'internal_medicine',
    'family_medicine',
    'ophthalmology',
    'ent',
    'urology',
    'gastroenterology',
    'pulmonology',
    'endocrinology',
    'nephrology',
    'rheumatology',
    'infectious_disease',
    'critical_care',
    'plastic_surgery',
    'neurosurgery',
    'cardiac_surgery',
    'other'
);


ALTER TYPE "public"."specialization" OWNER TO "postgres";


CREATE TYPE "public"."specialization_type" AS ENUM (
    'cardiology',
    'neurology',
    'orthopedics',
    'pediatrics',
    'surgery',
    'dermatology',
    'psychiatry',
    'radiology',
    'anesthesiology',
    'emergency_medicine',
    'internal_medicine',
    'obstetrics_gynecology',
    'ophthalmology',
    'pathology',
    'urology',
    'oncology',
    'gastroenterology',
    'pulmonology',
    'nephrology',
    'endocrinology',
    'rheumatology',
    'geriatrics',
    'sports_medicine',
    'plastic_surgery',
    'other'
);


ALTER TYPE "public"."specialization_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'professional',
    'premium',
    'deluxe'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification_preferences"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_notification_preferences"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_thread"("p_title" "text", "p_body" "text", "p_space_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_new_thread_id UUID;
BEGIN
    -- The RLS policy on the 'threads' table already checks if the user is an
    -- approved member of the container space, so we don't need to re-check here.
    -- The INSERT will fail automatically if they don't have permission.

    -- Step 1: Insert the new thread and capture its generated ID.
    INSERT INTO public.threads (creator_id, title, space_id)
    VALUES (auth.uid(), p_title, p_space_id)
    RETURNING id INTO v_new_thread_id;

    -- Step 2: Insert the initial message for this new thread.
    -- The RLS policy on 'messages' will also succeed because it checks
    -- permissions on the parent thread, which we just created.
    IF p_body IS NOT NULL AND char_length(p_body) > 0 THEN
        INSERT INTO public.messages (user_id, thread_id, body)
        VALUES (auth.uid(), v_new_thread_id, p_body);
    END IF;

    -- Return the ID of the newly created thread.
    RETURN v_new_thread_id;
END;
$$;


ALTER FUNCTION "public"."create_thread"("p_title" "text", "p_body" "text", "p_space_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_user_connection"("requester_id" "uuid", "addressee_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
  result JSON;
BEGIN
  -- Check if connection already exists
  IF EXISTS (
    SELECT 1 FROM user_connections 
    WHERE (requester_id = $1 AND addressee_id = $2) 
       OR (requester_id = $2 AND addressee_id = $1)
  ) THEN
    result := json_build_object('error', 'Connection already exists');
    RETURN result;
  END IF;
  
  -- Insert new connection request
  INSERT INTO user_connections (requester_id, addressee_id, status)
  VALUES ($1, $2, 'pending');
  
  result := json_build_object('success', true, 'message', 'Connection request sent');
  RETURN result;
END;
$_$;


ALTER FUNCTION "public"."create_user_connection"("requester_id" "uuid", "addressee_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_job_recommendations"("target_user_id" "uuid") RETURNS TABLE("job_id" "uuid", "title" "text", "company_name" "text", "location" "text", "job_type" "public"."job_type", "specialization_required" "text", "experience_required" "text", "match_score" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    WITH user_profile AS (
        SELECT 
            p.current_location,
            upd.specialization,
            upd.years_experience,
            upd.skills
        FROM profiles p
        LEFT JOIN user_professional_details upd ON p.id = upd.user_id
        WHERE p.id = target_user_id
    )
    SELECT 
        jp.id,
        jp.title,
        jp.company_name,
        jp.location,
        jp.job_type,
        jp.specialization_required::TEXT,
        jp.experience_required::TEXT,
        (
            CASE WHEN jp.location = up.current_location THEN 40 ELSE 0 END +
            CASE WHEN jp.specialization_required = up.specialization THEN 35 ELSE 0 END +
            CASE WHEN jp.experience_required = up.years_experience THEN 25 ELSE 0 END
        )::NUMERIC as match_score
    FROM job_postings jp, user_profile up
    WHERE jp.is_active = true
    AND jp.id NOT IN (
        SELECT job_id FROM job_applications WHERE applicant_id = target_user_id
    )
    AND (
        jp.location = up.current_location OR
        jp.specialization_required = up.specialization OR
        jp.experience_required = up.years_experience
    )
    ORDER BY match_score DESC
    LIMIT 10;
END;
$$;


ALTER FUNCTION "public"."get_job_recommendations"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_recommendations"("target_user_id" "uuid") RETURNS TABLE("user_id" "uuid", "full_name" "text", "current_location" "text", "specialization" "text", "years_experience" "text", "similarity_score" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    WITH target_user AS (
        SELECT 
            p.current_location as user_location,
            upd.specialization as user_spec,
            upd.years_experience as user_exp,
            upd.skills as user_skills
        FROM profiles p
        LEFT JOIN user_professional_details upd ON p.id = upd.user_id
        WHERE p.id = target_user_id
    ),
    candidate_users AS (
        SELECT 
            p.id,
            p.full_name,
            p.current_location,
            upd.specialization::TEXT,
            upd.years_experience::TEXT,
            upd.skills,
            target_user.user_location,
            target_user.user_spec,
            target_user.user_exp,
            target_user.user_skills
        FROM profiles p
        LEFT JOIN user_professional_details upd ON p.id = upd.user_id,
        target_user
        WHERE p.id != target_user_id
        AND p.id NOT IN (
            SELECT CASE 
                WHEN requester_id = target_user_id THEN addressee_id
                ELSE requester_id
            END
            FROM user_connections 
            WHERE (requester_id = target_user_id OR addressee_id = target_user_id)
            AND status = 'accepted'
        )
    )
    SELECT 
        cu.id,
        cu.full_name,
        cu.current_location,
        cu.specialization,
        cu.years_experience,
        (
            CASE WHEN cu.current_location = cu.user_location THEN 30 ELSE 0 END +
            CASE WHEN cu.specialization = cu.user_spec::TEXT THEN 25 ELSE 0 END +
            CASE WHEN cu.years_experience = cu.user_exp::TEXT THEN 20 ELSE 0 END +
            CASE WHEN cu.skills && cu.user_skills THEN 25 ELSE 0 END
        )::NUMERIC as similarity_score
    FROM candidate_users cu
    WHERE (
        cu.current_location = cu.user_location OR
        cu.specialization = cu.user_spec::TEXT OR
        cu.years_experience = cu.user_exp::TEXT OR
        cu.skills && cu.user_skills
    )
    ORDER BY similarity_score DESC
    LIMIT 10;
END;
$$;


ALTER FUNCTION "public"."get_user_recommendations"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name)
    VALUES (
        NEW.id, 
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_global_counter"("counter_name_param" "text") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  new_count bigint;
BEGIN
  UPDATE public.global_engagement 
  SET counter_value = counter_value + 1,
      updated_at = now()
  WHERE counter_name = counter_name_param
  RETURNING counter_value INTO new_count;
  
  RETURN COALESCE(new_count, 0);
END;
$$;


ALTER FUNCTION "public"."increment_global_counter"("counter_name_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."join_public_forum"("p_space_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_membership_id UUID;
BEGIN
    -- First, verify the forum is actually public to prevent misuse
    IF NOT EXISTS (SELECT 1 FROM public.forums WHERE id = p_space_id AND type = 'FORUM' AND forum_type = 'PUBLIC') THEN
        RAISE EXCEPTION 'Forum is not public or does not exist.';
    END IF;

    -- Insert the user into the memberships table with 'APPROVED' status.
    -- If they already have a record (e.g., were previously denied or pending),
    -- this will update their status to 'APPROVED'.
    INSERT INTO public.memberships (user_id, space_id, space_type, status, role)
    VALUES (auth.uid(), p_space_id, 'FORUM', 'APPROVED', 'MEMBER')
    ON CONFLICT (user_id, space_id)
    DO UPDATE SET
        status = 'APPROVED',
        role = 'MEMBER'
    RETURNING id INTO v_membership_id;

    RETURN v_membership_id;
END;
$$;


ALTER FUNCTION "public"."join_public_forum"("p_space_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."request_to_join_space"("p_space_id" "uuid", "p_space_type" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_membership_id UUID;
BEGIN
    -- Insert the user with a 'PENDING' status.
    -- ON CONFLICT DO NOTHING prevents creating duplicate pending requests.
    INSERT INTO public.memberships (user_id, space_id, space_type, status, role)
    VALUES (auth.uid(), p_space_id, 'PENDING', 'MEMBER')
    ON CONFLICT (user_id, space_id)
    DO NOTHING;

    -- If the insert was skipped (due to conflict), v_membership_id will be NULL.
    -- We can select the existing ID to return a consistent value.
    SELECT id INTO v_membership_id
    FROM public.memberships
    WHERE user_id = auth.uid()
        AND space_id = p_space_id;

    RETURN v_membership_id;
END;
$$;


ALTER FUNCTION "public"."request_to_join_space"("p_space_id" "uuid", "p_space_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."category_members" (
    "id" bigint NOT NULL,
    "category_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."member_role" DEFAULT 'member'::"public"."member_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."category_members" OWNER TO "postgres";


COMMENT ON TABLE "public"."category_members" IS 'Tracks user membership and roles within each forum category.';



ALTER TABLE "public"."category_members" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."category_members_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "room_id" "uuid",
    "sender_id" "uuid",
    "content" "text" NOT NULL,
    "message_type" "text" DEFAULT 'text'::"text",
    "file_url" "text",
    "is_edited" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chat_messages_message_type_check" CHECK (("message_type" = ANY (ARRAY['text'::"text", 'image'::"text", 'file'::"text"])))
);


ALTER TABLE "public"."chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "room_id" "uuid",
    "user_id" "uuid",
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "last_read_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chat_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_rooms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "is_group" boolean DEFAULT false,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chat_rooms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."courses_programs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "duration_years" integer,
    "degree_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."courses_programs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'pending'::"text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "email_notifications_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."email_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."forum_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon_name" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "type" "public"."space_type"
);


ALTER TABLE "public"."forum_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."forum_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "thread_id" "uuid",
    "author_id" "uuid",
    "content" "text" NOT NULL,
    "parent_post_id" "uuid",
    "is_deleted" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."forum_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."forum_threads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "is_pinned" boolean DEFAULT false,
    "is_locked" boolean DEFAULT false,
    "view_count" integer DEFAULT 0,
    "last_activity_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."forum_threads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."global_engagement" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "counter_name" "text" NOT NULL,
    "counter_value" bigint DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."global_engagement" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid",
    "applicant_id" "uuid",
    "cover_letter" "text",
    "resume_url" "text",
    "status" "text" DEFAULT 'applied'::"text",
    "applied_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "job_applications_status_check" CHECK (("status" = ANY (ARRAY['applied'::"text", 'reviewed'::"text", 'shortlisted'::"text", 'rejected'::"text", 'accepted'::"text"])))
);


ALTER TABLE "public"."job_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."job_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_postings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "posted_by" "uuid",
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "company_name" "text" NOT NULL,
    "location" "text" NOT NULL,
    "job_type" "public"."job_type" DEFAULT 'full_time'::"public"."job_type",
    "experience_required" "public"."experience_level",
    "specialization_required" "public"."specialization_type",
    "salary_range" "text",
    "requirements" "text"[],
    "benefits" "text"[],
    "application_deadline" "date",
    "is_active" boolean DEFAULT true,
    "category_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."job_postings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."medical_colleges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "location" "text",
    "established_year" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."medical_colleges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message_id" bigint NOT NULL,
    "file_url" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "file_size" integer,
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."message_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_reactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message_id" bigint NOT NULL,
    "user_id" "uuid",
    "reaction_emoji" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."message_reactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" bigint NOT NULL,
    "thread_id" bigint NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_read" boolean DEFAULT false
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


ALTER TABLE "public"."messages" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."messages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."notification_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email_enabled" boolean DEFAULT true,
    "connection_requests" boolean DEFAULT true,
    "job_alerts" boolean DEFAULT true,
    "forum_updates" boolean DEFAULT true,
    "message_notifications" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notification_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partner_services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "partner_id" "uuid",
    "service_name" "text" NOT NULL,
    "description" "text",
    "regular_price" numeric(10,2),
    "premium_discount" numeric(5,2),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."partner_services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "logo_url" "text",
    "website_url" "text",
    "contact_email" "text",
    "partner_type" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "tenant_id" "uuid",
    CONSTRAINT "partners_partner_type_check" CHECK (("partner_type" = ANY (ARRAY['medical_association'::"text", 'club'::"text", 'conference'::"text", 'cme_provider'::"text", 'technology'::"text", 'service'::"text"])))
);


ALTER TABLE "public"."partners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "subscription_id" "uuid",
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'INR'::"text",
    "payment_gateway" "text" DEFAULT 'razorpay'::"text",
    "transaction_id" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payment_transactions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text", 'refunded'::"text"])))
);


ALTER TABLE "public"."payment_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "phone" "text",
    "user_role" "public"."user_role" DEFAULT 'professional'::"public"."user_role",
    "current_location" "text",
    "profile_picture_url" "text",
    "bio" "text",
    "years_experience" "public"."experience_level",
    "is_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "duration_months" integer NOT NULL,
    "features" "text"[],
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subscription_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."thread_participants" (
    "id" bigint NOT NULL,
    "thread_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text",
    "joined_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."thread_participants" OWNER TO "postgres";


ALTER TABLE "public"."thread_participants" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."thread_participants_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."threads" (
    "id" bigint NOT NULL,
    "title" "text",
    "creator_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."threads" OWNER TO "postgres";


ALTER TABLE "public"."threads" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."threads_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "requester_id" "uuid",
    "addressee_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_connections_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'declined'::"text"])))
);


ALTER TABLE "public"."user_connections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_education" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "college_id" "uuid",
    "course_id" "uuid",
    "graduation_year" integer,
    "percentage_or_cgpa" numeric(4,2),
    "other_college_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_education" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_professional_details" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "specialization" "public"."specialization_type",
    "other_specialization" "text",
    "current_workplace" "text",
    "job_title" "text",
    "license_number" "text",
    "registration_council" "text",
    "skills" "text"[],
    "certifications" "text"[],
    "languages" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_professional_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_recommendations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "recommended_user_id" "uuid",
    "score" numeric(3,2),
    "reason" "text",
    "is_dismissed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_recommendations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "plan_id" "uuid",
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "is_active" boolean DEFAULT true,
    "payment_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "website_admin"."admins" (
    "admin_id" bigint NOT NULL,
    "email" "text"
);


ALTER TABLE "website_admin"."admins" OWNER TO "postgres";


ALTER TABLE "website_admin"."admins" ALTER COLUMN "admin_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "website_admin"."admins_admin_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."category_members"
    ADD CONSTRAINT "category_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_participants"
    ADD CONSTRAINT "chat_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_participants"
    ADD CONSTRAINT "chat_participants_room_id_user_id_key" UNIQUE ("room_id", "user_id");



ALTER TABLE ONLY "public"."chat_rooms"
    ADD CONSTRAINT "chat_rooms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."courses_programs"
    ADD CONSTRAINT "courses_programs_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."courses_programs"
    ADD CONSTRAINT "courses_programs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_notifications"
    ADD CONSTRAINT "email_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."forum_categories"
    ADD CONSTRAINT "forum_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."forum_categories"
    ADD CONSTRAINT "forum_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."forum_posts"
    ADD CONSTRAINT "forum_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."forum_threads"
    ADD CONSTRAINT "forum_threads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."global_engagement"
    ADD CONSTRAINT "global_engagement_counter_name_key" UNIQUE ("counter_name");



ALTER TABLE ONLY "public"."global_engagement"
    ADD CONSTRAINT "global_engagement_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_applications"
    ADD CONSTRAINT "job_applications_job_id_applicant_id_key" UNIQUE ("job_id", "applicant_id");



ALTER TABLE ONLY "public"."job_applications"
    ADD CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_categories"
    ADD CONSTRAINT "job_categories_ame_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."job_categories"
    ADD CONSTRAINT "job_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_postings"
    ADD CONSTRAINT "job_postings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."medical_colleges"
    ADD CONSTRAINT "medical_colleges_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."medical_colleges"
    ADD CONSTRAINT "medical_colleges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_attachments"
    ADD CONSTRAINT "message_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_reactions"
    ADD CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."partner_services"
    ADD CONSTRAINT "partner_services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partners"
    ADD CONSTRAINT "partners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_transaction_id_key" UNIQUE ("transaction_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."thread_participants"
    ADD CONSTRAINT "thread_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."thread_participants"
    ADD CONSTRAINT "thread_participants_thread_id_user_id_key" UNIQUE ("thread_id", "user_id");



ALTER TABLE ONLY "public"."threads"
    ADD CONSTRAINT "threads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."category_members"
    ADD CONSTRAINT "unique_user_per_category" UNIQUE ("user_id", "category_id");



ALTER TABLE ONLY "public"."user_connections"
    ADD CONSTRAINT "user_connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_connections"
    ADD CONSTRAINT "user_connections_requester_id_addressee_id_key" UNIQUE ("requester_id", "addressee_id");



ALTER TABLE ONLY "public"."user_education"
    ADD CONSTRAINT "user_education_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_professional_details"
    ADD CONSTRAINT "user_professional_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_recommendations"
    ADD CONSTRAINT "user_recommendations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_recommendations"
    ADD CONSTRAINT "user_recommendations_user_id_recommended_user_id_key" UNIQUE ("user_id", "recommended_user_id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "website_admin"."admins"
    ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("admin_id");



CREATE INDEX "idx_chat_messages_sender_id" ON "public"."chat_messages" USING "btree" ("sender_id");



CREATE INDEX "idx_chat_participants_user_id" ON "public"."chat_participants" USING "btree" ("user_id");



CREATE INDEX "idx_courses_programs_created_by" ON "public"."courses_programs" USING "btree" ("id");



CREATE INDEX "idx_forum_posts_author_id" ON "public"."forum_posts" USING "btree" ("author_id");



CREATE INDEX "idx_forum_threads_created_by" ON "public"."forum_threads" USING "btree" ("created_by");



CREATE INDEX "idx_forums_categories_owner_id" ON "public"."forum_categories" USING "btree" ("id");



CREATE INDEX "idx_job_applications_applicant_id" ON "public"."job_applications" USING "btree" ("applicant_id");



CREATE INDEX "idx_job_categories_user_id" ON "public"."job_categories" USING "btree" ("id");



CREATE INDEX "idx_job_postings_posted_by" ON "public"."job_postings" USING "btree" ("posted_by");



CREATE INDEX "idx_medical_colleges_admin_id" ON "public"."medical_colleges" USING "btree" ("id");



CREATE INDEX "idx_messages_is_read" ON "public"."messages" USING "btree" ("is_read");



CREATE INDEX "idx_messages_sender_id" ON "public"."messages" USING "btree" ("sender_id");



CREATE INDEX "idx_messages_thread_id" ON "public"."messages" USING "btree" ("thread_id");



CREATE INDEX "idx_partners_tenant_id" ON "public"."partners" USING "btree" ("tenant_id");



CREATE INDEX "idx_partners_user_id" ON "public"."partners" USING "btree" ("user_id");



CREATE INDEX "idx_payment_transactions_user_id" ON "public"."payment_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_subscription_plans_owner_user_id" ON "public"."subscription_plans" USING "btree" ("id");



CREATE INDEX "idx_thread_participants_thread_id" ON "public"."thread_participants" USING "btree" ("thread_id");



CREATE INDEX "idx_thread_participants_user_id" ON "public"."thread_participants" USING "btree" ("user_id");



CREATE INDEX "idx_threads_created_by" ON "public"."threads" USING "btree" ("creator_id");



CREATE INDEX "idx_user_connections_addressee_id" ON "public"."user_connections" USING "btree" ("addressee_id");



CREATE INDEX "idx_user_connections_requester_id" ON "public"."user_connections" USING "btree" ("requester_id");



CREATE INDEX "idx_user_education_user_id" ON "public"."user_education" USING "btree" ("user_id");



CREATE INDEX "idx_user_professional_user_id" ON "public"."user_professional_details" USING "btree" ("user_id");



CREATE INDEX "idx_user_recommendations_user_id" ON "public"."user_recommendations" USING "btree" ("user_id");



CREATE INDEX "idx_user_subscriptions_user_id" ON "public"."user_subscriptions" USING "btree" ("user_id");



CREATE UNIQUE INDEX "unique_public_category_idx" ON "public"."forum_categories" USING "btree" ("type") WHERE ("type" = 'PUBLIC'::"public"."space_type");



CREATE INDEX "idx_website_admin_admin_id" ON "website_admin"."admins" USING "btree" ("admin_id");



CREATE INDEX "idx_website_admin_email" ON "website_admin"."admins" USING "btree" ("email");



CREATE OR REPLACE TRIGGER "set_updated_at_chat_messages" BEFORE INSERT OR UPDATE ON "public"."chat_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_chat_rooms" BEFORE INSERT OR UPDATE ON "public"."chat_rooms" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_forum_posts" BEFORE INSERT OR UPDATE ON "public"."forum_posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_forum_threads" BEFORE INSERT OR UPDATE ON "public"."forum_threads" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_job_applications" BEFORE INSERT OR UPDATE ON "public"."job_applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_job_postings" BEFORE INSERT OR UPDATE ON "public"."job_postings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_payment_transactions" BEFORE INSERT OR UPDATE ON "public"."payment_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_profiles" BEFORE INSERT OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_user_connections" BEFORE INSERT OR UPDATE ON "public"."user_connections" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_user_professional_details" BEFORE INSERT OR UPDATE ON "public"."user_professional_details" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at_user_subscriptions" BEFORE INSERT OR UPDATE ON "public"."user_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_chat_messages_updated_at" BEFORE UPDATE ON "public"."chat_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_chat_rooms_updated_at" BEFORE UPDATE ON "public"."chat_rooms" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_forum_posts_updated_at" BEFORE UPDATE ON "public"."forum_posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_forum_threads_updated_at" BEFORE UPDATE ON "public"."forum_threads" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_global_engagement_updated_at" BEFORE UPDATE ON "public"."global_engagement" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_job_applications_updated_at" BEFORE UPDATE ON "public"."job_applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_job_postings_updated_at" BEFORE UPDATE ON "public"."job_postings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_connections_updated_at" BEFORE UPDATE ON "public"."user_connections" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_professional_details_updated_at" BEFORE UPDATE ON "public"."user_professional_details" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."category_members"
    ADD CONSTRAINT "category_members_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."forum_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."category_members"
    ADD CONSTRAINT "category_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_participants"
    ADD CONSTRAINT "chat_participants_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_participants"
    ADD CONSTRAINT "chat_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_rooms"
    ADD CONSTRAINT "chat_rooms_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."email_notifications"
    ADD CONSTRAINT "email_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."forum_posts"
    ADD CONSTRAINT "forum_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."forum_posts"
    ADD CONSTRAINT "forum_posts_parent_post_id_fkey" FOREIGN KEY ("parent_post_id") REFERENCES "public"."forum_posts"("id");



ALTER TABLE ONLY "public"."forum_posts"
    ADD CONSTRAINT "forum_posts_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."forum_threads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."forum_threads"
    ADD CONSTRAINT "forum_threads_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."forum_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."forum_threads"
    ADD CONSTRAINT "forum_threads_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_applications"
    ADD CONSTRAINT "job_applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_applications"
    ADD CONSTRAINT "job_applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_postings"
    ADD CONSTRAINT "job_postings_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."job_categories"("id");



ALTER TABLE ONLY "public"."job_postings"
    ADD CONSTRAINT "job_postings_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."partner_services"
    ADD CONSTRAINT "partner_services_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."partners"
    ADD CONSTRAINT "partners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id");



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."thread_participants"
    ADD CONSTRAINT "thread_participants_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."thread_participants"
    ADD CONSTRAINT "thread_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."threads"
    ADD CONSTRAINT "threads_created_by_fkey" FOREIGN KEY ("creator_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_connections"
    ADD CONSTRAINT "user_connections_addressee_id_fkey" FOREIGN KEY ("addressee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_connections"
    ADD CONSTRAINT "user_connections_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_education"
    ADD CONSTRAINT "user_education_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."medical_colleges"("id");



ALTER TABLE ONLY "public"."user_education"
    ADD CONSTRAINT "user_education_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses_programs"("id");



ALTER TABLE ONLY "public"."user_education"
    ADD CONSTRAINT "user_education_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_professional_details"
    ADD CONSTRAINT "user_professional_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_recommendations"
    ADD CONSTRAINT "user_recommendations_recommended_user_id_fkey" FOREIGN KEY ("recommended_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_recommendations"
    ADD CONSTRAINT "user_recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Allow authors to delete their own posts" ON "public"."forum_posts" FOR DELETE TO "authenticated" USING (("author_id" = "auth"."uid"()));



CREATE POLICY "Allow authors to delete their own threads" ON "public"."forum_threads" FOR DELETE TO "authenticated" USING (("created_by" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Allow authors to update their own posts" ON "public"."forum_posts" FOR UPDATE TO "authenticated" USING (("author_id" = "auth"."uid"())) WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "Allow authors to update their own threads" ON "public"."forum_threads" FOR UPDATE TO "authenticated" USING (("created_by" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Allow delete for owner" ON "public"."courses_programs" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Allow delete for owner" ON "public"."forum_categories" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Allow delete for owner" ON "public"."job_categories" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Allow delete for owner" ON "public"."medical_colleges" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Allow delete for owner" ON "public"."subscription_plans" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Allow delete for owner" ON "public"."thread_participants" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Allow insert for owner" ON "public"."courses_programs" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Allow insert for owner" ON "public"."forum_categories" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Allow insert for owner" ON "public"."job_categories" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Allow insert for owner" ON "public"."medical_colleges" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Allow insert for owner" ON "public"."subscription_plans" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Allow insert for owner" ON "public"."thread_participants" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Allow members to create threads" ON "public"."forum_threads" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."forum_categories"
  WHERE (("forum_categories"."id" = "forum_threads"."category_id") AND ("forum_categories"."type" = 'PUBLIC'::"public"."space_type")))) OR (EXISTS ( SELECT 1
   FROM "public"."category_members"
  WHERE (("category_members"."category_id" = "forum_threads"."category_id") AND ("category_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Allow read access to posts in visible threads" ON "public"."forum_posts" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."forum_threads"
  WHERE ("forum_threads"."id" = "forum_posts"."thread_id"))));



CREATE POLICY "Allow read access to public and member threads" ON "public"."forum_threads" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."forum_categories"
  WHERE (("forum_categories"."id" = "forum_threads"."category_id") AND ("forum_categories"."type" = 'PUBLIC'::"public"."space_type")))) OR (EXISTS ( SELECT 1
   FROM "public"."category_members"
  WHERE (("category_members"."category_id" = "forum_threads"."category_id") AND ("category_members"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Allow select for owner" ON "public"."courses_programs" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Allow select for owner" ON "public"."forum_categories" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Allow select for owner" ON "public"."job_categories" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Allow select for owner" ON "public"."medical_colleges" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Allow select for owner" ON "public"."subscription_plans" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Allow select for owner" ON "public"."thread_participants" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Allow update for owner" ON "public"."courses_programs" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Allow update for owner" ON "public"."forum_categories" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Allow update for owner" ON "public"."job_categories" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Allow update for owner" ON "public"."medical_colleges" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Allow update for owner" ON "public"."subscription_plans" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Allow update for owner" ON "public"."thread_participants" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Allow users to post in visible threads" ON "public"."forum_posts" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."forum_threads"
  WHERE ("forum_threads"."id" = "forum_posts"."thread_id"))));



CREATE POLICY "Chat messages delete for owner" ON "public"."chat_messages" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Chat messages insert for participant" ON "public"."chat_messages" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Chat messages select for participant" ON "public"."chat_messages" FOR SELECT TO "authenticated" USING (("sender_id" IN ( SELECT "chat_messages"."sender_id"
   FROM "public"."chat_participants"
  WHERE ("chat_participants"."id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Chat messages update for owner" ON "public"."chat_messages" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Chat participants delete for member" ON "public"."chat_participants" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Chat participants insert for member" ON "public"."chat_participants" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Chat participants select for member" ON "public"."chat_participants" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Chat participants update for member" ON "public"."chat_participants" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "ChatMessages: delete own" ON "public"."chat_messages" FOR DELETE TO "authenticated" USING (("sender_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "ChatMessages: insert own" ON "public"."chat_messages" FOR INSERT TO "authenticated" WITH CHECK ((("sender_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("room_id" IN ( SELECT "chat_participants"."room_id"
   FROM "public"."chat_participants"
  WHERE ("chat_participants"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "ChatMessages: select if in room" ON "public"."chat_messages" FOR SELECT TO "authenticated" USING ((("sender_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("room_id" IN ( SELECT "chat_participants"."room_id"
   FROM "public"."chat_participants"
  WHERE ("chat_participants"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "ChatParticipants: delete own" ON "public"."chat_participants" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "ChatParticipants: insert own" ON "public"."chat_participants" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") AND ("room_id" IS NOT NULL)));



CREATE POLICY "ChatParticipants: select own" ON "public"."chat_participants" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "ChatRooms: delete own" ON "public"."chat_rooms" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "created_by"));



CREATE POLICY "ChatRooms: insert own" ON "public"."chat_rooms" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "created_by"));



CREATE POLICY "ChatRooms: select if participant or creator" ON "public"."chat_rooms" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "created_by") OR ("id" IN ( SELECT "chat_participants"."room_id"
   FROM "public"."chat_participants"
  WHERE ("chat_participants"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "ChatRooms: update own" ON "public"."chat_rooms" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "created_by")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "created_by"));



CREATE POLICY "ForumPosts: delete own" ON "public"."forum_posts" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "author_id"));



CREATE POLICY "ForumPosts: insert own" ON "public"."forum_posts" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "author_id"));



CREATE POLICY "ForumPosts: select own" ON "public"."forum_posts" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "author_id"));



CREATE POLICY "ForumPosts: update own" ON "public"."forum_posts" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "author_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "author_id"));



CREATE POLICY "ForumThreads: delete own" ON "public"."forum_threads" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "created_by"));



CREATE POLICY "ForumThreads: insert own" ON "public"."forum_threads" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "created_by"));



CREATE POLICY "ForumThreads: select own" ON "public"."forum_threads" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "created_by"));



CREATE POLICY "ForumThreads: update own" ON "public"."forum_threads" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "created_by")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "created_by"));



CREATE POLICY "Global engagement is readable by all" ON "public"."global_engagement" FOR SELECT USING (true);



CREATE POLICY "Global engagement is updatable by all authenticated users" ON "public"."global_engagement" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text")) WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Job applications delete for owner" ON "public"."job_applications" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Job applications insert for owner" ON "public"."job_applications" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Job applications select for owner" ON "public"."job_applications" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Job applications update for owner" ON "public"."job_applications" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "JobApplications: delete own" ON "public"."job_applications" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "applicant_id"));



CREATE POLICY "JobApplications: insert own" ON "public"."job_applications" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "applicant_id"));



CREATE POLICY "JobApplications: select own" ON "public"."job_applications" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "applicant_id"));



CREATE POLICY "JobApplications: update own" ON "public"."job_applications" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "applicant_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "applicant_id"));



CREATE POLICY "JobPostings: delete own" ON "public"."job_postings" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "posted_by"));



CREATE POLICY "JobPostings: insert own" ON "public"."job_postings" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "posted_by"));



CREATE POLICY "JobPostings: select own" ON "public"."job_postings" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "posted_by"));



CREATE POLICY "JobPostings: update own" ON "public"."job_postings" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "posted_by")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "posted_by"));



CREATE POLICY "Message attachments are viewable by all" ON "public"."message_attachments" FOR SELECT USING (true);



CREATE POLICY "Message reactions are viewable by all" ON "public"."message_reactions" FOR SELECT USING (true);



CREATE POLICY "Messages insert participant" ON "public"."messages" FOR INSERT TO "authenticated" WITH CHECK ((("sender_id" = ( SELECT "auth"."uid"() AS "uid")) AND ((EXISTS ( SELECT 1
   FROM "public"."thread_participants" "tp"
  WHERE (("tp"."thread_id" = "tp"."thread_id") AND ("tp"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) OR (( SELECT "auth"."uid"() AS "uid") = ( SELECT "threads"."creator_id" AS "created_by"
   FROM "public"."threads"
  WHERE ("threads"."id" = "messages"."thread_id"))))));



CREATE POLICY "Messages mark read participant" ON "public"."messages" FOR UPDATE TO "authenticated" USING ((("sender_id" <> ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."thread_participants" "tp"
  WHERE (("tp"."thread_id" = "messages"."thread_id") AND ("tp"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))))) WITH CHECK ((("sender_id" <> ( SELECT "auth"."uid"() AS "uid")) AND ("is_read" = true)));



CREATE POLICY "Messages select participant" ON "public"."messages" FOR SELECT TO "authenticated" USING ((("sender_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."thread_participants" "tp"
  WHERE (("tp"."thread_id" = "messages"."thread_id") AND ("tp"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Messages update sender" ON "public"."messages" FOR UPDATE TO "authenticated" USING (("sender_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("sender_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Partner services tenant delete" ON "public"."partner_services" FOR DELETE TO "authenticated" USING (((("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid" = "partner_id"));



CREATE POLICY "Partner services tenant read" ON "public"."partner_services" FOR SELECT TO "authenticated" USING (((("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid" = "partner_id"));



CREATE POLICY "Partner services tenant update" ON "public"."partner_services" FOR UPDATE TO "authenticated" USING (((("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid" = "partner_id")) WITH CHECK (((("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid" = "partner_id"));



CREATE POLICY "Partner services tenant write" ON "public"."partner_services" FOR INSERT TO "authenticated" WITH CHECK (((("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid" = "partner_id"));



CREATE POLICY "Partners tenant delete" ON "public"."partners" FOR DELETE TO "authenticated" USING (((("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid" = "id"));



CREATE POLICY "Partners tenant read" ON "public"."partners" FOR SELECT TO "authenticated" USING (((("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid" = "id"));



CREATE POLICY "Partners tenant update" ON "public"."partners" FOR UPDATE TO "authenticated" USING (((("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid" = "id")) WITH CHECK (((("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid" = "id"));



CREATE POLICY "Partners tenant write" ON "public"."partners" FOR INSERT TO "authenticated" WITH CHECK (((("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid" = "id"));



CREATE POLICY "PaymentTransactions: delete own" ON "public"."payment_transactions" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "PaymentTransactions: insert own" ON "public"."payment_transactions" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "PaymentTransactions: select own" ON "public"."payment_transactions" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "PaymentTransactions: update own" ON "public"."payment_transactions" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Profiles delete for owner" ON "public"."profiles" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Profiles insert for owner" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Profiles insert self" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Profiles select for owner" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Profiles select self" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Profiles update for owner" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Profiles update self" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Profiles: delete own" ON "public"."profiles" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Profiles: insert own" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Profiles: select own" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Profiles: update own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Threads insert authenticated" ON "public"."threads" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "creator_id"));



CREATE POLICY "Threads select creator" ON "public"."threads" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "creator_id"));



CREATE POLICY "Threads select participant" ON "public"."threads" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "creator_id") OR (EXISTS ( SELECT 1
   FROM "public"."thread_participants" "tp"
  WHERE (("tp"."thread_id" = "threads"."id") AND ("tp"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "User connections delete for owner" ON "public"."user_connections" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "User connections insert for owner" ON "public"."user_connections" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "User connections select for owner" ON "public"."user_connections" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "User connections update for owner" ON "public"."user_connections" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "User education delete for owner" ON "public"."user_education" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "User education insert for owner" ON "public"."user_education" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "User education select for owner" ON "public"."user_education" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "User education update for owner" ON "public"."user_education" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "User professional delete for owner" ON "public"."user_professional_details" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "User professional insert for owner" ON "public"."user_professional_details" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "User professional select for owner" ON "public"."user_professional_details" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "User professional update for owner" ON "public"."user_professional_details" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "User recommendations delete for owner" ON "public"."user_recommendations" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "User recommendations insert for owner" ON "public"."user_recommendations" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "User recommendations select for owner" ON "public"."user_recommendations" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "User recommendations update for owner" ON "public"."user_recommendations" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "User subscriptions delete for owner" ON "public"."user_subscriptions" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "User subscriptions insert for owner" ON "public"."user_subscriptions" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "User subscriptions select for owner" ON "public"."user_subscriptions" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "User subscriptions update for owner" ON "public"."user_subscriptions" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "UserConnections: delete own" ON "public"."user_connections" FOR DELETE TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "requester_id") OR (( SELECT "auth"."uid"() AS "uid") = "addressee_id")));



CREATE POLICY "UserConnections: insert own" ON "public"."user_connections" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "requester_id"));



CREATE POLICY "UserConnections: select related" ON "public"."user_connections" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "requester_id") OR (( SELECT "auth"."uid"() AS "uid") = "addressee_id")));



CREATE POLICY "UserConnections: update own" ON "public"."user_connections" FOR UPDATE TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "requester_id") OR (( SELECT "auth"."uid"() AS "uid") = "addressee_id"))) WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "requester_id") OR (( SELECT "auth"."uid"() AS "uid") = "addressee_id")));



CREATE POLICY "UserEducation: delete own" ON "public"."user_education" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "UserEducation: insert own" ON "public"."user_education" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "UserEducation: select own" ON "public"."user_education" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "UserEducation: update own" ON "public"."user_education" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "UserProfessional: delete own" ON "public"."user_professional_details" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "UserProfessional: insert own" ON "public"."user_professional_details" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "UserProfessional: select own" ON "public"."user_professional_details" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "UserProfessional: update own" ON "public"."user_professional_details" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "UserRecommendations: delete own" ON "public"."user_recommendations" FOR DELETE TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR (( SELECT "auth"."uid"() AS "uid") = "recommended_user_id")));



CREATE POLICY "UserRecommendations: insert own" ON "public"."user_recommendations" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "UserRecommendations: select related" ON "public"."user_recommendations" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR (( SELECT "auth"."uid"() AS "uid") = "recommended_user_id")));



CREATE POLICY "UserSubscriptions: delete own" ON "public"."user_subscriptions" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "UserSubscriptions: insert own" ON "public"."user_subscriptions" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "UserSubscriptions: select own" ON "public"."user_subscriptions" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "UserSubscriptions: update own" ON "public"."user_subscriptions" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can add their own reactions" ON "public"."message_reactions" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can delete their own reactions" ON "public"."message_reactions" FOR DELETE USING ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can manage their own notification preferences" ON "public"."notification_preferences" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can upload attachments" ON "public"."message_attachments" FOR INSERT WITH CHECK ((("auth"."uid"() = "uploaded_by") OR ("uploaded_by" IS NULL)));



CREATE POLICY "Users can view their own email notifications" ON "public"."email_notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."category_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_rooms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."courses_programs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."forum_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."forum_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."forum_threads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."global_engagement" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_postings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."medical_colleges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."partner_services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."partners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."thread_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."threads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_connections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_education" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_professional_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_recommendations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Admins full access - DELETE" ON "website_admin"."admins" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "website_admin"."admins" "a"
  WHERE ("a"."email" = ("auth"."jwt"() ->> 'email'::"text")))));



CREATE POLICY "Admins full access - INSERT" ON "website_admin"."admins" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "website_admin"."admins" "a"
  WHERE ("a"."email" = ("auth"."jwt"() ->> 'email'::"text")))));



CREATE POLICY "Admins full access - SELECT" ON "website_admin"."admins" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "website_admin"."admins" "a"
  WHERE ("a"."email" = ("auth"."jwt"() ->> 'email'::"text")))));



CREATE POLICY "Admins full access - UPDATE" ON "website_admin"."admins" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "website_admin"."admins" "a"
  WHERE ("a"."email" = ("auth"."jwt"() ->> 'email'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "website_admin"."admins" "a"
  WHERE ("a"."email" = ("auth"."jwt"() ->> 'email'::"text")))));



ALTER TABLE "website_admin"."admins" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."chat_messages";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."chat_participants";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."chat_rooms";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."courses_programs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."email_notifications";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."forum_categories";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."forum_posts";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."forum_threads";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."global_engagement";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."job_applications";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."job_categories";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."job_postings";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."medical_colleges";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."message_attachments";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."message_reactions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."messages";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notification_preferences";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."partner_services";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."partners";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."payment_transactions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."profiles";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."subscription_plans";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."thread_participants";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."threads";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."user_connections";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."user_education";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."user_professional_details";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."user_recommendations";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."user_subscriptions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "website_admin"."admins";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."create_notification_preferences"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_notification_preferences"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_notification_preferences"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_thread"("p_title" "text", "p_body" "text", "p_space_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_thread"("p_title" "text", "p_body" "text", "p_space_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_thread"("p_title" "text", "p_body" "text", "p_space_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_user_connection"("requester_id" "uuid", "addressee_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_connection"("requester_id" "uuid", "addressee_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_connection"("requester_id" "uuid", "addressee_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_job_recommendations"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_job_recommendations"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_job_recommendations"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_recommendations"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_recommendations"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_recommendations"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_global_counter"("counter_name_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_global_counter"("counter_name_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_global_counter"("counter_name_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."join_public_forum"("p_space_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."join_public_forum"("p_space_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."join_public_forum"("p_space_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."request_to_join_space"("p_space_id" "uuid", "p_space_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."request_to_join_space"("p_space_id" "uuid", "p_space_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."request_to_join_space"("p_space_id" "uuid", "p_space_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."category_members" TO "anon";
GRANT ALL ON TABLE "public"."category_members" TO "authenticated";
GRANT ALL ON TABLE "public"."category_members" TO "service_role";



GRANT ALL ON SEQUENCE "public"."category_members_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."category_members_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."category_members_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."chat_participants" TO "anon";
GRANT ALL ON TABLE "public"."chat_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_participants" TO "service_role";



GRANT ALL ON TABLE "public"."chat_rooms" TO "anon";
GRANT ALL ON TABLE "public"."chat_rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_rooms" TO "service_role";



GRANT ALL ON TABLE "public"."courses_programs" TO "anon";
GRANT ALL ON TABLE "public"."courses_programs" TO "authenticated";
GRANT ALL ON TABLE "public"."courses_programs" TO "service_role";



GRANT ALL ON TABLE "public"."email_notifications" TO "anon";
GRANT ALL ON TABLE "public"."email_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."email_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."forum_categories" TO "anon";
GRANT ALL ON TABLE "public"."forum_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."forum_categories" TO "service_role";



GRANT ALL ON TABLE "public"."forum_posts" TO "anon";
GRANT ALL ON TABLE "public"."forum_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."forum_posts" TO "service_role";



GRANT ALL ON TABLE "public"."forum_threads" TO "anon";
GRANT ALL ON TABLE "public"."forum_threads" TO "authenticated";
GRANT ALL ON TABLE "public"."forum_threads" TO "service_role";



GRANT ALL ON TABLE "public"."global_engagement" TO "anon";
GRANT ALL ON TABLE "public"."global_engagement" TO "authenticated";
GRANT ALL ON TABLE "public"."global_engagement" TO "service_role";



GRANT ALL ON TABLE "public"."job_applications" TO "anon";
GRANT ALL ON TABLE "public"."job_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."job_applications" TO "service_role";



GRANT ALL ON TABLE "public"."job_categories" TO "anon";
GRANT ALL ON TABLE "public"."job_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."job_categories" TO "service_role";



GRANT ALL ON TABLE "public"."job_postings" TO "anon";
GRANT ALL ON TABLE "public"."job_postings" TO "authenticated";
GRANT ALL ON TABLE "public"."job_postings" TO "service_role";



GRANT ALL ON TABLE "public"."medical_colleges" TO "anon";
GRANT ALL ON TABLE "public"."medical_colleges" TO "authenticated";
GRANT ALL ON TABLE "public"."medical_colleges" TO "service_role";



GRANT ALL ON TABLE "public"."message_attachments" TO "anon";
GRANT ALL ON TABLE "public"."message_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."message_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."message_reactions" TO "anon";
GRANT ALL ON TABLE "public"."message_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."message_reactions" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON SEQUENCE "public"."messages_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."messages_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."messages_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."notification_preferences" TO "anon";
GRANT ALL ON TABLE "public"."notification_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."partner_services" TO "anon";
GRANT ALL ON TABLE "public"."partner_services" TO "authenticated";
GRANT ALL ON TABLE "public"."partner_services" TO "service_role";



GRANT ALL ON TABLE "public"."partners" TO "anon";
GRANT ALL ON TABLE "public"."partners" TO "authenticated";
GRANT ALL ON TABLE "public"."partners" TO "service_role";



GRANT ALL ON TABLE "public"."payment_transactions" TO "anon";
GRANT ALL ON TABLE "public"."payment_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_plans" TO "anon";
GRANT ALL ON TABLE "public"."subscription_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_plans" TO "service_role";



GRANT ALL ON TABLE "public"."thread_participants" TO "anon";
GRANT ALL ON TABLE "public"."thread_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."thread_participants" TO "service_role";



GRANT ALL ON SEQUENCE "public"."thread_participants_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."thread_participants_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."thread_participants_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."threads" TO "anon";
GRANT ALL ON TABLE "public"."threads" TO "authenticated";
GRANT ALL ON TABLE "public"."threads" TO "service_role";



GRANT ALL ON SEQUENCE "public"."threads_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."threads_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."threads_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_connections" TO "anon";
GRANT ALL ON TABLE "public"."user_connections" TO "authenticated";
GRANT ALL ON TABLE "public"."user_connections" TO "service_role";



GRANT ALL ON TABLE "public"."user_education" TO "anon";
GRANT ALL ON TABLE "public"."user_education" TO "authenticated";
GRANT ALL ON TABLE "public"."user_education" TO "service_role";



GRANT ALL ON TABLE "public"."user_professional_details" TO "anon";
GRANT ALL ON TABLE "public"."user_professional_details" TO "authenticated";
GRANT ALL ON TABLE "public"."user_professional_details" TO "service_role";



GRANT ALL ON TABLE "public"."user_recommendations" TO "anon";
GRANT ALL ON TABLE "public"."user_recommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."user_recommendations" TO "service_role";



GRANT ALL ON TABLE "public"."user_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."user_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_subscriptions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































RESET ALL;
