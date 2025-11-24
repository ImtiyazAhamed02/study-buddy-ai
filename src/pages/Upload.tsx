import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMode } from '@/contexts/ModeContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Brain, Upload as UploadIcon, LogOut } from 'lucide-react';

const Upload = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, signOut } = useAuth();
  const { mode, setMode } = useMode();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast.error('Please enter some text');
      return;
    }

    setLoading(true);
    try {
      // Call edge function to detect domain and create ingest
      const { data, error } = await supabase.functions.invoke('ingest', {
        body: { content: text, mode }
      });

      if (error) throw error;

      toast.success(`Material uploaded! Domain: ${data.domain}`);
      navigate(`/summary/${data.ingestId}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload material');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
              <Brain className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">ScholarGen</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button onClick={signOut} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Upload Study Material</CardTitle>
            <CardDescription>
              Paste your text or notes below, choose your learning mode, and let AI help you master it
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="mode" className="text-base font-semibold">Select Learning Mode</Label>
              <RadioGroup value={mode} onValueChange={(value: any) => setMode(value)} className="grid grid-cols-2 gap-4">
                <div>
                  <RadioGroupItem value="topper" id="topper" className="peer sr-only" />
                  <Label
                    htmlFor="topper"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-topper-primary peer-data-[state=checked]:bg-topper-secondary cursor-pointer transition-all"
                  >
                    <div className="text-2xl mb-2">🎯</div>
                    <div className="text-center">
                      <div className="font-bold">Topper Mode</div>
                      <div className="text-xs text-muted-foreground mt-1">Deep learning, detailed questions</div>
                    </div>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="pass" id="pass" className="peer sr-only" />
                  <Label
                    htmlFor="pass"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-pass-primary peer-data-[state=checked]:bg-pass-secondary cursor-pointer transition-all"
                  >
                    <div className="text-2xl mb-2">✅</div>
                    <div className="text-center">
                      <div className="font-bold">Pass Mode</div>
                      <div className="text-xs text-muted-foreground mt-1">Quick revision, key points</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="text">Your Study Material</Label>
              <Textarea
                id="text"
                placeholder="Paste your lecture notes, textbook content, or any study material here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[300px] resize-none"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                'Processing...'
              ) : (
                <>
                  <UploadIcon className="w-4 h-4 mr-2" />
                  Upload & Analyze
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Upload;
