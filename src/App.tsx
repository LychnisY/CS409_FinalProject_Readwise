import { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { SearchPage } from './components/SearchPage';
import { LibraryPage } from './components/LibraryPage';
import { AIReadingPlan } from './components/AIReadingPlan';
import { NotesPage } from './components/NotesPage';
import { SettingsPage } from './components/SettingsPage';
import { Toaster } from './components/ui/sonner';
import { API_BASE } from "./config";

type Page = 'login' | 'dashboard' | 'search' | 'library' | 'ai-plan' | 'notes' | 'settings';

export type Book = {
  id: number;
  title: string;
  author: string;
  progress: number;
  status: 'reading' | 'completed' | 'want-to-read';
  coverColor: string;
  pagesRead: number;
  totalPages: number;
  lastRead: string;
  addedDate: string;
  category?: string;
  rating?: number;
  description?: string;
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Global library state
  const [myBooks, setMyBooks] = useState<Book[]>([]);
  useEffect(() => {
    // 未登录就不拉数据，并清空本地
    if (!isAuthenticated) {
      setMyBooks([]);
      return;
    }

    const token = localStorage.getItem('readwise_jwt');
    if (!token) return;

    const fetchReadingItems = async () => {
      try {
        const res = await fetch(API_BASE+'/api/reading-items', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          console.error('Failed to fetch reading items');
          return;
        }

        const items = await res.json();

        const books: Book[] = items.map((item: any, index: number) => {
          const totalPages = item.totalPages ?? 0;
          const currentPage = item.currentPage ?? 0;
          const progress =
            totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

          const status: Book['status'] =
            totalPages > 0 && currentPage >= totalPages
              ? 'completed'
              : currentPage > 0
              ? 'reading'
              : 'want-to-read';

          return {
            id: index + 1, // 前端自己的 id，和 MongoDB _id 分开
            title: item.title,
            author: item.author ?? '',
            progress,
            status,
            coverColor: 'from-indigo-500 to-purple-600', // 给个默认配色
            pagesRead: currentPage,
            totalPages,
            lastRead: item.updatedAt
              ? item.updatedAt.slice(0, 10)
              : 'Not recorded',
            addedDate: item.createdAt
              ? item.createdAt.slice(0, 10)
              : new Date().toISOString().split('T')[0],
            category: item.topic ?? '',
            // rating / description 后端没有，就先空着
          };
        });

        setMyBooks(books);
      } catch (err) {
        console.error('Error loading reading items', err);
      }
    };

    fetchReadingItems();
  }, [isAuthenticated]);
  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPage('login');
    localStorage.removeItem('readwise_jwt');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Add book to library
  // Add book to library (and save to backend)
  const addBookToLibrary = async (
    book: Omit<
      Book,
      'id' | 'addedDate' | 'status' | 'progress' | 'pagesRead' | 'lastRead'
    >
  ) => {
    const token = localStorage.getItem('readwise_jwt');

    // 先假设本地一定要加进去（即使网络失败也能看到）
    let createdAt = new Date().toISOString();

    if (token) {
      try {
        const res = await fetch(API_BASE+'/api/reading-items', {
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
            currentPage: 0,
          }),
        });

        if (res.ok) {
          const item = await res.json();
          if (item.createdAt) {
            createdAt = item.createdAt;
          }
        } else {
          console.error('Failed to save reading item');
        }
      } catch (err) {
        console.error('Error saving reading item', err);
      }
    }

    const newBook: Book = {
      ...book,
      id: Math.max(...myBooks.map((b) => b.id), 0) + 1,
      status: 'want-to-read',
      progress: 0,
      pagesRead: 0,
      lastRead: 'Not started',
      addedDate: createdAt.slice(0, 10),
    };

    setMyBooks([...myBooks, newBook]);
  };


  // Delete book from library
  const deleteBookFromLibrary = (bookId: number) => {
    setMyBooks(myBooks.filter((book) => book.id !== bookId));
  };

  // Update book in library
  const updateBookInLibrary = (updatedBook: Book) => {
    setMyBooks(myBooks.map((book) => (book.id === updatedBook.id ? updatedBook : book)));
  };

  // Check if book is in library (by title and author to handle duplicates)
  const isBookInLibrary = (title: string, author: string) => {
    return myBooks.some((book) => book.title === title && book.author === author);
  };

  const renderPage = () => {
    if (!isAuthenticated) {
      return <LoginPage onLogin={handleLogin} />;
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} myBooks={myBooks} />;
      case 'search':
        return (
          <SearchPage
            onAddBook={addBookToLibrary}
            isBookInLibrary={isBookInLibrary}
          />
        );
      case 'library':
        return (
          <LibraryPage
            myBooks={myBooks}
            onDeleteBook={deleteBookFromLibrary}
            onUpdateBook={updateBookInLibrary}
          />
        );
      case 'ai-plan':
        return (
          <AIReadingPlan
            onAddBook={addBookToLibrary}
            isBookInLibrary={isBookInLibrary}
          />
        );
      case 'notes':
        return <NotesPage />;
      case 'settings':
        return <SettingsPage onLogout={handleLogout} darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />;
      default:
        return <Dashboard onNavigate={setCurrentPage} myBooks={myBooks} />;
    }
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
        {isAuthenticated && (
          <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
        )}
        <main className={isAuthenticated ? 'pt-16' : ''}>
          {renderPage()}
        </main>
      </div>
      <Toaster />
    </div>
  );
}