import { Search, Library, Settings, BookOpen } from 'lucide-react';
import { Button } from './ui/button';
import { API_BASE } from "../config";
type Page = 'login' | 'dashboard' | 'search' | 'library' | 'ai-plan' | 'notes' | 'settings';

interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const navItems = [
    // { id: 'search' as Page, label: 'Search', icon: Search },
    { id: 'library' as Page, label: 'My Library', icon: Library },
    { id: 'settings' as Page, label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-gray-900 dark:text-white">ReadWise+</span>
          </button>

          {/* Navigation Items */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'default' : 'ghost'}
                  onClick={() => onNavigate(item.id)}
                  className="gap-2"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}