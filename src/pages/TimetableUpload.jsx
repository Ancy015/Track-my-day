import { useMemo, useState } from 'react';
import { Database, LoaderCircle, Table2, UploadCloud } from 'lucide-react';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_VISION_MODEL = import.meta.env.VITE_GROQ_VISION_MODEL || '';
const TIMETABLE_STORAGE_KEY = 'tmd-ai-timetable';
const DEFAULT_VISION_MODELS = [
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'llama-3.2-90b-vision-preview',
];

const BOT_PROMPT = `Read the ENTIRE timetable image and extract all timetable cells into rows. Return ONLY valid JSON array.

Rules:
- Do not skip any visible timetable box in the image
- Extract day, time, subject, staff from each row
- If a cell contains subject on one line and staff name below, split correctly
- Keep day as "Day 1", "Day 2" style when possible
- Keep time as visible text (we will normalize later)
- Keep staff as empty string if not present
- Return only JSON, no markdown, no explanation
- Output format:
[
  {
    "day": "Day 1",
    "time": "09:00-10:00",
    "subject": "Operating Systems",
    "staff": "Dr. Kumar"
  }
]`;

const DAY_ORDER_MAP = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
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

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('Image read failed'));
  reader.readAsDataURL(file);
});

const normalizeSingleTime = (value) => {
  const source = String(value || '').trim().toLowerCase();
  if (!source) return '';

  const cleaned = source
    .replace(/\./g, ':')
    .replace(/hrs?/g, '')
    .replace(/o'clock/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const match = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return '';

  let hour = Number(match[1]);
  const minute = Number(match[2] ?? '0');
  const meridiem = String(match[3] || '').toLowerCase();

  if (Number.isNaN(hour) || Number.isNaN(minute) || minute > 59) return '';

  if (meridiem === 'am') {
    if (hour === 12) hour = 0;
  } else if (meridiem === 'pm') {
    if (hour !== 12) hour += 12;
  }

  if (hour > 23) return '';
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const normalizeTimeRange = (rawTime) => {
  const text = String(rawTime || '')
    .replace(/to/gi, '-')
    .replace(/[–—]/g, '-')
    .replace(/\s+-\s+/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) return { startTime: '', endTime: '' };

  const parts = text.split('-').map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return { startTime: '', endTime: '' };

  const startCandidate = parts[0];
  const endCandidate = parts[1];
  const startTime = normalizeSingleTime(startCandidate);
  let endTime = normalizeSingleTime(endCandidate);

  if (startTime && !endTime) {
    const meridiem = endCandidate.toLowerCase().includes('pm') ? 'pm' : endCandidate.toLowerCase().includes('am') ? 'am' : '';
    if (meridiem) {
      endTime = normalizeSingleTime(`${endCandidate.replace(/am|pm/gi, '').trim()} ${meridiem}`);
    }
  }

  if (!startTime || !endTime) return { startTime: '', endTime: '' };
  return { startTime, endTime };
};

const dayToOrder = (dayValue) => {
  const raw = String(dayValue || '').trim();
  if (!raw) return 0;

  const dayNumberMatch = raw.match(/(\d+)/);
  if (dayNumberMatch) return Number(dayNumberMatch[1]);

  const normalized = raw.toLowerCase();
  return DAY_ORDER_MAP[normalized] || 0;
};

const normalizeTimetableRows = (rows) => {
  if (!Array.isArray(rows)) return [];

  return rows
    .map((item) => {
      const day = String(item?.day || item?.dayName || '').trim();
      const rawTime = String(item?.time || `${item?.start || ''}-${item?.end || ''}`).trim();
      const subject = String(item?.subject || item?.course || '').trim();
      const staffName = String(item?.staff || item?.staffName || item?.teacher || item?.faculty || '').trim();
      const { startTime, endTime } = normalizeTimeRange(rawTime);
      const dayOrder = dayToOrder(day);

      return {
        id: crypto.randomUUID(),
        day,
        time: rawTime,
        subject,
        staffName,
        dayOrder,
        startTime,
        endTime,
      };
    })
    .filter((item) => item.day && item.time && item.subject && item.dayOrder > 0 && item.startTime && item.endTime);
};

const toSqlInsert = (row) => (
  `(${row.dayOrder}, '${row.startTime}', '${row.endTime}', '${row.subject.replace(/'/g, "''")}', '${row.staffName.replace(/'/g, "''")}')`
);

const toSqlBatchInsert = (rows) => {
  if (!rows.length) return '';
  const values = rows.map((row) => toSqlInsert(row)).join(',\n');
  return `INSERT INTO timetable (day_order, start_time, end_time, subject, staff_name)\nVALUES\n${values};`;
};

const getWeekdayOrder = () => {
  const day = new Date().getDay();
  return day === 0 ? 7 : day;
};

const toMainSubjectSet = (value) => {
  return new Set(
    String(value || '')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
};

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

const TimetableUpload = () => {
  const [studentType, setStudentType] = useState('college');
  const [timetableFormat, setTimetableFormat] = useState('rotating-day-order');
  const [mainPeriodsInput, setMainPeriodsInput] = useState('');
  const [todayDayOrderInput, setTodayDayOrderInput] = useState('1');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('Upload timetable image and click Process Timetable.');
  const [rows, setRows] = useState([]);

  const sqlPreview = useMemo(() => toSqlBatchInsert(rows), [rows]);
  const mainSubjectSet = useMemo(() => toMainSubjectSet(mainPeriodsInput), [mainPeriodsInput]);
  const todayOrder = useMemo(() => {
    if (timetableFormat === 'weekly') return getWeekdayOrder();
    const parsed = Number(todayDayOrderInput);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [timetableFormat, todayDayOrderInput]);

  const dailyRows = useMemo(() => {
    if (!todayOrder) return [];

    return rows
      .filter((row) => row.dayOrder === todayOrder)
      .sort((a, b) => (a.startTime > b.startTime ? 1 : -1))
      .map((row, index) => {
        const isMainPeriod = mainSubjectSet.has(row.subject.trim().toLowerCase());
        return {
          ...row,
          periodNo: index + 1,
          displaySubject: isMainPeriod ? row.subject : 'Free Period',
          displayStaff: isMainPeriod ? row.staffName || '-' : '-',
          typeLabel: isMainPeriod ? 'Main Period' : 'Free Period',
        };
      });
  }, [rows, todayOrder, mainSubjectSet]);

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file.');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRows([]);
    setErrorMessage('');
    setStatusMessage('Image is ready. Click Process Timetable.');
  };

  const handleProcess = async () => {
    if (!mainPeriodsInput.trim()) {
      setErrorMessage('Please answer question 3: enter main periods (comma separated).');
      return;
    }
    if (timetableFormat === 'rotating-day-order' && !todayOrder) {
      setErrorMessage('Please answer question 4: enter today day order (example: 1).');
      return;
    }
    if (!imageFile) {
      setErrorMessage('Please select a timetable image first.');
      return;
    }
    if (!GROQ_API_KEY) {
      setErrorMessage('Missing API key. Add VITE_GROQ_API_KEY in .env.local');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    setStatusMessage('Reading image and sending to AI model...');

    try {
      const dataUrl = await fileToDataUrl(imageFile);
      const candidates = [...new Set([GROQ_VISION_MODEL, ...DEFAULT_VISION_MODELS].filter(Boolean))];

      let data = null;
      let lastError = '';

      for (const model of candidates) {
        try {
          setStatusMessage(`Trying model: ${model}`);
          data = await requestWithModel({ model, dataUrl });
          break;
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Unknown model error';
        }
      }

      if (!data) {
        throw new Error(lastError || 'All vision models failed. Set VITE_GROQ_VISION_MODEL in .env.local');
      }

      const content = data?.choices?.[0]?.message?.content || '';
      const extracted = cleanAiJson(content);
      const cleanedRows = normalizeTimetableRows(extracted);

      if (cleanedRows.length === 0) {
        throw new Error('AI could not extract valid rows with day, time and subject.');
      }

      setRows(cleanedRows);
      localStorage.setItem(
        TIMETABLE_STORAGE_KEY,
        JSON.stringify({
          rows: cleanedRows,
          studentType,
          timetableFormat,
          mainPeriodsInput,
          todayDayOrderInput,
          updatedAt: new Date().toISOString(),
        }),
      );
      setStatusMessage(`Processed successfully. ${cleanedRows.length} rows are SQL-ready.`);
    } catch (error) {
      setRows([]);
      setErrorMessage('Unable to process this image. Try a clearer timetable image.');
      setStatusMessage(error instanceof Error ? error.message : 'Timetable processing failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 page-fade-in">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 to-blue-700 px-5 py-6 text-white shadow-xl sm:px-8 sm:py-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-100">Smart Rotating Timetable</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Timetable Image Processing</h2>
        <p className="mt-2 text-sm font-medium text-sky-100">Upload image only. AI extracts rows and prepares SQL-ready data.</p>
      </section>

      <section className="card-base p-5 sm:p-7">
        <h3 className="text-lg font-bold text-slate-900">First Step: Student Questions</h3>
        <p className="mt-1 text-sm font-medium text-slate-600">Fill these questions first, then process timetable image.</p>

        <div className="mt-4 grid gap-4">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-800">1) Student Type</label>
            <select value={studentType} onChange={(event) => setStudentType(event.target.value)} className="input-base">
              <option value="school">School</option>
              <option value="college">College</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-800">2) Timetable Calculation Format (Most Important)</label>
            <select value={timetableFormat} onChange={(event) => setTimetableFormat(event.target.value)} className="input-base">
              <option value="rotating-day-order">Rotating Day Order (Day 1, Day 2...)</option>
              <option value="weekly">Weekly Format (Monday to Sunday)</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-800">3) Main Period Subjects</label>
            <input
              value={mainPeriodsInput}
              onChange={(event) => setMainPeriodsInput(event.target.value)}
              className="input-base"
              placeholder="Networking, Operating Systems, DBMS"
            />
            <p className="mt-1 text-xs font-medium text-slate-500">Other extracted subjects will be treated as Free Period in daily output.</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-800">4) Today Day Order</label>
            {timetableFormat === 'rotating-day-order' ? (
              <input
                type="number"
                min="1"
                value={todayDayOrderInput}
                onChange={(event) => setTodayDayOrderInput(event.target.value)}
                className="input-base"
                placeholder="Enter day order number"
              />
            ) : (
              <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800">
                Weekly mode auto-detects today as day order: {todayOrder || '-'}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="card-base p-5 sm:p-7">
        <div className="flex items-center gap-2">
          <UploadCloud size={20} className="text-brand-primary" />
          <h3 className="text-lg font-bold text-slate-900">Upload Timetable Image</h3>
        </div>

        <div className="mt-4 rounded-2xl border border-dashed border-sky-300 bg-sky-50/60 p-4">
          <input type="file" accept="image/*" onChange={handleImageSelect} className="input-base cursor-pointer" />

          {imagePreview && (
            <div className="mt-4 rounded-2xl border border-sky-100 bg-white p-3">
              <img src={imagePreview} alt="Uploaded timetable" className="max-h-96 w-full rounded-xl object-contain" />
            </div>
          )}

          <button
            type="button"
            onClick={handleProcess}
            disabled={isProcessing}
            className="btn-primary mt-4 inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isProcessing ? <LoaderCircle size={16} className="animate-spin" /> : <Table2 size={16} />}
            {isProcessing ? 'Processing...' : 'Process Timetable'}
          </button>

          <p className="mt-3 rounded-xl bg-slate-900 px-3 py-2 text-xs text-slate-100">{statusMessage}</p>
          {errorMessage && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{errorMessage}</p>}
        </div>
      </section>

      <section className="card-base p-5 sm:p-7">
        <h3 className="text-lg font-bold text-slate-900">Daily Timetable Output (Student Friendly Format)</h3>
        <div className="mt-3 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-900">
          Student Type: {studentType === 'school' ? 'School' : 'College'} | Format: {timetableFormat === 'weekly' ? 'Weekly' : 'Rotating Day Order'} | Today Day Order: {todayOrder || '-'}
        </div>

        {dailyRows.length === 0 ? (
          <p className="mt-3 text-sm font-medium text-slate-600">No periods for current day order yet. Process a timetable image first.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-3 py-2 text-left font-bold">Period</th>
                  <th className="px-3 py-2 text-left font-bold">Time</th>
                  <th className="px-3 py-2 text-left font-bold">Subject</th>
                  <th className="px-3 py-2 text-left font-bold">Staff</th>
                  <th className="px-3 py-2 text-left font-bold">Type</th>
                </tr>
              </thead>
              <tbody>
                {dailyRows.map((row) => (
                  <tr key={`daily-${row.id}`} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-semibold text-slate-700">P{row.periodNo}</td>
                    <td className="px-3 py-2 text-slate-700">{row.startTime} - {row.endTime}</td>
                    <td className="px-3 py-2 text-slate-900">{row.displaySubject}</td>
                    <td className="px-3 py-2 text-slate-700">{row.displayStaff}</td>
                    <td className="px-3 py-2 text-slate-700">{row.typeLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card-base p-5 sm:p-7">
        <h3 className="text-lg font-bold text-slate-900">Extracted Timetable (All Cleaned Rows)</h3>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm font-medium text-slate-600">No extracted rows yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-3 py-2 text-left font-bold">Day</th>
                  <th className="px-3 py-2 text-left font-bold">Time</th>
                  <th className="px-3 py-2 text-left font-bold">Subject</th>
                  <th className="px-3 py-2 text-left font-bold">Staff</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-semibold text-slate-700">{row.day}</td>
                    <td className="px-3 py-2 text-slate-700">{row.time}</td>
                    <td className="px-3 py-2 text-slate-900">{row.subject}</td>
                    <td className="px-3 py-2 text-slate-700">{row.staffName || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card-base p-5 sm:p-7">
        <div className="flex items-center gap-2">
          <Database size={20} className="text-brand-primary" />
          <h3 className="text-lg font-bold text-slate-900">3) SQL-Ready Output</h3>
        </div>

        {rows.length === 0 ? (
          <p className="mt-3 text-sm font-medium text-slate-600">Process an image to generate SQL inserts.</p>
        ) : (
          <>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-left font-bold">day_order</th>
                    <th className="px-3 py-2 text-left font-bold">start_time</th>
                    <th className="px-3 py-2 text-left font-bold">end_time</th>
                    <th className="px-3 py-2 text-left font-bold">subject</th>
                    <th className="px-3 py-2 text-left font-bold">staff_name</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={`sql-${row.id}`} className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-700">{row.dayOrder}</td>
                      <td className="px-3 py-2 text-slate-700">{row.startTime}</td>
                      <td className="px-3 py-2 text-slate-700">{row.endTime}</td>
                      <td className="px-3 py-2 text-slate-900">{row.subject}</td>
                      <td className="px-3 py-2 text-slate-700">{row.staffName || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-900 p-4 text-xs text-slate-100">{sqlPreview}</pre>
          </>
        )}
      </section>
    </div>
  );
};

export default TimetableUpload;