# ✦ Fabulous Quotes

A premium, full-stack, and high-performance **Inspirational Quote Engine** crafted with a gorgeous glassmorphic Dark Theme, multi-lingual translations, PWA capability, customizable canvas downloads, and real-time smart parameters.

🚀 **Live Site:** [fabulous-quotes.vercel.app](https://fabulous-quotes.vercel.app)

---

## ✨ Features

- **🧘 Zen Focus Mode:** Escape layout noise. Switch to a calming minimal screen with category-themed neon signature glows (*Neon Blue, Fire Orange, Violet Purple, Teal Pink, and Warm Gold*).
- **🗣️ Multilingual Capabilities:** Fully localizable in English, Hindi (हिंदी), and Hinglish with dedicated translations.
- **🎨 Canvas Image Downloader:** Instant Canvas compilation. Export your favorite quotes formatted for:
  - **1:1** Square (Instagram / Grid feeds)
  - **9:16** Stories (Instagram Stories / Shorts / Reels)
- **🔥 Streaks & Gamification:** Maintain daily reading streaks with a 7-Day calendar checklist and custom built-in CSS confetti particles shower.
- **📁 Custom Folder Collections:** Organize and save bookmarks into custom categories (*Exam Motivation, Tech Mindset, Inner Peace, etc.*) stored locally.
- **🧠 AI Deep-Dive Takeaways:** Every quote includes a practical 2-line life/tech application tip contextually customized using tag classifiers.
- **🔌 Copyable Embed Widgets:** Direct iframe embed routes (`/embed/:id`) to paste interactive quotes cards directly on your portfolio or GitHub Profile README.

---

## 🛠️ Technology Stack

### Frontend
- **React 19 & TypeScript**
- **Vite** (Build Tool)
- **Vanilla CSS3** (Curated custom palette, keyframe animations, glassmorphism filters, neon overlays)
- **HTML5 Canvas API** (Dynamic image compilation and downloader)

### Backend
- **Node.js (ESM) & Express 5**
- **TypeScript**
- **Local JSON DB Storage & Real-Time Sync:** Automatic filesystem write loops (`fs.readFileSync` & `fs.writeFileSync`) ensuring complete persistence of custom user quotes across restarts.

---

## 📂 Project Structure

```
fabulous-quotes/
├── backend/
│   ├── src/
│   │   ├── index.ts          # Express Server Setup
│   │   ├── routes/
│   │   │   └── quotes.ts     # CRUD & Interaction Logic
│   │   └── data/
│   │       └── quotes.json   # JSON Database Storage
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Application Core Logic
│   │   ├── main.tsx          # Client Entry Point
│   │   ├── App.css           # Styling Sheet
│   │   └── components/
│   │       ├── QuoteCard.tsx # Rendering Card Engine
│   │       └── AddQuoteModal.tsx
│   ├── index.html
│   └── vite.config.ts
```

---

## ⚡ Setup & Installation

### Prerequisites
- Node.js (v18+)
- npm / yarn

### 1. Backend Setup
```bash
cd backend
npm install
# Start local development server
npm run dev
# For production
npm run build && npm start
```
*Port default:* `http://localhost:5000`

### 2. Frontend Setup
```bash
cd ../frontend
npm install
# Start Vite client dev server
npm run dev
```
*Port default:* `http://localhost:5173`

---

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for more information.

Crafted with ❤️ for mental focus and technical clarity.
