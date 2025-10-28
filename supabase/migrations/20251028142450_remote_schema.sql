create type "public"."connection_status_type" as enum ('connected', 'pending_sent', 'pending_received', 'not_connected');

drop trigger if exists "on_new_public_space" on "public"."spaces";

drop trigger if exists "on_new_public_thread" on "public"."threads";

drop policy "Users can view participants of their own conversations" on "public"."conversation_participants";

drop policy "Users can view own full profile" on "public"."profiles";

drop policy "Users can view profiles with privacy controls" on "public"."profiles";

drop policy "Users can view their own connections and own blocklist" on "public"."user_connections";

drop function if exists "public"."create_thread"(p_title text, p_body text, p_space_id uuid, p_description text);

drop function if exists "public"."get_threads"(p_space_id uuid);

drop function if exists "public"."handle_new_public_space"();

drop function if exists "public"."handle_new_public_thread"();

drop function if exists "public"."update_profile"(p_full_name text, p_bio text, p_phone text, p_date_of_birth date, p_current_position text, p_organization text, p_medical_license text, p_skills text[], p_location_id uuid, p_location_other text, p_institution_id uuid, p_institution_other text, p_course_id uuid, p_course_other text, p_specialization_id uuid, p_specialization_other text, p_student_year_value text, p_experience_level_value text);

drop function if exists "public"."update_profile"(p_full_name text, p_bio text, p_phone text, p_date_of_birth date, p_current_position text, p_organization text, p_medical_license text, p_skills text[], p_location_id uuid, p_location_other text, p_institution_id uuid, p_institution_other text, p_course_id uuid, p_course_other text, p_specialization_id uuid, p_specialization_other text, p_student_year_value text, p_experience_level_value text, p_resume_url text, p_profile_picture_url text, p_is_onboarded boolean);

drop view if exists "public"."blocked_members";

drop function if exists "public"."get_mutual_connections"(other_user_id uuid);

drop function if exists "public"."get_profile_with_privacy"(profile_id uuid, viewer_id uuid);

drop view if exists "public"."sent_pending_requests";

alter type "public"."notification_type" rename to "notification_type__old_version_to_be_dropped";

create type "public"."notification_type" as enum ('new_connection_request', 'connection_accepted', 'new_thread', 'new_space', 'system_update', 'new_reply', 'job_application_update', 'new_public_post_by_followed_user', 'new_public_space_by_followed_user', 'new_reply_to_your_message', 'new_direct_message');

create table "public"."academic_achievements" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "exam_name" text not null,
    "rank" text,
    "percentile" numeric(5,2),
    "year" integer,
    "certificate_url" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."academic_achievements" enable row level security;

create table "public"."awards" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "type" text not null default 'professional'::text,
    "award_name" text not null,
    "issuing_org" text,
    "date" date,
    "description" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."awards" enable row level security;

create table "public"."career_transitions" (
    "profile_id" uuid not null,
    "transition_status" text,
    "target_industries" text[],
    "transition_story" text,
    "transition_date" date,
    "open_to_opportunities" boolean default false,
    "seeking_mentorship" boolean default false,
    "offering_mentorship" boolean default false,
    "updated_at" timestamp with time zone default now()
);


alter table "public"."career_transitions" enable row level security;

create table "public"."certifications" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "certification_name" text not null,
    "issuing_org" text,
    "issue_date" date,
    "expiry_date" date,
    "credential_id" text,
    "credential_url" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."certifications" enable row level security;

create table "public"."cocurriculars" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "category" text not null,
    "title" text not null,
    "description" text,
    "activity_date" date,
    "url" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."cocurriculars" enable row level security;

create table "public"."content_portfolio" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "content_type" text not null,
    "title" text not null,
    "description" text,
    "url" text,
    "platform_name" text,
    "thumbnail_url" text,
    "featured" boolean default false,
    "created_at" timestamp with time zone default now()
);


alter table "public"."content_portfolio" enable row level security;

create table "public"."education_history" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "institution_name" text not null,
    "degree" text,
    "field_of_study" text,
    "start_year" integer,
    "end_year" integer,
    "description" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."education_history" enable row level security;

create table "public"."profile_analytics" (
    "profile_id" uuid not null,
    "view_count" bigint not null default 0
);


alter table "public"."profile_analytics" enable row level security;

create table "public"."publications" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "type" text not null,
    "title" text not null,
    "authors" text[],
    "publication_date" date,
    "journal_name" text,
    "doi" text,
    "citation_count" integer,
    "url" text,
    "description" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."publications" enable row level security;

create table "public"."user_follows" (
    "follower_id" uuid not null,
    "followed_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."user_follows" enable row level security;

create table "public"."ventures" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "venture_type" text,
    "name" text not null,
    "description" text,
    "website_url" text,
    "role" text,
    "status" text,
    "start_date" date,
    "end_date" date,
    "achievements" text[],
    "featured_image_url" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."ventures" enable row level security;

create table "public"."work_experiences" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid not null,
    "position" text not null,
    "organization" text not null,
    "start_date" date,
    "end_date" date,
    "description" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."work_experiences" enable row level security;

alter table "public"."notifications" alter column type type "public"."notification_type" using type::text::"public"."notification_type";

drop type "public"."notification_type__old_version_to_be_dropped";

alter table "public"."direct_message_attachments" alter column "id" set default extensions.uuid_generate_v4();

alter table "public"."messages" add column "preview_description" text;

alter table "public"."messages" add column "preview_image_url" text;

alter table "public"."messages" add column "preview_title" text;

alter table "public"."notification_preferences" add column "direct_messages" boolean not null default true;

alter table "public"."notification_preferences" add column "follows_activity" boolean not null default true;

alter table "public"."profiles" add column "follower_count" integer not null default 0;

alter table "public"."profiles" add column "following_count" integer not null default 0;

alter table "public"."profiles" add column "profile_mode" text not null default 'clinical'::text;

CREATE UNIQUE INDEX academic_achievements_pkey ON public.academic_achievements USING btree (id);

CREATE UNIQUE INDEX awards_pkey ON public.awards USING btree (id);

CREATE UNIQUE INDEX career_transitions_pkey ON public.career_transitions USING btree (profile_id);

CREATE UNIQUE INDEX certifications_pkey ON public.certifications USING btree (id);

CREATE UNIQUE INDEX cocurriculars_pkey ON public.cocurriculars USING btree (id);

CREATE UNIQUE INDEX content_portfolio_pkey ON public.content_portfolio USING btree (id);

CREATE UNIQUE INDEX education_history_pkey ON public.education_history USING btree (id);

CREATE INDEX idx_academic_achievements_profile_id ON public.academic_achievements USING btree (profile_id);

CREATE INDEX idx_awards_profile_id ON public.awards USING btree (profile_id);

CREATE INDEX idx_certifications_profile_id ON public.certifications USING btree (profile_id);

CREATE INDEX idx_cocurriculars_profile_id ON public.cocurriculars USING btree (profile_id);

CREATE INDEX idx_content_portfolio_profile_id ON public.content_portfolio USING btree (profile_id);

CREATE INDEX idx_education_history_profile_id ON public.education_history USING btree (profile_id);

CREATE INDEX idx_publications_profile_id ON public.publications USING btree (profile_id);

CREATE INDEX idx_ventures_profile_id ON public.ventures USING btree (profile_id);

CREATE INDEX idx_work_experiences_profile_id ON public.work_experiences USING btree (profile_id);

CREATE UNIQUE INDEX profile_analytics_pkey ON public.profile_analytics USING btree (profile_id);

CREATE UNIQUE INDEX publications_pkey ON public.publications USING btree (id);

CREATE UNIQUE INDEX user_follows_pkey ON public.user_follows USING btree (follower_id, followed_id);

CREATE UNIQUE INDEX ventures_pkey ON public.ventures USING btree (id);

CREATE UNIQUE INDEX work_experiences_pkey ON public.work_experiences USING btree (id);

alter table "public"."academic_achievements" add constraint "academic_achievements_pkey" PRIMARY KEY using index "academic_achievements_pkey";

alter table "public"."awards" add constraint "awards_pkey" PRIMARY KEY using index "awards_pkey";

alter table "public"."career_transitions" add constraint "career_transitions_pkey" PRIMARY KEY using index "career_transitions_pkey";

alter table "public"."certifications" add constraint "certifications_pkey" PRIMARY KEY using index "certifications_pkey";

alter table "public"."cocurriculars" add constraint "cocurriculars_pkey" PRIMARY KEY using index "cocurriculars_pkey";

alter table "public"."content_portfolio" add constraint "content_portfolio_pkey" PRIMARY KEY using index "content_portfolio_pkey";

alter table "public"."education_history" add constraint "education_history_pkey" PRIMARY KEY using index "education_history_pkey";

alter table "public"."profile_analytics" add constraint "profile_analytics_pkey" PRIMARY KEY using index "profile_analytics_pkey";

alter table "public"."publications" add constraint "publications_pkey" PRIMARY KEY using index "publications_pkey";

alter table "public"."user_follows" add constraint "user_follows_pkey" PRIMARY KEY using index "user_follows_pkey";

alter table "public"."ventures" add constraint "ventures_pkey" PRIMARY KEY using index "ventures_pkey";

alter table "public"."work_experiences" add constraint "work_experiences_pkey" PRIMARY KEY using index "work_experiences_pkey";

alter table "public"."academic_achievements" add constraint "academic_achievements_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."academic_achievements" validate constraint "academic_achievements_profile_id_fkey";

alter table "public"."awards" add constraint "awards_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."awards" validate constraint "awards_profile_id_fkey";

alter table "public"."career_transitions" add constraint "career_transitions_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."career_transitions" validate constraint "career_transitions_profile_id_fkey";

alter table "public"."certifications" add constraint "certifications_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."certifications" validate constraint "certifications_profile_id_fkey";

alter table "public"."cocurriculars" add constraint "cocurriculars_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."cocurriculars" validate constraint "cocurriculars_profile_id_fkey";

alter table "public"."content_portfolio" add constraint "content_portfolio_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."content_portfolio" validate constraint "content_portfolio_profile_id_fkey";

alter table "public"."education_history" add constraint "education_history_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."education_history" validate constraint "education_history_profile_id_fkey";

alter table "public"."profile_analytics" add constraint "profile_analytics_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."profile_analytics" validate constraint "profile_analytics_profile_id_fkey";

alter table "public"."publications" add constraint "publications_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."publications" validate constraint "publications_profile_id_fkey";

alter table "public"."user_follows" add constraint "user_follows_followed_id_fkey" FOREIGN KEY (followed_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_follows" validate constraint "user_follows_followed_id_fkey";

alter table "public"."user_follows" add constraint "user_follows_follower_id_fkey" FOREIGN KEY (follower_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_follows" validate constraint "user_follows_follower_id_fkey";

alter table "public"."ventures" add constraint "ventures_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."ventures" validate constraint "ventures_profile_id_fkey";

alter table "public"."work_experiences" add constraint "work_experiences_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."work_experiences" validate constraint "work_experiences_profile_id_fkey";

set check_function_bodies = off;

create type "public"."attachment_input" as ("file_url" text, "file_name" text, "file_type" text, "file_size_bytes" integer);

CREATE OR REPLACE FUNCTION public.create_thread(p_title text, p_body text, p_space_id uuid DEFAULT NULL::uuid, p_description text DEFAULT NULL::text, p_attachments attachment_input[] DEFAULT NULL::attachment_input[], p_preview_title text DEFAULT NULL::text, p_preview_description text DEFAULT NULL::text, p_preview_image_url text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_new_thread_id UUID;
    v_first_message_id BIGINT;
    v_target_space_id UUID;
    v_attachment public.attachment_input;
BEGIN
    v_target_space_id := COALESCE(
        p_space_id, 
        (SELECT id FROM public.spaces WHERE space_type = 'PUBLIC' LIMIT 1)
    );

    INSERT INTO public.threads (creator_id, title, space_id, description)
    VALUES (auth.uid(), p_title, v_target_space_id, p_description)
    RETURNING id INTO v_new_thread_id;

    IF p_body IS NOT NULL AND char_length(p_body) > 0 THEN
        -- MODIFY THIS INSERT STATEMENT --
        INSERT INTO public.messages (
          user_id,
          thread_id,
          body,
          -- ADD THE NEW COLUMNS --
          preview_title,
          preview_description,
          preview_image_url
        )
        VALUES (
          auth.uid(),
          v_new_thread_id,
          p_body,
          -- ADD THE NEW VALUES --
          p_preview_title,
          p_preview_description,
          p_preview_image_url
        )
        RETURNING id INTO v_first_message_id;

        IF v_first_message_id IS NOT NULL AND p_attachments IS NOT NULL THEN
            FOREACH v_attachment IN ARRAY p_attachments
            LOOP
                INSERT INTO public.message_attachments 
                    (message_id, file_url, file_name, file_type, file_size_bytes, uploaded_by)
                VALUES 
                    (v_first_message_id, v_attachment.file_url, v_attachment.file_name, v_attachment.file_type, v_attachment.file_size_bytes, auth.uid());
            END LOOP;
        END IF;
        
    END IF;
    
    RETURN v_new_thread_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_post(p_thread_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_space_id uuid;
BEGIN
    -- 1. Find the space_id for the given thread
    SELECT space_id INTO v_space_id 
    FROM public.threads 
    WHERE id = p_thread_id;

    -- 2. Delete the thread, checking for creator OR moderator status
    DELETE FROM public.threads t
    WHERE 
        t.id = p_thread_id 
        AND (
            t.creator_id = auth.uid() -- User is the creator
            OR 
            public.is_space_moderator_or_admin(v_space_id, auth.uid()) -- User is a mod/admin
        );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_followers_with_status(p_profile_id uuid)
 RETURNS SETOF profile_with_status
 LANGUAGE sql
 STABLE
AS $function$
  SELECT
    p.id,
    p.full_name,
    p.profile_picture_url,
    p.current_position,
    p.organization,
    spec.label AS specialization_name,
    loc.label AS location_name,
    
    -- 1. Get Connection Status
    CASE
      WHEN c.status = 'accepted' THEN 'connected'::public.connection_status_type
      WHEN c.status = 'pending' AND c.requester_id = auth.uid() THEN 'pending_sent'::public.connection_status_type
      WHEN c.status = 'pending' AND c.addressee_id = auth.uid() THEN 'pending_received'::public.connection_status_type
      ELSE 'not_connected'::public.connection_status_type
    END AS connection_status,
    
    -- 2. Get Follow Status (is viewer following this person?)
    EXISTS (
      SELECT 1
      FROM public.user_follows
      WHERE follower_id = auth.uid() AND followed_id = p.id
    ) AS is_viewer_following
    
  FROM public.user_follows f
  JOIN public.profiles p ON f.follower_id = p.id
  LEFT JOIN public.specializations spec ON p.specialization_id = spec.id
  LEFT JOIN public.locations loc ON p.location_id = loc.id
  
  -- LEFT JOIN to find a connection (if any) between the viewer and the follower
  LEFT JOIN public.user_connections c
    ON (c.requester_id = auth.uid() AND c.addressee_id = p.id)
    OR (c.addressee_id = auth.uid() AND c.requester_id = p.id)
  
  WHERE
    f.followed_id = p_profile_id
    AND f.follower_id != auth.uid() -- Filter out the viewer from their own list
  ORDER BY
    f.created_at DESC
  LIMIT 10;
$function$
;

CREATE OR REPLACE FUNCTION public.get_following_with_status(p_profile_id uuid)
 RETURNS SETOF profile_with_status
 LANGUAGE sql
 STABLE
AS $function$
  SELECT
    p.id,
    p.full_name,
    p.profile_picture_url,
    p.current_position,
    p.organization,
    spec.label AS specialization_name,
    loc.label AS location_name,
    
    -- 1. Get Connection Status
    CASE
      WHEN c.status = 'accepted' THEN 'connected'::public.connection_status_type
      WHEN c.status = 'pending' AND c.requester_id = auth.uid() THEN 'pending_sent'::public.connection_status_type
      WHEN c.status = 'pending' AND c.addressee_id = auth.uid() THEN 'pending_received'::public.connection_status_type
      ELSE 'not_connected'::public.connection_status_type
    END AS connection_status,
    
    -- 2. Get Follow Status (is viewer following this person?)
    EXISTS (
      SELECT 1
      FROM public.user_follows
      WHERE follower_id = auth.uid() AND followed_id = p.id
    ) AS is_viewer_following
    
  FROM public.user_follows f
  -- The JOIN is on followed_id this time
  JOIN public.profiles p ON f.followed_id = p.id
  LEFT JOIN public.specializations spec ON p.specialization_id = spec.id
  LEFT JOIN public.locations loc ON p.location_id = loc.id
  
  -- LEFT JOIN to find a connection (if any) between the viewer and the followed user
  LEFT JOIN public.user_connections c
    ON (c.requester_id = auth.uid() AND c.addressee_id = p.id)
    OR (c.addressee_id = auth.uid() AND c.requester_id = p.id)
  
  WHERE
    f.follower_id = p_profile_id -- The WHERE is on follower_id
    AND f.followed_id != auth.uid() -- Filter out the viewer
  ORDER BY
    f.created_at DESC
  LIMIT 10;
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_connections_with_status()
 RETURNS SETOF profile_with_status
 LANGUAGE sql
 STABLE
AS $function$
  -- 1. Get all my friend IDs
  WITH my_friends AS (
    SELECT requester_id AS friend_id, created_at FROM user_connections WHERE addressee_id = auth.uid() AND status = 'accepted'
    UNION
    SELECT addressee_id AS friend_id, created_at FROM user_connections WHERE requester_id = auth.uid() AND status = 'accepted'
  )
  -- 2. Join with profiles and get their status
  SELECT
    p.id,
    p.full_name,
    p.profile_picture_url,
    p.current_position,
    p.organization,
    spec.label AS specialization_name,
    loc.label AS location_name,
    
    -- Status Fields
    'connected'::public.connection_status_type AS connection_status, -- Always connected
    
    EXISTS (
      SELECT 1
      FROM public.user_follows
      WHERE follower_id = auth.uid() AND followed_id = p.id
    ) AS is_viewer_following
    
  FROM my_friends mf
  JOIN public.profiles p ON p.id = mf.friend_id
  LEFT JOIN public.specializations spec ON p.specialization_id = spec.id
  LEFT JOIN public.locations loc ON p.location_id = loc.id
  WHERE
    p.id != auth.uid()
  ORDER BY
    mf.created_at DESC -- Order by when the connection was made
  LIMIT 10;
$function$
;

CREATE OR REPLACE FUNCTION public.get_threads(p_space_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 10, p_page integer DEFAULT 1)
 RETURNS TABLE(id uuid, title text, creator_id uuid, creator_full_name text, creator_position text, creator_organization text, creator_specialization text, created_at timestamp with time zone, last_activity_at timestamp with time zone, space_id uuid, space_type text, total_message_count bigint, comment_count bigint, first_message_id bigint, first_message_body text, first_message_reaction_count bigint, first_message_user_reaction text, last_message_body text, attachments json)
 LANGUAGE sql
 STABLE
AS $function$
WITH 
  thread_metrics AS (
    SELECT
      thread_id,
      COUNT(*) AS message_count,
      MAX(created_at) AS last_activity_at
    FROM messages
    GROUP BY thread_id
  ),
  
  first_messages AS (
    SELECT DISTINCT ON (thread_id)
      id,
      thread_id,
      body
    FROM messages
    WHERE parent_message_id IS NULL
    ORDER BY thread_id, created_at ASC
  ),
  
  first_message_attachments AS (
    SELECT
      fm.thread_id,
      json_agg(
        json_build_object(
          'file_url', ma.file_url,
          'file_name', ma.file_name,
          'file_type', ma.file_type
        )
      ) AS attachments
    FROM first_messages fm
    JOIN message_attachments ma ON fm.id = ma.message_id
    GROUP BY fm.thread_id
  ),
  
  first_message_reaction_metrics AS (
    SELECT
      fm.thread_id,
      COUNT(r.id) AS total_reaction_count,
      (
        SELECT r_user.reaction_emoji
        FROM public.message_reactions r_user
        WHERE r_user.message_id = fm.id AND r_user.user_id = auth.uid()
        LIMIT 1
      ) AS user_reaction
    FROM first_messages fm
    LEFT JOIN public.message_reactions r ON r.message_id = fm.id
    GROUP BY fm.thread_id, fm.id
  ),
  
  last_active_messages AS (
    SELECT DISTINCT ON (thread_id)
      id,
      thread_id,
      body
    FROM messages
    ORDER BY thread_id, created_at DESC
  )
  
SELECT
  t.id,
  t.title,
  t.creator_id,
  p.full_name AS creator_full_name,
  p.current_position AS creator_position,
  p.organization AS creator_organization,
  spec.label AS creator_specialization,
  t.created_at,
  COALESCE(tm.last_activity_at, t.created_at) AS last_activity_at,
  t.space_id,
  s.space_type,
  COALESCE(tm.message_count, 0) AS total_message_count,
  GREATEST(0, COALESCE(tm.message_count, 0) - 1) AS comment_count,
  
  CASE 
    WHEN s.space_type IN ('PUBLIC', 'FORUM') THEN fm.id 
    ELSE NULL 
  END AS first_message_id,
  CASE 
    WHEN s.space_type IN ('PUBLIC', 'FORUM') THEN fm.body 
    ELSE NULL 
  END AS first_message_body,
  CASE 
    WHEN s.space_type IN ('PUBLIC', 'FORUM') THEN COALESCE(rm_first.total_reaction_count, 0) 
    ELSE NULL 
  END AS first_message_reaction_count,
  CASE 
    WHEN s.space_type IN ('PUBLIC', 'FORUM') THEN rm_first.user_reaction 
    ELSE NULL 
  END AS first_message_user_reaction,
    
  CASE 
    WHEN s.space_type = 'COMMUNITY_SPACE' THEN lam.body 
    ELSE NULL 
  END AS last_message_body,
  
  CASE 
    WHEN s.space_type IN ('PUBLIC', 'FORUM') THEN fma.attachments
    ELSE NULL 
  END AS attachments
  
FROM
  threads AS t
JOIN
  spaces AS s ON t.space_id = s.id
LEFT JOIN
  profiles AS p ON t.creator_id = p.id
LEFT JOIN
  public.specializations spec ON p.specialization_id = spec.id
LEFT JOIN
  thread_metrics AS tm ON t.id = tm.thread_id
LEFT JOIN
  first_messages AS fm ON t.id = fm.thread_id
LEFT JOIN
  first_message_reaction_metrics AS rm_first ON t.id = rm_first.thread_id
LEFT JOIN
  last_active_messages AS lam ON t.id = lam.thread_id
LEFT JOIN
  first_message_attachments AS fma ON t.id = fma.thread_id
WHERE
  t.space_id = COALESCE(p_space_id, (SELECT id FROM spaces WHERE space_type = 'PUBLIC' LIMIT 1))
ORDER BY
  last_activity_at DESC
OFFSET (p_page - 1) * p_limit
LIMIT p_limit;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_profile_view(p_profile_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profile_analytics (profile_id, view_count)
  VALUES (p_profile_id, 1)
  ON CONFLICT (profile_id)
  DO UPDATE SET view_count = profile_analytics.view_count + 1;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_followers_on_new_public_post()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_space_type public.spaces.space_type%TYPE;
BEGIN
  -- This handles global posts
  IF NEW.space_id = '00000000-0000-0000-0000-000000000001' THEN
    INSERT INTO public.notifications (user_id, actor_id, type, entity_id)
    SELECT
      f.follower_id,
      NEW.creator_id,
      'new_public_post_by_followed_user',
      NEW.id
    FROM
      public.user_follows AS f
    JOIN
      public.notification_preferences AS prefs
      ON f.follower_id = prefs.user_id
    WHERE
      f.followed_id = NEW.creator_id
      AND prefs.follows_activity = true;
  ELSE
    -- This handles posts in other PUBLIC spaces
    SELECT space_type INTO v_space_type
    FROM public.spaces
    WHERE id = NEW.space_id;
    
    IF v_space_type = 'PUBLIC' THEN
      INSERT INTO public.notifications (user_id, actor_id, type, entity_id)
      SELECT
        f.follower_id,
        NEW.creator_id,
        'new_public_post_by_followed_user',
        NEW.id
      FROM
        public.user_follows AS f
      JOIN
        public.notification_preferences AS prefs
        ON f.follower_id = prefs.user_id
      WHERE
        f.followed_id = NEW.creator_id
        AND prefs.follows_activity = true;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_followers_on_new_public_space()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.space_type = 'PUBLIC' THEN
    INSERT INTO public.notifications (user_id, actor_id, type, entity_id)
    SELECT
      f.follower_id,
      NEW.creator_id,
      'new_public_space_by_followed_user',
      NEW.id
    FROM
      public.user_follows AS f
    JOIN
      public.notification_preferences AS prefs
      ON f.follower_id = prefs.user_id
    WHERE
      f.followed_id = NEW.creator_id
      AND prefs.follows_activity = true;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_on_new_direct_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_recipient_id uuid;
BEGIN
  -- 1. Find the *other* participant in the conversation
  -- (This assumes 1-on-1 conversations)
  SELECT user_id
  INTO v_recipient_id
  FROM public.conversation_participants
  WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id
  LIMIT 1;

  -- 2. If we found a recipient...
  IF v_recipient_id IS NOT NULL THEN
    -- 3. Insert a notification for them, checking their preferences
    INSERT INTO public.notifications (user_id, actor_id, type, entity_id)
    SELECT
      v_recipient_id, -- The user to notify
      NEW.sender_id,    -- The user who sent the message
      'new_direct_message',
      NEW.conversation_id -- The entity_id so we can link to the conversation
    FROM public.notification_preferences AS prefs
    WHERE
      prefs.user_id = v_recipient_id
      AND prefs.direct_messages = true; -- Check their DM preference
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_on_new_reply_to_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_parent_author_id uuid;
  v_parent_thread_id uuid;
BEGIN
  -- 1. Check if this new message is a reply
  IF NEW.parent_message_id IS NULL THEN
    RETURN NEW; -- Not a reply, do nothing
  END IF;

  -- 2. Get the author and thread ID of the parent message
  SELECT creator_id, thread_id
  INTO v_parent_author_id, v_parent_thread_id
  FROM public.messages
  WHERE id = NEW.parent_message_id;

  -- 3. Don't send a notification if the user is replying to themself
  IF NEW.creator_id = v_parent_author_id THEN
    RETURN NEW;
  END IF;

  -- 4. Insert the notification for the parent message's author,
  --    checking their notification preferences first.
  INSERT INTO public.notifications (user_id, actor_id, type, entity_id)
  SELECT
    v_parent_author_id, -- The user to notify (author of the parent message)
    NEW.creator_id,       -- The actor who wrote the reply
    'new_reply_to_your_message',
    v_parent_thread_id  -- The entity_id, so we can link to the thread
  FROM public.notification_preferences AS prefs
  WHERE
    prefs.user_id = v_parent_author_id
    AND prefs.forum_updates = true; -- We'll use the 'forum_updates' toggle

  RETURN NEW;
END;
$function$
;

create type "public"."profile_with_status" as ("id" uuid, "full_name" text, "profile_picture_url" text, "current_position" text, "organization" text, "specialization_name" text, "location_name" text, "connection_status" connection_status_type, "is_viewer_following" boolean);

create or replace view "public"."public_posts_feed" as  SELECT t.id AS thread_id,
    t.title,
    t.creator_id AS thread_creator_id,
    t.space_id AS thread_space_id,
    t.created_at,
    t.updated_at AS thread_updated_at,
    t.last_activity_at,
    jsonb_build_object('id', p.id, 'full_name', p.full_name, 'profile_picture_url', p.profile_picture_url, 'current_position', p.current_position) AS author,
    fm.id AS first_message_id,
    fm.body AS first_message_body,
    fm.user_id AS message_user_id,
    fm.created_at AS message_created_at,
    fm.preview_title,
    fm.preview_description,
    fm.preview_image_url,
    COALESCE(stats.comment_count, (0)::bigint) AS comment_count,
    COALESCE(stats.total_reaction_count, (0)::bigint) AS total_reaction_count,
    stats.first_message_user_reaction,
    stats.attachments
   FROM (((threads t
     LEFT JOIN profiles p ON ((p.id = t.creator_id)))
     LEFT JOIN LATERAL ( SELECT m.id,
            m.thread_id,
            m.user_id,
            m.body,
            m.is_edited,
            m.created_at,
            m.updated_at,
            m.parent_message_id,
            m.preview_title,
            m.preview_description,
            m.preview_image_url
           FROM messages m
          WHERE (m.thread_id = t.id)
          ORDER BY m.created_at
         LIMIT 1) fm ON (true))
     LEFT JOIN LATERAL ( SELECT GREATEST((0)::bigint, (count(*) - 1)) AS comment_count,
            ( SELECT count(mr.id) AS count
                   FROM message_reactions mr
                  WHERE (mr.message_id = fm.id)) AS total_reaction_count,
            ( SELECT mr.reaction_emoji
                   FROM message_reactions mr
                  WHERE ((mr.message_id = fm.id) AND (mr.user_id = auth.uid()))
                 LIMIT 1) AS first_message_user_reaction,
            ( SELECT json_agg(json_build_object('file_url', ma.file_url, 'file_name', ma.file_name, 'file_type', ma.file_type)) AS json_agg
                   FROM message_attachments ma
                  WHERE (ma.message_id = fm.id)) AS attachments
           FROM messages m
          WHERE (m.thread_id = t.id)) stats ON (true))
  WHERE (t.space_id IN ( SELECT spaces.id
           FROM spaces
          WHERE (spaces.space_type = 'PUBLIC'::space_type)));


CREATE OR REPLACE FUNCTION public.toggle_follow(p_followed_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_follower_id UUID := auth.uid();
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.user_follows 
        WHERE follower_id = v_follower_id 
          AND followed_id = p_followed_id
    ) THEN
        -- Is following, so "unfollow"
        DELETE FROM public.user_follows
        WHERE follower_id = v_follower_id 
          AND followed_id = p_followed_id;
    ELSE
        -- Is not following, so "follow"
        INSERT INTO public.user_follows (follower_id, followed_id)
        VALUES (v_follower_id, p_followed_id);
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.toggle_reaction(p_message_id bigint, p_new_emoji text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_current_reaction RECORD;
BEGIN
    -- Find any existing reaction from this user on this message
    SELECT * INTO v_current_reaction
    FROM public.message_reactions
    WHERE message_id = p_message_id AND user_id = auth.uid();

    IF v_current_reaction IS NULL THEN
        -- Case 1: No reaction. Insert new one.
        INSERT INTO public.message_reactions (message_id, user_id, reaction_emoji)
        VALUES (p_message_id, auth.uid(), p_new_emoji);
        
    ELSIF v_current_reaction.reaction_emoji = p_new_emoji THEN
        -- Case 2: Clicked same emoji. Delete it.
        DELETE FROM public.message_reactions
        WHERE id = v_current_reaction.id;
        
    ELSE
        -- Case 3: Clicked new emoji. Update (replace) old one.
        UPDATE public.message_reactions
        SET reaction_emoji = p_new_emoji, created_at = NOW()
        WHERE id = v_current_reaction.id;
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_follow_counts()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- When a follow is added
  IF (TG_OP = 'INSERT') THEN
    -- Increment follower count for the user being followed
    UPDATE public.profiles
    SET follower_count = COALESCE(follower_count, 0) + 1
    WHERE id = NEW.followed_id;
    
    -- Increment following count for the user who is following
    UPDATE public.profiles
    SET following_count = COALESCE(following_count, 0) + 1
    WHERE id = NEW.follower_id;

  -- When a follow is removed
  ELSIF (TG_OP = 'DELETE') THEN
    -- Decrement follower count
    UPDATE public.profiles
    SET follower_count = GREATEST(COALESCE(follower_count, 1) - 1, 0) -- Use GREATEST to prevent going below 0
    WHERE id = OLD.followed_id;
    
    -- Decrement following count
    UPDATE public.profiles
    SET following_count = GREATEST(COALESCE(following_count, 1) - 1, 0)
    WHERE id = OLD.follower_id;
  END IF;
  
  RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_post(p_thread_id uuid, p_title text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_space_id uuid;
BEGIN
    -- 1. Find the space_id for the given thread
    SELECT space_id INTO v_space_id 
    FROM public.threads 
    WHERE id = p_thread_id;

    -- 2. Update the thread title, checking for creator OR moderator status
    UPDATE public.threads t
    SET 
        title = p_title
    WHERE 
        t.id = p_thread_id 
        AND (
            t.creator_id = auth.uid() -- User is the creator
            OR 
            public.is_space_moderator_or_admin(v_space_id, auth.uid()) -- User is a mod/admin
        );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_profile(p_full_name text DEFAULT NULL::text, p_bio text DEFAULT NULL::text, p_phone text DEFAULT NULL::text, p_date_of_birth date DEFAULT NULL::date, p_current_position text DEFAULT NULL::text, p_organization text DEFAULT NULL::text, p_medical_license text DEFAULT NULL::text, p_skills text[] DEFAULT NULL::text[], p_location_id uuid DEFAULT NULL::uuid, p_location_other text DEFAULT NULL::text, p_institution_id uuid DEFAULT NULL::uuid, p_institution_other text DEFAULT NULL::text, p_course_id uuid DEFAULT NULL::uuid, p_course_other text DEFAULT NULL::text, p_specialization_id uuid DEFAULT NULL::uuid, p_specialization_other text DEFAULT NULL::text, p_student_year_value text DEFAULT NULL::text, p_experience_level_value text DEFAULT NULL::text, p_resume_url text DEFAULT NULL::text, p_profile_picture_url text DEFAULT NULL::text, p_is_onboarded boolean DEFAULT NULL::boolean, p_profile_mode text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  UPDATE public.profiles
  SET
    full_name = COALESCE(p_full_name, full_name),
    bio = COALESCE(p_bio, bio),
    phone = COALESCE(p_phone, phone),
    date_of_birth = COALESCE(p_date_of_birth, date_of_birth),
    current_position = COALESCE(p_current_position, current_position),
    organization = COALESCE(p_organization, organization),
    medical_license = COALESCE(p_medical_license, medical_license),
    skills = COALESCE(p_skills, skills),
    location_id = COALESCE(p_location_id, location_id),
    location_other = COALESCE(p_location_other, location_other),
    institution_id = COALESCE(p_institution_id, institution_id),
    institution_other = COALESCE(p_institution_other, institution_other),
    course_id = COALESCE(p_course_id, course_id),
    course_other = COALESCE(p_course_other, course_other),
    specialization_id = COALESCE(p_specialization_id, specialization_id),
    specialization_other = COALESCE(p_specialization_other, specialization_other),
    student_year_value = COALESCE(p_student_year_value, student_year_value),
    experience_level_value = COALESCE(p_experience_level_value, experience_level_value),
    resume_url = COALESCE(p_resume_url, resume_url),
    profile_picture_url = COALESCE(p_profile_picture_url, profile_picture_url),
    is_onboarded = COALESCE(p_is_onboarded, is_onboarded),
    profile_mode = COALESCE(p_profile_mode, profile_mode) -- 2. ADD THIS LINE TO THE UPDATE
  WHERE id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.are_users_connected(user_a uuid, user_b uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_connections
    WHERE status = 'accepted'
    AND (
      (requester_id = user_a AND addressee_id = user_b)
      OR
      (requester_id = user_b AND addressee_id = user_a)
    )
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.assign_creator_role_on_space_creation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_creator_role public.membership_role;
BEGIN
  v_creator_role := CASE NEW.space_type
    WHEN 'COMMUNITY_SPACE' THEN 'ADMIN'
    WHEN 'FORUM' THEN 'MODERATOR'
    ELSE 'MEMBER' -- A safe default
  END;
  INSERT INTO public.memberships (user_id, space_id, role, status)
  VALUES (NEW.creator_id, NEW.id, v_creator_role, 'ACTIVE');

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.block_user(blocked_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$DECLARE
  blocker_id uuid := auth.uid();
BEGIN
  DELETE FROM public.user_connections
  WHERE (requester_id = blocker_id AND addressee_id = blocked_user_id)
     OR (requester_id = blocked_user_id AND addressee_id = blocker_id);
  INSERT INTO public.user_connections (requester_id, addressee_id, status)
  VALUES (blocker_id, blocked_user_id, 'blocked'::public.connection_status);
END;$function$
;

create or replace view "public"."blocked_members" as  SELECT p.id,
    p.full_name,
    p.profile_picture_url,
    uc.created_at AS blocked_at
   FROM ((user_connections uc
     JOIN profiles p ON ((uc.addressee_id = p.id)))
     LEFT JOIN user_professional_details upd ON ((p.id = upd.user_id)))
  WHERE ((uc.requester_id = auth.uid()) AND (uc.status = 'blocked'::connection_status));


CREATE OR REPLACE FUNCTION public.calculate_age(birth_date date)
 RETURNS integer
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
BEGIN
  RETURN EXTRACT(YEAR FROM AGE(birth_date));
END;
$function$
;

CREATE OR REPLACE FUNCTION public.can_send_direct_message(other_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_connections
    WHERE
      status = 'accepted' AND
      (
        (requester_id = auth.uid() AND addressee_id = other_user_id) OR
        (requester_id = other_user_id AND addressee_id = auth.uid())
      )
  );
$function$
;

CREATE OR REPLACE FUNCTION public.can_view_field(profile_id uuid, field_name text, viewer_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
DECLARE
  privacy_level TEXT;
  are_connected BOOLEAN;
  default_privacy TEXT;
BEGIN 
  -- If viewing own profile, always return TRUE
  IF profile_id = viewer_id THEN
    RETURN TRUE;
  END IF;
  
  -- Get privacy setting for this field
  SELECT privacy_settings->>field_name INTO privacy_level
  FROM public.profiles
  WHERE id = profile_id;
  
  -- ✅ FIX 2: Set sensible defaults if privacy_level is NULL
  IF privacy_level IS NULL THEN
    -- Define default privacy levels for sensitive fields
    IF field_name IN ('email', 'phone', 'date_of_birth', 'medical_license') THEN
      default_privacy := 'connections';
    ELSE
      default_privacy := 'public';
    END IF;
    privacy_level := default_privacy;
  END IF;
  
  -- Check privacy level
  IF privacy_level = 'public' THEN
    RETURN TRUE;
  END IF;
  
  IF privacy_level = 'private' THEN
    RETURN FALSE;
  END IF;
  
  IF privacy_level = 'connections' THEN
    -- If viewer_id is NULL (not logged in), deny access to connections-only fields
    IF viewer_id IS NULL THEN
      RETURN FALSE;
    END IF;
    
    SELECT are_users_connected(profile_id, viewer_id) INTO are_connected;
    RETURN COALESCE(are_connected, FALSE);
  END IF;
  
  -- Default to FALSE for unknown privacy levels
  RETURN FALSE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.can_view_thread(p_thread_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_space_id UUID;
    v_space_type public.space_type;
BEGIN
    -- Step 1: Find the space_id and space_type for the given thread
    -- by joining threads with spaces.
SELECT
    t.space_id,
    s.space_type
INTO
    v_space_id,
    v_space_type
FROM
    public.threads t
JOIN
    public.spaces s ON t.space_id = s.id
WHERE
    t.id = p_thread_id;

    -- If the query returned no rows (e.g., bad thread_id), deny access.
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Step 2: Check permissions based on the space type.
    -- If the space type is 'PUBLIC', any authenticated user can view.
    IF v_space_type = 'PUBLIC' THEN
        RETURN auth.role() = 'authenticated';
    END IF;
    -- For any other type ('FORUM', 'COMMUNITY_SPACE'),
    -- check if the user is a member of that space.
    RETURN public.is_space_member(v_space_id);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.clean_profile_normalized_fields()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- If an ID is provided, NULL out the 'other' field.
  
  IF NEW.location_id IS NOT NULL THEN
    NEW.location_other := NULL;
  END IF;
  
  IF NEW.institution_id IS NOT NULL THEN
    NEW.institution_other := NULL;
  END IF;
  
  IF NEW.course_id IS NOT NULL THEN
    NEW.course_other := NULL;
  END IF;
  
  IF NEW.specialization_id IS NOT NULL THEN
    NEW.specialization_other := NULL;
  END IF;

  -- These two don't have '_other' columns, so they are not needed here.
  -- NEW.student_year_value
  -- NEW.experience_level_value
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_connection_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'pending') THEN
    INSERT INTO public.notifications (user_id, actor_id, type, entity_id)
    VALUES (NEW.addressee_id, NEW.requester_id, 'new_connection_request', NEW.id);
  ELSIF (TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status = 'pending') THEN
    INSERT INTO public.notifications (user_id, actor_id, type, entity_id)
    VALUES (NEW.requester_id, NEW.addressee_id, 'connection_accepted', NEW.id);
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_notification_preferences()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$BEGIN
  INSERT INTO notification_preferences (
    user_id,
    email_enabled,
    connection_requests,
    job_alerts,
    forum_updates,
    follows_activity, -- ADDED
    direct_messages
  )
  VALUES (
    NEW.id,
    true,
    true,
    true,
    true,
    true, -- ADDED
    true
  );
  RETURN NEW;
END;$function$
;

CREATE OR REPLACE FUNCTION public.create_or_get_conversation(other_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$DECLARE
  v_conversation_id uuid;
BEGIN
  SELECT cp1.conversation_id INTO v_conversation_id 
  FROM public.conversation_participants cp1
  JOIN public.conversation_participants cp2
    ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = auth.uid() AND cp2.user_id = other_user_id;

  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  WITH new_convo AS (
    INSERT INTO public.conversations (id)
    VALUES (DEFAULT)
    RETURNING id
  ),
  participant_inserts AS (
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    SELECT id, auth.uid() FROM new_convo
    UNION ALL
    SELECT id, other_user_id FROM new_convo
  )
  SELECT id INTO v_conversation_id FROM new_convo;

  RETURN v_conversation_id;
END;$function$
;

CREATE OR REPLACE FUNCTION public.delete_message(p_message_id bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_thread_id UUID;
  v_space_id UUID;
  v_can_delete BOOLEAN;
BEGIN
  -- Get the message's user_id and thread_id
  SELECT user_id, thread_id INTO v_user_id, v_thread_id
  FROM public.messages WHERE id = p_message_id; -- <-- Compares bigint = bigint
  
  IF v_thread_id IS NULL THEN
    RAISE EXCEPTION 'Message not found.';
  END IF;
  
  -- Get the space_id from the parent thread
  SELECT space_id INTO v_space_id FROM public.threads WHERE id = v_thread_id;
  
  -- Check if user is the message creator OR a space admin/mod
  SELECT (v_user_id = auth.uid() OR
          public.is_space_moderator_or_admin(v_space_id, auth.uid()))
  INTO v_can_delete;
  
  IF NOT v_can_delete THEN
    RAISE EXCEPTION 'You do not have permission to delete this message.';
  END IF;
  
  DELETE FROM public.messages WHERE id = p_message_id; -- <-- Compares bigint = bigint
END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_own_user()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  -- Delete the user's profile from the public 'profiles' table
  delete from public.profiles where id = auth.uid();

  -- Delete the user from the 'auth.users' table
  delete from auth.users where id = auth.uid();
end;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_space(p_space_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_can_delete boolean;
BEGIN
  -- Check if user is space admin or moderator
  SELECT public.is_space_moderator_or_admin(p_space_id, auth.uid())
    INTO v_can_delete;

  IF NOT v_can_delete THEN
    RAISE EXCEPTION 'Only space admins or moderators can delete a space.';
  END IF;

  -- This delete will cascade to memberships and threads
  -- if you ran the prerequisite migration.
  DELETE FROM public.spaces WHERE id = p_space_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_thread(p_thread_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_space_id UUID;
  v_can_delete BOOLEAN;
BEGIN
  SELECT space_id INTO v_space_id FROM public.threads WHERE id = p_thread_id;
  
  IF v_space_id IS NULL THEN
    RAISE EXCEPTION 'Thread not found.';
  END IF;
  
  -- Check if user is creator OR space admin/mod
  SELECT (public.is_thread_creator(p_thread_id, auth.uid()) OR 
          public.is_space_moderator_or_admin(v_space_id, auth.uid()))
  INTO v_can_delete;
  
  IF NOT v_can_delete THEN
    RAISE EXCEPTION 'You do not have permission to delete this thread.';
  END IF;

  -- This delete will cascade to messages
  DELETE FROM public.threads WHERE id = p_thread_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_job_recommendations(target_user_id uuid)
 RETURNS TABLE(job_id uuid, title text, company_name text, location text, job_type job_type, specialization_required text, experience_required text, match_score numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_messages(p_thread_id uuid)
 RETURNS TABLE(id bigint, body text, created_at timestamp with time zone, is_edited boolean, user_id uuid, email text)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
    -- Security Check: RLS on the underlying SELECT is sufficient and more performant.
    -- The SELECT will return zero rows if the user lacks permission.
    RETURN QUERY
    SELECT
        m.id,
        m.body,
        m.created_at,
        m.is_edited,
        m.user_id,
        u.email
    FROM
        public.messages m
    JOIN
        auth.users u ON m.user_id = u.id
    WHERE
        m.thread_id = p_thread_id
    ORDER BY
        m.created_at ASC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_mutual_connections(other_user_id uuid)
 RETURNS SETOF profile_with_status
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  WITH my_friends AS (
    SELECT requester_id AS friend_id FROM user_connections WHERE addressee_id = auth.uid() AND status = 'accepted'
    UNION
    SELECT addressee_id AS friend_id FROM user_connections WHERE requester_id = auth.uid() AND status = 'accepted'
  ),
  their_friends AS (
    SELECT requester_id AS friend_id FROM user_connections WHERE addressee_id = other_user_id AND status = 'accepted'
    UNION
    SELECT addressee_id AS friend_id FROM user_connections WHERE requester_id = other_user_id AND status = 'accepted'
  )
  SELECT
    p.id,
    p.full_name,
    p.profile_picture_url,
    p.current_position,
    p.organization,
    spec.label AS specialization_name,
    loc.label AS location_name,
    
    -- Status Fields
    'connected'::public.connection_status_type AS connection_status, -- Always 'connected' for mutuals
    
    EXISTS (
      SELECT 1
      FROM public.user_follows
      WHERE follower_id = auth.uid() AND followed_id = p.id
    ) AS is_viewer_following
    
  FROM my_friends mf
  INNER JOIN their_friends tf ON mf.friend_id = tf.friend_id
  INNER JOIN profiles p ON p.id = mf.friend_id
  LEFT JOIN specializations spec ON p.specialization_id = spec.id
  LEFT JOIN locations loc ON p.location_id = loc.id
  WHERE
    p.id != auth.uid() -- Filter out the viewer
  LIMIT 10;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_blocked_users()
 RETURNS TABLE(connection_id uuid, blocked_user_id uuid, full_name text, profile_picture_url text, current_position text)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    uc.id as connection_id,
    p.id as blocked_user_id,
    p.full_name,
    p.profile_picture_url,
    p.current_position
  FROM public.user_connections uc
  -- Join to get the BLOCKED user's profile
  JOIN public.profiles p ON uc.addressee_id = p.id
  WHERE
    uc.requester_id = auth.uid() AND uc.status = 'blocked'
  ORDER BY
    p.full_name;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_connections()
 RETURNS TABLE(id uuid, full_name text, profile_picture_url text, current_position text, organization text, location_name text, specialization_name text)
 LANGUAGE plpgsql
 STABLE
AS $function$DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  RETURN QUERY
  WITH my_connections AS (
    -- Get IDs of all accepted connections
    SELECT requester_id AS friend_id
    FROM public.user_connections
    WHERE addressee_id = current_user_id AND status = 'accepted'
    UNION
    SELECT addressee_id AS friend_id
    FROM public.user_connections
    WHERE requester_id = current_user_id AND status = 'accepted'
  )
  -- Join with profiles and related tables to get full details
  SELECT
    p.id,
    p.full_name,
    p.profile_picture_url,
    p.current_position,
    p.organization,
    loc.label as location_name,
    spec.label as specialization_name -- Using label as per our last discussion
  FROM my_connections mc
  JOIN public.profiles p ON mc.friend_id = p.id
  LEFT JOIN public.locations loc ON p.location_id = loc.id
  LEFT JOIN public.specializations spec ON p.specialization_id = spec.id
  ORDER BY p.full_name;
END;$function$
;

CREATE OR REPLACE FUNCTION public.get_my_inbox_conversations()
 RETURNS TABLE(conversation_id uuid, participant_id uuid, participant_full_name text, participant_avatar_url text, is_starred boolean, last_message_id bigint, last_message_content text, last_message_sender_id uuid, last_message_created_at timestamp with time zone, unread_count integer, master_encryption_key text, encrypted_conversation_key text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT
    c.id AS conversation_id,
    other_user.id AS participant_id,
    other_user.full_name AS participant_full_name,
    other_user.profile_picture_url AS participant_avatar_url,
    my_p.is_starred,
    dm.last_message_id,
    dm.last_message_content,
    dm.last_message_sender_id,
    dm.last_message_created_at,
    COALESCE(unread_counts.unread_count, 0) AS unread_count,
    c.master_encryption_key,
    my_p.encrypted_conversation_key
  FROM conversations c
  -- Get MY participant entry
  JOIN conversation_participants my_p
    ON c.id = my_p.conversation_id
  -- Get the OTHER participant's entry
  JOIN conversation_participants other_p
    ON c.id = other_p.conversation_id AND my_p.user_id <> other_p.user_id
  -- Get the OTHER user's profile
  JOIN profiles other_user
    ON other_p.user_id = other_user.id
  -- Get the last message
  LEFT JOIN LATERAL (
    SELECT
      d.id AS last_message_id,
      d.content AS last_message_content,
      d.sender_id AS last_message_sender_id,
      d.created_at AS last_message_created_at
    FROM direct_messages d
    WHERE d.conversation_id = c.id
    ORDER BY d.created_at DESC
    LIMIT 1
  ) dm ON true
  -- Get the unread count
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS unread_count
    FROM direct_messages d2
    WHERE d2.conversation_id = c.id
      AND d2.is_read = false
      AND d2.sender_id <> my_p.user_id
  ) unread_counts ON true
  WHERE
    my_p.user_id = auth.uid() -- <<< This makes the function secure
  ORDER BY
    COALESCE(dm.last_message_created_at, c.updated_at) DESC;
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_unread_inbox_count()
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT COUNT(DISTINCT T.conversation_id)::int
  FROM (
    SELECT dm.conversation_id
    FROM direct_messages AS dm
    WHERE dm.is_read = false
      AND dm.sender_id <> auth.uid()
    ) AS T
    INNER JOIN conversation_participants AS cp
      ON T.conversation_id = cp.conversation_id
      AND cp.user_id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.get_pending_connection_requests()
 RETURNS TABLE(connection_id uuid, requester_id uuid, full_name text, profile_picture_url text, current_position text, organization text, location_name text, specialization_name text, requested_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
AS $function$BEGIN
  RETURN QUERY
  SELECT
    uc.id as connection_id,
    p.id as requester_id,
    p.full_name,
    p.profile_picture_url,
    p.current_position,
    p.organization,
    loc.label as location_name,
    spec.label as specialization_name,
    uc.created_at as requested_at
  FROM public.user_connections uc
  -- Join to get the REQUESTER'S profile
  JOIN public.profiles p ON uc.requester_id = p.id
  LEFT JOIN public.locations loc ON p.location_id = loc.id
  LEFT JOIN public.specializations spec ON p.specialization_id = spec.id
  WHERE
    uc.addressee_id = auth.uid() AND uc.status = 'pending'
  ORDER BY
    uc.created_at DESC;
END;$function$
;

CREATE OR REPLACE FUNCTION public.get_pending_requests(p_space_id uuid)
 RETURNS TABLE(membership_id uuid, user_id uuid, full_name text, profile_picture_url text, requested_at timestamp with time zone, current_position text, organization text, location_name text, specialization_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$BEGIN
    IF NOT public.is_space_moderator_or_admin(p_space_id, auth.uid()) THEN
        RETURN;
    END IF;

    RETURN QUERY
        SELECT
            m.id as membership_id,
            m.user_id,
            p.full_name,
            p.profile_picture_url,
            m.created_at as requested_at,
            p.current_position,
            p.organization,
            loc.label as location_name,
            spec.label as specialization_name
        FROM
            public.memberships m
        JOIN
            public.profiles p ON m.user_id = p.id
        LEFT JOIN
            public.locations loc ON p.location_id = loc.id
        LEFT JOIN
            public.specializations spec ON p.specialization_id = spec.id
        WHERE
            m.space_id = p_space_id AND m.status = 'PENDING'
        ORDER BY
            m.created_at ASC;
END;$function$
;

CREATE OR REPLACE FUNCTION public.get_profile_with_privacy(profile_id uuid, viewer_id uuid DEFAULT auth.uid())
 RETURNS TABLE(id uuid, email text, full_name text, phone text, user_role user_role, current_location text, profile_picture_url text, bio text, years_experience text, is_verified boolean, is_onboarded boolean, created_at timestamp with time zone, updated_at timestamp with time zone, institution text, course text, year_of_study text, current_position text, organization text, specialization text, medical_license text, resume_url text, skills text[], work_experience jsonb, connection_count integer, date_of_birth date, age integer, privacy_settings jsonb, follower_count integer, following_count integer, profile_mode text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    CASE WHEN can_view_field(p.id, 'email', viewer_id) THEN p.email ELSE NULL END,
    p.full_name,
    CASE WHEN can_view_field(p.id, 'phone', viewer_id) THEN p.phone ELSE NULL END,
    p.user_role,
    CASE WHEN can_view_field(p.id, 'current_location', viewer_id)
         THEN COALESCE(loc.label, p.location_other)
         ELSE NULL
    END AS current_location,
    p.profile_picture_url,
    CASE WHEN can_view_field(p.id, 'bio', viewer_id) THEN p.bio ELSE NULL END,
    CASE WHEN can_view_field(p.id, 'years_experience', viewer_id)
         THEN exp.label
         ELSE NULL
    END AS years_experience,
    p.is_verified,
    p.is_onboarded,
    p.created_at,
    p.updated_at,
    CASE WHEN can_view_field(p.id, 'institution', viewer_id)
         THEN COALESCE(inst.label, p.institution_other)
         ELSE NULL
    END AS institution,
    CASE WHEN can_view_field(p.id, 'course', viewer_id)
         THEN COALESCE(cour.label, p.course_other)
         ELSE NULL
    END AS course,
    CASE WHEN can_view_field(p.id, 'year_of_study', viewer_id)
         THEN sy.label
         ELSE NULL
    END AS year_of_study,
    CASE WHEN can_view_field(p.id, 'current_position', viewer_id) THEN p.current_position ELSE NULL END,
    CASE WHEN can_view_field(p.id, 'organization', viewer_id) THEN p.organization ELSE NULL END,
    CASE WHEN can_view_field(p.id, 'specialization', viewer_id)
         THEN COALESCE(spec.label, p.specialization_other)
         ELSE NULL
    END AS specialization,
    CASE WHEN can_view_field(p.id, 'medical_license', viewer_id) THEN p.medical_license ELSE NULL END,
    p.resume_url,
    p.skills,
    CASE WHEN can_view_field(p.id, 'years_experience', viewer_id) THEN p.work_experience ELSE NULL END,
    p.connection_count,
    CASE WHEN can_view_field(p.id, 'date_of_birth', viewer_id) THEN p.date_of_birth ELSE NULL END,
    CASE WHEN can_view_field(p.id, 'date_of_birth', viewer_id) THEN calculate_age(p.date_of_birth) ELSE NULL END,
    CASE WHEN p.id = viewer_id THEN p.privacy_settings ELSE NULL END,
    
    -- ADDED THESE THREE LINES --
    p.follower_count,
    p.following_count,
    p.profile_mode

  FROM public.profiles p
  LEFT JOIN public.locations loc ON p.location_id = loc.id
  LEFT JOIN public.institutions inst ON p.institution_id = inst.id
  LEFT JOIN public.courses cour ON p.course_id = cour.id
  LEFT JOIN public.specializations spec ON p.specialization_id = spec.id
  LEFT JOIN public.student_years sy ON p.student_year_value = sy.value
  LEFT JOIN public.experience_levels exp ON p.experience_level_value = exp.value
  WHERE p.id = profile_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_public_space_id()
 RETURNS uuid
 LANGUAGE sql
 IMMUTABLE
AS $function$ SELECT '00000000-0000-0000-0000-000000000001'::uuid; $function$
;

CREATE OR REPLACE FUNCTION public.get_space_id_for_thread(thread_id_to_check uuid)
 RETURNS uuid
 LANGUAGE sql
 SECURITY DEFINER
AS $function$ SELECT space_id FROM public.threads WHERE id = thread_id_to_check; $function$
;

CREATE OR REPLACE FUNCTION public.get_spaces_with_details()
 RETURNS TABLE(id uuid, creator_id uuid, name text, description text, space_type space_type, join_level space_join_level, created_at timestamp with time zone, creator_full_name text, creator_position text, creator_organization text, creator_specialization text, moderators jsonb)
 LANGUAGE sql
 STABLE
AS $function$
WITH space_moderators AS (
    SELECT
        m.space_id,
        jsonb_agg(
            jsonb_build_object(
                'role', m.role,
                'user_id', p.id,
                'full_name', p.full_name,
                'current_position', p.current_position,
                'organization', p.organization,
                'specialization', spec.label
            )
        ) as moderators
    FROM
        public.memberships m
    JOIN
        public.profiles p ON m.user_id = p.id
    -- NEW: Join to get moderator's specialization name
    LEFT JOIN
        public.specializations spec ON p.specialization_id = spec.id
    WHERE
        m.role IN ('ADMIN', 'MODERATOR') AND m.status = 'ACTIVE'
    GROUP BY
        m.space_id
)
SELECT
    s.id,
    s.creator_id,
    s.name,
    s.description,
    s.space_type,
    s.join_level,
    s.created_at,
    -- Creator's details
    p.full_name as creator_full_name,
    p.current_position as creator_position,
    p.organization as creator_organization,
    spec.label as creator_specialization,
    -- Moderator list
    sm.moderators
FROM
    public.spaces s
-- Join to get creator details
LEFT JOIN
    public.profiles p ON s.creator_id = p.id
-- NEW: Join to get creator's specialization name
LEFT JOIN
    public.specializations spec ON p.specialization_id = spec.id
-- Join to get the aggregated moderator list
LEFT JOIN
    space_moderators sm ON s.id = sm.space_id
ORDER BY
    s.name ASC;
$function$
;

CREATE OR REPLACE FUNCTION public.get_total_partnership_proposals_count()
 RETURNS bigint
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT COUNT(*) FROM public.partnership_proposals;
$function$
;

CREATE OR REPLACE FUNCTION public.get_total_spaces_count()
 RETURNS bigint
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT COUNT(*) FROM public.spaces;
$function$
;

CREATE OR REPLACE FUNCTION public.get_total_users_count()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN (SELECT COUNT(*) FROM auth.users);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_recommendations(target_user_id uuid)
 RETURNS TABLE(id uuid, full_name text, current_location text, specialization text, years_experience text, institution text, course text, organization text, similarity_score numeric, profile_picture_url text)
 LANGUAGE plpgsql
AS $function$BEGIN
  RETURN QUERY
  WITH target_user AS (
    -- Step 1: Get the target user's PROFILE IDs and skills.
    SELECT
      p.location_id as user_location_id,
      p.institution_id as user_institution_id,
      p.course_id as user_course_id, 
      p.organization as user_organization,
      p.specialization_id as user_spec_id,
      p.experience_level_value as user_exp_value,
      p.skills as user_skills
    FROM public.profiles p
    WHERE p.id = target_user_id
  ),
  candidate_users AS (
    -- Step 2: Find all valid candidates and JOIN to get their text values.
    SELECT
      p.id,
      p.full_name,
      p.organization,
      p.skills,
      p.location_id,
      p.institution_id,
      p.course_id,
      p.specialization_id,
      p.experience_level_value,
      p.profile_picture_url,
      loc.label as current_location_text,
      inst.label as institution_text,
      cour.label as course_text,
      spec.label as specialization_text,
      tu.user_location_id,
      tu.user_institution_id,
      tu.user_course_id,
      tu.user_organization,
      tu.user_spec_id,
      tu.user_exp_value,
      tu.user_skills
    FROM public.profiles p
    CROSS JOIN target_user tu
    LEFT JOIN public.locations loc ON p.location_id = loc.id
    LEFT JOIN public.institutions inst ON p.institution_id = inst.id
    LEFT JOIN public.courses cour ON p.course_id = cour.id
    LEFT JOIN public.specializations spec ON p.specialization_id = spec.id
    WHERE
      p.id != target_user_id
      AND p.id NOT IN (
        SELECT CASE
          WHEN requester_id = target_user_id THEN addressee_id
          ELSE requester_id
        END
        FROM public.user_connections
        WHERE (requester_id = target_user_id OR addressee_id = target_user_id)
          AND status IN ('accepted', 'pending')
      )
      AND p.id NOT IN (
        SELECT requester_id FROM public.user_connections WHERE addressee_id = target_user_id AND status = 'blocked'
        UNION
        SELECT addressee_id FROM public.user_connections WHERE requester_id = target_user_id AND status = 'blocked'
      )
  )
  -- Step 3: Calculate the score using the IDs, but return the text values.
  SELECT
    cu.id,
    cu.full_name,
    cu.current_location_text as current_location,
    cu.specialization_text as specialization,
    cu.experience_level_value as years_experience,
    cu.institution_text as institution,
    cu.course_text as course,
    cu.organization,
    (
      COALESCE(CASE WHEN cu.institution_id = cu.user_institution_id THEN 25 ELSE 0 END, 0) +
      COALESCE(CASE WHEN cu.organization = cu.user_organization THEN 25 ELSE 0 END, 0) +
      COALESCE(CASE WHEN cu.location_id = cu.user_location_id THEN 15 ELSE 0 END, 0) +
      COALESCE(CASE WHEN cu.specialization_id = cu.user_spec_id THEN 20 ELSE 0 END, 0) +
      COALESCE(CASE WHEN cu.experience_level_value = cu.user_exp_value THEN 10 ELSE 0 END, 0) +
      COALESCE(CASE WHEN cu.skills && cu.user_skills THEN 15 ELSE 0 END, 0) +
      COALESCE(CASE WHEN cu.course_id = cu.user_course_id THEN 10 ELSE 0 END, 0)
    )::NUMERIC as similarity_score,
    cu.profile_picture_url
  FROM candidate_users cu
  ORDER BY similarity_score DESC;
END;$function$
;

CREATE OR REPLACE FUNCTION public.handle_email_confirmation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.profiles
  SET is_onboarded = TRUE
  WHERE id = NEW.id;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_reply()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF NEW.parent_message_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id,             -- The person who gets the alert (author of parent message)
      actor_id,            -- The person who wrote the reply
      type,                -- 'new_reply'
      entity_id     
    )
    SELECT
      parent_message.user_id, -- The user to notify
      NEW.user_id,            -- The user who wrote the reply (the "actor")
      'new_reply',            -- The notification type
      NEW.thread_id           -- The ID of the thread the reply is in
    FROM
      public.messages AS parent_message
    JOIN
      public.notification_preferences AS p
      ON p.user_id = parent_message.user_id -- Join with their preferences
    WHERE
      parent_message.id = NEW.parent_message_id
      AND parent_message.user_id != NEW.user_id
      AND p.forum_updates = TRUE;
  END IF;
    
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  meta_user_role TEXT;
  mapped_user_role public.user_role; 
BEGIN
  meta_user_role := NEW.raw_user_meta_data ->> 'user_role';
  mapped_user_role := CASE
    WHEN meta_user_role = 'student' THEN 'student'::public.user_role
    WHEN meta_user_role = 'professional' THEN 'professional'::public.user_role
    WHEN meta_user_role = 'premium' THEN 'premium'::public.user_role
    ELSE NULL
  END;

  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    phone,
    date_of_birth, 
    user_role, 
    profile_picture_url,
    bio,
    current_position, 
    organization, 
    medical_license,
    is_onboarded, 
    encryption_salt,

    -- NORMALIZED COLUMNS
    location_id,
    location_other,
    institution_id,
    institution_other,
    course_id,
    course_other,
    specialization_id,
    specialization_other,
    student_year_value,
    experience_level_value

  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NULLIF(NEW.raw_user_meta_data ->> 'phone', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'date_of_birth', '')::date, 
    mapped_user_role,
    NULLIF(NEW.raw_user_meta_data ->> 'profile_picture_url',''),
    NULLIF(NEW.raw_user_meta_data ->> 'bio', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'current_position', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'organization', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'medical_license', ''),
    false, -- Default to false
    NULLIF(NEW.raw_user_meta_data ->> 'encryption_salt',''),

    -- NEW VALUES FROM METADATA
    NULLIF(NEW.raw_user_meta_data ->> 'location_id', '')::uuid,
    NULLIF(NEW.raw_user_meta_data ->> 'location_other', ''),
    
    NULLIF(NEW.raw_user_meta_data ->> 'institution_id', '')::uuid,
    NULLIF(NEW.raw_user_meta_data ->> 'institution_other', ''),
    
    NULLIF(NEW.raw_user_meta_data ->> 'course_id', '')::uuid,
    NULLIF(NEW.raw_user_meta_data ->> 'course_other', ''),
    
    NULLIF(NEW.raw_user_meta_data ->> 'specialization_id', '')::uuid,
    NULLIF(NEW.raw_user_meta_data ->> 'specialization_other', ''),
    
    NULLIF(NEW.raw_user_meta_data ->> 'student_year_value', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'experience_level_value', '')
  );
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_reciprocal_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF (NEW.status = 'accepted' AND OLD.status = 'pending') THEN
    DELETE FROM public.user_connections
    WHERE requester_id = NEW.addressee_id
      AND addressee_id = NEW.requester_id
      AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_global_counter(counter_name_param text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.is_space_member(space_id_to_check uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$ SELECT EXISTS (SELECT 1 FROM public.memberships WHERE space_id = space_id_to_check AND user_id = auth.uid() AND status = 'ACTIVE'); $function$
;

CREATE OR REPLACE FUNCTION public.is_space_moderator_or_admin(p_space_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    is_admin_or_mod BOOLEAN;
    is_creator BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.memberships
        WHERE space_id = p_space_id
          AND user_id = p_user_id -- Check against the passed-in user
          AND status = 'ACTIVE'
          AND (role = 'ADMIN' OR role = 'MODERATOR')
    ) INTO is_admin_or_mod;
    SELECT EXISTS (
        SELECT 1
        FROM public.spaces
        WHERE id = p_space_id
          AND creator_id = p_user_id -- Check against the passed-in user
    ) INTO is_creator;
    RETURN is_admin_or_mod OR is_creator;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_thread_creator(p_thread_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.threads
    WHERE id = p_thread_id 
    AND creator_id = auth.uid()
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_thread_creator(p_thread_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.threads
    WHERE id = p_thread_id 
    AND creator_id = p_user_id
  );
$function$
;

CREATE OR REPLACE FUNCTION public.join_space_as_member(p_space_id uuid)
 RETURNS SETOF memberships
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Security Check: Ensure the target space is a FORUM with an OPEN join_level.
  -- This prevents users from using this function to bypass requests for private spaces.
  IF NOT EXISTS (
    SELECT 1
    FROM public.spaces s
    WHERE s.id = p_space_id AND s.space_type = 'FORUM' AND s.join_level = 'OPEN'
  ) THEN
    RAISE EXCEPTION 'This space is not an open forum and cannot be joined directly.';
  END IF;
  -- Insert the user into the membership table.
  -- If they already have a record (e.g., were previously banned or have a pending request),
  -- this will update their status to ACTIVE.
  RETURN QUERY
  INSERT INTO public.memberships (user_id, space_id, role, status)
  VALUES (auth.uid(), p_space_id, 'MEMBER', 'ACTIVE')
  ON CONFLICT (user_id, space_id) DO UPDATE
  SET status = 'ACTIVE'
  RETURNING *;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.leave_space(p_space_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_creator_id UUID;
BEGIN
  SELECT creator_id INTO v_creator_id FROM public.spaces WHERE id = p_space_id;

  IF v_creator_id = auth.uid() THEN
    RAISE EXCEPTION 'Space creator cannot leave the space. You must delete it or transfer ownership.';
  END IF;
  
  DELETE FROM public.memberships
  WHERE user_id = auth.uid() AND space_id = p_space_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.mark_conversation_as_read(p_conversation_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  UPDATE public.direct_messages
  SET is_read = true
  WHERE
    conversation_id = p_conversation_id
    AND sender_id != auth.uid()
    AND is_read = false;
$function$
;

CREATE OR REPLACE FUNCTION public.post_direct_message(p_conversation_id uuid, p_content text, p_parent_message_id bigint DEFAULT NULL::bigint)
 RETURNS direct_messages
 LANGUAGE plpgsql
AS $function$

DECLARE
    new_message_row public.direct_messages;
BEGIN
    INSERT INTO public.direct_messages (conversation_id, sender_id, content, parent_message_id)
    VALUES (p_conversation_id, auth.uid(), p_content, p_parent_message_id)
    RETURNING *
    INTO new_message_row;
    RETURN new_message_row;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.post_message_with_reply(p_thread_id uuid, p_body text, p_parent_message_id bigint DEFAULT NULL::bigint)
 RETURNS SETOF messages
 LANGUAGE sql
AS $function$INSERT INTO public.messages (
    thread_id,
    body,
    parent_message_id,
    user_id
  )
  VALUES (
    p_thread_id,
    p_body,
    p_parent_message_id,
    (SELECT auth.uid())
  )
  RETURNING *;$function$
;

CREATE OR REPLACE FUNCTION public.remove_connection(user_to_remove_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  DELETE FROM public.user_connections
  WHERE
    -- Case 1: EITHER user can remove an 'accepted' connection
    (
      status = 'accepted' AND
      (
        (requester_id = auth.uid() AND addressee_id = user_to_remove_id) OR
        (requester_id = user_to_remove_id AND addressee_id = auth.uid())
      )
    )
    OR
    -- Case 2: ONLY the requester can withdraw a 'pending' request
    (
      status = 'pending' AND
      requester_id = auth.uid() AND 
      addressee_id = user_to_remove_id
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.request_to_join_space(p_space_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$                           
DECLARE
    v_membership_id UUID;
BEGIN
    INSERT INTO public.memberships (user_id, space_id, status, "role")
    VALUES (auth.uid(), p_space_id, 'PENDING', 'MEMBER')
    ON CONFLICT (user_id, space_id)
    DO NOTHING;
    SELECT id INTO v_membership_id
    FROM public.memberships
    WHERE user_id = auth.uid()
        AND space_id = p_space_id;
    RETURN v_membership_id;
END;                     
$function$
;

CREATE OR REPLACE FUNCTION public.respond_to_connection_request(requester_uuid uuid, response connection_status)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.user_connections
  SET status = response
  WHERE requester_id = requester_uuid AND addressee_id = auth.uid() AND status = 'pending'::public.connection_status;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.send_connection_request(addressee_uuid uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  block_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_connections
    WHERE
      status = 'blocked'::public.connection_status AND
      (requester_id = auth.uid() AND addressee_id = addressee_uuid) OR
      (requester_id = addressee_uuid AND addressee_id = auth.uid())
  ) INTO block_exists;
  IF block_exists THEN
    RETURN;
  END IF;
  INSERT INTO public.user_connections (requester_id, addressee_id, status)
  VALUES (auth.uid(), addressee_uuid, 'pending'::public.connection_status)
  ON CONFLICT (requester_id, addressee_id) DO NOTHING;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.send_system_update_to_all_users(system_actor_id uuid, announcement_entity_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$DECLARE 
  caller_role TEXT;
  caller_id uuid := auth.uid();
BEGIN
  SELECT role INTO caller_role
  FROM public.profiles
  WHERE id = caller_id;
  IF caller_role != 'ADMIN' THEN
    RAISE EXCEPTION 'Not authorized: You must be an admin to run this function';
  END IF;
  INSERT INTO public.notifications (
    user_id,    
    actor_id,   
    type,       
    announcement_id   
  )
  SELECT
    u.id,                 
    system_actor_id,
    'system_update',
    announcement_entity_id
  FROM
    auth.users AS u
  WHERE
    u.id != system_actor_id AND u.id != caller_id;

END;$function$
;

create or replace view "public"."sent_pending_requests" as  SELECT uc.addressee_id,
    uc.created_at AS request_date,
    p.full_name,
    p.profile_picture_url,
    p.current_position,
    p.organization
   FROM (user_connections uc
     JOIN profiles p ON ((uc.addressee_id = p.id)))
  WHERE ((uc.requester_id = auth.uid()) AND (uc.status = 'pending'::connection_status));


CREATE OR REPLACE FUNCTION public.set_conversation_master_key_if_null(p_conversation_id uuid, p_new_key_jwk text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  existing_key_jwk TEXT;
  official_key_jwk TEXT;
BEGIN
  -- Lock the specific conversation row to prevent concurrent updates
  SELECT master_encryption_key INTO existing_key_jwk
  FROM public.conversations
  WHERE id = p_conversation_id
  FOR UPDATE;
  IF existing_key_jwk IS NOT NULL THEN
    -- A key already exists. Another user won the race. Return their key.
    official_key_jwk := existing_key_jwk;
  ELSE
    -- No key exists. We are the first. Set our new key.
    UPDATE public.conversations
    SET master_encryption_key = p_new_key_jwk
    WHERE id = p_conversation_id;
    official_key_jwk := p_new_key_jwk;
  END IF;
  RETURN official_key_jwk;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_message_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.toggle_reaction_dm(p_message_id bigint, p_emoji text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  existing_emoji text;
  is_participant boolean;
BEGIN

  SELECT EXISTS (
      SELECT 1
      FROM public.direct_messages dm
      JOIN public.conversation_participants cp ON dm.conversation_id = cp.conversation_id
      WHERE dm.id = p_message_id AND cp.user_id = auth.uid()
) INTO is_participant;
  IF NOT is_participant THEN
      RETURN json_build_object('error', 'You are not a participant in this conversation.');
  END IF;

  SELECT reaction_emoji INTO existing_emoji
  FROM public.direct_message_reactions
  WHERE message_id = p_message_id AND user_id = auth.uid();

  IF existing_emoji = p_emoji THEN
    DELETE FROM public.direct_message_reactions
    WHERE message_id = p_message_id AND user_id = auth.uid();
    RETURN json_build_object('status', 'removed');
  ELSE
    INSERT INTO public.direct_message_reactions (message_id, user_id, reaction_emoji)
    VALUES (p_message_id, auth.uid(), p_emoji)
    ON CONFLICT (message_id, user_id)
    DO UPDATE SET reaction_emoji = EXCLUDED.reaction_emoji;
    RETURN json_build_object('status', 'set', 'emoji', p_emoji);
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.transfer_space_ownership(p_space_id uuid, p_new_owner_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_active_member BOOLEAN;
BEGIN
  -- 1. Check if the caller is the CURRENT creator
  IF NOT EXISTS (
    SELECT 1 FROM public.spaces
    WHERE id = p_space_id AND creator_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the current space creator can transfer ownership.';
  END IF;

  -- 2. Check if the new owner is a valid, active member
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE space_id = p_space_id
      AND user_id = p_new_owner_id
      AND status = 'ACTIVE'
  ) INTO v_is_active_member;

  IF NOT v_is_active_member THEN
    RAISE EXCEPTION 'New owner must be an active member of the space.';
  END IF;

  -- 3. Perform the transfer
  BEGIN
    -- Step A: Update the spaces table with the new creator
    UPDATE public.spaces
    SET creator_id = p_new_owner_id
    WHERE id = p_space_id;
    
    -- Step B: Promote the new owner to ADMIN
    UPDATE public.memberships
    SET role = 'ADMIN'
    WHERE space_id = p_space_id AND user_id = p_new_owner_id;
    
    -- Step C: Demote the old owner (current user) to ADMIN
    -- (They can choose to leave or be demoted further later)
    UPDATE public.memberships
    SET role = 'ADMIN'
    WHERE space_id = p_space_id AND user_id = auth.uid();
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'An error occurred during ownership transfer. Transaction rolled back.';
  END;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.unblock_user(unblocked_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  DELETE FROM public.user_connections
  WHERE requester_id = auth.uid()
    AND addressee_id = unblocked_user_id
    AND status = 'blocked'::public.connection_status;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_connection_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF (TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status <> 'accepted') THEN
    UPDATE public.profiles SET connection_count = connection_count + 1 WHERE id = NEW.requester_id;
    UPDATE public.profiles SET connection_count = connection_count + 1 WHERE id = NEW.addressee_id;
  END IF;
  IF (TG_OP = 'DELETE' AND OLD.status = 'accepted') THEN
    UPDATE public.profiles SET connection_count = connection_count - 1 WHERE id = OLD.requester_id;
    UPDATE public.profiles SET connection_count = connection_count - 1 WHERE id = OLD.addressee_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE public.conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_member_role(p_membership_id uuid, p_new_role membership_role)
 RETURNS SETOF memberships
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_space_id uuid;
BEGIN
    SELECT space_id INTO v_space_id FROM public.memberships WHERE id = p_membership_id;
    IF NOT public.is_space_moderator_or_admin(v_space_id, auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized: You do not have permission to manage member roles in this space.';
    END IF;

    UPDATE public.memberships
    SET role = p_new_role
    WHERE id = p_membership_id;

    RETURN QUERY
    SELECT * FROM public.memberships
    WHERE id = p_membership_id;

END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_membership_status(p_membership_id uuid, p_new_status membership_status)
 RETURNS SETOF memberships
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    target_space_id uuid;
BEGIN
    SELECT space_id INTO target_space_id FROM public.memberships
    WHERE id = p_membership_id;
    IF NOT public.is_space_moderator_or_admin(target_space_id, auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized: You do not have permission to manage members in this space.';
    END IF;
    UPDATE public.memberships
    SET status = p_new_status
    WHERE id = p_membership_id;

    RETURN QUERY
    SELECT * FROM public.memberships
    WHERE id = p_membership_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_message(p_message_id bigint, p_new_body text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  UPDATE public.messages
  SET
    body = p_new_body,
    is_edited = true, -- <-- Good practice to set this
    updated_at = now()
  WHERE 
    id = p_message_id AND user_id = auth.uid(); -- <-- Checks bigint id and uuid user
$function$
;

CREATE OR REPLACE FUNCTION public.update_thread(p_thread_id uuid, p_new_title text, p_new_description text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_space_id UUID;
  v_can_edit BOOLEAN;
BEGIN
  SELECT space_id INTO v_space_id FROM public.threads WHERE id = p_thread_id;
  
  IF v_space_id IS NULL THEN
    RAISE EXCEPTION 'Thread not found.';
  END IF;
  
  -- Check if user is creator OR space admin/mod
  SELECT (public.is_thread_creator(p_thread_id, auth.uid()) OR 
          public.is_space_moderator_or_admin(v_space_id, auth.uid()))
  INTO v_can_edit;
  
  IF NOT v_can_edit THEN
    RAISE EXCEPTION 'You do not have permission to edit this thread.';
  END IF;
  
  UPDATE public.threads
  SET 
    title = COALESCE(p_new_title, title),
    description = COALESCE(p_new_description, description),
    updated_at = now()
  WHERE id = p_thread_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_thread_metrics_on_delete_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_last_activity timestamptz;
  thread_created_at timestamptz;
BEGIN
  -- Find the new latest message in the thread
  SELECT MAX(created_at) INTO new_last_activity
  FROM public.messages
  WHERE thread_id = OLD.thread_id;
  
  -- Get the thread's creation time as a fallback
  SELECT created_at INTO thread_created_at
  FROM public.threads
  WHERE id = OLD.thread_id;

  -- Update the thread's metrics
  UPDATE public.threads
  SET
    -- Decrement the count, ensuring it doesn't go below zero
    message_count = GREATEST(0, COALESCE(message_count, 1) - 1),
    
    -- Set last activity to the new latest message,
    -- or to the thread's creation time if no messages are left
    last_activity_at = COALESCE(new_last_activity, thread_created_at)
  WHERE id = OLD.thread_id;
  
  RETURN OLD;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_thread_metrics_on_new_message()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- When a new message is inserted, update the corresponding thread.
  UPDATE public.threads
  SET
    -- Increment the message count by one.
    message_count = message_count + 1,
    -- Set the last activity to the timestamp of the new message.
    last_activity_at = NEW.created_at
  WHERE
    id = NEW.thread_id;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN 
  NEW.updated_at = now();
    
  -- We return the modified row.
  RETURN NEW;
END;
$function$
;

create policy "Allow owner to manage their achievements"
on "public"."academic_achievements"
as permissive
for all
to public
using ((auth.uid() = profile_id));


create policy "Allow public read access to achievements"
on "public"."academic_achievements"
as permissive
for select
to public
using (true);


create policy "Allow owner to manage their awards"
on "public"."awards"
as permissive
for all
to public
using ((auth.uid() = profile_id));


create policy "Allow public read access to awards"
on "public"."awards"
as permissive
for select
to public
using (true);


create policy "Allow owner to manage their transition data"
on "public"."career_transitions"
as permissive
for all
to public
using ((auth.uid() = profile_id));


create policy "Allow public read access to transition data"
on "public"."career_transitions"
as permissive
for select
to public
using (true);


create policy "Allow owner to manage their certifications"
on "public"."certifications"
as permissive
for all
to public
using ((auth.uid() = profile_id));


create policy "Allow public read access to certifications"
on "public"."certifications"
as permissive
for select
to public
using (true);


create policy "Allow owner to manage their cocurriculars"
on "public"."cocurriculars"
as permissive
for all
to public
using ((auth.uid() = profile_id));


create policy "Allow public read access to cocurriculars"
on "public"."cocurriculars"
as permissive
for select
to public
using (true);


create policy "Allow owner to manage their content"
on "public"."content_portfolio"
as permissive
for all
to public
using ((auth.uid() = profile_id));


create policy "Allow public read access to content"
on "public"."content_portfolio"
as permissive
for select
to public
using (true);


create policy "Allow connected read access on education_history"
on "public"."education_history"
as permissive
for select
to authenticated
using (((auth.uid() = profile_id) OR are_users_connected(auth.uid(), profile_id)));


create policy "Allow individual delete access on education_history"
on "public"."education_history"
as permissive
for delete
to public
using ((auth.uid() = profile_id));


create policy "Allow individual insert access on education_history"
on "public"."education_history"
as permissive
for insert
to public
with check ((auth.uid() = profile_id));


create policy "Allow individual read access on education_history"
on "public"."education_history"
as permissive
for select
to public
using ((auth.uid() = profile_id));


create policy "Allow individual update access on education_history"
on "public"."education_history"
as permissive
for update
to public
using ((auth.uid() = profile_id));


create policy "Allow owner to read their own stats"
on "public"."profile_analytics"
as permissive
for select
to public
using ((auth.uid() = profile_id));


create policy "Authenticated users can view profiles"
on "public"."profiles"
as permissive
for select
to authenticated
using (true);


create policy "Allow owner to manage their publications"
on "public"."publications"
as permissive
for all
to public
using ((auth.uid() = profile_id));


create policy "Allow public read access to publications"
on "public"."publications"
as permissive
for select
to public
using (true);


create policy "Users can view all their own connection rows"
on "public"."user_connections"
as permissive
for select
to public
using (((auth.uid() = requester_id) OR (auth.uid() = addressee_id)));


create policy "All users can read follow relationships"
on "public"."user_follows"
as permissive
for select
to public
using (true);


create policy "Users can follow/unfollow"
on "public"."user_follows"
as permissive
for all
to public
using ((auth.uid() = follower_id));


create policy "Allow owner to manage their ventures"
on "public"."ventures"
as permissive
for all
to public
using ((auth.uid() = profile_id));


create policy "Allow public read access to ventures"
on "public"."ventures"
as permissive
for select
to public
using (true);


create policy "Allow connected read access on work_experiences"
on "public"."work_experiences"
as permissive
for select
to authenticated
using (((auth.uid() = profile_id) OR are_users_connected(auth.uid(), profile_id)));


create policy "Allow individual delete access on work_experiences"
on "public"."work_experiences"
as permissive
for delete
to public
using ((auth.uid() = profile_id));


create policy "Allow individual insert access on work_experiences"
on "public"."work_experiences"
as permissive
for insert
to public
with check ((auth.uid() = profile_id));


create policy "Allow individual read access on work_experiences"
on "public"."work_experiences"
as permissive
for select
to public
using ((auth.uid() = profile_id));


create policy "Allow individual update access on work_experiences"
on "public"."work_experiences"
as permissive
for update
to public
using ((auth.uid() = profile_id));


CREATE TRIGGER on_new_dm_notify_recipient AFTER INSERT ON public.direct_messages FOR EACH ROW EXECUTE FUNCTION notify_on_new_direct_message();

CREATE TRIGGER handle_education_history_updated_at BEFORE UPDATE ON public.education_history FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_new_reply_notify_author AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION notify_on_new_reply_to_message();

CREATE TRIGGER on_new_public_space_notify_followers AFTER INSERT ON public.spaces FOR EACH ROW EXECUTE FUNCTION notify_followers_on_new_public_space();

CREATE TRIGGER on_new_public_post_notify_followers AFTER INSERT ON public.threads FOR EACH ROW EXECUTE FUNCTION notify_followers_on_new_public_post();

CREATE TRIGGER on_follow_change AFTER INSERT OR DELETE ON public.user_follows FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

CREATE TRIGGER handle_work_experiences_updated_at BEFORE UPDATE ON public.work_experiences FOR EACH ROW EXECUTE FUNCTION handle_updated_at();



