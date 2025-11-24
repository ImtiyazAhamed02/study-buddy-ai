import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const Quiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  useEffect(() => {
    if (questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmitAnswer();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, questions]);

  const loadQuiz = async () => {
    try {
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*, question_packs(*)')
        .eq('id', quizId)
        .single();

      if (quizError) throw quizError;

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('pack_id', quizData.pack_id)
        .order('created_at', { ascending: true });

      if (questionsError) throw questionsError;
      setQuestions(questionsData);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    const question = questions[currentIndex];
    const isCorrect = userAnswer.trim().toLowerCase() === question.answer.trim().toLowerCase();

    try {
      await supabase.from('quiz_responses').insert({
        quiz_id: quizId,
        question_id: question.id,
        user_answer: userAnswer || 'No answer',
        is_correct: isCorrect,
        time_taken: 60 - timeLeft
      });

      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setUserAnswer('');
        setTimeLeft(60);
      } else {
        await finishQuiz();
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const finishQuiz = async () => {
    try {
      // Calculate score
      const { data: responses, error: responsesError } = await supabase
        .from('quiz_responses')
        .select('*')
        .eq('quiz_id', quizId);

      if (responsesError) throw responsesError;

      const correctCount = responses.filter(r => r.is_correct).length;
      const totalScore = Math.round((correctCount / questions.length) * 100);

      await supabase
        .from('quizzes')
        .update({
          finished_at: new Date().toISOString(),
          total_score: totalScore
        })
        .eq('id', quizId);

      toast.success(`Quiz completed! Score: ${totalScore}%`);
      navigate(`/results/${quizId}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Question {currentIndex + 1} of {questions.length}</h2>
            <Progress value={progress} className="mt-2 w-64" />
          </div>
          <div className="flex items-center gap-2 text-xl font-bold">
            <Clock className={`w-5 h-5 ${timeLeft < 10 ? 'text-destructive' : 'text-primary'}`} />
            <span className={timeLeft < 10 ? 'text-destructive' : ''}>{timeLeft}s</span>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{currentQuestion.prompt}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentQuestion.question_type === 'mcq' ? (
              <RadioGroup value={userAnswer} onValueChange={setUserAnswer}>
                {(currentQuestion.options as string[]).map((option, i) => (
                  <div key={i} className="flex items-center space-x-2 p-3 rounded hover:bg-accent/50 cursor-pointer">
                    <RadioGroupItem value={option} id={`option-${i}`} />
                    <Label htmlFor={`option-${i}`} className="flex-1 cursor-pointer">
                      {String.fromCharCode(65 + i)}. {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <Input
                placeholder="Type your answer here..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="text-lg"
              />
            )}

            <Button
              onClick={handleSubmitAnswer}
              className="w-full"
              size="lg"
              disabled={!userAnswer.trim()}
            >
              {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Quiz;
