import { ArrowDown, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroImage from '@/assets/hero-image.jpg';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-hero overflow-hidden">
      {/* Hero Image Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Spiritual Bible with light and sound waves"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
              Find Any{' '}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Bible Verse
              </span>{' '}
              by Voice
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Just like Shazam for music, VerseFinder identifies Bible verses from spoken audio in seconds
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            {[
              'Instant Recognition',
              'Multiple Translations', 
              'Context & Commentary',
              'Save & Share'
            ].map((feature) => (
              <div key={feature} className="bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border">
                {feature}
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-gradient-primary hover:shadow-glow text-lg px-8 py-6">
              Start Recording
              <ArrowDown className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 border-t border-border/50">
            {[
              { number: '31K+', label: 'Bible Verses' },
              { number: '50+', label: 'Translations' },
              { number: '95%', label: 'Accuracy' },
              { number: '<5s', label: 'Recognition Time' }
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary mb-1">
                  {stat.number}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl animate-pulse-glow" />
      <div className="absolute bottom-32 right-16 w-32 h-32 bg-secondary/10 rounded-full blur-xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
    </section>
  );
};

export default HeroSection;