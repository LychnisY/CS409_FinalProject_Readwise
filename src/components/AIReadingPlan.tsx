import { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  ChevronRight,
  Plus,
  Loader2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import type { Book } from '../App';
import { toast } from 'sonner';
import { API_BASE } from '../config';
interface AIReadingPlanProps {
  onAddBook: Omit<
    Book,
    'id' | 'addedDate' | 'status' | 'progress' | 'pagesRead' | 'lastRead'
  > extends infer T
    ? (book: T) => void
    : never;
  isBookInLibrary: (title: string, author: string) => boolean;
}

export function AIReadingPlan({ onAddBook, isBookInLibrary }: AIReadingPlanProps) {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);

  const difficultyColors = {
    Beginner:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    Intermediate:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    Advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };

  const coverColors = [
    'from-indigo-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-green-600',
    'from-amber-500 to-orange-600',
    'from-pink-500 to-rose-600',
    'from-teal-500 to-cyan-600',
    'from-violet-500 to-purple-600',
  ];



const handleGenerate = async (e: React.FormEvent) => {
  e.preventDefault();
  const trimmedTopic = topic.trim();
  if (!trimmedTopic) return;

  const token = localStorage.getItem('readwise_jwt');
  if (!token) {
    toast.error('Please log in first.');
    return;
  }

  setIsGenerating(true);
  setGeneratedPlan(null);

  try {
    const res = await fetch(API_BASE+'/api/ai/reading-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ topic: trimmedTopic }),
    });

    if (!res.ok) {
      toast.error('Failed to generate reading plan.');
      console.error('Failed to generate reading plan');
      return;
    }

    const data = await res.json();
    console.log('AI /api/ai/reading-plan response:', data);


    if (data.plan) {
      setGeneratedPlan(data.plan);
      return;
    }


    if (typeof data.rawText === 'string' && data.rawText.trim().length > 0) {
      try {
        const parsed = JSON.parse(data.rawText);

        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.subtopics)) {
          setGeneratedPlan(parsed);
          return;
        }
      } catch (e) {
        console.error('Failed to parse rawText as JSON:', e, data.rawText);
      }

      setGeneratedPlan({
        topic: trimmedTopic,
        estimatedTime: '3-6 months',
        difficulty: 'Progressive',
        subtopics: [
          {
            id: 1,
            title: 'AI Suggestions',
            description: `AI generated reading ideas for ${trimmedTopic}`,
            books: [
              {
                title: trimmedTopic,
                author: 'AI Assistant',
                difficulty: 'Beginner',
                totalPages: 320,
              },
            ],
          },
        ],
      });
      return;
    }



    toast.error('AI did not return a valid reading plan.');
  } catch (err) {
    console.error(err);
    toast.error('Error generating reading plan.');
  } finally {
    setIsGenerating(false);
  }
};


  const handleAddSingleBook = (book: any, index: number) => {
    if (!generatedPlan) return;

    onAddBook({
      title: book.title,
      author: book.author,
      coverColor: coverColors[index % coverColors.length],
      totalPages: book.totalPages,
      category: generatedPlan.topic,
      rating: 4.5,
      description: `A comprehensive guide to ${generatedPlan.topic}.`,
    });
    toast.success(`"${book.title}" added to your library!`);
  };

  const handleAddAllBooks = () => {
    if (!generatedPlan) return;

    let booksAdded = 0;
    generatedPlan.subtopics.forEach((subtopic: any) => {
      subtopic.books.forEach((book: any, index: number) => {
        if (!isBookInLibrary(book.title, book.author)) {
          onAddBook({
            title: book.title,
            author: book.author,
            coverColor: coverColors[index % coverColors.length],
            totalPages: book.totalPages,
            category: generatedPlan.topic,
            rating: 4.5,
            description: `A comprehensive guide to ${generatedPlan.topic}.`,
          });
          booksAdded++;
        }
      });
    });

    if (booksAdded > 0) {
      toast.success(
        `${booksAdded} book${booksAdded > 1 ? 's' : ''} added to your library!`,
      );
    } else {
      toast.info('All books are already in your library.');
    }
  };

  const handleGenerateNewPlan = () => {
    setGeneratedPlan(null);
    // 你可以选择是否清空 topic，这里我先保留原来的 topic，方便改 prompt 再点
    // setTopic('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-indigo-500" />
          AI Reading Plan
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Enter a topic you're interested in and AI will generate a personalized
          reading roadmap
        </p>
      </div>

      {/* Input Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create a New Reading Plan</CardTitle>
          <CardDescription>
            Tell us what you want to learn and we'll recommend a structured
            learning path
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Learning Topic</Label>
              <Input
                id="topic"
                placeholder="e.g., Psychology, Investing, Artificial Intelligence..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full gap-2"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI is generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Reading Plan
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Generated Plan */}
      {generatedPlan && (
        <div className="space-y-6">
          {/* Plan Overview */}
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border-indigo-200 dark:border-indigo-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-gray-900 dark:text-white mb-2">
                    {generatedPlan.topic} Learning Roadmap
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <span>Estimated Time:</span>
                      <span>{generatedPlan.estimatedTime}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <span>Difficulty:</span>
                      <span>{generatedPlan.difficulty}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <span>
                        {generatedPlan.subtopics.reduce(
                          (acc: number, st: any) => acc + st.books.length,
                          0,
                        )}{' '}
                        books total
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subtopics and Books */}
          <div className="space-y-6">
            {generatedPlan.subtopics.map((subtopic: any, index: number) => (
              <Card key={subtopic.id}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-full flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="mb-1">{subtopic.title}</CardTitle>
                      <CardDescription>
                        {subtopic.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {subtopic.books.map((book: any, bookIndex: number) => (
                      <div
                        key={bookIndex}
                        className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                      >
                        <div className="w-12 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-gray-900 dark:text-white mb-1">
                            {book.title}
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400">
                            {book.author}
                          </p>
                        </div>
                        <Badge
                          className={
                            difficultyColors[
                              book.difficulty as keyof typeof difficultyColors
                            ]
                          }
                        >
                          {book.difficulty}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() =>
                            handleAddSingleBook(book, bookIndex)
                          }
                        >
                          <Plus className="w-4 h-4" />
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <Card className="bg-gray-50 dark:bg-gray-800">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="flex-1 gap-2" onClick={handleAddAllBooks}>
                  <Plus className="w-4 h-4" />
                  Add All Books to Library
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleGenerateNewPlan}
                >
                  <Sparkles className="w-4 h-4" />
                  Generate New Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Example Topics */}
      {!generatedPlan && (
        <Card>
          <CardHeader>
            <CardTitle>Popular Learning Topics</CardTitle>
            <CardDescription>Click to get started quickly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                'Psychology',
                'Investing',
                'AI & Machine Learning',
                'Product Design',
                'Leadership',
                'Communication Skills',
              ].map((example) => (
                <Button
                  key={example}
                  variant="outline"
                  onClick={() => setTopic(example)}
                  className="justify-start gap-2"
                >
                  <ChevronRight className="w-4 h-4" />
                  {example}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
