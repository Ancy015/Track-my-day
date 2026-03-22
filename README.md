# 📅 Track My Day - Student Productivity Hub

A modern, intelligent productivity app designed to help students plan goals, track progress, manage exams, and stay organized—all in one beautiful interface.

---

## ✨ Features

### 🔐 **Smart Login System**
- Quick authentication with username and Gmail validation
- User profile management with avatar generation
- Persistent login using browser localStorage
- Secure session management

### 🏠 **Interactive Dashboard**
- Personalized greetings based on time of day (Good morning/afternoon/evening)
- Dynamic motivational quotes that change daily
- Quick access to user profile and email
- Clean, intuitive navigation hub

### 🎯 **AI-Powered Goal Planner**
- Chat-based interface with intelligent goal planning assistant
- Get personalized learning roadmaps from beginner to pro level
- AI-crafted study plans based on your goals and timeline
- YouTube channel recommendations for specific topics
- Weekly study schedules and practical next steps
- Powered by **Groq LLM API** (Llama 3.3 70B model) for fast, accurate responses

### 📚 **Exam Helper**
- OCR-powered text recognition using **Tesseract.js**
- Extract and digitize exam-related content from images
- Store and manage exam notes efficiently
- Quick reference during study sessions

### 📆 **Smart Calendar**
- Year/month view navigation with holiday markers
- Track important academic events and breaks
- Visualize working days and weekends
- Campus-specific events pre-loaded
- Plan study schedules around key dates

### 🔔 **Smart Alerts & Notifications**
- Create and manage exam timetables
- Set exam reminders with subject, date, and time
- Daily motivational quotes to stay focused
- Upcoming exam preview and alerts
- Never miss an important deadline

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **React 19.2** | UI framework |
| **Vite** | Fast build tool & dev server |
| **React Router 7** | Client-side routing |
| **Tailwind CSS 4** | Styling & responsive design |
| **Lucide React** | Beautiful SVG icons |
| **Tesseract.js** | OCR for text recognition |
| **Groq API** | AI-powered goal planning |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn package manager
- Groq API key (for Goal Planner feature)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ancy015/Track-my-day.git
   cd Track-my-day
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env.local` file in the root directory:
   ```
   VITE_GROQ_MODEL=llama-3.3-70b-versatile
   VITE_GROQ_API_KEY=your_groq_api_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   The app will open at `http://localhost:5173`

---

## 📦 Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint for code quality
npm run lint
```

---

## 📱 App Structure

```
src/
├── pages/
│   ├── Login.jsx           # User authentication
│   ├── Home.jsx            # Dashboard with greeting & quotes
│   ├── AddEdit.jsx         # Goal Planner with AI assistant
│   ├── ExamHelper.jsx      # OCR text recognition
│   ├── Calendar.jsx        # Smart calendar view
│   └── Notifications.jsx   # Exam alerts & reminders
├── layout/
│   └── Layout.jsx          # Main app layout with navigation
├── components/             # Reusable UI components
├── assets/                 # Images and static files
├── styles/
│   └── globals.css         # Global Tailwind styles
├── App.jsx                 # Main app routing
└── main.jsx                # React entry point
```

---

## 🎨 User Interface Highlights

- **Modern Design**: Clean, minimalist interface with gradient backgrounds
- **Dark Mode Ready**: Sleek light theme with blue accent colors
- **Fully Responsive**: Works seamlessly on desktop, tablet, and mobile
- **Smooth Animations**: Card hover effects and page transitions
- **Accessible**: Semantic HTML and keyboard navigation
- **Glassmorphism**: Frosted glass effect with backdrop blur

---

## 🔑 Key Components

### Authentication Flow
- Gmail validation with format checking
- Local storage persistence for user sessions
- Automatic redirect to login for unauthorized access

### Goal Planner AI
- Real-time chat interface
- System prompts optimized for learning goals
- Fallback responses for offline scenarios
- Structured output: summaries, roadmaps, YouTube recommendations

### Calendar Features
- Month navigation with previous/next buttons
- Holiday highlighting with custom labels
- Count working days vs. weekends
- Pre-populated academic events

### Notifications System
- Store exam schedules in localStorage
- Date and time tracking
- Daily inspirational quotes
- Smart preview of upcoming exams

---

## 🌟 Tips for Best Experience

1. **Goal Planner**: Be specific about your learning goals and timeline for better recommendations
2. **Exam Alerts**: Add all your exams early to get advanced reminders
3. **Calendar**: Check your calendar before planning study sessions
4. **Login**: Remember to use a valid Gmail address for full features

---

## 📝 Notes

- User data is stored locally in your browser (localStorage)
- No data is sent to external servers except Groq API for AI features
- Clear browser cache or use incognito mode to start fresh

---

## 🤝 Contributing

Found a bug or have a feature idea? Feel free to contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the MIT License.

---

## 👨‍💻 Author

**Ancy015**
- GitHub: [@Ancy015](https://github.com/Ancy015)
- Project: [Track My Day Repository](https://github.com/Ancy015/Track-my-day)

---

## 🙏 Acknowledgments

- **Groq API** for powerful LLM capabilities
- **Tesseract.js** for OCR functionality
- **Tailwind CSS** community for design utilities
- **React & Vite** teams for amazing developer experience

---

**Happy Tracking! 📊✨**

*Track your goals, plan your exams, master your time.*
