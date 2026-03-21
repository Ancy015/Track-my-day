import { Quote, Sunrise, Sunset, UserRound } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

const motivationalQuotes = [
  'Progress is built one focused day at a time.',
  'Consistency beats intensity when you are learning.',
  'Small wins today become big success tomorrow.',
  'Your future self is waiting for your effort today.',
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const HomePage = () => {
  const { user } = useOutletContext();

  const quoteIndex = new Date().getDate() % motivationalQuotes.length;
  const selectedQuotes = [
    motivationalQuotes[quoteIndex],
    motivationalQuotes[(quoteIndex + 1) % motivationalQuotes.length],
  ];

  return (
    <div className="space-y-6 page-fade-in">
      <section className="card-base gradient-soft p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex-1 min-w-[300px]">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-sky-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-sky-700">
              {new Date().getHours() < 18 ? <Sunrise size={16} /> : <Sunset size={16} />}
              {getGreeting()}, {user.username}
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 sm:text-4xl">
              Let&apos;s <span className="text-brand-primary underline decoration-sky-500/30 underline-offset-8">track</span> your day
            </h2>
          </div>

          <div className="flex items-center gap-4 rounded-3xl border border-sky-100 bg-white p-4 shadow-xl shadow-sky-500/5">
            <img src={user.avatar} alt="profile" className="h-16 w-16 rounded-2xl object-cover ring-4 ring-sky-50" />
            <div>
              <p className="text-lg font-extrabold text-slate-900 tracking-tight">{user.username}</p>
              <p className="text-sm font-semibold text-slate-500">{user.email}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {selectedQuotes.map((quote) => (
          <article key={quote} className="card-base card-hover p-6">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-brand-primary">
              <Quote size={20} className="fill-brand-primary/10" />
            </div>
            <p className="text-sm font-semibold leading-relaxed text-slate-700">{quote}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="card-base p-6">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-sky-600">Focus today</p>
          <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-900">Goal Planner</h3>
          <p className="mt-1 text-sm font-semibold text-slate-600">Set your learning goal and timeline.</p>
        </article>

        <article className="card-base p-6">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-sky-600">Must check</p>
          <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-900">Exam Helper</h3>
          <p className="mt-1 text-sm font-semibold text-slate-600">Scan exam timetable and get smart reminders.</p>
        </article>

        <article className="card-base p-6">
          <div className="mb-1 inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-sky-600">
            <UserRound size={14} />
            Personal tip
          </div>
          <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-900">Stay consistent</h3>
          <p className="mt-1 text-sm font-semibold text-slate-600">Even 45 minutes of deep study is powerful.</p>
        </article>
      </section>
    </div>
  );
};

export default HomePage;
