import { useState, useEffect } from 'react';
import { QuoteCard } from './components/QuoteCard';
import { AddQuoteModal } from './components/AddQuoteModal';
import './App.css';

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

const CATEGORIES = ['all', 'wisdom', 'inspiration', 'motivation', 'design', 'tech', 'life'];
const FOLDERS = ['All Likes', 'My Quotes', 'Exam Motivation', 'Tech Mindset', 'Inner Peace', 'Miscellaneous'];

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [allQuotes, setAllQuotes] = useState<Quote[]>([]);
  const [displayedQuotes, setDisplayedQuotes] = useState<Quote[]>([]);
  const [popularQuotes, setPopularQuotes] = useState<Quote[]>([]);
  
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'spotlight' | 'collection'>('spotlight');
  const [streak, setStreak] = useState(0);
  const [error, setError] = useState('');

  // Font Style switch
  const [isSansFont, setIsSansFont] = useState(false);

  // Language switch
  const [language, setLanguage] = useState<'en' | 'hi' | 'hinglish'>('en');

  // Zen Mode toggle
  const [zenMode, setZenMode] = useState(false);

  // Track quotes added locally by this browser
  const [myQuoteIds, setMyQuoteIds] = useState<number[]>(() => {
    const saved = localStorage.getItem('fabulous-my-quotes');
    return saved ? JSON.parse(saved) : [];
  });

  // Track liked quote IDs locally to block multiple likes
  const [likedQuoteIds, setLikedQuoteIds] = useState<number[]>(() => {
    const saved = localStorage.getItem('fabulous-liked-quotes');
    return saved ? JSON.parse(saved) : [];
  });

  // Folder Bookmarks State
  const [bookmarkedFolders, setBookmarkedFolders] = useState<Record<number, string>>(() => {
    const saved = localStorage.getItem('fabulous-bookmarks');
    return saved ? JSON.parse(saved) : {};
  });
  const [selectedFolderFilter, setSelectedFolderFilter] = useState('All Likes');
  const [viewLikesOnly, setViewLikesOnly] = useState(false);

  // Smart Sorting state
  const [sortBy, setSortBy] = useState<'default' | 'likes' | 'short' | 'shuffle'>('default');

  // Quote of the Day
  const [quoteOfDay, setQuoteOfDay] = useState<Quote | null>(null);

  // Native CSS Confetti trigger
  const triggerConfetti = () => {
    const container = document.createElement('div');
    container.className = 'confetti-wrapper';
    document.body.appendChild(container);

    const colors = ['#f3d266', '#d4af37', '#ff4757', '#2ed573', '#1e90ff'];
    for (let i = 0; i < 60; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti-particle';
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.left = Math.random() * 100 + 'vw';
      particle.style.animationDelay = Math.random() * 2 + 's';
      particle.style.transform = `scale(${Math.random() * 0.8 + 0.4})`;
      container.appendChild(particle);
    }

    setTimeout(() => {
      container.remove();
    }, 4000);
  };

  // Fetch a random quote
  const fetchRandomQuote = async (tag?: string) => {
    setIsLoading(true);
    setError('');
    try {
      let url = `${API_BASE_URL}/api/quotes/random`;
      if (tag && tag !== 'all') {
        url += `?tag=${tag}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch a random quote.');
      }
      const data = await response.json();
      setTimeout(() => {
        setQuote(data);
        setIsLoading(false);
        trackStreak(true); // update streak
      }, 300);
    } catch (err: any) {
      setError(err.message || 'Error loading quote.');
      setIsLoading(false);
    }
  };

  // Fetch all quotes for collection view
  const fetchAllQuotes = async (category: string, search: string) => {
    setError('');
    try {
      let url = `${API_BASE_URL}/api/quotes`;
      const params = new URLSearchParams();
      if (category && category !== 'all') {
        params.append('tag', category);
      }
      if (search) {
        params.append('search', search);
      }
      
      const queryStr = params.toString();
      if (queryStr) {
        url += `?${queryStr}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch the quotes collection.');
      }
      const data = await response.json();
      setAllQuotes(data);
      
      // Calculate deterministic Quote of the Day
      if (data.length > 0) {
        const dateSeed = new Date().getDate();
        setQuoteOfDay(data[dateSeed % data.length]);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading collection.');
    }
  };

  // Fetch top liked quotes
  const fetchPopularQuotes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quotes/popular`);
      if (response.ok) {
        const data = await response.json();
        setPopularQuotes(data);
      }
    } catch (err) {
      console.error('Failed to load popular quotes', err);
    }
  };

  // Streak tracker logic
  const trackStreak = (isAction: boolean = false) => {
    const today = new Date().toDateString();
    const lastRead = localStorage.getItem('fabulous-last-read');
    let currentStreak = parseInt(localStorage.getItem('fabulous-streak') || '0', 10);

    if (!lastRead) {
      currentStreak = 1;
      if (isAction) triggerConfetti();
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      if (lastRead === yesterdayStr) {
        currentStreak += 1;
        if (isAction) triggerConfetti();
      } else if (lastRead !== today) {
        currentStreak = 1;
        if (isAction) triggerConfetti();
      }
    }

    localStorage.setItem('fabulous-last-read', today);
    localStorage.setItem('fabulous-streak', currentStreak.toString());
    setStreak(currentStreak);

    // Save history logs for the 7-day checklist
    const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'short' });
    const completedDays = JSON.parse(localStorage.getItem('fabulous-completed-days') || '[]');
    if (!completedDays.includes(currentDayName)) {
      completedDays.push(currentDayName);
      localStorage.setItem('fabulous-completed-days', JSON.stringify(completedDays));
    }
  };

  // Handle Liking / Folder Sorting with Unlike Toggle functionality
  const handleLike = async (id: number) => {
    const isAlreadyLiked = likedQuoteIds.includes(id);
    const endpoint = isAlreadyLiked ? 'unlike' : 'like';

    try {
      const response = await fetch(`${API_BASE_URL}/api/quotes/${id}/${endpoint}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error(`Failed to register ${endpoint}`);
      
      const data = await response.json();

      if (quote && quote.id === id) {
        setQuote({ ...quote, likes: data.likes });
      }

      setAllQuotes(prev =>
        prev.map(q => (q.id === id ? { ...q, likes: data.likes } : q))
      );

      // Update LocalStorage and state
      let updatedLikes = [...likedQuoteIds];
      if (isAlreadyLiked) {
        updatedLikes = updatedLikes.filter(qId => qId !== id);
        // Remove folder bookmarks assignment if unliked
        const updatedFolders = { ...bookmarkedFolders };
        delete updatedFolders[id];
        setBookmarkedFolders(updatedFolders);
        localStorage.setItem('fabulous-bookmarks', JSON.stringify(updatedFolders));
      } else {
        updatedLikes.push(id);
        // Auto assign to Miscellaneous if liked and not bookmark-categorized
        if (!bookmarkedFolders[id]) {
          handleAssignFolder(id, 'Miscellaneous');
        }
        triggerConfetti();
      }

      setLikedQuoteIds(updatedLikes);
      localStorage.setItem('fabulous-liked-quotes', JSON.stringify(updatedLikes));

      fetchPopularQuotes();
    } catch (err) {
      console.error(err);
    }
  };

  // Assign quote to folder bookmarks
  const handleAssignFolder = (quoteId: number, folderName: string) => {
    const updated = { ...bookmarkedFolders, [quoteId]: folderName };
    setBookmarkedFolders(updated);
    localStorage.setItem('fabulous-bookmarks', JSON.stringify(updated));
  };

  // Initial loads
  useEffect(() => {
    fetchRandomQuote();
    fetchAllQuotes('all', '');
    fetchPopularQuotes();
    
    const storedStreak = localStorage.getItem('fabulous-streak');
    if (storedStreak) {
      setStreak(parseInt(storedStreak, 10));
    }
  }, []);

  // Sync displayed quotes with filters, bookmarks, and sorting
  useEffect(() => {
    let filtered = [...allQuotes];

    // Filter by Folder Likes
    if (viewLikesOnly) {
      if (selectedFolderFilter === 'All Likes') {
        filtered = filtered.filter(q => bookmarkedFolders[q.id]);
      } else if (selectedFolderFilter === 'My Quotes') {
        filtered = filtered.filter(q => myQuoteIds.includes(q.id));
      } else {
        filtered = filtered.filter(q => bookmarkedFolders[q.id] === selectedFolderFilter);
      }
    }

    // Apply Smart Sorting
    if (sortBy === 'likes') {
      filtered.sort((a, b) => b.likes - a.likes);
    } else if (sortBy === 'short') {
      filtered.sort((a, b) => {
        const aLen = (a[language] || a.en).text.length;
        const bLen = (b[language] || b.en).text.length;
        return aLen - bLen;
      });
    } else if (sortBy === 'shuffle') {
      filtered.sort(() => Math.random() - 0.5);
    }

    setDisplayedQuotes(filtered);
  }, [allQuotes, bookmarkedFolders, selectedFolderFilter, viewLikesOnly, sortBy, language, myQuoteIds]);

  // Refetch list when active category or search query updates
  useEffect(() => {
    fetchAllQuotes(activeCategory, searchQuery);
  }, [activeCategory, searchQuery]);

  const handleAddSuccess = (newQuote: Quote) => {
    setAllQuotes(prev => [newQuote, ...prev]);
    setMyQuoteIds(prev => [...prev, newQuote.id]);
    setQuote(newQuote);
    setViewMode('spotlight');
    fetchPopularQuotes();
  };

  const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const completedDaysList = JSON.parse(localStorage.getItem('fabulous-completed-days') || '[]');

  // Check URL pathname for embed requests: /embed/:id
  const isEmbed = window.location.pathname.startsWith('/embed/');
  
  // Set embed language from query params if specified
  useEffect(() => {
    if (isEmbed) {
      const searchParams = new URLSearchParams(window.location.search);
      const queryLang = searchParams.get('lang');
      if (queryLang === 'hi' || queryLang === 'en' || queryLang === 'hinglish') {
        setLanguage(queryLang);
      }
    }
  }, [isEmbed]);

  if (isEmbed) {
    const match = window.location.pathname.match(/\/embed\/(\d+)/);
    const embedId = match ? parseInt(match[1], 10) : null;
    
    // Find matching quote in local collection or show loading
    const embedQuote = allQuotes.find(q => q.id === embedId);

    return (
      <div className="embed-container">
        {embedQuote ? (
          <QuoteCard 
            quote={embedQuote} 
            onLike={() => {}} 
            isLoading={false} 
            isSansFont={false}
            language={language}
            isLiked={false}
            isEmbedView={true}
          />
        ) : (
          <div className="embed-loading">✦ Whispering quote embed...</div>
        )}
      </div>
    );
  }

  // Active Quote of the Day text helper
  const activeHeroContent = quoteOfDay ? (quoteOfDay[language] || quoteOfDay.en) : null;

  // Zen Mode Layout
  if (zenMode && quote) {
    return (
      <div className={`app-layout zen-mode-active tag-${quote.tag}`}>
        {/* Floating Zen Exit Trigger */}
        <div className="zen-exit-container">
          <button className="btn-exit-zen" onClick={() => setZenMode(false)}>
            Exit Zen Mode 🧘
          </button>
        </div>

        {/* Central Card */}
        <main className="main-content zen-content">
          <QuoteCard 
            quote={quote} 
            onLike={handleLike} 
            isLoading={isLoading} 
            isSansFont={isSansFont}
            language={language}
            isLiked={likedQuoteIds.includes(quote.id)}
          />
          
          <button 
            className="btn-next-quote zen-next" 
            onClick={() => fetchRandomQuote(activeCategory)}
            disabled={isLoading}
          >
            ✦ Next Spark
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Navigation Header */}
      <header className="app-header">
        <div className="brand-logo">
          <span className="logo-icon">✦</span>
          <h1>Fabulous Quotes</h1>
        </div>

        {/* Global Toolbar */}
        <div className="global-toolbar">
          {/* Language Selector Bar */}
          <div className="language-selector-bar">
            <button 
              className={language === 'en' ? 'active' : ''} 
              onClick={() => setLanguage('en')}
            >
              EN
            </button>
            <button 
              className={language === 'hi' ? 'active' : ''} 
              onClick={() => setLanguage('hi')}
            >
              हिंदी
            </button>
            <button 
              className={language === 'hinglish' ? 'active' : ''} 
              onClick={() => setLanguage('hinglish')}
            >
              Hinglish
            </button>
          </div>

          {/* Font Toggle Icon */}
          <button 
            className={`toolbar-btn font-toggle-btn ${isSansFont ? 'active' : ''}`}
            onClick={() => setIsSansFont(!isSansFont)}
            title="Toggle Font Style (Serif / Sans)"
          >
            Aa
          </button>

          {/* Zen Mode Button */}
          <button 
            className="toolbar-btn zen-toggle-btn"
            onClick={() => setZenMode(true)}
            title="Enter Zen Focus Mode"
          >
            🧘
          </button>

          {/* Streak Flame Badge */}
          {streak > 0 && (
            <div 
              className="streak-badge clickable" 
              onClick={() => {
                setIsStreakModalOpen(true);
                triggerConfetti();
              }}
              title="View Daily Inspiration Streak"
            >
              <span className="streak-flame">🔥</span>
              <span className="streak-count">{streak} Day Streak</span>
            </div>
          )}
        </div>

        <div className="nav-controls">
          <button 
            className={`nav-btn ${viewMode === 'spotlight' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('spotlight');
              setViewLikesOnly(false);
              fetchRandomQuote(activeCategory);
            }}
          >
            Spotlight
          </button>
          <button 
            className={`nav-btn ${viewMode === 'collection' ? 'active' : ''}`}
            onClick={() => setViewMode('collection')}
          >
            Collection
          </button>
          <button 
            className="btn-add-quote"
            onClick={() => setIsModalOpen(true)}
          >
            + Add Custom
          </button>
        </div>
      </header>

      {/* Quote of the Day: Featured Hero Card */}
      {viewMode === 'spotlight' && quoteOfDay && activeHeroContent && !isLoading && (
        <section className="featured-hero-container">
          <div className="featured-hero-card">
            <div className="hero-badge">✦ QUOTE OF THE DAY ✦</div>
            <p className="hero-text">"{activeHeroContent.text}"</p>
            <span className="hero-author">— {activeHeroContent.author}</span>
            <div className="hero-actions-overlay">
              <button onClick={() => setQuote(quoteOfDay)}>Reveal in Spotlight</button>
            </div>
          </div>
        </section>
      )}

      {/* Hero Category Filter (Sticky Navigation) */}
      <section className="category-section">
        <div className="category-scroll-container">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`category-tab ${activeCategory === cat && !viewLikesOnly ? 'active' : ''}`}
              onClick={() => {
                setViewLikesOnly(false);
                setActiveCategory(cat);
                if (viewMode === 'spotlight') {
                  fetchRandomQuote(cat);
                }
              }}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {/* Main Content Area */}
      <main className="main-content">
        {error && <div className="error-banner">{error}</div>}

        {viewMode === 'spotlight' ? (
          <section className="spotlight-view">
            {quote ? (
              <QuoteCard 
                quote={quote} 
                onLike={handleLike} 
                isLoading={isLoading} 
                isSansFont={isSansFont}
                language={language}
                isLiked={likedQuoteIds.includes(quote.id)}
              />
            ) : (
              <div className="no-data">No quotes found.</div>
            )}
            
            <button 
              className="btn-next-quote" 
              onClick={() => fetchRandomQuote(activeCategory)}
              disabled={isLoading}
            >
              {isLoading ? 'Whispering next quote...' : 'Next Quote ✦'}
            </button>
          </section>
        ) : (
          <section className="collection-view">
            {/* Folder Bookmarks & Smart Sorting Layout */}
            <div className="collection-header-controls">
              {/* Folder Selector Tabs */}
              <div className="folder-tabs-container">
                <button 
                  className={`folder-tab ${!viewLikesOnly ? 'active' : ''}`}
                  onClick={() => setViewLikesOnly(false)}
                >
                  📁 All Feed
                </button>
                {FOLDERS.map(folder => (
                  <button
                    key={folder}
                    className={`folder-tab ${viewLikesOnly && selectedFolderFilter === folder ? 'active' : ''}`}
                    onClick={() => {
                      setViewLikesOnly(true);
                      setSelectedFolderFilter(folder);
                    }}
                  >
                    {folder === 'My Quotes' ? '✍️ My Quotes' : `❤️ ${folder}`}
                  </button>
                ))}
              </div>

              {/* Smart Sorting Dropdown */}
              <div className="sorting-container">
                <label htmlFor="smart-sort">Sort By: </label>
                <select 
                  id="smart-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="default">Original List</option>
                  <option value="likes">🔥 Most Liked</option>
                  <option value="short">⚡ Short & Crisp</option>
                  <option value="shuffle">🔀 Random Shuffle</option>
                </select>
              </div>
            </div>

            {/* Search Box */}
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Search quotes by content or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="clear-search" onClick={() => setSearchQuery('')}>
                  &times;
                </button>
              )}
            </div>

            {/* Popular Choices Section */}
            {popularQuotes.length > 0 && !searchQuery && activeCategory === 'all' && !viewLikesOnly && (
              <div className="trending-section">
                <h3 className="section-title">🏆 Popular Choices</h3>
                <div className="trending-grid">
                  {popularQuotes.map(pq => {
                    const activePqContent = pq[language] || pq.en;
                    return (
                      <div key={`trending-${pq.id}`} className="trending-card">
                        <p className="trending-text">"{activePqContent.text}"</p>
                        <div className="trending-footer-info">
                          <span className="trending-author">— {activePqContent.author}</span>
                          <span className="trending-likes">❤️ {pq.likes}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quote Grid */}
            <h3 className="section-title">
              {viewLikesOnly ? `Favorites: ${selectedFolderFilter}` : 'Quotes Collection'}
            </h3>
            {displayedQuotes.length > 0 ? (
              <div className="quotes-grid">
                {displayedQuotes.map(q => (
                  <div key={q.id} className="quote-grid-item-container">
                    <QuoteCard 
                      quote={q}
                      onLike={handleLike}
                      isLoading={false}
                      isSansFont={isSansFont}
                      language={language}
                      isLiked={likedQuoteIds.includes(q.id)}
                    />
                    
                    {/* Folder selector assignment dropdown */}
                    <div className="card-folder-assigner">
                      <label>Save to folder: </label>
                      <select
                        value={bookmarkedFolders[q.id] || 'None'}
                        onChange={(e) => handleAssignFolder(q.id, e.target.value)}
                      >
                        <option value="None">None</option>
                        {FOLDERS.slice(2).map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">
                <span className="no-data-icon">📁</span>
                <p>No quotes here yet. Add custom quotes or bookmark your likes!</p>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Interactive 7-Day Streak Checklist Modal */}
      {isStreakModalOpen && (
        <div className="modal-overlay" onClick={() => setIsStreakModalOpen(false)}>
          <div className="modal-content streak-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Inspiration Streak Status</h3>
              <button className="close-btn" onClick={() => setIsStreakModalOpen(false)}>&times;</button>
            </div>
            <div className="streak-hero-display">
              <span className="streak-huge-flame">🔥</span>
              <span className="streak-number">{streak}</span>
              <p>Days Inspirational Streak</p>
            </div>

            {/* 7 Day Checklist */}
            <div className="streak-checklist">
              {WEEKDAYS.map(day => {
                const isCompleted = completedDaysList.includes(day);
                return (
                  <div key={day} className={`streak-day-item ${isCompleted ? 'completed' : ''}`}>
                    <span className="day-checkbox">{isCompleted ? '✓' : ''}</span>
                    <span className="day-name">{day}</span>
                  </div>
                );
              })}
            </div>
            
            <p className="streak-encouragement">
              {streak > 3 ? "Fantastic! You're building a strong habit of wisdom." : "Keep loading daily quotes to complete your weekly checklist!"}
            </p>
          </div>
        </div>
      )}

      {/* Add Custom Quote Modal */}
      <AddQuoteModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      <footer className="app-footer">
        <p>Crafted for inspiration &middot; &copy; 2026</p>
      </footer>
    </div>
  );
}

export default App;
