import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ingestId, mode } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    const { data: ingest, error: ingestError } = await supabase
      .from('ingests')
      .select('*')
      .eq('id', ingestId)
      .single();

    if (ingestError) throw ingestError;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const difficulty = mode === 'topper' ? 'hard' : 'medium';
    const systemPrompt = `Generate EXACTLY 5 questions from the provided text:
- 2 MCQs (multiple choice with 3 options each, one correct)
- 2 Short Answer questions
- 1 Analytical question

Each question MUST include:
- id (unique string)
- type (mcq/short/analytical)
- prompt (the question)
- options (array of 3 strings for MCQ only)
- answer (correct answer)
- rationale (explanation why)
- supportingSpan (exact verbatim quote from source text)
- difficulty ("${difficulty}")

Return ONLY valid JSON with "questions" array. NO repetition. Each supportingSpan MUST exist verbatim in the source text.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: ingest.content
          }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI error:', await aiResponse.text());
      throw new Error('AI question generation failed');
    }

    const aiData = await aiResponse.json();
    const result = JSON.parse(aiData.choices[0].message.content);

    // Create question pack
    const { data: pack, error: packError } = await supabase
      .from('question_packs')
      .insert({
        ingest_id: ingestId,
        user_id: user.id,
        mode
      })
      .select()
      .single();

    if (packError) throw packError;

    // Insert questions
    const questionsToInsert = result.questions.map((q: any) => ({
      pack_id: pack.id,
      question_type: q.type,
      prompt: q.prompt,
      options: q.options || null,
      answer: q.answer,
      rationale: q.rationale,
      supporting_span: q.supportingSpan,
      difficulty: q.difficulty
    }));

    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questionsToInsert);

    if (questionsError) throw questionsError;

    return new Response(
      JSON.stringify({ packId: pack.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
