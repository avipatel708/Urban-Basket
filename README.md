# 🛒 Urban-Basket

[![GitHub license](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.0-blue.svg?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF.svg?logo=vite&logoColor=white)](https://vite.dev)
[![TailwindCSS v4](https://img.shields.io/badge/TailwindCSS-v4.0-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E.svg?logo=supabase&logoColor=white)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-AI_Search-orange.svg?logo=google-gemini&logoColor=white)](https://deepmind.google/technologies/gemini/)

**Urban-Basket** is a state-of-the-art e-commerce platform built to provide a premium, modern, and highly interactive shopping experience. Packed with advanced features like **Gemini 2.5 Flash Dual-Engine Visual Search**, a custom **Singleton Voice Search**, real-time inventory tracking via **Supabase**, dynamic dashboards, a premium **Delivered Order Review Popup**, and high-fidelity micro-animations.

---

## 🌟 Advanced Engineering Highlights

### 📸 1. Dual-Engine Visual Similarity Search (Google Lens Style)
Unlike typical platforms that perform crude keyword tags or rely entirely on error-prone client-side classification, Urban-Basket features a sophisticated **Dual-Engine Search system**:

```
      [Uploaded Product Image]
                 │
                 ▼
     ┌───────────────────────┐
     │  visualSearchService  │
     └───────────┬───────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
   [ENGINE A]        [ENGINE B] (Fallback)
 Gemini 2.5 Flash     Sharp Color Extraction
Multimodal Analysis         + Suffix-Fuzzy
        │                 │ (Singular/Plural Resolve)
        │                 │
        ▼                 ▼
  Live Catalog Match  ◄───┘
 (Visual Design &   
  Harmonious Ranking)
```

- **Engine A (Direct Vision Matching)**: Integrates the `gemini-2.5-flash` model. It takes the base64-encoded image and feeds it alongside the entire live catalog to match visual aesthetics, shapes, styling, and color profiles directly.
- **Engine B (Fuzzy Tag-Color Fallback)**: Runs if the API key is not present. Extracts image color palettes using **Sharp** and executes a suffix-fuzzy resolver (`hasWord`) supporting singular/plural variants (e.g. matching a photo labeled `"sneaker"` to a product titled `"Velocity Running Shoes"`) to ensure zero-result screens are avoided.

### 🎙️ 2. High-Reliability Voice Search
Replaces standard erratic voice integrations with a resilient, production-ready system:
- **Singleton SpeechRecognition Pattern**: Binds listeners to a single `SpeechRecognition` instance, resolving browser restart crashes and duplicate event triggers.
- **User-Centric Permissions**: Uses proactive browser `getUserMedia` checks for microphone availability before waking the transcription engine, offering actionable permission warnings.
- **Listening Guardrails**: Incorporates a built-in 8-second speech silence timeout to automatically reset microphone state and notify users.

### 🎁 3. Full-Screen "Delivered Order" Review Dialog
Designed to significantly increase customer engagement:
- Recognizes immediately when an order is updated to `delivered`.
- On page load, presents a beautiful, prominent overlay showcase displaying the product image, delivery status, and an **inline five-star review form**.
- Bypasses standard quiet notifications, prompting users directly to review their purchases and capturing useful store feedback.

---

## 🛠️ The Tech Stack

### Frontend (Modern SPA)
* **Framework**: React 19 & TypeScript 6
* **Build Tool**: Vite 8 (Ultra-fast HMR)
* **Styling**: Tailwind CSS v4 & Lucide React (Premium icons)
* **State Management**: Zustand 5 (High-performance, minimal boilerplate)
* **Animations**: Motion 12 (Dynamic transitions and physics)
* **Routing**: React Router 7
* **Interactive Components**: Recharts (Dashboard metrics) & Leaflet (Geographical tracking)

### Backend (Robust REST API)
* **Runtime**: Node.js (ES Module format)
* **Framework**: Express
* **Database & Auth**: Supabase JS Client SDK
* **File Uploads**: Multer
* **Image Processing**: Sharp
* **AI Engine**: `@google/generative-ai` (Gemini 2.5 Flash)

---

## 📂 Project Structure

```
Urban-Basket/
├── backend/                   # REST API Service
│   ├── config/                # Db and API Configuration
│   ├── controllers/           # Route Business Logic (Auth, Products, Visual Search, Orders)
│   ├── routes/                # Express API Route Declarations
│   ├── services/              # Gemini AI and Sharp Utilities
│   ├── uploads/               # Temporary uploads storage
│   ├── server.js              # Application Entry point
│   └── package.json
│
├── frontend/                  # React Single Page App
│   ├── src/
│   │   ├── components/        # Reusable UI Blocks (Search Bars, Cards, Voice Buttons)
│   │   ├── hooks/             # Custom hooks (useVoiceSearch, useCart)
│   │   ├── pages/             # View Screen Routings (Home, Products, Dashboards)
│   │   ├── services/          # API Services & Fetch utilities
│   │   ├── utils/             # Query Parsers & Speech Recog Singletons
│   │   └── main.tsx
│   ├── index.html
│   └── package.json
```

---

## 🚀 Installation & Local Setup

### Prerequisites
* **Node.js** (v18.x or above recommended)
* **npm** (v9.x or above)
* **Supabase Project** (Database & Storage buckets configured)

### 1. Set Up the Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the template and fill in your keys:
   ```env
   PORT=5000
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_service_role_key
   JWT_SECRET=your_jwt_signing_key
   GEMINI_API_KEY=your_google_gemini_api_key
   ```
4. Seed the database with catalog mock products:
   ```bash
   node seed-db.js
   ```
5. Run the dev server:
   ```bash
   npm run dev
   ```

### 2. Set Up the Frontend
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_client_anon_key
   ```
4. Launch the application locally:
   ```bash
   npm run dev
   ```
   Open your browser to the URL printed in the terminal (usually `http://localhost:5173`).

---

## 📡 Essential REST API Endpoints

### 🔐 Authentication
* `POST /api/auth/register` — Create a customer account
* `POST /api/auth/login` — Sign in and receive JWT token

### 🏷️ Products
* `GET /api/products` — Retrieve list of products (supports filtering, sorting, price range)
* `GET /api/products/:id` — Details of a specific product

### 📸 AI & Visual Search
* `POST /api/visual-search` — Match and rank catalog products against uploaded images (Gemini + Suffix-Fuzzy engine)

### 📦 Orders & Tracking
* `POST /api/orders` — Complete order checkout
* `GET /api/orders/my-orders` — Customer purchase history
* `PATCH /api/orders/:id/status` — Admin update (triggers Delivered Review Popup when status becomes `delivered`)

---

## ⚡ Build & Verification
To verify the codebase, check for compilation or bundler errors:

```bash
# Within the frontend directory
npm run build
```

This verifies that the custom speech recognition hooks, visual search page interfaces, and TypeScript compilers run cleanly without warnings.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
