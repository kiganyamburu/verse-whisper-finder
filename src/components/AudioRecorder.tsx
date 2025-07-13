import { useState } from 'react';
import { Mic, Square, Upload, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setHasRecording(true);
    } else {
      setIsRecording(true);
      setHasRecording(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-divine">
      <CardContent className="p-8 text-center">
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Record or Upload Audio</h3>
          <p className="text-muted-foreground">
            Speak or play a Bible verse to identify it
          </p>
        </div>

        {/* Waveform Visualization */}
        <div className="mb-8 h-20 flex items-end justify-center gap-1">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={`w-2 bg-gradient-primary rounded-full ${
                isRecording ? 'animate-waveform' : 'h-2'
              }`}
              style={{
                animationDelay: `${i * 0.1}s`,
                height: isRecording ? 'auto' : '8px'
              }}
            />
          ))}
        </div>

        {/* Record Button */}
        <div className="flex flex-col items-center gap-4">
          <Button
            size="lg"
            onClick={toggleRecording}
            className={`w-20 h-20 rounded-full ${
              isRecording 
                ? 'bg-destructive hover:bg-destructive/90 animate-recording shadow-glow' 
                : 'bg-gradient-primary hover:shadow-glow'
            }`}
          >
            {isRecording ? (
              <Square className="h-8 w-8" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </Button>
          
          <p className="text-sm text-muted-foreground">
            {isRecording ? 'Recording... Tap to stop' : 'Tap and hold to record'}
          </p>
        </div>

        {/* Upload Option */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" className="flex-1">
              <Upload className="h-4 w-4 mr-2" />
              Upload Audio
            </Button>
            {hasRecording && (
              <Button variant="outline" size="icon">
                <Volume2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AudioRecorder;