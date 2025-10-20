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

  if (messageCount < MIN_MESSAGES) {
    throw new AppError(
      `At least ${MIN_MESSAGES} messages are required to generate a summary. This thread only has ${messageCount}.`,
      400
    );
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

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new AppError("Missing Authorization header. Please log in.", 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
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

    if (!threadId) {
      throw new AppError("thread_id is required", 400);
    }

    const summary = await summarizeLastMessages(userSupabase, threadId, limit);
    
    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("summarize-last error:", err);
    if (err instanceof AppError) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: err.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: "internal_error", details: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
