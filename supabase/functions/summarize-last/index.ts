// supabase/functions/summarize-last/index.ts

import { createClient } from "npm:@supabase/supabase-js@2";
import type { Database } from "../types.ts";

// Custom Error Class
class AppError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}

const MIN_MESSAGES = 50;
const MAX_PAYLOAD_CHARS = 15000;

async function summarizeLastMessages(
  userSupabase: ReturnType<typeof createClient<Database>>,
  threadId: string,
  limit = 50
) {
  const cappedLimit = Math.max(50, Math.min(limit, 100));

  const { data, error } = await userSupabase
    .from("messages")
    .select("id, body, created_at, user_id")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .limit(cappedLimit);

  if (error) {
    console.error("Database query failed:", error);
    if (error.code === '42501' || error.message?.includes("security policy")) {
       throw new AppError("Access denied. You may not have permission to view these messages.", 403);
    }
    throw new AppError("Failed to fetch messages from the database.", 500);
  }

  const messageCount = data?.length ?? 0;

  console.log(`Thread ${threadId}: Found ${messageCount} messages`);

  if (messageCount < MIN_MESSAGES) {
    const errorMsg = `At least ${MIN_MESSAGES} messages are required to generate a summary. This thread only has ${messageCount} message${messageCount === 1 ? '' : 's'}.`;
    console.error(errorMsg);
    throw new AppError(errorMsg, 400);
  }

  let messages = (data || []).map((m) => m.body).join("\n").trim();

  if (!messages) {
    throw new AppError(
      "Cannot generate a summary. The selected messages are all empty.",
      400
    );
  }

  if (messages.length > MAX_PAYLOAD_CHARS) {
    console.warn(`Truncating messages for thread ${threadId}`);
    messages = messages.substring(0, MAX_PAYLOAD_CHARS) + 
      "\n... [Message log truncated due to length] ...";
  }

  let summary: string;
  try {
    // @ts-ignore - Supabase.ai is available in the edge runtime
    const model = new Supabase.ai.Session("gpt-5-mini");
    
    summary = await model.run(
      `You are an expert conversation summarizer. Below is a series of messages from a discussion thread. Summarize the main points, notable decisions, and action items clearly and concisely in 2–3 short paragraphs. Avoid mentioning individual message authors, but preserve the overall flow and tone. Ensure the summary is easy to understand and useful for someone not familiar with the conversation.

Messages:
${messages}

Summary:`,
      { stream: false, max_tokens: 250 }
    );
  } catch (aiError) {
    console.error("Supabase AI model.run() failed:", aiError);
    throw new AppError(
      "The AI summary service is temporarily unavailable. Please try again later.",
      503
    );
  }

  return {
    thread_id: threadId,
    message_count: messageCount,
    latest_message_at: data?.[0]?.created_at ?? null,
    ai_summary: summary,
  };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Or your specific frontend URL for production
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Request received: ${req.method} ${req.url}`);

  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(JSON.stringify({ message: "ok" }), {
      status: 200,
      headers: corsHeaders,
    });
  }
  
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing Authorization header");
      throw new AppError("Missing Authorization header. Please log in.", 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("Missing environment variables");
      throw new AppError("Missing environment variables", 500);
    }

    const userSupabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const url = new URL(req.url);
    const threadId = url.searchParams.get("thread_id");
    const limit = Number(url.searchParams.get("limit")) || 50;

    console.log(`Processing summary request for thread: ${threadId}, limit: ${limit}`);

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("Missing environment variables");
      throw new AppError("Missing environment variables", 500);
    }
    
    const userSupabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const url = new URL(req.url);
    const threadId = url.searchParams.get("thread_id");
    const limit = Number(url.searchParams.get("limit")) || 50;

    console.log(`Processing summary request for thread: ${threadId}, limit: ${limit}`);

    if (!threadId) {
      throw new AppError("thread_id is required", 400);
    }

    const summary = await summarizeLastMessages(userSupabase, threadId, limit);
    
    const duration = Date.now() - startTime;
    console.log(`[SUCCESS] Summary generated in ${duration}ms`);
    
    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { 
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Response-Time": `${duration}ms`
      },
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`[ERROR] Failed after ${duration}ms:`, err);
    
    if (err instanceof AppError) {
      console.error(`AppError [${err.status}]: ${err.message}`);
      return new Response(JSON.stringify({ 
        error: err.message,
        status: err.status 
      }), {
        status: err.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ 
      error: "internal_error", 
      details: String(err),
      message: err instanceof Error ? err.message : "Unknown error"
    }), {
      status: 500,
      headers: {...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
