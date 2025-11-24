import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Play, Zap, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';

const Questions = () => {
  const { packId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<any[]>([]);
  const [pack, setPack] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showingSpan, setShowingSpan] = useState<string | null>(null);

  useEffect(() => {
    loadQuestions();
  }, [packId]);

  const loadQuestions = async () => {
    try {
      const { data: packData, error: packError } = await supabase
        .from('question_packs')
        .select('*')
        .eq('id', packId)
        .single();

      if (packError) throw packError;
      setPack(packData);

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('pack_id', packId)
        .order('created_at', { ascending: true });

      if (questionsError) throw questionsError;
      setQuestions(questionsData);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async () => {
    try {
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          pack_id: packId,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (quizError) throw quizError;
      navigate(`/quiz/${quizData.id}`);
    } catch (error: any) {
      toast.error(error.message);
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
        <Button onClick={() => navigate(-1)} variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Practice Questions</h1>
            <Badge variant="secondary" className="mt-2 capitalize">{pack?.mode} Mode</Badge>
          </div>
          <div className="flex gap-3">
            <Button onClick={startQuiz}>
              <Play className="w-4 h-4 mr-2" />
              Start Quiz
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card key={question.id} className="shadow-md">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    Question {index + 1}
                    <Badge variant="outline" className="ml-2 capitalize">
                      {question.question_type}
                    </Badge>
                  </CardTitle>
                  <Badge className={
                    question.difficulty === 'hard' ? 'bg-destructive' :
                    question.difficulty === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }>
                    {question.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-medium">{question.prompt}</p>
                
                {question.options && (
                  <div className="space-y-2">
                    {(question.options as string[]).map((option, i) => (
                      <div key={i} className="p-2 rounded bg-muted/50 text-sm">
                        {String.fromCharCode(65 + i)}. {option}
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-4 border-t">
                  <p className="text-sm font-semibold text-primary mb-2">Answer:</p>
                  <p className="text-sm bg-primary/10 p-3 rounded">{question.answer}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Rationale:</p>
                  <p className="text-sm text-muted-foreground">{question.rationale}</p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowingSpan(showingSpan === question.id ? null : question.id)}
                >
                  {showingSpan === question.id ? (
                    <>
                      <EyeOff className="w-3 h-3 mr-2" />
                      Hide Source
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3 mr-2" />
                      Show Source
                    </>
                  )}
                </Button>

                {showingSpan === question.id && (
                  <div className="mt-2 p-3 bg-accent/10 rounded text-xs italic">
                    "{question.supporting_span}"
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Questions;
