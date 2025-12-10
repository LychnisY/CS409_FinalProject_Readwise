import { useState } from 'react';
import { Search, Plus, Star, TrendingUp, BookOpen, Check, ArrowLeft } from 'lucide-react';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import type { Book } from '../App';
import { toast } from 'sonner';

interface SearchPageProps {
  onAddBook: (
    book: Omit<Book, 'id' | 'addedDate' | 'status' | 'progress' | 'pagesRead' | 'lastRead'>
  ) => void;
  isBookInLibrary: (title: string, author: string) => boolean;
}

type TopicBook = {
  title: string;
  author: string;
  category: string;
  rating: number;
  description: string;
  coverColor: string;
  totalPages: number;
};

export function SearchPage({ onAddBook, isBookInLibrary }: SearchPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);


  const [aiBooks, setAiBooks] = useState<TopicBook[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [aiRawText, setAiRawText] = useState<string | null>(null);

  const trendingBooks: TopicBook[] = [
    {
      title: 'The Courage to Be Disliked',
      author: 'Ichiro Kishimi',
      category: 'Psychology',
      rating: 4.5,
      description:
        "A dialogue-based introduction to Adlerian psychology that helps readers break free from others' expectations and courageously be themselves.",
      coverColor: 'from-amber-500 to-orange-600',
      totalPages: 288,
    },
    {
      title: 'The Almanack of Naval Ravikant',
      author: 'Eric Jorgenson',
      category: 'Business',
      rating: 4.7,
      description:
        "A collection of Naval Ravikant's wisdom on wealth, happiness, and life, offering a fresh path to success for modern readers.",
      coverColor: 'from-blue-500 to-indigo-600',
      totalPages: 242,
    },
    {
      title: 'Nonviolent Communication',
      author: 'Marshall Rosenberg',
      category: 'Communication',
      rating: 4.6,
      description:
        'Learn how to communicate effectively through four steps: observation, feeling, needs, and requests to resolve conflicts and build harmonious relationships.',
      coverColor: 'from-green-500 to-emerald-600',
      totalPages: 220,
    },
    {
      title: 'The Power of Habit',
      author: 'Charles Duhigg',
      category: 'Self-Improvement',
      rating: 4.4,
      description:
        'Reveals the science behind habit formation and teaches you how to reshape your life by changing your habit loops for lasting positive change.',
      coverColor: 'from-purple-500 to-pink-600',
      totalPages: 371,
    },
    {
      title: "Man's Search for Meaning",
      author: 'Viktor Frankl',
      category: 'Philosophy',
      rating: 4.8,
      description:
        'A Holocaust survivor’s psychological observations exploring how humans find meaning and value even in the most extreme circumstances.',
      coverColor: 'from-red-500 to-rose-600',
      totalPages: 184,
    },
    {
      title: 'Flow',
      author: 'Mihaly Csikszentmihalyi',
      category: 'Psychology',
      rating: 4.5,
      description:
        'Explores the psychology of optimal experience and teaches you how to achieve true happiness and fulfillment through complete immersion.',
      coverColor: 'from-cyan-500 to-blue-600',
      totalPages: 303,
    },
  ];


  const topicBooks: Record<string, TopicBook[]> = {
    Psychology: [
      {
        title: 'The Courage to Be Disliked',
        author: 'Ichiro Kishimi',
        category: 'Psychology',
        rating: 4.5,
        description: 'A dialogue-based introduction to Adlerian psychology.',
        coverColor: 'from-amber-500 to-orange-600',
        totalPages: 288,
      },
      {
        title: 'Flow',
        author: 'Mihaly Csikszentmihalyi',
        category: 'Psychology',
        rating: 4.5,
        description: 'The psychology of optimal experience.',
        coverColor: 'from-cyan-500 to-blue-600',
        totalPages: 303,
      },
      {
        title: 'Influence',
        author: 'Robert Cialdini',
        category: 'Psychology',
        rating: 4.6,
        description: 'The psychology of persuasion and how people are influenced.',
        coverColor: 'from-pink-500 to-rose-600',
        totalPages: 336,
      },
    ],
    Business: [
      {
        title: 'The Almanack of Naval Ravikant',
        author: 'Eric Jorgenson',
        category: 'Business',
        rating: 4.7,
        description: 'Wisdom on wealth, happiness, and life.',
        coverColor: 'from-blue-500 to-indigo-600',
        totalPages: 242,
      },
      {
        title: 'Zero to One',
        author: 'Peter Thiel',
        category: 'Business',
        rating: 4.5,
        description: 'Notes on startups and building the future.',
        coverColor: 'from-indigo-500 to-purple-600',
        totalPages: 224,
      },
      {
        title: 'The Lean Startup',
        author: 'Eric Ries',
        category: 'Business',
        rating: 4.4,
        description: "How today's entrepreneurs use continuous innovation.",
        coverColor: 'from-teal-500 to-cyan-600',
        totalPages: 336,
      },
    ],
    'Personal Growth': [
      {
        title: 'Atomic Habits',
        author: 'James Clear',
        category: 'Personal Growth',
        rating: 4.8,
        description: 'Tiny changes that create remarkable results.',
        coverColor: 'from-emerald-500 to-green-600',
        totalPages: 320,
      },
      {
        title: 'The 7 Habits of Highly Effective People',
        author: 'Stephen Covey',
        category: 'Personal Growth',
        rating: 4.6,
        description: 'Powerful lessons in personal change.',
        coverColor: 'from-blue-500 to-indigo-600',
        totalPages: 381,
      },
      {
        title: 'Mindset',
        author: 'Carol Dweck',
        category: 'Personal Growth',
        rating: 4.5,
        description: 'The new psychology of success.',
        coverColor: 'from-purple-500 to-pink-600',
        totalPages: 320,
      },
    ],
    Technology: [
      {
        title: 'The Innovators',
        author: 'Walter Isaacson',
        category: 'Technology',
        rating: 4.5,
        description: 'How a group of hackers, geniuses, and geeks created the digital revolution.',
        coverColor: 'from-blue-500 to-cyan-600',
        totalPages: 542,
      },
      {
        title: 'AI Superpowers',
        author: 'Kai-Fu Lee',
        category: 'Technology',
        rating: 4.4,
        description: 'China, Silicon Valley, and the new world order.',
        coverColor: 'from-indigo-500 to-purple-600',
        totalPages: 272,
      },
    ],
    History: [
      {
        title: 'Sapiens',
        author: 'Yuval Noah Harari',
        category: 'History',
        rating: 4.7,
        description: 'A brief history of humankind.',
        coverColor: 'from-green-500 to-emerald-600',
        totalPages: 443,
      },
      {
        title: 'Guns, Germs, and Steel',
        author: 'Jared Diamond',
        category: 'History',
        rating: 4.5,
        description: 'The fates of human societies.',
        coverColor: 'from-amber-500 to-orange-600',
        totalPages: 528,
      },
    ],
    Philosophy: [
      {
        title: "Man's Search for Meaning",
        author: 'Viktor Frankl',
        category: 'Philosophy',
        rating: 4.8,
        description: 'Finding meaning in suffering.',
        coverColor: 'from-red-500 to-rose-600',
        totalPages: 184,
      },
      {
        title: 'Meditations',
        author: 'Marcus Aurelius',
        category: 'Philosophy',
        rating: 4.6,
        description: 'Stoic philosophy and personal reflections.',
        coverColor: 'from-slate-500 to-gray-600',
        totalPages: 254,
      },
    ],
    Writing: [
      {
        title: 'On Writing',
        author: 'Stephen King',
        category: 'Writing',
        rating: 4.7,
        description: 'A memoir of the craft.',
        coverColor: 'from-orange-500 to-red-600',
        totalPages: 320,
      },
      {
        title: 'Bird by Bird',
        author: 'Anne Lamott',
        category: 'Writing',
        rating: 4.5,
        description: 'Some instructions on writing and life.',
        coverColor: 'from-teal-500 to-cyan-600',
        totalPages: 237,
      },
    ],
    Finance: [
      {
        title: 'The Intelligent Investor',
        author: 'Benjamin Graham',
        category: 'Finance',
        rating: 4.6,
        description: 'The definitive book on value investing.',
        coverColor: 'from-green-500 to-emerald-600',
        totalPages: 623,
      },
      {
        title: 'Rich Dad Poor Dad',
        author: 'Robert Kiyosaki',
        category: 'Finance',
        rating: 4.4,
        description: 'What the rich teach their kids about money.',
        coverColor: 'from-yellow-500 to-orange-600',
        totalPages: 336,
      },
    ],
  };

  const popularTopics = [
    'Psychology',
    'Business',
    'Personal Growth',
    'Technology',
    'History',
    'Philosophy',
    'Writing',
    'Finance',
  ];


  const filteredTrending = searchQuery
    ? trendingBooks.filter(
        (book) =>
          book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : trendingBooks;


  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    const token = localStorage.getItem('readwise_jwt');
    if (!token) {
      toast.error('Please log in first.');
      return;
    }

    setIsSearching(true);
    setAiBooks([]);
    setAiRawText(null);

    try {
      const res = await fetch('/api/ai/search-book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: trimmed }),
      });

      if (!res.ok) {
        toast.error('Failed to search books.');
        console.error('AI search HTTP error:', res.status);
        return;
      }

      const data = await res.json();
      console.log('🔍 /api/ai/search-book response:', data);

      if (Array.isArray(data.books) && data.books.length > 0) {
        // 书封面颜色
        const colored = data.books.map((b: any, index: number): TopicBook => ({
          title: b.title,
          author: b.author,
          category: b.category || 'General',
          rating: typeof b.rating === 'number' ? b.rating : 4.5,
          description: b.description || 'Recommended by AI.',
          totalPages: b.totalPages || 320,
          coverColor: trendingBooks[index % trendingBooks.length]?.coverColor || 'from-indigo-500 to-purple-600',
        }));
        setAiBooks(colored);
        setAiRawText(null);
      } else if (typeof data.rawText === 'string' && data.rawText.trim().length > 0) {
        // rawText
        setAiBooks([]);
        setAiRawText(data.rawText);
      } else {
        setAiBooks([]);
        setAiRawText(null);
        toast.info('No AI search results, showing trending instead.');
      }
    } catch (err) {
      console.error('AI search error:', err);
      toast.error('Error searching books.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddBook = (book: TopicBook) => {
    onAddBook({
      title: book.title,
      author: book.author,
      coverColor: book.coverColor,
      totalPages: book.totalPages,
      category: book.category,
      rating: book.rating,
      description: book.description,
    });
    toast.success(`"${book.title}" added to your library!`);
  };

  const handleTopicClick = (topic: string) => {
    setSelectedTopic(topic);
  };

  const handleBackToTopics = () => {
    setSelectedTopic(null);
  };

  // Topic detail view
  if (selectedTopic) {
    const booksForTopic = topicBooks[selectedTopic] || [];
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={handleBackToTopics} className="mb-6 gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Topics
        </Button>

        <div className="mb-8">
          <h1 className="text-gray-900 dark:text-white mb-2">{selectedTopic}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Recommended books for {selectedTopic.toLowerCase()}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {booksForTopic.map((book, index) => {
            const inLibrary = isBookInLibrary(book.title, book.author);
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div
                    className={`w-full h-48 bg-gradient-to-br ${book.coverColor} rounded-lg mb-4 flex items-center justify-center shadow-md`}
                  >
                    <div className="text-white text-center p-4">
                      <div className="opacity-80">{book.title}</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-gray-900 dark:text-white mb-1">{book.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">{book.author}</p>
                    <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                      {book.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="secondary">{book.category}</Badge>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-gray-900 dark:text-white">{book.rating}</span>
                    </div>
                  </div>

                  {inLibrary ? (
                    <Button className="w-full gap-2" variant="outline" disabled>
                      <Check className="w-4 h-4" />
                      In Library
                    </Button>
                  ) : (
                    <Button className="w-full gap-2" onClick={() => handleAddBook(book)}>
                      <Plus className="w-4 h-4" />
                      Add to Library
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  const booksToShow = aiBooks.length > 0 ? aiBooks : filteredTrending;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-gray-900 dark:text-white mb-2">Discover Books</h1>
        <p className="text-gray-600 dark:text-gray-400">Explore new knowledge, start new journeys</p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <form className="relative max-w-2xl flex gap-2" onSubmit={handleSearchSubmit}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by title, author, or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={isSearching}>
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </form>
        {aiRawText && (
          <p className="mt-2 text-xs text-gray-500">
            AI raw text (debug): {aiRawText.slice(0, 120)}...
          </p>
        )}
      </div>

      <Tabs defaultValue="books" className="mb-8">
        <TabsList>
          <TabsTrigger value="books">Books</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
        </TabsList>

        <TabsContent value="books" className="mt-6">
          {}
          <div className="mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            <h2 className="text-gray-900 dark:text-white">
              {aiBooks.length > 0
                ? `AI Search Results (${aiBooks.length})`
                : searchQuery
                ? `Search Results in Trending (${filteredTrending.length})`
                : 'Trending Recommendations'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {booksToShow.map((book, index) => {
              const inLibrary = isBookInLibrary(book.title, book.author);
              return (
                <Card key={`${book.title}-${index}`} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div
                      className={`w-full h-48 bg-gradient-to-br ${book.coverColor} rounded-lg mb-4 flex items-center justify-center shadow-md`}
                    >
                      <div className="text-white text-center p-4">
                        <div className="opacity-80">{book.title}</div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h3 className="text-gray-900 dark:text-white mb-1">{book.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">{book.author}</p>
                      <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                        {book.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="secondary">{book.category}</Badge>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-gray-900 dark:text-white">{book.rating}</span>
                      </div>
                    </div>

                    {inLibrary ? (
                      <Button className="w-full gap-2" variant="outline" disabled>
                        <Check className="w-4 h-4" />
                        In Library
                      </Button>
                    ) : (
                      <Button className="w-full gap-2" onClick={() => handleAddBook(book)}>
                        <Plus className="w-4 h-4" />
                        Add to Library
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {booksToShow.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No books found. Try different keywords
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="topics" className="mt-6">
          <div className="mb-6">
            <h2 className="text-gray-900 dark:text-white">Popular Topics</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Choose topics you're interested in to discover related books
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {popularTopics.map((topic, index) => (
              <Card
                key={index}
                onClick={() => handleTopicClick(topic)}
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
              >
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-white">{topic.slice(0, 2)}</span>
                    </div>
                    <h3 className="text-gray-900 dark:text-white">{topic}</h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
