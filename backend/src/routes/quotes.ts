import { Router, type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import initialQuotes from '../data/quotes.json' with { type: 'json' };

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const quotesFilePath = path.join(__dirname, '../data/quotes.json');

interface QuoteContent {
  text: string;
  author: string;
  takeaway: string;
}

interface Quote {
  id: number;
  tag: string;
  likes: number;
  en: QuoteContent;
  hi: QuoteContent;
  hinglish: QuoteContent;
}

// Helper to load quotes from file dynamically
const loadQuotesFromFile = (): Quote[] => {
  try {
    if (fs.existsSync(quotesFilePath)) {
      const data = fs.readFileSync(quotesFilePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to read quotes from file, using fallback.', err);
  }
  return initialQuotes;
};

// Persist quotes back to quotes.json file helper
const saveQuotesToFile = (updatedQuotes: Quote[]) => {
  try {
    fs.writeFileSync(quotesFilePath, JSON.stringify(updatedQuotes, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write quotes to file', err);
  }
};

// Simple context-based takeaway generator for user additions
const generateAutoTakeaway = (text: string, tag: string, lang: 'en' | 'hi' | 'hinglish'): string => {
  const normalizedTag = tag.toLowerCase();
  if (lang === 'en') {
    if (normalizedTag === 'tech') return "Focus on execution over planning. Clear code logic and clean structure make your project scale.";
    if (normalizedTag === 'motivation') return "Take the first step today. Progress is built on small, consistent actions done daily.";
    return "Simplify your environment. Remove distraction and focus purely on what adds true long-term value.";
  } else if (lang === 'hi') {
    if (normalizedTag === 'tech') return "योजना बनाने से ज़्यादा काम करने पर ध्यान दें। स्पष्ट कोड लॉजिक और साफ स्ट्रक्चर आपके प्रोजेक्ट को बढ़ाता है।";
    if (normalizedTag === 'motivation') return "आज ही पहला कदम उठाएं। प्रगति रोज़ाना किए जाने वाले छोटे और निरंतर कार्यों से बनती है।";
    return "अपने वातावरण को सरल बनाएं। ध्यान भटकाने वाली चीज़ों को हटाएं और केवल उस पर ध्यान दें जो मूल्य जोड़ता है।";
  } else { // hinglish
    if (normalizedTag === 'tech') return "Planning se zyada executing par focus karein. Clear code logic aur clean structure hi project ko scale karta hai.";
    if (normalizedTag === 'motivation') return "Aaj hi pehla step lein. Progress hamesha daily basis par kiye gaye small actions se banti hai.";
    return "Apne environment ko simple banayein. Distractions ko cut down karein aur sirf real value par focus karein.";
  }
};

// GET random quote
router.get('/random', (req: Request, res: Response): void => {
  const { tag } = req.query;
  const quotes = loadQuotesFromFile();
  let filteredQuotes = quotes;

  if (typeof tag === 'string') {
    filteredQuotes = quotes.filter(q => q.tag.toLowerCase() === tag.toLowerCase());
  }

  if (filteredQuotes.length === 0) {
    res.status(404).json({ error: `No quotes found for tag: ${tag}` });
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  res.json(filteredQuotes[randomIndex]);
});

// GET popular quotes (sorted by likes)
router.get('/popular', (req: Request, res: Response): void => {
  const quotes = loadQuotesFromFile();
  const sorted = [...quotes].sort((a, b) => b.likes - a.likes).slice(0, 3);
  res.json(sorted);
});

// GET all quotes (supports multilingual searching and tag filtering)
router.get('/', (req: Request, res: Response): void => {
  const { search, tag } = req.query;
  const quotes = loadQuotesFromFile();
  let result = quotes;

  if (typeof tag === 'string') {
    result = result.filter(q => q.tag.toLowerCase() === tag.toLowerCase());
  }

  if (typeof search === 'string' && search.trim() !== '') {
    const query = search.toLowerCase();
    result = result.filter(
      q =>
        q.en.text.toLowerCase().includes(query) ||
        q.en.author.toLowerCase().includes(query) ||
        q.hi.text.toLowerCase().includes(query) ||
        q.hi.author.toLowerCase().includes(query) ||
        q.hinglish.text.toLowerCase().includes(query) ||
        q.hinglish.author.toLowerCase().includes(query)
    );
  }

  res.json(result);
});

// POST a new quote with auto-generated AI takeaway context
router.post('/', (req: Request, res: Response): void => {
  const { text, author, tag, hiText, hiAuthor, hinglishText, hinglishAuthor } = req.body;
  const quotes = loadQuotesFromFile();

  if (!text || !author) {
    res.status(400).json({ error: 'Text and Author are required.' });
    return;
  }

  const activeTag = typeof tag === 'string' ? tag.toLowerCase() : 'general';

  const newQuote: Quote = {
    id: quotes.length > 0 ? Math.max(...quotes.map(q => q.id)) + 1 : 1,
    tag: activeTag,
    likes: 0,
    en: {
      text,
      author,
      takeaway: generateAutoTakeaway(text, activeTag, 'en')
    },
    hi: {
      text: hiText || text,
      author: hiAuthor || author,
      takeaway: generateAutoTakeaway(hiText || text, activeTag, 'hi')
    },
    hinglish: {
      text: hinglishText || text,
      author: hinglishAuthor || author,
      takeaway: generateAutoTakeaway(hinglishText || text, activeTag, 'hinglish')
    }
  };

  quotes.push(newQuote);
  saveQuotesToFile(quotes); // write to file for persistence
  res.status(201).json(newQuote);
});

// POST like a quote
router.post('/:id/like', (req: Request, res: Response): void => {
  const rawId = req.params.id;
  const idStr = Array.isArray(rawId) ? rawId[0] : rawId;
  const id = parseInt(idStr || '', 10);
  const quotes = loadQuotesFromFile();
  const quote = quotes.find(q => q.id === id);

  if (!quote) {
    res.status(404).json({ error: 'Quote not found.' });
    return;
  }

  quote.likes += 1;
  saveQuotesToFile(quotes); // write to file for persistence
  res.json({ id: quote.id, likes: quote.likes });
});

// POST unlike a quote (decrement likes count)
router.post('/:id/unlike', (req: Request, res: Response): void => {
  const rawId = req.params.id;
  const idStr = Array.isArray(rawId) ? rawId[0] : rawId;
  const id = parseInt(idStr || '', 10);
  const quotes = loadQuotesFromFile();
  const quote = quotes.find(q => q.id === id);

  if (!quote) {
    res.status(404).json({ error: 'Quote not found.' });
    return;
  }

  if (quote.likes > 0) {
    quote.likes -= 1;
    saveQuotesToFile(quotes); // write to file for persistence
  }
  res.json({ id: quote.id, likes: quote.likes });
});

export default router;
