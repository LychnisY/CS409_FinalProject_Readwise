import { useState, useEffect } from 'react';
import { Plus, BookOpen, Calendar, Trash2, Edit, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

interface Note {
  id: string;
  bookTitle: string;
  author: string;
  note: string;
  date: string;
  tags: string[];
}

export function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newNote, setNewNote] = useState({
    bookTitle: '',
    author: '',
    note: '',
    tags: '',
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('readwise_jwt');
    if (!token) return;

    const fetchNotes = async () => {
      try {
        const res = await fetch('/api/notes', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          console.error('Failed to fetch notes');
          return;
        }

        const data = await res.json();
        // data: [{ _id, bookTitle, author, note, date, tags }]
        const mapped: Note[] = data.map((n: any) => ({
          id: n._id,
          bookTitle: n.bookTitle || '',
          author: n.author || '',
          note: n.note || '',
          date: n.date
            ? String(n.date).slice(0, 10)
            : (n.createdAt ? String(n.createdAt).slice(0, 10) : ''),
          tags: Array.isArray(n.tags) ? n.tags : [],
        }));

        setNotes(mapped);
      } catch (err) {
        console.error('Error fetching notes', err);
      }
    };

    fetchNotes();
  }, []);

  const handleAddNote = async () => {
    if (!newNote.bookTitle || !newNote.note) return;

    const token = localStorage.getItem('readwise_jwt');
    if (!token) return;

    try {
      const body = {
        bookTitle: newNote.bookTitle,
        author: newNote.author,
        note: newNote.note,
        tags: newNote.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        console.error('Failed to create note');
        return;
      }

      const created = await res.json();
      const mapped: Note = {
        id: created._id,
        bookTitle: created.bookTitle || body.bookTitle,
        author: created.author || body.author,
        note: created.note || body.note,
        date: created.date
          ? String(created.date).slice(0, 10)
          : (created.createdAt ? String(created.createdAt).slice(0, 10) : new Date().toISOString().split('T')[0]),
        tags: Array.isArray(created.tags) ? created.tags : body.tags,
      };

      setNotes((prev) => [mapped, ...prev]);
      setNewNote({ bookTitle: '', author: '', note: '', tags: '' });
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Error creating note', err);
    }
  };

  const handleDeleteNote = async (id: string) => {
    const token = localStorage.getItem('readwise_jwt');
    if (!token) return;

    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error('Failed to delete note');
        return;
      }

      setNotes((prev) => prev.filter((note) => note.id !== id));
    } catch (err) {
      console.error('Error deleting note', err);
    }
  };


  const filteredNotes = searchQuery
    ? notes.filter(
        (note) =>
          note.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : notes;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-gray-900 dark:text-white">My Notes</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Note
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>New Reading Note</DialogTitle>
                <DialogDescription>Record your thoughts and insights from reading</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="book-title">Book Title</Label>
                    <Input
                      id="book-title"
                      placeholder="Enter book title"
                      value={newNote.bookTitle}
                      onChange={(e) => setNewNote({ ...newNote, bookTitle: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author">Author</Label>
                    <Input
                      id="author"
                      placeholder="Enter author name"
                      value={newNote.author}
                      onChange={(e) => setNewNote({ ...newNote, author: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note">Note Content</Label>
                  <Textarea
                    id="note"
                    placeholder="Write down your thoughts, insights, or key quotes..."
                    rows={6}
                    value={newNote.note}
                    onChange={(e) => setNewNote({ ...newNote, note: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    placeholder="e.g., Psychology, Decision Making, Thinking"
                    value={newNote.tags}
                    onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddNote}>Save Note</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Record your reading reflections and distill knowledge
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-gray-900 dark:text-white mb-1">{notes.length}</div>
            <p className="text-gray-600 dark:text-gray-400">Total Notes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-gray-900 dark:text-white mb-1">
              {new Set(notes.map((n) => n.bookTitle)).size}
            </div>
            <p className="text-gray-600 dark:text-gray-400">Books Covered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-gray-900 dark:text-white mb-1">
              {new Set(notes.flatMap((n) => n.tags)).size}
            </div>
            <p className="text-gray-600 dark:text-gray-400">Tags</p>
          </CardContent>
        </Card>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {filteredNotes.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'No notes found' : 'No notes yet. Click "New Note" to start recording'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredNotes.map((note) => (
            <Card key={note.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="mb-1">{note.bookTitle}</CardTitle>
                    <CardDescription>{note.author}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button> */}
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteNote(note.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                  {note.note}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {note.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{note.date}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
