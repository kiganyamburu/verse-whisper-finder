import { useState } from 'react';
import { Copy, Share2, Heart, BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const VerseResults = () => {
  const [translation, setTranslation] = useState('NIV');
  
  // Mock data for demonstration
  const verseData = {
    reference: 'John 3:16',
    text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
    context: 'Jesus explains the nature of God\'s love and salvation to Nicodemus',
    confidence: 94,
    chapter: 'John 3',
    theme: 'God\'s Love & Salvation'
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Confidence Badge */}
      <div className="text-center">
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Sparkles className="h-4 w-4 mr-2" />
          {verseData.confidence}% Match Confidence
        </Badge>
      </div>

      {/* Main Result Card */}
      <Card className="shadow-divine">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold text-primary">{verseData.reference}</h2>
          </div>
          
          {/* Translation Selector */}
          <Select value={translation} onValueChange={setTranslation}>
            <SelectTrigger className="w-32 mx-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NIV">NIV</SelectItem>
              <SelectItem value="ESV">ESV</SelectItem>
              <SelectItem value="KJV">KJV</SelectItem>
              <SelectItem value="NASB">NASB</SelectItem>
              <SelectItem value="NLT">NLT</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Verse Text */}
          <blockquote className="text-lg leading-relaxed text-center italic border-l-4 border-primary pl-6 py-4 bg-muted/30 rounded-r-lg">
            "{verseData.text}"
          </blockquote>

          {/* Context Information */}
          <div className="bg-gradient-hero p-4 rounded-lg">
            <h4 className="font-semibold text-primary mb-2">Context & Theme</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Chapter:</span>
                <Badge variant="outline">{verseData.chapter}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Theme:</span>
                <Badge variant="outline">{verseData.theme}</Badge>
              </div>
              <p className="text-muted-foreground text-sm mt-2">
                {verseData.context}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-2" />
              Copy Verse
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Heart className="h-4 w-4 mr-2" />
              Save to Favorites
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Related Verses */}
      <Card>
        <CardHeader>
          <h4 className="font-semibold">Related Verses</h4>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {['Romans 5:8', '1 John 4:9', 'John 14:6'].map((verse) => (
              <div key={verse} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                <span className="font-medium text-primary">{verse}</span>
                <Button variant="ghost" size="sm">
                  View
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerseResults;