'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import AudioRecorder from '@/components/AudioRecorder';
import VerseResults from '@/components/VerseResults';
import { matchVerse, MatchResult } from '@/lib/matcher';

export default function Home() {
  const [showResults, setShowResults] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [matchedVerse, setMatchedVerse] = useState<MatchResult | null>(null);

  const handleRecordingComplete = async (transcript: string, blob?: Blob) => {
    setIsAnalyzing(true);
    setShowResults(false);
    
    try {
      const formData = new FormData();
      formData.append("transcript", transcript);
      if (blob) {
        formData.append("audio", blob, "recording.wav");
      }

      const response = await fetch("/api/match", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setMatchedVerse(data.match);
      } else {
        console.warn("API response failed, falling back to local matching");
        const match = matchVerse(transcript);
        setMatchedVerse(match);
      }
    } catch (err) {
      console.error("Failed to connect to API, falling back to local matching:", err);
      const match = matchVerse(transcript);
      setMatchedVerse(match);
    } finally {
      setIsAnalyzing(false);
      setShowResults(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <HeroSection />
      
      {/* Main App Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Try VerseFinder Now
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Record yourself speaking a Bible verse, or upload an audio file to see our recognition in action
            </p>
          </div>
          
          {/* Toggle between recorder and results for demo */}
          <div className="space-y-8">
            <AudioRecorder onRecordingComplete={handleRecordingComplete} />
            
            <div className="text-center">
              <button
                onClick={() => {
                  if (!showResults) {
                    const fallback = matchVerse("For God so loved the world");
                    setMatchedVerse(fallback);
                  }
                  setShowResults(!showResults);
                  setIsAnalyzing(false);
                }}
                className="text-primary hover:text-primary/80 underline text-sm"
              >
                {showResults ? 'Try Another Verse' : 'See Demo Results'}
              </button>
            </div>
            
            {isAnalyzing && (
              <div className="text-center py-12 animate-pulse space-y-4">
                <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted-foreground text-sm">Analyzing audio patterns & matching scripture database...</p>
              </div>
            )}
            
            {showResults && !isAnalyzing && <VerseResults matchedVerse={matchedVerse} />}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground">
              Three simple steps to find any Bible verse
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Record or Upload',
                description: 'Speak a Bible verse or upload an audio file containing scriptural content'
              },
              {
                step: '2', 
                title: 'AI Recognition',
                description: 'Our advanced AI converts speech to text and matches it with our Bible database'
              },
              {
                step: '3',
                title: 'Get Results',
                description: 'Receive the verse reference, text, context, and related passages instantly'
              }
            ].map((item) => (
              <div key={item.step} className="text-center p-6 rounded-lg bg-card shadow-divine">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-2xl font-bold text-primary-foreground mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <div className="text-2xl font-bold text-primary mb-2">VerseFinder</div>
          <p className="text-muted-foreground mb-6">
            Discover the Word through voice recognition
          </p>
          <p className="text-sm text-muted-foreground">
            © 2025 VerseFinder. Built with faith and technology.
          </p>
        </div>
      </footer>
    </div>
  );
}
