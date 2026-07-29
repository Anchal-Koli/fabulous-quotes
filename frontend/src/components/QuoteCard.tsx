import React from 'react';

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

interface QuoteCardProps {
  quote: Quote;
  onLike: (id: number) => void;
  isLoading: boolean;
  isSansFont?: boolean;
  language: 'en' | 'hi' | 'hinglish';
  isLiked: boolean;
  isEmbedView?: boolean;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({ 
  quote, 
  onLike, 
  isLoading, 
  isSansFont = false,
  language = 'en',
  isLiked = false,
  isEmbedView = false
}) => {
  const [copied, setCopied] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [showExportMenu, setShowExportMenu] = React.useState(false);
  const [showTakeaway, setShowTakeaway] = React.useState(false);
  const [copiedEmbed, setCopiedEmbed] = React.useState(false);

  // Safely extract active localized content with fallbacks
  const activeContent = quote[language] || quote.en || { text: '', author: '', takeaway: '' };

  const handleCopy = () => {
    navigator.clipboard.writeText(`"${activeContent.text}" — ${activeContent.author}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate Iframe Embed code
  const getEmbedCode = () => {
    // Dynamically resolve active URL parameters
    const origin = window.location.origin;
    return `<iframe src="${origin}/embed/${quote.id}?lang=${language}" width="100%" height="280" style="border:1px solid rgba(0,0,0,0.06); border-radius:16px; background:#faf9f6;" title="Fabulous Quotes Embed"></iframe>`;
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(getEmbedCode());
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  // Helper to wrap text for HTML5 Canvas
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
    const words = text.split(' ');
    let line = '';
    const lines = [];

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    let currentY = y - ((lines.length - 1) * lineHeight) / 2;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i].trim(), x, currentY);
      currentY += lineHeight;
    }
  };

  // Generate and download image using HTML5 Canvas
  const handleExportImage = (format: 'square' | 'story') => {
    setIsExporting(true);
    setShowExportMenu(false);
    
    const canvas = document.createElement('canvas');
    if (format === 'story') {
      canvas.width = 1080;
      canvas.height = 1920;
    } else {
      canvas.width = 1080;
      canvas.height = 1080;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsExporting(false);
      return;
    }

    const w = canvas.width;
    const h = canvas.height;
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Draw Background
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    if (isDark) {
      gradient.addColorStop(0, '#101012');
      gradient.addColorStop(0.5, '#18181c');
      gradient.addColorStop(1, '#22222a');
    } else {
      gradient.addColorStop(0, '#faf9f6');
      gradient.addColorStop(0.5, '#f5efe4');
      gradient.addColorStop(1, '#ebe4d5');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // Draw Subtle Border Frames
    ctx.strokeStyle = isDark ? 'rgba(243, 210, 102, 0.12)' : 'rgba(212, 175, 55, 0.18)';
    ctx.lineWidth = 16;
    ctx.strokeRect(32, 32, w - 64, h - 64);

    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)';
    ctx.lineWidth = 2;
    ctx.strokeRect(48, 48, w - 96, h - 96);

    // Draw Design Ornaments
    ctx.fillStyle = isDark ? '#f3d266' : '#d4af37';
    ctx.font = '36px serif';
    ctx.textAlign = 'center';
    
    const ornamentY = format === 'story' ? 320 : 180;
    const tagY = format === 'story' ? 380 : 230;
    const quoteY = format === 'story' ? 900 : 520;
    const lineY = format === 'story' ? 1460 : 780;
    const authorY = format === 'story' ? 1520 : 830;
    const footerY = format === 'story' ? 1820 : 1010;

    ctx.fillText('✦', w / 2, ornamentY);

    // Draw Tag Badge
    ctx.fillStyle = isDark ? '#f3d266' : '#d4af37';
    ctx.font = 'bold 16px Outfit, sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText(quote.tag.toUpperCase(), w / 2, tagY);

    // Draw Quote Text
    ctx.fillStyle = isDark ? '#f5f5f7' : '#1e1e24';
    
    if (isSansFont) {
      ctx.font = '400 36px Outfit, sans-serif';
    } else {
      ctx.font = 'italic 44px Playfair Display, Georgia, serif';
    }
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const quoteString = `“ ${activeContent.text} ”`;
    wrapText(ctx, quoteString, w / 2, quoteY, 820, 68);

    // Draw Separator Line
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 100, lineY);
    ctx.lineTo(w / 2 + 100, lineY);
    ctx.stroke();

    // Draw Author
    ctx.fillStyle = isDark ? '#9e9ea7' : '#6e6e76';
    ctx.font = '500 20px Outfit, sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText(`— ${activeContent.author.toUpperCase()} —`, w / 2, authorY);

    // Draw Branding Watermark
    ctx.fillStyle = isDark ? 'rgba(243, 210, 102, 0.25)' : 'rgba(212, 175, 55, 0.4)';
    ctx.font = 'bold 13px Outfit, sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText('FABULOUS QUOTES ✦ INSPIRE DAILY', w / 2, footerY);

    // Export & Download
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `fabulous-quote-${format}-${quote.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Failed to export quote card', e);
    } finally {
      setIsExporting(false);
    }
  };

  // Embed Mode Layout (Simplified)
  if (isEmbedView) {
    return (
      <div className={`quote-card-container embed-mode-card tag-${quote.tag}`}>
        <div className="quote-badge">{quote.tag.toUpperCase()}</div>
        <blockquote className={`quote-text ${isSansFont ? 'clean-sans' : 'classic-serif'}`}>
          <span className="quote-mark open">“</span>
          {activeContent.text}
          <span className="quote-mark close">”</span>
        </blockquote>
        <div className="quote-author">— {activeContent.author}</div>
      </div>
    );
  }

  return (
    <div className={`quote-card-container tag-${quote.tag} ${isLoading ? 'loading' : ''}`}>
      <div className="quote-badge">{quote.tag.toUpperCase()}</div>
      
      <blockquote className={`quote-text ${isSansFont ? 'clean-sans' : 'classic-serif'}`}>
        <span className="quote-mark open">“</span>
        {activeContent.text}
        <span className="quote-mark close">”</span>
      </blockquote>
      
      <div className="quote-author">— {activeContent.author}</div>

      {/* AI Deep Dive/Takeaway Section */}
      {showTakeaway && (
        <div className="quote-takeaway-container">
          <span className="takeaway-badge">💡 AI Takeaway</span>
          <p className="takeaway-text">{activeContent.takeaway || "Practical wisdom details loading..."}</p>
        </div>
      )}
      
      <div className="quote-actions">
        {/* Like Button */}
        <button 
          onClick={() => onLike(quote.id)} 
          className={`action-btn like-btn ${isLiked ? 'liked' : ''}`}
          aria-label={isLiked ? "Unlike quote" : "Like quote"}
        >
          <span className="icon">{isLiked ? '❤️' : '🖤'}</span>
          <span className="count">{quote.likes}</span>
        </button>
        
        {/* Copy Button */}
        <button 
          onClick={handleCopy} 
          className="action-btn copy-btn"
          aria-label="Copy to clipboard"
        >
          <span className="icon">{copied ? '✅' : '📋'}</span>
          <span className="text">{copied ? 'Copied!' : 'Copy'}</span>
        </button>

        {/* AI Deep Dive Button */}
        <button 
          onClick={() => setShowTakeaway(!showTakeaway)} 
          className={`action-btn takeaway-btn ${showTakeaway ? 'active' : ''}`}
          aria-label="Toggle Takeaway Context"
        >
          <span className="icon">💡</span>
          <span className="text">What this means?</span>
        </button>

        {/* Share Dropdown Button */}
        <div className="share-menu-container">
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)} 
            className="action-btn download-btn"
            aria-label="Share card dropdown"
            disabled={isExporting}
          >
            <span className="icon">🎨</span>
            <span className="text">{isExporting ? 'Creating...' : 'Share Card'}</span>
            <span className="arrow">▾</span>
          </button>
          
          {showExportMenu && (
            <div className="share-dropdown">
              <button onClick={() => handleExportImage('square')}>
                📸 Instagram Square (1:1)
              </button>
              <button onClick={() => handleExportImage('story')}>
                📱 Instagram Story (9:16)
              </button>
              <button onClick={handleCopyEmbed} className="embed-code-btn">
                {copiedEmbed ? '✅ Copied Embed!' : '🖥️ Copy Embed Code'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
