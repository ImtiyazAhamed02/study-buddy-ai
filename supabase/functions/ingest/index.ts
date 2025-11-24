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
    const { content, mode } = await req.json();
    
    if (!content || !mode) {
      throw new Error('Content and mode are required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    // Detect domain using AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
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
            content: 'You are a domain classifier. Analyze the text and respond with ONLY ONE WORD: the academic domain (Medicine, Engineering, History, Mathematics, Biology, Chemistry, Physics, Computer Science, Literature, or General).'
          },
          {
            role: 'user',
            content: `Classify this text:\n\n${content.substring(0, 1000)}`
          }
        ],
        max_tokens: 10
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI error:', await aiResponse.text());
      throw new Error('AI classification failed');
    }

    const aiData = await aiResponse.json();
    const domain = aiData.choices[0].message.content.trim();

    // Create ingest record
    const { data: ingestData, error: ingestError } = await supabase
      .from('ingests')
      .insert({
        user_id: user.id,
        content,
        domain,
        source_type: 'text'
      })
      .select()
      .single();

    if (ingestError) throw ingestError;

    return new Response(
      JSON.stringify({ ingestId: ingestData.id, domain }),
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
