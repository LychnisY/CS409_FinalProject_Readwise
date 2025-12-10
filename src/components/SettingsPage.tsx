import { useState, useEffect } from 'react';
import { User, Bell, Moon, Sun, LogOut, Target, BookOpen, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Slider } from './ui/slider';

interface SettingsPageProps {
  onLogout: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  
}

export function SettingsPage({ onLogout, darkMode, onToggleDarkMode }: SettingsPageProps) {
  // const [profile, setProfile] = useState({
  //   name: 'John Doe',
  //   email: 'john.doe@example.com',
  // });

  const [preferences, setPreferences] = useState({
    dailyGoal: 30,
    // notifications: true,
    // weeklyReminder: true,
    // streakReminder: true,
  });

  const [saving, setSaving] = useState(false);

  

  // 进入设置页时，从后端拉当前用户的 dailyMinutesGoal
  useEffect(() => {
    const token = localStorage.getItem('readwise_jwt');
    if (!token) return;

    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/user/settings', {
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
          setPreferences((prev) => ({
            ...prev,
            dailyGoal: data.dailyMinutesGoal,
          }));
        }
      } catch (err) {
        console.error('Error loading user settings', err);
      }
    };

    fetchSettings();
  }, []);

  const saveDailyGoal = async (minutes: number) => {
    const token = localStorage.getItem('readwise_jwt');
    if (!token) return;

    setSaving(true);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dailyMinutesGoal: minutes,
        }),
      });

      if (!res.ok) {
        console.error('Failed to save user settings');
      }
    } catch (err) {
      console.error('Error saving user settings', err);
    } finally {
      setSaving(false);
    }
  };

    const handleDeleteAccount = async () => {
    const confirm = window.confirm(
      'This will permanently delete your account and all reading data. Are you sure?'
    );
    if (!confirm) return;

    const token = localStorage.getItem('readwise_jwt');
    if (!token) return;

    try {
      const res = await fetch('/api/user', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error('Failed to delete account');
        alert('Failed to delete account. Please try again.');
        return;
      }

      localStorage.removeItem('readwise_jwt');

      alert('Your account has been deleted.');
      onLogout();
    } catch (err) {
      console.error('Error deleting account', err);
      alert('Error deleting account. Please try again.');
    }
  };


  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-gray-900 dark:text-white mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account and reading preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Settings（已移除，仅保留注释） */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Account Information
            </CardTitle>
            <CardDescription>Manage your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card> */}

        {/* Reading Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Reading Preferences
            </CardTitle>
            <CardDescription>Set your reading goals and habits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="daily-goal">Daily Reading Goal</Label>
                <span className="text-gray-900 dark:text-white">
                  {preferences.dailyGoal} minutes
                </span>
              </div>
              <Slider
                id="daily-goal"
                value={[preferences.dailyGoal]}
                onValueChange={(value) => {
                  const minutes = value[0];
                  setPreferences((prev) => ({ ...prev, dailyGoal: minutes }));
                  saveDailyGoal(minutes);
                }}
                min={10}
                max={120}
                step={5}
              />
              <p className="text-gray-500 dark:text-gray-400">
                We recommend reading at least 20-30 minutes daily
              </p>
              {saving && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Saving your preference...
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              Appearance
            </CardTitle>
            <CardDescription>Customize the app's visual appearance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <p className="text-gray-500 dark:text-gray-400">
                  Switch to dark theme to protect your eyes
                </p>
              </div>
              <Switch id="dark-mode" checked={darkMode} onCheckedChange={onToggleDarkMode} />
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy & Data
            </CardTitle>
            <CardDescription>Manage your data and privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Export Data</Label>
                <p className="text-gray-500 dark:text-gray-400">
                  Download all your reading data and notes
                </p>
              </div>
              <Button variant="outline">Export Data</Button>
            </div>

            <Separator /> */}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Delete Account</Label>
                <p className="text-gray-500 dark:text-gray-400">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button variant="destructive" onClick={handleDeleteAccount}>
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sign Out</Label>
                <p className="text-gray-500 dark:text-gray-400">
                  Sign out of your current account
                </p>
              </div>
              <Button variant="outline" onClick={onLogout} className="gap-2">
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* App Info */}
        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
          <p>ReadWise+ v1.0.0</p>
          <p className="mt-1">Your AI-powered reading companion</p>
        </div>
      </div>
    </div>
  );
}
