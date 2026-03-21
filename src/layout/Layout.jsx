import { useEffect } from 'react';
import { LogOut, Sparkles, Bell, Calendar, ClipboardList, LayoutDashboard, BookOpenCheck } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

const STORAGE_KEY = 'tmd-exam-timetable';
const DAILY_NOTIFICATION_KEY = 'tmd-last-exam-alert';
const DAILY_QUOTES = [
  'Keep going. Your consistency is your superpower.',
  'Small steps today become big success tomorrow.',
  'Focus for one hour now. Future you will thank you.',
  'Progress matters more than perfection.',
  'Believe in your preparation and trust your effort.',
];

const toLocalIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Goal Planner', path: '/goal-planner', icon: BookOpenCheck },
  { label: 'Exam Helper', path: '/exam-helper', icon: ClipboardList },
  { label: 'Smart Calendar', path: '/smart-calendar', icon: Calendar },
  { label: 'Smart Alerts', path: '/smart-alerts', icon: Bell },
];

const normalizeExams = (schedule) => {
  return (schedule?.exams || [])
    .map((item) => ({
      date: String(item?.date || '').trim(),
      subject: String(item?.subject || '').trim(),
      time: String(item?.time || '').trim(),
    }))
    .filter((item) => item.date && item.subject);
};

const Layout = ({ user, onLogout }) => {
  useEffect(() => {
    const pushExamReminder = async () => {
      const now = new Date();
      if (now.getHours() < 7) return;

      const todayIso = toLocalIsoDate(now);
      if (localStorage.getItem(DAILY_NOTIFICATION_KEY) === todayIso) return;

      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      let schedule;
      try {
        schedule = JSON.parse(raw);
      } catch {
        return;
      }

      const exams = normalizeExams(schedule);
      if (exams.length === 0) return;

      const tomorrowDate = new Date(now);
      tomorrowDate.setHours(0, 0, 0, 0);
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrowIso = toLocalIsoDate(tomorrowDate);

      const todayExam = exams.find((exam) => exam.date === todayIso);
      const tomorrowExam = exams.find((exam) => exam.date === tomorrowIso);

      if (!('Notification' in window)) return;
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      if (Notification.permission !== 'granted') return;

      let body = '';
      if (todayExam) {
        body = `All the best for your ${todayExam.subject}`;
      } else if (tomorrowExam) {
        body = `Tomorrow you have ${tomorrowExam.subject}`;
      } else {
        body = DAILY_QUOTES[now.getDate() % DAILY_QUOTES.length];
      }

      new Notification('Track My Day - Exam Reminder', { body });
      localStorage.setItem(DAILY_NOTIFICATION_KEY, todayIso);
    };

    pushExamReminder();
    const timer = window.setInterval(pushExamReminder, 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen app-bg pb-16 md:pb-0">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px]">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200/70 bg-white/75 p-5 backdrop-blur md:flex md:flex-col">
          <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-blue-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary text-white shadow-lg shadow-sky-400/30">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">Track My Day</p>
                <p className="text-[10px] uppercase font-bold text-sky-600">Student Planner</p>
              </div>
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                      isActive
                        ? 'bg-brand-primary text-white shadow-lg shadow-sky-500/25'
                        : 'text-slate-600 hover:bg-sky-50 hover:text-brand-primary'
                    }`
                  }
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <img src={user.avatar} alt="profile" className="h-10 w-10 rounded-xl object-cover ring-2 ring-sky-50" />
              <div>
                <p className="text-sm font-bold text-slate-900">{user.username}</p>
                <p className="text-[11px] font-medium text-slate-600">{user.email}</p>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-100"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-sky-600">Welcome back</p>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">{user.username}</h1>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onLogout}
                  className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-100"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
            <Outlet context={{ user }} />
          </main>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium transition-all ${
                    isActive
                      ? 'bg-sky-100 text-brand-primary'
                      : 'text-slate-500'
                  }`
                }
              >
                <Icon size={16} />
                <span className="truncate">{item.label.split(' ')[0]}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
