# Track My Day

Track My Day is a React + Vite student productivity app for planning goals, parsing timetables from images, tracking exams, and organizing study routines.

## Features

- Login flow with localStorage session persistence.
- Goal Planner chat that uses Groq chat completions with a local fallback response when no API key is configured.
- Exam Helper that extracts exam rows from uploaded images through Groq vision models, with manual edit and save support.
- Timetable Upload that extracts class timetable entries from uploaded images and generates SQL insert previews.
- Smart Calendar and Smart Alerts pages for study planning and exam reminders.

## Tech Stack

- React 19
- Vite 8
- React Router 7
- Tailwind CSS 4
- Lucide React

## Routes

- /login
- / (home dashboard)
- /goal-planner
- /exam-helper
- /timetable
- /smart-calendar
- /smart-alerts

## Environment Variables

Create a .env.local file in the project root when using AI features:

```env
VITE_GROQ_API_KEY=your_groq_api_key
VITE_GROQ_MODEL=llama-3.3-70b-versatile
VITE_GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
```

Notes:

- VITE_GROQ_API_KEY is required for live Groq calls.
- VITE_GROQ_MODEL is used by Goal Planner.
- VITE_GROQ_VISION_MODEL is optional; if omitted, built-in fallback vision models are tried.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start the dev server:

```bash
npm run dev
```

3. Open the app at http://localhost:5173.

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build production bundle
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Project Structure

```text
src/
  App.jsx
  main.jsx
  layout/
    Layout.jsx
  pages/
    AddEdit.jsx
    Calendar.jsx
    ExamHelper.jsx
    Home.jsx
    Login.jsx
    Notifications.jsx
    TimetableUpload.jsx
  components/
  styles/
    globals.css
```

## Data Storage

- User session and planner data are stored in browser localStorage.
- AI requests are sent directly from the client to Groq endpoints.

## Contributing

1. Create a feature branch.
2. Make your changes.
3. Run lint and build checks.
4. Open a pull request.
