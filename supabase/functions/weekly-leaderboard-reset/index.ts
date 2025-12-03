// supabase/functions/weekly-leaderboard-reset/index.ts
// This Edge Function runs every Sunday at midnight IST to:
// 1. Calculate top 5 weekly winners
// 2. Award +10 bonus points
// 3. Record winners in leaderboard_weekly
// 4. Reset weekly scores

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate current week number (ISO week)
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(
      ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
    );

    // Get start date of current week (Monday)
    const currentDay = now.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const weekStartDate = new Date(now);
    weekStartDate.setDate(now.getDate() + mondayOffset);
    weekStartDate.setHours(0, 0, 0, 0);

    console.log(`Processing Week ${weekNumber}, starting ${weekStartDate.toISOString()}`);

    // Get week end date (Sunday)
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    weekEndDate.setHours(23, 59, 59, 999);

    // Calculate weekly scores from submissions in the past week
    const { data: weeklyScores, error: scoresError } = await supabase.rpc(
      "calculate_weekly_scores",
      {
        week_start: weekStartDate.toISOString(),
        week_end: weekEndDate.toISOString(),
      }
    );

    if (scoresError) {
      console.error("Error calculating weekly scores:", scoresError);
      throw scoresError;
    }

    console.log(`Found ${weeklyScores?.length || 0} participants this week`);

    // Get top 5 winners
    const top5Winners = weeklyScores?.slice(0, 5) || [];

    if (top5Winners.length === 0) {
      console.log("No participants this week, skipping bonus awards");
      return new Response(
        JSON.stringify({ message: "No participants this week" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Award +10 bonus to top 5 and record in leaderboard_weekly
    const leaderboardInserts = [];
    const profileUpdates = [];

    for (let i = 0; i < top5Winners.length; i++) {
      const winner = top5Winners[i];
      const rank = i + 1;

      // Prepare leaderboard insert
      leaderboardInserts.push({
        user_id: winner.user_id,
        week_number: weekNumber,
        week_start_date: weekStartDate.toISOString().split("T")[0],
        weekly_score: winner.weekly_score,
        rank: rank,
        bonus_awarded: true,
      });

      // Prepare profile update (add +10 bonus)
      profileUpdates.push(
        supabase
          .from("profiles")
          .update({
            quiz_total_score: supabase.raw("quiz_total_score + 10"),
            updated_at: new Date().toISOString(),
          })
          .eq("id", winner.user_id)
      );
    }

    // Insert into leaderboard_weekly
    const { error: insertError } = await supabase
      .from("leaderboard_weekly")
      .upsert(leaderboardInserts, { onConflict: "user_id,week_number" });

    if (insertError) {
      console.error("Error inserting leaderboard records:", insertError);
      throw insertError;
    }

    // Award bonuses to all top 5
    await Promise.all(profileUpdates);

    console.log(`✅ Awarded +10 bonus to top ${top5Winners.length} winners`);

    // Return summary
    return new Response(
      JSON.stringify({
        success: true,
        week_number: weekNumber,
        week_start: weekStartDate.toISOString(),
        winners_count: top5Winners.length,
        top_winners: top5Winners.map((w, i) => ({
          rank: i + 1,
          user_id: w.user_id,
          weekly_score: w.weekly_score,
        })),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in weekly reset:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
