import { useEffect, useMemo, useState } from 'react';
import { Bot, CalendarDays, Plus, RotateCcw, Save, SendHorizonal, Trash2 } from 'lucide-react';

const STORAGE_KEY = 'tmd-exam-timetable';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_VISION_MODEL = import.meta.env.VITE_GROQ_VISION_MODEL || '';
const DEFAULT_VISION_MODELS = [
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'llama-3.2-90b-vision-preview',
];
const DAILY_QUOTES = [
  'Consistency beats intensity. Show up today.',
  'Your focus today is your success tomorrow.',
  'Start now. Small steps create big outcomes.',
  'Calm mind, clear plan, strong execution.',
  'Keep preparing. You are closer than you think.',
];

const BOT_PROMPT = `Extract exam timetable details from this image and return ONLY valid JSON array.

Rules:
- Extract only date, subject, time
- Keep date in DD/MM/YYYY format
- Keep time as shown in image
- Return only JSON, no explanation
- Output format:
[
  {
    "date": "",
    "subject": "",
    "time": ""
  }
]`;

const toIsoDate = (value) => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const normalized = String(value).replace(/[.\-]/g, '/').trim();
  const parts = normalized.split('/').map((part) => part.trim());
  if (parts.length !== 3) return '';

  const day = Number(parts[0]);
  const month = Number(parts[1]);
  const yearRaw = Number(parts[2]);
  const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;

  if (!day || !month || !year || day > 31 || month > 12) return '';
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const formatDisplayDate = (isoDate) => {
  if (!isoDate) return '';
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString('en-GB');
};

const cleanAiJson = (text) => {
  const trimmed = String(text || '').trim();
  const unfenced = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(unfenced);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    const start = unfenced.indexOf('[');
    const end = unfenced.lastIndexOf(']');
    if (start === -1 || end === -1 || end <= start) return [];
    try {
      const parsed = JSON.parse(unfenced.slice(start, end + 1));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
};

const normalizeExams = (rows) => {
  if (!Array.isArray(rows)) return [];

  return rows
    .map((item) => ({
      id: crypto.randomUUID(),
      date: toIsoDate(item?.date || ''),
      subject: String(item?.subject || '').trim(),
      time: String(item?.time || '').trim(),
    }))
    .filter((item) => item.date && item.subject);
};

const saveExams = (rows) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ exams: rows, updatedAt: new Date().toISOString() }));
};

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('Image read failed'));
  reader.readAsDataURL(file);
});

const requestWithModel = async ({ model, dataUrl }) => {
  const payload = {
    model,
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: 'Return only valid JSON array. No markdown, no explanation.',
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: BOT_PROMPT },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      },
    ],
  };

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Model ${model} failed (${response.status}) ${err.slice(0, 140)}`);
  }

  return response.json();
};

const ExamHelperPage = () => {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [botStatus, setBotStatus] = useState('Upload image and click Send to Bot.');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [examRows, setExamRows] = useState([]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      setExamRows(normalizeExams(parsed.exams || []));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const sortedRows = useMemo(() => [...examRows].sort((a, b) => (a.date > b.date ? 1 : -1)), [examRows]);
  const quoteOfDay = DAILY_QUOTES[new Date().getDate() % DAILY_QUOTES.length];

  const reminderPreview = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const tomorrowDate = new Date(`${todayIso}T00:00:00`);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowIso = tomorrowDate.toISOString().slice(0, 10);

    const todayExam = sortedRows.find((item) => item.date === todayIso);
    const tomorrowExam = sortedRows.find((item) => item.date === tomorrowIso);

    return {
      tomorrow: tomorrowExam ? `Tomorrow you have ${tomorrowExam.subject}` : 'Tomorrow you have [Subject Name]',
      examDay: todayExam ? `All the best for your ${todayExam.subject}` : 'All the best for your [Subject Name]',
    };
  }, [sortedRows]);

  const handleImageSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select an image file.');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErrorMessage('');
    setBotStatus('Image ready. Click Send to Bot.');
  };

  const sendToBot = async () => {
    if (!imageFile) {
      setErrorMessage('Select an image first.');
      return;
    }
    if (!GROQ_API_KEY) {
      setErrorMessage('Missing API key in .env');
      return;
    }

    setIsSending(true);
    setErrorMessage('');
    setBotStatus('Bot is reading image...');

    try {
      const dataUrl = await fileToDataUrl(imageFile);

      const candidates = [...new Set([GROQ_VISION_MODEL, ...DEFAULT_VISION_MODELS].filter(Boolean))];
      let data = null;
      let lastError = '';

      for (const model of candidates) {
        try {
          setBotStatus(`Trying model: ${model}`);
          data = await requestWithModel({ model, dataUrl });
          break;
        } catch (err) {
          lastError = err instanceof Error ? err.message : 'Unknown model error';
        }
      }

      if (!data) {
        throw new Error(lastError || 'All vision models failed. Set VITE_GROQ_VISION_MODEL in .env');
      }

      const content = data?.choices?.[0]?.message?.content || '';
      const extracted = normalizeExams(cleanAiJson(content));

      if (extracted.length === 0) {
        throw new Error('Bot could not extract rows from image');
      }

      setExamRows(extracted);
      saveExams(extracted);
      setBotStatus(`Bot extracted ${extracted.length} exam rows and saved automatically.`);
    } catch (error) {
      setErrorMessage('Unable to detect automatically. You can edit/add manually below.');
      setBotStatus(error instanceof Error ? error.message : 'Bot extraction failed');
    } finally {
      setIsSending(false);
    }
  };

  const handleAddRow = () => {
    setExamRows((prev) => [...prev, { id: crypto.randomUUID(), date: '', subject: '', time: '' }]);
  };

  const handleRowChange = (id, field, value) => {
    setExamRows((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const handleRemoveRow = (id) => {
    setExamRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleSave = (event) => {
    event.preventDefault();

    const cleaned = examRows
      .map((row) => ({
        id: row.id,
        date: toIsoDate(row.date),
        subject: String(row.subject || '').trim(),
        time: String(row.time || '').trim(),
      }))
      .filter((row) => row.date || row.subject || row.time);

    if (cleaned.length === 0) {
      setErrorMessage('No exam data to save.');
      return;
    }

    if (cleaned.some((row) => !row.date || !row.subject)) {
      setErrorMessage('Each row must contain date and subject.');
      return;
    }

    setExamRows(cleaned);
    saveExams(cleaned);
    setErrorMessage('');
    setBotStatus('Saved successfully. Daily reminders are active.');
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setExamRows([]);
    setImageFile(null);
    setImagePreview('');
    setErrorMessage('');
    setBotStatus('Cleared. Upload a new image and send to bot.');
  };

  return (
    <div className="space-y-6 page-fade-in">
      <section className="card-base p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <Bot size={22} className="text-brand-primary" />
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Exam Bot</h2>
        </div>
        <p className="mt-2 text-sm font-medium text-slate-700">
          Send timetable image to bot. Bot converts it into table and stores it automatically.
        </p>

        <div className="mt-5 rounded-2xl border border-dashed border-sky-300 bg-sky-50/60 p-4">
          <label className="mb-2 block text-sm font-bold text-slate-800">Exam Timetable Image</label>
          <input type="file" accept="image/*" onChange={handleImageSelect} className="input-base cursor-pointer" />

          {imagePreview && (
            <div className="mt-4 rounded-2xl border border-sky-100 bg-white p-3">
              <img src={imagePreview} alt="Uploaded timetable" className="max-h-80 w-full rounded-xl object-contain" />
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={sendToBot}
              disabled={isSending}
              className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <SendHorizonal size={16} />
              {isSending ? 'Sending to Bot...' : 'Send to Bot'}
            </button>
          </div>

          <p className="mt-3 rounded-xl bg-slate-900 px-3 py-2 text-xs text-slate-100">{botStatus}</p>
          {errorMessage && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{errorMessage}</p>}
        </div>
      </section>

      <section className="card-base p-6 sm:p-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xl font-bold tracking-tight text-slate-900">Exam Table (Editable)</h3>
          <button type="button" onClick={handleAddRow} className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700">
            <Plus size={14} className="inline-block" /> Add Row
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-3 py-2 text-left font-bold">Date</th>
                  <th className="px-3 py-2 text-left font-bold">Subject</th>
                  <th className="px-3 py-2 text-left font-bold">Time</th>
                  <th className="px-3 py-2 text-left font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center font-medium text-slate-500">No exam rows yet.</td>
                  </tr>
                )}
                {sortedRows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      <input type="date" value={row.date} onChange={(e) => handleRowChange(row.id, 'date', e.target.value)} className="input-base" />
                    </td>
                    <td className="px-3 py-2">
                      <input value={row.subject} onChange={(e) => handleRowChange(row.id, 'subject', e.target.value)} className="input-base" placeholder="Mathematics" />
                    </td>
                    <td className="px-3 py-2">
                      <input value={row.time} onChange={(e) => handleRowChange(row.id, 'time', e.target.value)} className="input-base" placeholder="09:00 AM - 12:00 PM" />
                    </td>
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => handleRemoveRow(row.id)} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700">
                        <Trash2 size={14} className="inline-block" /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn-primary inline-flex items-center gap-2"><Save size={16} /> Save Exams</button>
            <button type="button" onClick={handleReset} className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700"><RotateCcw size={16} /> Clear / Reset</button>
          </div>
        </form>
      </section>

      <section className="card-base p-6 sm:p-8">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays size={22} className="text-brand-primary" />
          <h3 className="text-xl font-bold tracking-tight text-slate-900">Daily Reminder Preview</h3>
        </div>
        <p className="text-sm font-semibold text-slate-700">{reminderPreview.tomorrow}</p>
        <p className="mt-2 text-sm font-semibold text-slate-700">{reminderPreview.examDay}</p>
      </section>

      <section className="card-base p-6 sm:p-8">
        <h3 className="text-xl font-bold tracking-tight text-slate-900">Daily Motivation</h3>
        <p className="mt-3 text-sm font-medium text-slate-700">{quoteOfDay}</p>
      </section>

      <section className="card-base p-6 sm:p-8">
        <h3 className="text-xl font-bold tracking-tight text-slate-900">Upcoming Exams</h3>
        {sortedRows.length === 0 ? (
          <p className="mt-3 text-sm font-medium text-slate-700">No exams saved yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {sortedRows.map((item) => (
              <li key={`preview-${item.id}`} className="rounded-xl border border-sky-100 bg-sky-50/50 px-3 py-2 text-sm font-semibold text-slate-700">
                {formatDisplayDate(item.date)} {item.time ? `(${item.time})` : ''} - {item.subject}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default ExamHelperPage;
