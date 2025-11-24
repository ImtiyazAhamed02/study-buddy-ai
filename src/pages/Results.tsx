import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Trophy, Target, Clock, Home, Loader2 } from 'lucide-react';

const Results = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [quizId]);

  const loadResults = async () => {
    try {
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (quizError) throw quizError;
      setQuiz(quizData);

      const { data: responsesData, error: responsesError } = await supabase
        .from('quiz_responses')
        .select('*, questions(*)')
        .eq('quiz_id', quizId);

      if (responsesError) throw responsesError;
      setResponses(responsesData);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const correctCount = responses.filter(r => r.is_correct).length;
  const totalTime = responses.reduce((sum, r) => sum + r.time_taken, 0);
  const avgTime = Math.round(totalTime / responses.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
                <Trophy className="w-14 h-14 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-4xl mb-2">Quiz Complete!</CardTitle>
            <div className="text-5xl font-bold text-primary my-4">{quiz?.total_score}%</div>
            <p className="text-muted-foreground">
              You got {correctCount} out of {responses.length} questions correct
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-primary/5">
                <CardContent className="flex items-center gap-3 p-4">
                  <Target className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Accuracy</p>
                    <p className="text-2xl font-bold">{Math.round((correctCount / responses.length) * 100)}%</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-accent/5">
                <CardContent className="flex items-center gap-3 p-4">
                  <Clock className="w-8 h-8 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Time</p>
                    <p className="text-2xl font-bold">{avgTime}s</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="pt-4">
              <h3 className="font-semibold mb-3">Question Breakdown</h3>
              <div className="space-y-2">
                {responses.map((response, index) => (
                  <div key={response.id} className="flex items-center justify-between p-3 rounded bg-muted/30">
                    <div className="flex items-center gap-3">
                      {response.is_correct ? (
                        <Badge className="bg-green-500">Correct</Badge>
                      ) : (
                        <Badge variant="destructive">Wrong</Badge>
                      )}
                      <span className="text-sm">Question {index + 1}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{response.time_taken}s</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={() => navigate('/')} className="flex-1">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Results;
