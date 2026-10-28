<div align="center">

# 🎯 DeterMind

**Determine your path. Dominate your day.**

A personal life-tracking and self-improvement dashboard for students.

[**Open the app →**](https://deter-mind.vercel.app)

</div>

## ✨ Features

| | Feature | What it does |
|---|---|---|
| ✅ | **To-do** | Plan the day's tasks and tick them off. |
| 📅 | **Routine** | Build a daily routine and edit it any time. |
| 📊 | **Tracker** | See your progress on a dashboard with charts. |
| ⏱️ | **Focus** | Distraction-free focus sessions. |
| 🏆 | **Leaderboard** | Stay motivated alongside other students. |
| 🤖 | **Sigma** | A built-in AI assistant for advice and planning. |
| 🔔 | **Smart reminders** | Timely nudges to keep you on track. |
| 📱 | **Installable** | Works as a PWA on your phone. |

> 🚧 DeterMind is in active development.

## 🛠️ Tech stack

- **React** + **Vite**
- **Firebase** (Google login + Firestore) for optional cloud backup — browsing never needs it, using a feature does
- **Gemini**, called through a server route (`api/ai.js`) so the key never reaches the browser
- **Zustand** for state, **React Router**, **Recharts**, **Framer Motion**
- **Tailwind CSS**

## 🚀 Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173. Copy `.env.example` to `.env` and fill in your Firebase project config and `GEMINI_API_KEY` first — see the comments in `.env.example` for what each one needs and where it's set (Vercel project settings for the server-only key).

## 👤 Author

Built by **[Abdul Aziz Kayes](https://github.com/Kayes2323)**.
