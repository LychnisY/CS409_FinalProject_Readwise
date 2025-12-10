import { useState } from 'react';
import { BookOpen, Grid, List, Clock, CheckCircle, ArrowUpDown, Trash2 } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import type { Book } from '../App';

interface LibraryPageProps {
  myBooks: Book[];
  onDeleteBook: (bookId: number) => void;
  onUpdateBook: (book: Book) => void;
}

export function LibraryPage({ myBooks, onDeleteBook, onUpdateBook }: LibraryPageProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'progress' | 'title'>('recent');
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const motivationalMessages = [
    "Keep going—you're making progress!",
    "Every page brings you closer!",
    "You're doing amazing!",
    "Knowledge is power—keep reading!",
    "One step at a time, you've got this!",
    "Your dedication is inspiring!",
    "Great momentum—don't stop now!",
  ];

  const getMotivationalMessage = (bookId: number) => {
    return motivationalMessages[bookId % motivationalMessages.length];
  };

  const handleEditBook = (book: Book) => {
    setEditingBook({ ...book });
    setIsEditDialogOpen(true);
  };

  const handleDeleteBook = (bookId: number) => {
    onDeleteBook(bookId);
  };

  const syncReadingProgress = async (book: Book) => {
    try {
      const token = localStorage.getItem('readwise_jwt');
      if (!token) {
        return;
      }
      await fetch('/api/reading-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: book.title,
          author: book.author,
          topic: book.category,
          totalPages: book.totalPages,
          currentPageAfter: book.pagesRead,
        }),
      });
    } catch (err) {
      console.error('Failed to sync reading progress', err);
    }
  };

  const handleSaveProgress = () => {
    if (editingBook) {
      const progress = Math.round((editingBook.pagesRead / editingBook.totalPages) * 100);
      const status =
        progress >= 100 ? 'completed' : progress > 0 ? 'reading' : 'want-to-read';

      const currentBook = myBooks.find((b) => b.id === editingBook.id);
      const updatedBook: Book = {
        ...editingBook,
        progress,
        status,
        pagesRead: Math.min(editingBook.pagesRead, editingBook.totalPages),
        lastRead:
          currentBook && progress > currentBook.progress ? 'Today' : editingBook.lastRead,
      };

      onUpdateBook(updatedBook);
      void syncReadingProgress(updatedBook);
      setIsEditDialogOpen(false);
      setEditingBook(null);
    }
  };

  const getSortedBooks = (books: Book[]) => {
    const sorted = [...books];
    switch (sortBy) {
      case 'recent':
        return sorted.sort(
          (a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
        );
      case 'progress':
        return sorted.sort((a, b) => b.progress - a.progress);
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return sorted;
    }
  };

  const readingBooks = getSortedBooks(myBooks.filter((book) => book.status === 'reading'));
  const completedBooks = getSortedBooks(
    myBooks.filter((book) => book.status === 'completed')
  );
  const wantToReadBooks = getSortedBooks(
    myBooks.filter((book) => book.status === 'want-to-read')
  );
  const allBooks = getSortedBooks(myBooks);

  const BookCard = ({ book }: { book: Book }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        {/* Book Cover */}
        <div
          className={`w-full h-48 bg-gradient-to-br ${book.coverColor} rounded-lg mb-4 flex items-center justify-center shadow-md relative`}
        >
          {book.status === 'completed' && (
            <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          )}
          <BookOpen className="w-12 h-12 text-white opacity-50" />
        </div>

        {/* Book Info */}
        <h3 className="text-gray-900 dark:text-white mb-1">{book.title}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-2">{book.author}</p>
        <p className="text-indigo-600 dark:text-indigo-400 italic mb-4">
          {getMotivationalMessage(book.id)}
        </p>

        {/* Progress */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">
              {book.pagesRead} / {book.totalPages} pages
            </span>
            <span className="text-gray-900 dark:text-white">{book.progress}%</span>
          </div>
          <Progress value={book.progress} className="h-2" />
        </div>

        {/* Last Read */}
        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-4">
          <Clock className="w-3 h-3" />
          <span>{book.lastRead}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            className="flex-1"
            variant={book.status === 'want-to-read' ? 'outline' : 'default'}
            onClick={() => handleEditBook(book)}
          >
            {book.status === 'completed'
              ? 'Read Again'
              : book.status === 'reading'
              ? 'Continue'
              : 'Start Reading'}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleDeleteBook(book.id)}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const BookListItem = ({ book }: { book: Book }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex gap-4">
          {/* Book Cover */}
          <div
            className={`w-24 h-32 bg-gradient-to-br ${book.coverColor} rounded-lg flex items-center justify-center shadow-md flex-shrink-0 relative`}
          >
            {book.status === 'completed' && (
              <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            )}
            <BookOpen className="w-8 h-8 text-white opacity-50" />
          </div>

          {/* Book Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-gray-900 dark:text-white mb-1">{book.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-1">{book.author}</p>
                <p className="text-indigo-600 dark:text-indigo-400 italic">
                  {getMotivationalMessage(book.id)}
                </p>
              </div>
              <Badge
                variant={book.status === 'completed' ? 'default' : 'secondary'}
              >
                {book.status === 'completed'
                  ? 'Completed'
                  : book.status === 'reading'
                  ? 'Reading'
                  : 'Want to Read'}
              </Badge>
            </div>

            {/* Progress */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  {book.pagesRead} / {book.totalPages} pages
                </span>
                <span className="text-gray-900 dark:text-white">{book.progress}%</span>
              </div>
              <Progress value={book.progress} className="h-2" />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <Clock className="w-3 h-3" />
                <span>{book.lastRead}</span>
              </div>
              <div className="flex gap-2 min-w-[220px]">
                <Button
                  size="sm"
                  className="flex-1"
                  variant={book.status === 'want-to-read' ? 'outline' : 'default'}
                  onClick={() => handleEditBook(book)}
                >
                  {book.status === 'completed'
                    ? 'Read Again'
                    : book.status === 'reading'
                    ? 'Continue'
                    : 'Start Reading'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteBook(book.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-gray-900 dark:text-white mb-2">My Library</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {myBooks.length} books total · {completedBooks.length} completed
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Sort Selector */}
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently Added</SelectItem>
                <SelectItem value="progress">By Progress</SelectItem>
                <SelectItem value="title">By Title</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({myBooks.length})</TabsTrigger>
          <TabsTrigger value="reading">Reading ({readingBooks.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedBooks.length})</TabsTrigger>
          <TabsTrigger value="want-to-read">
            Want to Read ({wantToReadBooks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {allBooks.map((book) =>
              viewMode === 'grid' ? (
                <BookCard key={book.id} book={book} />
              ) : (
                <BookListItem key={book.id} book={book} />
              )
            )}
          </div>
        </TabsContent>

        <TabsContent value="reading" className="mt-6">
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {readingBooks.map((book) =>
              viewMode === 'grid' ? (
                <BookCard key={book.id} book={book} />
              ) : (
                <BookListItem key={book.id} book={book} />
              )
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {completedBooks.map((book) =>
              viewMode === 'grid' ? (
                <BookCard key={book.id} book={book} />
              ) : (
                <BookListItem key={book.id} book={book} />
              )
            )}
          </div>
        </TabsContent>

        <TabsContent value="want-to-read" className="mt-6">
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {wantToReadBooks.map((book) =>
              viewMode === 'grid' ? (
                <BookCard key={book.id} book={book} />
              ) : (
                <BookListItem key={book.id} book={book} />
              )
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Progress Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Reading Progress</DialogTitle>
            <DialogDescription>
              Track your reading progress and the system will calculate your completion
              percentage
            </DialogDescription>
          </DialogHeader>
          {editingBook && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="book-title-display">Book Title</Label>
                <Input
                  id="book-title-display"
                  value={editingBook.title}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total-pages">Total Pages</Label>
                  <Input
                    id="total-pages"
                    type="number"
                    min="1"
                    value={editingBook.totalPages}
                    onChange={(e) =>
                      setEditingBook({
                        ...editingBook,
                        totalPages: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pages-read">Pages Read</Label>
                  <Input
                    id="pages-read"
                    type="number"
                    min="0"
                    value={editingBook.pagesRead}
                    onChange={(e) =>
                      setEditingBook({
                        ...editingBook,
                        pagesRead: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    Current Progress
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {Math.round(
                      (editingBook.pagesRead / editingBook.totalPages) * 100
                    ) || 0}
                  </span>
                </div>
                <Progress
                  value={Math.min(
                    (editingBook.pagesRead / editingBook.totalPages) * 100,
                    100
                  )}
                  className="h-2"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveProgress}>Save Progress</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
