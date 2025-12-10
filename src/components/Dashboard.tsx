import { useState, useEffect } from 'react';
import { Flame, Target, BookOpen, TrendingUp, Clock, Sparkles, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import type { Book } from '../App';
import { API_BASE } from "../config";
type Page = 'login' | 'dashboard' | 'search' | 'library' | 'ai-plan' | 'notes' | 'settings';

interface DashboardProps {
  onNavigate: (page: Page) => void;
  myBooks: Book[];
}

export function Dashboard({ onNavigate, myBooks }: DashboardProps) {
  const [streak, setStreak] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);

  const currentlyReading = myBooks
    .filter((book) => book.status === 'reading')
    .slice(0, 3);

  useEffect(() => {
    const token = localStorage.getItem('readwise_jwt');
    if (!token) return;

    const fetchSettings = async () => {
      try {
        const res = await fetch(API_BASE+'/api/user/settings', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          console.error('Failed to fetch user settings');
          return;
        }

        const data = await res.json();
        if (typeof data.dailyMinutesGoal === 'number') {
          setDailyGoal(data.dailyMinutesGoal);
        }
      } catch (err) {
        console.error('Error fetching settings', err);
      }
    };

    const pingStreak = async () => {
      try {
        const res = await fetch(API_BASE+'/api/user/streak-ping', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          console.error('Failed to ping streak');
          return;
        }

        const data = await res.json();
        if (typeof data.streakDays === 'number') {
          setStreak(data.streakDays);
        }
      } catch (err) {
        console.error('Error pinging streak', err);
      }
    };

    fetchSettings();
    pingStreak();
  }, []);

  useEffect(() => {
    const readingBooks = myBooks.filter(
      (b) => b.status === 'reading' && (b.totalPages || 0) > 0
    );

    const totalPages = readingBooks.reduce(
      (sum, b) => sum + (b.totalPages || 0),
      0
    );
    const readPages = readingBooks.reduce(
      (sum, b) => sum + (b.pagesRead || 0),
      0
    );

    if (totalPages > 0) {
      setCompletionRate(Math.round((readPages / totalPages) * 100));
    } else {
      setCompletionRate(0);
    }
  }, [myBooks]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-gray-900 dark:text-white mb-2">Welcome Back!</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Continue your reading journey
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Reading Streak Card */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Reading Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-gray-900 dark:text-white">{streak}</span>
              <span className="text-gray-600 dark:text-gray-400">days</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Amazing! Keep the momentum going
            </p>
          </CardContent>
        </Card>

        {/* Daily Goal Card */}
        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-500" />
              Daily Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-gray-900 dark:text-white">{dailyGoal}</span>
              <span className="text-gray-600 dark:text-gray-400">minutes</span>
            </div>
              {/* {dailyGoal > 0 && <Progress value={100} className="h-2" />}
              {dailyGoal === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                  Set your daily reading goal in Settings.
                </p>
              )} */}
          </CardContent>
        </Card>

        {/* Completion Rate Card */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-gray-900 dark:text-white">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2 mb-2" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Based on books you are currently reading
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Currently Reading Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Currently Reading
          </CardTitle>
          <CardDescription>Pick up where you left off</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentlyReading.map((book) => (
              <Card
                key={book.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
              >
                <CardContent className="pt-6">
                  {/* Book Cover */}
                  <div
                    className={`w-full h-48 bg-gradient-to-br ${book.coverColor} rounded-lg mb-4 flex items-center justify-center shadow-md`}
                  >
                    <BookOpen className="w-12 h-12 text-white opacity-50" />
                  </div>

                  {/* Book Info */}
                  <h3 className="text-gray-900 dark:text-white mb-1">
                    {book.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {book.author}
                  </p>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Progress
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {book.progress}%
                      </span>
                    </div>
                    <Progress value={book.progress} className="h-2" />
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{book.lastRead}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-4"
                    onClick={() => onNavigate('library')}
                  >
                    Continue Reading
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          onClick={() => onNavigate('ai-plan')}
          className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border-indigo-200 dark:border-indigo-800 cursor-pointer hover:shadow-lg transition-shadow"
        >
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white mb-1">
                  AI Reading Plan
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Get a personalized reading roadmap powered by AI
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => onNavigate('notes')}
          className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800 cursor-pointer hover:shadow-lg transition-shadow"
        >
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white mb-1">
                  View Notes
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Review your reading notes and reflections
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
