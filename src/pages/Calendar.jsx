import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

const holidayData = [
  { date: '2026-03-20', label: 'Campus Festival' },
  { date: '2026-03-27', label: 'Local Holiday' },
  { date: '2026-04-14', label: 'Semester Break' },
  { date: '2026-04-21', label: 'Sports Day' },
];

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatISO = (year, month, day) => {
  const monthValue = String(month + 1).padStart(2, '0');
  const dayValue = String(day).padStart(2, '0');
  return `${year}-${monthValue}-${dayValue}`;
};

const SmartCalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const totalDays = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const holidayMap = useMemo(() => {
    const map = {};
    holidayData.forEach((holiday) => {
      map[holiday.date] = holiday.label;
    });
    return map;
  }, []);

  const cells = [];
  for (let i = 0; i < firstDayIndex; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= totalDays; day += 1) {
    cells.push(day);
  }

  const workingDays = useMemo(() => {
    let count = 0;
    for (let day = 1; day <= totalDays; day += 1) {
      const date = new Date(year, month, day);
      const dayIndex = date.getDay();
      const isoDate = formatISO(year, month, day);
      const isWeekend = dayIndex === 0 || dayIndex === 6;
      const isHoliday = Boolean(holidayMap[isoDate]);

      if (!isWeekend && !isHoliday) count += 1;
    }
    return count;
  }, [holidayMap, month, totalDays, year]);

  return (
    <div className="space-y-6 page-fade-in">
      <section className="card-base p-6 sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            className="rounded-lg border border-slate-300 p-2 text-slate-700 transition hover:bg-slate-100"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>

          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">{monthLabel}</h2>

          <button
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            className="rounded-lg border border-slate-300 p-2 text-slate-700 transition hover:bg-slate-100"
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-500">
          {dayNames.map((name) => (
            <div key={name} className="py-2">{name}</div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {cells.map((day, index) => {
            if (!day) return <div key={`empty-${index}`} className="h-16 rounded-lg" />;

            const dateIndex = new Date(year, month, day).getDay();
            const isoDate = formatISO(year, month, day);
            const holidayName = holidayMap[isoDate];
            const isSunday = dateIndex === 0;
            const isSaturday = dateIndex === 6;

            return (
              <div
                key={isoDate}
                className={`h-16 rounded-xl border p-1.5 text-xs transition ${
                  holidayName
                    ? 'border-sky-200 bg-sky-50 text-sky-700'
                    : isSunday
                      ? 'border-sky-200 bg-sky-50 text-sky-700'
                      : isSaturday
                        ? 'border-sky-200 bg-sky-50 text-sky-700'
                        : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <p className="font-semibold">{day}</p>
                {holidayName && <p className="mt-1 line-clamp-2 text-[10px]">{holidayName}</p>}
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="card-base p-5">
          <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
            <CalendarDays size={16} />
          </div>
          <p className="text-sm text-slate-600">Working days this month</p>
          <h3 className="mt-1 text-2xl font-semibold text-slate-900">{workingDays}</h3>
        </article>

        <article className="card-base p-5">
          <p className="text-sm font-medium text-sky-700">Sundays</p>
          <p className="mt-1 text-sm text-slate-600">Highlighted in amber for easy weekend planning.</p>
        </article>

        <article className="card-base p-5">
          <p className="text-sm font-medium text-sky-700">Holidays</p>
          <p className="mt-1 text-sm text-slate-600">Static holiday list is highlighted in rose color.</p>
        </article>
      </section>
    </div>
  );
};

export default SmartCalendarPage;
