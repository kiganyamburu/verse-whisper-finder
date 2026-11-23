'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Upload, Volume2, Pause, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface AudioRecorderProps {
  onRecordingComplete?: (transcript: string, blob?: Blob) => void;
}

// Detect best supported audio MIME type across desktop and mobile browsers
const getSupportedAudioConfig = (): { mimeType: string; extension: string } => {
  if (typeof window === 'undefined' || !window.MediaRecorder) {
    return { mimeType: '', extension: 'webm' };
  }

  const formats = [
    { mimeType: 'audio/webm;codecs=opus', extension: 'webm' },
    { mimeType: 'audio/webm', extension: 'webm' },
    { mimeType: 'audio/mp4;codecs=mp4a.40.2', extension: 'mp4' },
    { mimeType: 'audio/mp4', extension: 'mp4' },
    { mimeType: 'audio/aac', extension: 'aac' },
    { mimeType: 'audio/ogg;codecs=opus', extension: 'ogg' },
    { mimeType: 'audio/ogg', extension: 'ogg' },
    { mimeType: 'audio/wav', extension: 'wav' },
  ];

  for (const fmt of formats) {
    try {
      if (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(fmt.mimeType)) {
        return fmt;
      }
    } catch {
      // Continue to next format
    }
  }

  return { mimeType: '', extension: 'mp4' };
};

const DEFAULT_BAR_HEIGHTS = [12, 18, 26, 35, 45, 52, 40, 28, 38, 48, 32, 22, 16, 12, 16, 14];

const AudioRecorder = ({ onRecordingComplete }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [visualizerBars, setVisualizerBars] = useState<number[]>(DEFAULT_BAR_HEIGHTS);

  const isRecordingRef = useRef<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);
  const audioConfigRef = useRef<{ mimeType: string; extension: string }>({ mimeType: '', extension: 'webm' });
  const transcriptRef = useRef<string>('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Web Audio API refs for real-time frequency analysis
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const { toast } = useToast();

  // Check speech recognition support once on mount
  useEffect(() => {
    const hasSpeechRecognition = typeof window !== 'undefined' && 
      !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    setIsSpeechSupported(hasSpeechRecognition);
  }, []);

  // Sync playback audio element
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

  // Clean up all audio contexts and streams
  const cleanupAudio = useCallback(() => {
    isRecordingRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      mediaStreamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    analyserRef.current = null;
    setVisualizerBars(DEFAULT_BAR_HEIGHTS);
  }, []);

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  const startRecording = async () => {
    if (isStarting || isRecording) return;
    setIsStarting(true);

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }

      transcriptRef.current = '';
      setLiveTranscript('');
      setRecordingSeconds(0);

      const isMobile = typeof window !== 'undefined' && (
        /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 2)
      );

      // 1. START SPEECH RECOGNITION SYNCHRONOUSLY (Directly in the user gesture event loop!)
      const SpeechRecognition = typeof window !== 'undefined' && 
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          // Mobile Safari and Android are much more reliable with continuous=false
          rec.continuous = !isMobile;
          rec.interimResults = true;
          rec.lang = typeof navigator !== 'undefined' ? (navigator.language || 'en-US') : 'en-US';

          rec.onresult = (event: any) => {
            let interim = '';
            let final = '';

            for (let i = 0; i < event.results.length; ++i) {
              const res = event.results[i];
              if (res.isFinal) {
                final += res[0].transcript + ' ';
              } else {
                interim += res[0].transcript;
              }
            }

            const current = (final + interim).trim();
            if (current) {
              setLiveTranscript(current);
              transcriptRef.current = current;
            }
          };

          rec.onerror = (e: any) => {
            if (e.error !== 'no-speech' && e.error !== 'aborted') {
              console.warn("Speech recognition notice:", e.error);
            }
          };

          // On mobile, if single utterance ends while still recording, gracefully restart
          rec.onend = () => {
            if (isRecordingRef.current && isMobile) {
              try {
                rec.start();
              } catch {}
            }
          };

          rec.start();
          recognitionRef.current = rec;
        } catch (recErr) {
          console.warn("Synchronous speech recognition notice:", recErr);
        }
      }

      // 2. ACQUIRE MICROPHONE STREAM FOR AUDIO RECORDING
      let stream: MediaStream | null = null;
      if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
        } catch (constraintErr) {
          console.warn("Advanced audio constraints rejected, falling back to basic audio:", constraintErr);
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          } catch (basicErr) {
            console.warn("Basic getUserMedia failed or denied:", basicErr);
          }
        }
      }

      mediaStreamRef.current = stream;

      // If both getUserMedia and SpeechRecognition are unavailable, notify the user clearly
      if (!stream && !recognitionRef.current) {
        cleanupAudio();
        setIsRecording(false);
        setIsStarting(false);
        toast({
          title: "Microphone Access Required",
          description: "Please tap 'Allow' when your browser asks for microphone permission, or use the search box below.",
          variant: "destructive",
        });
        return;
      }

      // 3. Setup MediaRecorder if stream was acquired
      if (stream) {
        const config = getSupportedAudioConfig();
        audioConfigRef.current = config;
        
        let recorder: MediaRecorder;
        try {
          recorder = config.mimeType
            ? new MediaRecorder(stream, { mimeType: config.mimeType })
            : new MediaRecorder(stream);
        } catch {
          recorder = new MediaRecorder(stream);
        }

        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          const finalMime = recorder.mimeType || config.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: finalMime });
          const url = URL.createObjectURL(audioBlob);

          setAudioUrl(url);
          setHasRecording(true);
          audioBlobRef.current = audioBlob;

          cleanupAudio();

          if (onRecordingComplete) {
            onRecordingComplete(transcriptRef.current.trim(), audioBlob);
          }
        };

        // On iOS Safari, recorder.start(timeslice) throws NotSupportedError for MP4 container.
        // We start safely without timeslice fallback.
        try {
          recorder.start(1000);
        } catch {
          recorder.start();
        }
      }

      // 4. Connect Web Audio Visualizer (Non-blocking progressive enhancement)
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx && stream) {
          const audioCtx = new AudioCtx();
          if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
          }

          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.75;

          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const updateWaveform = () => {
            if (analyserRef.current) {
              analyserRef.current.getByteFrequencyData(dataArray);

              const barCount = 16;
              const newHeights: number[] = [];

              for (let i = 0; i < barCount; i++) {
                const binIndex = Math.min(bufferLength - 1, Math.floor((i / barCount) * 22));
                const value = dataArray[binIndex] || 0;
                const percent = Math.min(100, Math.max(12, Math.round((value / 255) * 100)));
                newHeights.push(percent);
              }

              setVisualizerBars(newHeights);
            } else {
              // Pulsing fallback animation
              const t = Date.now() / 250;
              setVisualizerBars(DEFAULT_BAR_HEIGHTS.map((h, i) => 
                Math.min(90, Math.max(15, Math.round(h * (0.8 + 0.35 * Math.sin(t + i * 0.45)))))
              ));
            }
            animationFrameRef.current = requestAnimationFrame(updateWaveform);
          };

          animationFrameRef.current = requestAnimationFrame(updateWaveform);
        } else {
          // Synthetic visualizer loop when AudioContext is unavailable on mobile
          const updateSynthetic = () => {
            const t = Date.now() / 250;
            setVisualizerBars(DEFAULT_BAR_HEIGHTS.map((h, i) => 
              Math.min(90, Math.max(15, Math.round(h * (0.8 + 0.35 * Math.sin(t + i * 0.45)))))
            ));
            animationFrameRef.current = requestAnimationFrame(updateSynthetic);
          };
          animationFrameRef.current = requestAnimationFrame(updateSynthetic);
        }
      } catch (audioErr) {
        console.warn("Visualizer setup note:", audioErr);
      }

      // 5. Mark recording active
      isRecordingRef.current = true;
      setIsRecording(true);
      setHasRecording(false);
      setAudioUrl(null);
      audioBlobRef.current = null;

      // Start recording timer
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      cleanupAudio();
      setIsRecording(false);
      toast({
        title: "Microphone Access Error",
        description: "Please check your browser permissions to allow microphone access, or type your verse below.",
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn("Error stopping recognition:", e);
      }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn("Error stopping MediaRecorder:", e);
      }
    } else {
      // In case speech recognition was used exclusively without a media stream
      cleanupAudio();
      if (onRecordingComplete) {
        onRecordingComplete(transcriptRef.current.trim(), undefined);
      }
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
      audioBlobRef.current = file;
      setLiveTranscript('');

      if (onRecordingComplete) {
        onRecordingComplete('', file);
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-divine">
      <CardContent className="p-6 sm:p-8 text-center">
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Record or Upload Audio</h3>
          <p className="text-muted-foreground text-sm">
            Speak a Bible verse or upload an audio file to identify scripture
          </p>

          {!isSpeechSupported && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/50 py-1.5 px-3 rounded-full mx-auto max-w-sm">
              <Info className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span>Browser speech recognition unavailable. Audio capture or text search will be used.</span>
            </div>
          )}
        </div>

        {/* Real-time Audio Waveform Visualizer */}
        <div className="mb-6 h-20 flex items-center justify-center gap-1.5 px-4 bg-muted/20 border border-border/40 rounded-xl">
          {visualizerBars.map((heightPercent, i) => (
            <div
              key={i}
              className={`w-2 rounded-full transition-all duration-75 ${
                isRecording
                  ? 'bg-gradient-to-t from-primary to-primary-glow shadow-[0_0_8px_hsl(var(--primary)/0.5)]'
                  : 'bg-muted-foreground/30'
              }`}
              style={{
                height: isRecording
                  ? `${Math.max(10, Math.round((heightPercent / 100) * 60))}px`
                  : `${Math.round((heightPercent / 100) * 50)}px`,
              }}
            />
          ))}
        </div>

        {/* Live Transcript Preview */}
        {isRecording && (
          <div className="mb-4 min-h-[1.5rem] text-sm text-primary font-medium italic animate-pulse">
            {liveTranscript ? `“${liveTranscript}”` : "Listening for scripture..."}
          </div>
        )}

        {/* Record Button & Timer */}
        <div className="flex flex-col items-center gap-3">
          <Button
            size="lg"
            type="button"
            disabled={isStarting}
            onClick={toggleRecording}
            className={`w-20 h-20 rounded-full transition-transform active:scale-95 touch-manipulation select-none cursor-pointer ${
              isRecording
                ? 'bg-destructive hover:bg-destructive/90 shadow-glow animate-pulse'
                : 'bg-gradient-primary hover:shadow-glow'
            }`}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isStarting ? (
              <Loader2 className="h-8 w-8 text-primary-foreground animate-spin" />
            ) : isRecording ? (
              <Square className="h-8 w-8 text-destructive-foreground" />
            ) : (
              <Mic className="h-8 w-8 text-primary-foreground" />
            )}
          </Button>

          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {isStarting
                ? 'Initializing microphone...'
                : isRecording
                ? `Recording... (${formatTime(recordingSeconds)})`
                : 'Tap to record'}
            </p>
            {isRecording && (
              <p className="text-xs text-muted-foreground mt-0.5">Tap the square button when finished speaking</p>
            )}
          </div>
        </div>

        {/* Upload & Playback Option */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center justify-center gap-4">
            <label className="flex-1 cursor-pointer">
              <div className="flex items-center justify-center border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors touch-manipulation">
                <Upload className="h-4 w-4 mr-2" />
                Upload Audio File
              </div>
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
            {hasRecording && (
              <Button
                variant="outline"
                size="icon"
                type="button"
                onClick={togglePlayback}
                className="w-10 h-10 shrink-0 touch-manipulation"
                title={isPlaying ? "Pause audio" : "Play recorded audio"}
              >
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
