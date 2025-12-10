require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const User = require('./models/User');
const ReadingItem = require('./models/ReadingItem');
const ReadingLog = require('./models/ReadingLog');
const Note = require('./models/Note'); 
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

app.delete('/api/user', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    await Promise.all([
      ReadingItem.deleteMany({ user: userId }),
      ReadingLog.deleteMany({ user: userId }),
      Note.deleteMany({ user: userId }),
      User.findByIdAndDelete(userId),
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ message: 'Failed to delete account' });
  }
});

if (!MONGODB_URI) {
  console.error('❌ Missing MONGODB_URI in environment variables');
  process.exit(1);
}

app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// --- Database connection ---
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// --- Auth helpers ---
function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'Missing Authorization header' });
  }
  const [, token] = authHeader.split(' ');
  if (!token) {
    return res.status(401).json({ message: 'Invalid Authorization header' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}


// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      name,
    });
    const token = generateToken(user);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});


// User settings: timezone / daily goals
app.get('/api/user/settings', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('settings createdAt');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const defaultSettings = {
      timezone: 'America/Chicago',
      dailyPageGoal: 0,
      dailyMinutesGoal: 0,
      streakDays: 1,
      lastActiveDate: null,
    };

    res.json({
      ...defaultSettings,
      ...(user.settings || {}),
      registrationDate: user.createdAt,
    });
  } catch (err) {
    console.error('Get user settings error:', err);
    res.status(500).json({ message: 'Failed to fetch user settings' });
  }
});

app.put('/api/user/settings', authMiddleware, async (req, res) => {
  try {
    const { timezone, dailyPageGoal, dailyMinutesGoal } = req.body;
    const update = {};

    if (typeof timezone === 'string') {
      update['settings.timezone'] = timezone;
    }
    if (typeof dailyPageGoal === 'number') {
      update['settings.dailyPageGoal'] = dailyPageGoal;
    }
    if (typeof dailyMinutesGoal === 'number') {
      update['settings.dailyMinutesGoal'] = dailyMinutesGoal;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: update },
      { new: true }
    ).select('settings');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.settings || {});
  } catch (err) {
    console.error('Update user settings error:', err);
    res.status(500).json({ message: 'Failed to update user settings' });
  }
});

// streak + daily goal 
app.post('/api/user/streak-ping', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.settings) {
      user.settings = {};
    }

    const today = new Date();
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let { lastActiveDate, streakDays } = user.settings;

    if (!streakDays || streakDays < 1) {
      streakDays = 1;
    }

    if (!lastActiveDate) {
      lastActiveDate = todayDateOnly;
    } else {
      const last = new Date(lastActiveDate);
      const lastDateOnly = new Date(last.getFullYear(), last.getMonth(), last.getDate());

      if (lastDateOnly.getTime() !== todayDateOnly.getTime()) {
        streakDays += 1;
        lastActiveDate = todayDateOnly;
      }
    }

    user.settings.streakDays = streakDays;
    user.settings.lastActiveDate = lastActiveDate;

    await user.save();

    res.json({
      streakDays,
      registrationDate: user.createdAt,
    });
  } catch (err) {
    console.error('Streak ping error:', err);
    res.status(500).json({ message: 'Failed to update streak' });
  }
});



// Get
app.get('/api/reading-items', authMiddleware, async (req, res) => {
  try {
    const items = await ReadingItem.find({ user: req.user.id }).sort({ updatedAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('Get reading items error:', err);
    res.status(500).json({ message: 'Failed to fetch reading items' });
  }
});

app.post('/api/reading-items', authMiddleware, async (req, res) => {
  try {
    const { title, author, topic, school, totalPages, currentPage } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    let item = await ReadingItem.findOne({ user: req.user.id, title, author });
    if (!item) {
      item = await ReadingItem.create({
        user: req.user.id,
        title,
        author,
        topic,
        school,
        totalPages: totalPages || 0,
        currentPage: currentPage || 0,
      });
    } else {
      if (typeof topic !== 'undefined') item.topic = topic;
      if (typeof school !== 'undefined') item.school = school;
      if (typeof totalPages === 'number') item.totalPages = totalPages;
      if (typeof currentPage === 'number') item.currentPage = currentPage;
      await item.save();
    }
    res.status(201).json(item);
  } catch (err) {
    console.error('Create reading item error:', err);
    res.status(500).json({ message: 'Failed to create or update reading item' });
  }
});

app.post('/api/reading-logs', authMiddleware, async (req, res) => {
  try {
    const { title, author, topic, school, totalPages, currentPageAfter } = req.body;
    if (!title || typeof currentPageAfter !== 'number') {
      return res.status(400).json({ message: 'Title and currentPageAfter are required' });
    }

    let item = await ReadingItem.findOne({ user: req.user.id, title, author });
    if (!item) {
      item = await ReadingItem.create({
        user: req.user.id,
        title,
        author,
        topic,
        school,
        totalPages: totalPages || 0,
        currentPage: 0,
      });
    }

    const previousPage = item.currentPage || 0;
    const pagesRead = Math.max(0, currentPageAfter - previousPage);

    item.currentPage = currentPageAfter;
    if (typeof totalPages === 'number' && totalPages > 0) {
      item.totalPages = totalPages;
    }
    await item.save();

    const now = new Date();
    const dateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const log = await ReadingLog.create({
      user: req.user.id,
      readingItem: item._id,
      date: dateOnly,
      pagesRead,
      currentPageAfter,
    });

    res.status(201).json({ item, log });
  } catch (err) {
    console.error('Create reading log error:', err);
    res.status(500).json({ message: 'Failed to create reading log' });
  }
});

app.get('/api/reading-stats/summary', authMiddleware, async (req, res) => {
  try {
    const items = await ReadingItem.find({ user: req.user.id });
    const totalPages = items.reduce((sum, it) => sum + (it.totalPages || 0), 0);
    const currentPages = items.reduce((sum, it) => sum + (it.currentPage || 0), 0);
    const overallProgress = totalPages > 0 ? Math.round((currentPages / totalPages) * 100) : 0;

    res.json({
      totalBooks: items.length,
      totalPages,
      currentPages,
      overallProgress,
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

//Motes
app.get('/api/notes', authMiddleware, async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user.id }).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (err) {
    console.error('Get notes error:', err);
    res.status(500).json({ message: 'Failed to fetch notes' });
  }
});


app.post('/api/notes', authMiddleware, async (req, res) => {
  try {
    const { bookTitle, author, note, tags } = req.body;
    if (!bookTitle || !note) {
      return res.status(400).json({ message: 'Book title and note content are required' });
    }

    const formattedTags = Array.isArray(tags)
      ? tags
      : (typeof tags === 'string'
          ? tags.split(',').map((t) => t.trim()).filter(Boolean)
          : []);

    const newNote = await Note.create({
      user: req.user.id,
      bookTitle,
      author,
      note,
      tags: formattedTags,
    });

    res.status(201).json(newNote);
  } catch (err) {
    console.error('Create note error:', err);
    res.status(500).json({ message: 'Failed to create note' });
  }
});


app.put('/api/notes/:id', authMiddleware, async (req, res) => {
  try {
    const { bookTitle, author, note, tags } = req.body;

    const noteDoc = await Note.findOne({ _id: req.params.id, user: req.user.id });
    if (!noteDoc) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (typeof bookTitle === 'string') noteDoc.bookTitle = bookTitle;
    if (typeof author === 'string') noteDoc.author = author;
    if (typeof note === 'string') noteDoc.note = note;
    if (typeof tags !== 'undefined') {
      noteDoc.tags = Array.isArray(tags)
        ? tags
        : (typeof tags === 'string'
            ? tags.split(',').map((t) => t.trim()).filter(Boolean)
            : []);
    }

    await noteDoc.save();
    res.json(noteDoc);
  } catch (err) {
    console.error('Update note error:', err);
    res.status(500).json({ message: 'Failed to update note' });
  }
});


app.delete('/api/notes/:id', authMiddleware, async (req, res) => {
  try {
    const noteDoc = await Note.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!noteDoc) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Delete note error:', err);
    res.status(500).json({ message: 'Failed to delete note' });
  }
});

app.post('/api/ai/search-book', authMiddleware, async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Query is required' });
    }

    const apiKey = process.env.BIGMODEL_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'Missing BIGMODEL_API_KEY on server' });
    }

    const response = await axios.post(
      'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      {
        model: 'glm-4.6',
        messages: [
          {
            role: 'user',
            content: `
You are a book recommendation assistant.

Given the user query: "${query}"

Return 5–8 **real, existing non-fiction books** that best match the query.
Focus on self-learning / thinking / professional growth.
Output **ONLY** valid JSON, no explanation, no markdown.

JSON format (array only):

[
  {
    "title": "Book title",
    "author": "Author name",
    "category": "Short category, e.g. Psychology, Business, History",
    "rating": 4.6,
    "description": "1–2 sentence English description of why this book is helpful for the query.",
    "totalPages": 320
  }
]
          `.trim(),
          },
        ],
        temperature: 0.8,
        max_tokens: 1024,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let content = response.data?.choices?.[0]?.message?.content || '';
    content = content.trim();

    console.log('🔍 GLM-4.6 search raw content:', content);

    if (!content) {
      return res.json({ books: [], rawText: '' });
    }

    let rawParsed;
    let books = [];

    try {
      rawParsed = JSON.parse(content);
    } catch (e) {
      const start = content.indexOf('[');
      const end = content.lastIndexOf(']');
      if (start !== -1 && end !== -1 && end > start) {
        const jsonPart = content.slice(start, end + 1);
        try {
          rawParsed = JSON.parse(jsonPart);
        } catch (e2) {
          console.error('AI search JSON parse error:', e2);
        }
      }
    }

    if (Array.isArray(rawParsed)) {
      books = rawParsed;
    } else if (rawParsed && Array.isArray(rawParsed.books)) {
      books = rawParsed.books;
    }

    if (!books || !books.length) {
      return res.json({ books: [], rawText: content });
    }

    const normalized = books.map((b, idx) => ({
      title: String(b.title || query),
      author: String(b.author || 'Unknown Author'),
      category: String(b.category || 'General'),
      rating:
        typeof b.rating === 'number'
          ? b.rating
          : 4.5,
      description:
        typeof b.description === 'string'
          ? b.description
          : typeof b.reason === 'string'
          ? b.reason
          : `Recommended book related to "${query}".`,
      totalPages:
        typeof b.totalPages === 'number' && b.totalPages > 0
          ? b.totalPages
          : 280 + (idx % 5) * 40, 
    }));

    return res.json({ books: normalized });
  } catch (err) {
    console.error('AI search book error:', err.response?.data || err.message);
    res.status(500).json({ message: 'Failed to search books' });
  }
});

app.post('/api/ai/reading-plan', authMiddleware, async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ message: "Topic is required" });
    }

    const apiKey = process.env.BIGMODEL_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "Missing BIGMODEL_API_KEY" });
    }

    const response = await axios.post(
      'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      {
        model: "glm-4.6",
        messages: [
          {
            role: "user",
            content: `
You are a reading-plan generator. For the topic "${topic}", return EXACTLY this JSON format:

{
 "topic": "${topic}",
 "estimatedTime": "3-6 months",
 "difficulty": "Progressive",
 "subtopics": [
   {
     "id": 1,
     "title": "Fundamentals",
     "description": "Short English description.",
     "books": [
       {
         "title": "Book title",
         "author": "Author name",
         "difficulty": "Beginner",
         "totalPages": 300
       }
     ]
   }
 ]
}

Rules:
- Output ONLY pure JSON.
- No markdown, no explanation, no backticks.
            `.trim()
          }
        ],
        temperature: 0.7
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    let content = response.data?.choices?.[0]?.message?.content || "";
    content = content.trim();

    if (content.startsWith("```")) {
      content = content.replace(/```json/g, "")
                       .replace(/```/g, "")
                       .trim();
    }

    let plan;

    try {
      plan = JSON.parse(content);
    } catch (err) {
      console.error("JSON parse failed:", content);

      const fixed = content.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
      try {
        plan = JSON.parse(fixed);
      } catch (e2) {
        return res.json({ rawText: content });
      }
    }

    return res.json({ plan });

  } catch (err) {
    console.error("AI error:", err.response?.data || err.message);
    res.status(500).json({ message: "Failed to generate reading plan" });
  }
});


app.listen(PORT, () => {
  console.log(`🚀 API server listening on http://localhost:${PORT}`);
});


