import { useEffect, useMemo, useState } from 'react';
import { BellRing, CalendarDays, Clock3, Quote } from 'lucide-react';

const STORAGE_KEY = 'tmd-exam-timetable';
const QUOTES = [
  'Discipline today creates freedom tomorrow.',
  'Start now. Momentum solves half the struggle.',
  'Study with intent, not stress.',
  'You are one focused session away from progress.',
  'Confidence is built from preparation.',
];

const formatDate = (iso) => {
  if (!iso) return '';
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-GB');
};

const SmartAlertsPage = () => {
  const [exams, setExams] = useState([]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setExams([]);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      const normalized = (parsed.exams || [])
        .map((exam) => ({
          date: String(exam?.date || '').trim(),
          subject: String(exam?.subject || '').trim(),
          time: String(exam?.time || '').trim(),
        }))
        .filter((exam) => exam.date && exam.subject)
        .sort((a, b) => (a.date > b.date ? 1 : -1));
      setExams(normalized);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setExams([]);
    }
  }, []);

  const quote = useMemo(() => QUOTES[new Date().getDate() % QUOTES.length], []);

  const preview = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const tomorrowDate = new Date(`${todayIso}T00:00:00`);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowIso = tomorrowDate.toISOString().slice(0, 10);

    const todayExam = exams.find((exam) => exam.date === todayIso);
    const tomorrowExam = exams.find((exam) => exam.date === tomorrowIso);

    return {
      tomorrow: tomorrowExam ? `Tomorrow you have ${tomorrowExam.subject}` : 'Tomorrow you have [Subject Name]',
      examDay: todayExam ? `All the best for your ${todayExam.subject}` : 'All the best for your [Subject Name]',
    };
  }, [exams]);

  return (
    <div className="space-y-6 page-fade-in">
      <section className="card-base gradient-soft p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Smart Alerts</h2>
        <p className="mt-2 text-sm text-slate-600">AI-extracted exam reminders and daily motivation.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="card-base card-hover p-5">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <BellRing size={18} />
          </div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Reminder: One day before</p>
          <p className="mt-2 text-sm font-semibold text-slate-800">{preview.tomorrow}</p>
        </article>

        <article className="card-base card-hover p-5">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <Clock3 size={18} />
          </div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Reminder: Exam day at 7:00 AM</p>
          <p className="mt-2 text-sm font-semibold text-slate-800">{preview.examDay}</p>
        </article>

        <article className="card-base card-hover p-5 md:col-span-2">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <Quote size={18} />
          </div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Daily Quote</p>
          <p className="mt-2 text-sm font-semibold text-slate-800">{quote}</p>
        </article>
      </section>

      <section className="card-base p-6 sm:p-8">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays size={22} className="text-brand-primary" />
          <h3 className="text-xl font-bold tracking-tight text-slate-900">Saved Exams</h3>
        </div>

        {exams.length === 0 ? (
          <p className="text-sm font-medium text-slate-700">No exam data found. Add exams in Exam Helper.</p>
        ) : (
          <ul className="space-y-2">
            {exams.map((exam, index) => (
              <li key={`${exam.date}-${exam.subject}-${index}`} className="rounded-xl border border-sky-100 bg-sky-50/50 px-3 py-2 text-sm font-semibold text-slate-700">
                {formatDate(exam.date)} {exam.time ? `(${exam.time})` : ''} - {exam.subject}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default SmartAlertsPage;
