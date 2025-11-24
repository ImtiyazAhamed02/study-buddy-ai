import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Sparkles, Baby, FileQuestion, ArrowLeft, Loader2 } from 'lucide-react';

const Summary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ingest, setIngest] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [eli5Mode, setEli5Mode] = useState(false);
  const [eli5Text, setEli5Text] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      // Load ingest
      const { data: ingestData, error: ingestError } = await supabase
        .from('ingests')
        .select('*')
        .eq('id', id)
        .single();

      if (ingestError) throw ingestError;
      setIngest(ingestData);

      // Load or generate summary
      const { data: summaryData, error: summaryError } = await supabase
        .from('summaries')
        .select('*')
        .eq('ingest_id', id)
        .maybeSingle();

      if (summaryData) {
        setSummary(summaryData);
      } else {
        // Generate summary with default mode from context or query params
        await generateSummary('topper');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async (mode: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('summarize', {
        body: { ingestId: id, mode }
      });

      if (error) throw error;
      setSummary(data.summary);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEli5 = async () => {
    if (eli5Mode) {
      setEli5Mode(false);
      return;
    }

    try {
      setEli5Mode(true);
      const { data, error } = await supabase.functions.invoke('eli5', {
        body: { summaryId: summary.id }
      });

      if (error) throw error;
      setEli5Text(data.eli5Text);
    } catch (error: any) {
      toast.error(error.message);
      setEli5Mode(false);
    }
  };

  const handleGenerateQuestions = async () => {
    setGeneratingQuestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-questions', {
        body: { ingestId: id, mode: summary?.mode || 'topper' }
      });

      if (error) throw error;
      toast.success('Questions generated!');
      navigate(`/questions/${data.packId}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setGeneratingQuestions(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button onClick={() => navigate('/')} variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Upload
        </Button>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Study Summary</CardTitle>
              <Badge variant="secondary" className="capitalize">
                {ingest?.domain}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!eli5Mode ? (
              <>
                <div className="prose prose-sm max-w-none">
                  <p className="text-foreground whitespace-pre-wrap">{summary?.summary_text}</p>
                </div>

                {summary?.highlights && (
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Key Highlights
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {summary.highlights.map((highlight: string, i: number) => (
                        <li key={i}>{highlight}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="prose prose-sm max-w-none bg-secondary/30 p-4 rounded-lg">
                <p className="text-foreground whitespace-pre-wrap">{eli5Text}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button onClick={handleEli5} variant="outline" className="flex-1">
                <Baby className="w-4 h-4 mr-2" />
                {eli5Mode ? 'Show Original' : 'Explain Like I\'m 5'}
              </Button>
              <Button
                onClick={handleGenerateQuestions}
                disabled={generatingQuestions}
                className="flex-1"
              >
                {generatingQuestions ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileQuestion className="w-4 h-4 mr-2" />
                    Generate Questions
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Summary;
