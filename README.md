# PlotHole — Cinephile Community & Movie Tracking Platform

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Playwright](https://img.shields.io/badge/Tested%20with-Playwright-2EAD33?style=flat-square&logo=playwright&logoColor=white)](https://playwright.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

PlotHole is a full-stack social platform designed for cinema enthusiasts. It allows users to discover movies via TMDB, maintain a personalized viewing diary, log ratings and in-depth reviews, organize watchlists, and follow friends in an interactive community feed.

---

## ⚡ Key Highlights

- **Complete Social Loop**: User follows, activity feeds, diary logging, and community review threads.
- **Automated E2E Testing**: Comprehensive test coverage across core flows powered by **Playwright**.
- **Resilient Database Layer**: Configured for both local SQLite development and zero-overhead PostgreSQL cloud deployment.
- **Instant Search & Discovery**: Real-time debounce movie search and genre curation utilizing the TMDB REST API.
- **Security & Integrity**: JWT-based session authorization, bcrypt password hashing, and parameterized queries.

---

## 🏗️ Architecture

`
PlotHole/
├── backend/
│   ├── config/             # Database connection & migrations (PostgreSQL / SQLite)
│   ├── controllers/        # Route logic for auth, movies, reviews, and diary
│   ├── middleware/         # JWT verification & request validation
│   ├── routes/             # RESTful API routing
│   └── server.js           # Express application entrypoint
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components & modals
│   │   ├── pages/          # Feed, Movie Details, Profile, Diary, Watchlist
│   │   ├── services/       # API abstraction layer (Axios / TanStack Query)
│   │   └── context/        # Auth & theme state management
│   └── vite.config.js
├── e2e/                    # Playwright end-to-end integration tests
└── playwright.config.js    # Multi-browser headless test configuration
`

---

## 🧪 Automated Testing (Playwright)

PlotHole features end-to-end verification covering user registration, review submission, and diary updates.

`ash
# Run all end-to-end browser tests
npx playwright test

# Run tests in interactive UI mode
npx playwright test --ui

# View generated HTML test report
npx playwright show-report
`

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm
- TMDB API Key ([The Movie Database](https://www.themoviedb.org/documentation/api))

### 1. Clone & Install Dependencies
`ash
git clone https://github.com/saptak69/PlotHole.git
cd PlotHole

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
`

### 2. Configure Environment Variables
Create a .env file in the ackend/ directory:
`env
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
TMDB_API_KEY=your_tmdb_api_key_here
# Optional: defaults to local SQLite if DATABASE_URL is not set
DATABASE_URL=postgresql://username:password@localhost:5432/plothole
`

### 3. Run Development Servers
`ash
# Terminal 1 - Backend (http://localhost:5000)
cd backend && npm run dev

# Terminal 2 - Frontend (http://localhost:5173)
cd frontend && npm run dev
`

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.