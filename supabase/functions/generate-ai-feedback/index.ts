// supabase/functions/generate-ai-feedback/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QuestionAnswer {
  question_id: string;
  level: number;
  difficulty: string;
  question_text: string;
  selected_option: number;
  is_correct: boolean;
  time_taken_seconds: number;
  correct_answer_text: string;
  topic_area: string; // e.g., "AI Ethics", "DPDP Act", "Clinical ML"
}

interface RequestBody {
  user_id: string;
  topic_id: string;
  day_number: number;
  topic_title: string;
  answers: QuestionAnswer[];
  user_profile?: {
    user_role: string; // 'student' or 'professional'
    current_position?: string;
    student_year_value?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body: RequestBody = await req.json();
    const { user_id, topic_id, day_number, topic_title, answers, user_profile } = body;

    // Validate input
    if (!user_id || !topic_id || !answers || answers.length === 0) {
      throw new Error("Missing required fields: user_id, topic_id, or answers");
    }

    // Calculate performance metrics
    const totalQuestions = answers.length;
    const correctAnswers = answers.filter(a => a.is_correct).length;
    const accuracyRate = (correctAnswers / totalQuestions) * 100;
    const avgTime = answers.reduce((sum, a) => sum + a.time_taken_seconds, 0) / totalQuestions;
    
    // Analyze by level
    const levelPerformance = answers.reduce((acc, a) => {
      if (!acc[a.level]) acc[a.level] = { correct: 0, total: 0 };
      acc[a.level].total++;
      if (a.is_correct) acc[a.level].correct++;
      return acc;
    }, {} as Record<number, { correct: number; total: number }>);
    
    // Identify weak areas
    const incorrectAnswers = answers.filter(a => !a.is_correct);
    const weakTopics = incorrectAnswers.map(a => a.topic_area || a.difficulty);

    // Build enhanced prompt for Gemini
    const prompt = `You are an expert medical educator and career mentor for the "Beyond the Clinic" Quiz League - a national competition focusing on AI in healthcare, digital health, and medical innovation.

**CONTEXT:**
- Day ${day_number}: ${topic_title}
- User Profile: ${user_profile?.user_role === 'student' ? `Medical Student (Year ${user_profile.student_year_value || 'Unknown'})` : `Healthcare Professional (${user_profile?.current_position || 'Practitioner'})`}
- Questions Answered: ${totalQuestions}/5
- Score: ${correctAnswers}/${totalQuestions} (${accuracyRate.toFixed(1)}%)
- Average Time per Question: ${avgTime.toFixed(1)} seconds

**LEVEL-WISE PERFORMANCE:**
${Object.entries(levelPerformance).map(([level, perf]) => 
  `Level ${level} (${['Intern', 'Resident', 'Consultant', 'Medical Director', 'Minister/CEO'][parseInt(level)-1]}): ${perf.correct}/${perf.total} correct`
).join('\n')}

**QUESTIONS BREAKDOWN:**
${answers.map((a, i) => `
Question ${i+1} (Level ${a.level} - ${a.difficulty}):
- Question: "${a.question_text.substring(0, 150)}..."
- User's Answer: Option ${a.selected_option} ${a.is_correct ? '✓ CORRECT' : '✗ WRONG'}
- Correct Answer: "${a.correct_answer_text}"
- Time Taken: ${a.time_taken_seconds}s
${!a.is_correct ? `- Knowledge Gap: ${a.topic_area || 'General'}` : ''}
`).join('\n')}

**YOUR TASK:**
Analyze this performance and provide:

1. **DYNAMIC PERSONA GENERATION:**
   - Create a unique, creative, and professional 2-4 word Title/Persona for this user based on their specific performance.
   - Do NOT use a fixed list. Invent a title that captures their specific blend of strengths.
   - Examples (Do not copy, just for inspiration): "Clinical Data Strategist", "Ethical AI Guardian", "Fast-Track Policy Maker", "Digital Health Skeptic", "Precision Medicine Architect".
   - If they failed mostly technical questions, maybe "Emerging Clinical Leader".
   - If they aced legal questions, maybe "Future Medico-Legal Authority".

2. **PERSONALIZED FEEDBACK** (2-3 sentences):
   - Start with what they did well (be specific about which levels/topics)
   - Identify their primary weakness (based on incorrect answers and weak topics: ${weakTopics.join(', ')})
   - Provide actionable advice with context from Indian healthcare (mention ABDM, DPDP Act, or relevant frameworks if applicable)
   - Keep tone encouraging but honest - this is a competitive league
   - ${accuracyRate === 100 ? 'Acknowledge their perfect score and challenge them to maintain it' : ''}
   - ${avgTime < 30 ? 'Note: They answered very quickly - encourage deeper thinking' : ''}

3. **REMEDIAL QUESTIONS** (Generate EXACTLY 2 questions):
   - Focus on the topics where they made mistakes: ${weakTopics.slice(0, 2).join(' and ')}
   - Questions should be at the level they struggled with most (Level ${Object.entries(levelPerformance).find(([_, perf]) => perf.correct / perf.total < 0.5)?.[0] || 3})
   - Use the SAME format as the original quiz (scenario-based, Indian context, realistic)
   - Include 4 options (A, B, C, D)
   - Provide the correct answer index (0-3)
   - Add a brief explanation (2-3 sentences)

**OUTPUT FORMAT (STRICT JSON, NO MARKDOWN):**
{
  "persona": "Your dynamically generated 2-4 word title",
  "feedback": "2-3 sentences of personalized feedback...",
  "career_insight": "One sentence about what role they might excel in...",
  "remedial_questions": [
    {
      "question": "Full question text...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer_index": 0,
      "explanation": "..."
    },
    {
      "question": "Second question...",
      "options": ["...", "...", "...", "..."],
      "correct_answer_index": 2,
      "explanation": "..."
    }
  ]
}

**CRITICAL RULES:**
- Output ONLY valid JSON, no markdown code blocks.
- Persona must be creative and unique to this user's run.
- Reference specific Indian healthcare contexts (ABDM, DPDP, Ayushman Bharat) where relevant.
- If they scored 5/5, still generate remedial questions to deepen understanding.`;

    // Call Gemini API
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    console.log("Calling Gemini API for user:", user_id);

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.8, // Slightly higher temperature for more creative personas
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
            responseMimeType: "application/json", 
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API Error:", errorText);
      throw new Error(`Gemini API failed: ${geminiResponse.status} - ${errorText}`);
    }

    const aiData = await geminiResponse.json();
    
    if (!aiData.candidates || aiData.candidates.length === 0) {
      throw new Error("No response from Gemini API");
    }

    let generatedText = aiData.candidates[0].content.parts[0].text;
    
    // Robust JSON extraction
    generatedText = generatedText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    let cleanJson;
    try {
      cleanJson = JSON.parse(generatedText);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanJson = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not extract valid JSON from Gemini response");
      }
    }

    // Validate required fields
    if (!cleanJson.persona || !cleanJson.feedback || !cleanJson.remedial_questions) {
      throw new Error("Invalid response structure from Gemini");
    }

    // Add career_insight to feedback if present
    const fullFeedback = cleanJson.career_insight 
      ? `${cleanJson.feedback}\n\n💡 ${cleanJson.career_insight}`
      : cleanJson.feedback;

    // Save to database
    console.log("Saving AI analysis to database...");
    
    const { error } = await supabase.rpc("save_daily_ai_analysis", {
      p_user_id: user_id,
      p_topic_id: topic_id,
      p_feedback: fullFeedback,
      p_remedial_data: cleanJson.remedial_questions,
      p_persona: cleanJson.persona, // Now dynamic
    });

    if (error) {
      console.error("Database Error:", error);
      throw error;
    }

    console.log(`✅ AI feedback saved: "${cleanJson.persona}" assigned to user ${user_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        persona: cleanJson.persona,
        feedback: fullFeedback,
        remedial_questions_count: cleanJson.remedial_questions.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Function Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
