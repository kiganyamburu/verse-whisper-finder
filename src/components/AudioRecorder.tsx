'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Upload, Volume2, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface AudioRecorderProps {
  onRecordingComplete?: (url: string) => void;
}

const AudioRecorder = ({ onRecordingComplete }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlaying(false);
      audioRef.current = audio;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setHasRecording(true);
        stream.getTracks().forEach((track) => track.stop());
        if (onRecordingComplete) {
          onRecordingComplete(url);
        }
      };

      recorder.start();
      setIsRecording(true);
      setHasRecording(false);
      setAudioUrl(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast({
        title: "Microphone Access Error",
        description: "Please allow microphone access to record audio.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setHasRecording(true);
      if (onRecordingComplete) {
        onRecordingComplete(url);
      }
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
            {isRecording ? 'Recording... Tap to stop' : 'Tap to record'}
          </p>
        </div>

        {/* Upload & Playback Option */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center justify-center gap-4">
            <label className="flex-1 cursor-pointer">
              <div className="flex items-center justify-center border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                <Upload className="h-4 w-4 mr-2" />
                Upload Audio
              </div>
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
            {hasRecording && (
              <Button variant="outline" size="icon" onClick={togglePlayback} className="w-10 h-10">
                {isPlaying ? (
                  <Pause className="h-4 w-4 text-primary" />
                ) : (
                  <Volume2 className="h-4 w-4 text-primary" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AudioRecorder;