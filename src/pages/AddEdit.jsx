import { useState } from 'react';
import { Bot, SendHorizontal, Sparkles, UserRound } from 'lucide-react';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile';

const STARTER_MESSAGE = `Hi! 👋 I'm your Goal Planner Bot.\n\nYou can ask me anything about learning:\n- Share your goal + timeline for a full Beginner to Pro roadmap\n- Ask where to learn something\n- Ask for YouTube channels\n- Ask about study tips and best practices\n\nI'll respond directly to your question. No boring templates!`;

const SYSTEM_PROMPT = `You are a friendly, helpful learning coach like ChatGPT.

Rules:
1. Keep replies short and friendly (120-250 words max).
2. Respond DIRECTLY to what the user asks.
3. Use simple, clear English.
4. Format:
   - If they ask about channels: List top 5 YouTube channels with brief reasons.
   - If they ask for a roadmap: Use headings (Summary, Study Plan, YouTube Channels, Next 7 Days).
   - If they ask a quick question: Answer conversationally, no forced format.
5. Use headings only when needed. Keep it natural.
6. Under YouTube Channels, always suggest exactly 5 top channels.
7. No markdown symbols like ## or **.
8. Be warm, encouraging, and practical.
9. Ask clarifying questions if the request is unclear.
10. Never give the same fixed template for every question.
11. If the user asks only one thing, answer only that thing.`;

const fallbackResponse = (userInput) => {
   const text = (userInput || '').toLowerCase();
   
   // If asking about channels or where to learn
   if (text.includes('channel') || text.includes('where') || text.includes('learn from')) {
      return `Top 5 YouTube Channels\n- freeCodeCamp.org: Complete courses from beginner to advanced\n- Traversy Media: Practical, easy-to-follow tutorials\n- Programming with Mosh: Clear explanations for all levels\n- The Net Ninja: Well-organized playlists by topic\n- Apna College: Great for placement and DSA prep`;
   }
   
   // If giving details like timeline + course
   if (text.length > 50 && (text.includes('month') || text.includes('week') || text.includes('year'))) {
      return `Summary\n- Goal: ${userInput}\n\nBeginner to Pro Path\n- Step 1: Learn basics and setup tools\n- Step 2: Practice core concepts daily\n- Step 3: Build 2 mini projects\n- Step 4: Build 1 real project with useful features\n- Step 5: Master advanced tools and techniques\n\nTop 5 YouTube Channels\n- freeCodeCamp.org\n- Traversy Media\n- Programming with Mosh\n- The Net Ninja\n- Apna College\n\nNext 7 Days\n- Day 1-2: Basics and notes\n- Day 3-4: Practice tasks\n- Day 5-6: Mini project\n- Day 7: Review and adjust plan`;
   }
   
   // Generic fallback for unclear queries
   return `That's a great question! Tell me:\n- What skill or course you want to learn\n- Your timeline (weeks/months)\n- Your current level (beginner/intermediate/advanced)\n- How many hours/week you can study\n\nI'll create a custom roadmap for you with top 5 YouTube channels.`;
};

const makeUserFriendly = (text) => {
   const compact = text
      .replace(/\n{3,}/g, '\n\n')
      .split('\n')
      .map((line) => line.replace(/^#{1,6}\s*/, '').trim())
      .filter((line) => line && !/^\s*[-*]\s*$/.test(line))
      .join('\n')
      .trim();

   const words = compact.split(/\s+/);
   if (words.length <= 230) return compact;
   return `${words.slice(0, 230).join(' ')}...`;
};

const getSectionIcon = (title) => {
   const t = title.toLowerCase();
   if (t.includes('summary')) return '📋';
   if (t.includes('study') || t.includes('plan')) return '📚';
   if (t.includes('youtube') || t.includes('channel')) return '▶️';
   if (t.includes('next')) return '🚀';
   return '✨';
};

const getSectionColor = (title) => {
   const t = title.toLowerCase();
   if (t.includes('summary')) return 'border-blue-200 bg-gradient-to-r from-blue-50 to-sky-50';
   if (t.includes('study') || t.includes('plan')) return 'border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50';
   if (t.includes('youtube') || t.includes('channel')) return 'border-orange-200 bg-gradient-to-r from-orange-50 to-red-50';
   if (t.includes('next')) return 'border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50';
   return 'border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50';
};

const HEADING_TITLES = new Set([
   'Summary',
   'Study Plan',
   'Beginner to Pro Path',
   'YouTube Channels',
   'Top 5 YouTube Channels',
   'Next 7 Days',
]);

const getSections = (content) => {
   const sections = [];
   let current = { title: 'Summary', items: [] };

   content.split('\n').forEach((rawLine) => {
      const line = rawLine.trim().replace(/^#{1,6}\s*/, '');
      if (!line) return;

      const isNumberedItem = /^\d+\./.test(line);
      const isHeading =
         HEADING_TITLES.has(line) ||
         (!isNumberedItem && !line.startsWith('-') && !line.startsWith('*') && !line.includes(':') && line.length <= 24);

      if (isHeading) {
         if (current.items.length || current.title) sections.push(current);
         current = { title: line, items: [] };
         return;
      }

      const cleaned = line.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '');
      current.items.push(cleaned);
   });

   if (current.items.length || current.title) sections.push(current);
   return sections.filter((section) => section.items.length);
};

const toGroqMessages = (messages) => [
   { role: 'system', content: SYSTEM_PROMPT },
   ...messages
      .filter((msg) => msg.role === 'assistant' || msg.role === 'user')
      .map((msg) => ({ role: msg.role, content: msg.content })),
];

const getBotReply = async (messages) => {
   const apiKey = import.meta.env.VITE_GROQ_API_KEY;
   const userInput = messages[messages.length - 1]?.content || '';

   if (!apiKey) {
      return `${fallbackResponse(userInput)}\n\nNote: Add VITE_GROQ_API_KEY in .env to enable live Groq answers.`;
   }

   const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
         'Content-Type': 'application/json',
         Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
         model: GROQ_MODEL,
         messages: toGroqMessages(messages),
         temperature: 0.6,
         max_tokens: 550,
      }),
   });

   if (!response.ok) {
      throw new Error(`Groq API failed (${response.status})`);
   }

   const data = await response.json();
   const raw = data.choices?.[0]?.message?.content?.trim() || 'I could not generate a plan. Please try again.';
   return makeUserFriendly(raw);
};

const GoalPlannerPage = () => {
   const [userPrompt, setUserPrompt] = useState('');
   const [isLoading, setIsLoading] = useState(false);
   const [messages, setMessages] = useState([
      { id: 'start', role: 'assistant', content: STARTER_MESSAGE },
   ]);

   const handleSend = async (event) => {
      event.preventDefault();
      const trimmed = userPrompt.trim();
      if (!trimmed || isLoading) return;

      const nextMessages = [...messages, { id: crypto.randomUUID(), role: 'user', content: trimmed }];
      setMessages(nextMessages);
      setUserPrompt('');
      setIsLoading(true);

      try {
         const reply = await getBotReply(nextMessages);
         setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: reply }]);
      } catch (error) {
         setMessages((prev) => [
            ...prev,
            {
               id: crypto.randomUUID(),
               role: 'assistant',
               content: `I hit an error while calling Groq. Please try again.\n\n${error.message}`,
            },
         ]);
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <div className="space-y-6 page-fade-in">
         <section className="card-base p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Goal Planner</h2>
            <p className="mt-2 text-sm font-medium text-slate-700">
               Stay consistent, success will follow.
            </p>
            
         </section>

         <section className="card-base p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-2">
               <Sparkles size={22} className="text-brand-primary" />
               <h3 className="text-xl font-bold tracking-tight text-slate-900">Goal Bot</h3>
            </div>

            <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-2xl border border-sky-100 bg-sky-50/40 p-3 sm:p-4">
               {messages.map((msg) => (
                  <article
                     key={msg.id}
                     className={`flex gap-3 rounded-2xl border p-3 sm:p-4 ${
                        msg.role === 'assistant'
                           ? 'border-sky-200 bg-white'
                           : 'border-blue-200 bg-blue-50'
                     }`}
                  >
                     <div className="mt-0.5 shrink-0 text-sky-700">
                        {msg.role === 'assistant' ? <Bot size={18} /> : <UserRound size={18} />}
                     </div>

                     {msg.role === 'assistant' ? (
                        <div className="flex-1 space-y-2.5">
                           {getSections(msg.content).map((section) => {
                              const icon = getSectionIcon(section.title);
                              const colorClass = getSectionColor(section.title);
                              return (
                                 <div key={`${msg.id}-${section.title}`} className={`rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${colorClass}`}>
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                                       <span className="text-lg">{icon}</span>
                                       <span>{section.title}</span>
                                    </h4>
                                    <ul className="mt-3 space-y-2">
                                       {section.items.map((item, index) => (
                                          <li key={`${msg.id}-${section.title}-${index}`} className="flex gap-2.5 text-sm font-medium leading-5 text-slate-700">
                                             <span className="shrink-0 text-xs font-bold text-slate-400">→</span>
                                             <span>{item}</span>
                                          </li>
                                       ))}
                                    </ul>
                                 </div>
                              );
                           })}
                        </div>
                     ) : (
                        <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-slate-800">{msg.content}</p>
                     )}
                  </article>
               ))}

               {isLoading && (
                  <article className="flex gap-3 rounded-2xl border border-sky-200 bg-white p-3 sm:p-4">
                     <Bot size={18} className="mt-0.5 shrink-0 text-sky-700" />
                     <p className="text-sm font-semibold text-slate-700">Generating your roadmap...</p>
                  </article>
               )}
            </div>

            <form onSubmit={handleSend} className="mt-4 flex flex-col gap-3 sm:flex-row">
               <textarea
                  value={userPrompt}
                  onChange={(event) => setUserPrompt(event.target.value)}
                  placeholder="You are doing great! Share your goal and timeline to get your plan."
                  className="input-base min-h-24 flex-1 rounded-2xl"
               />

               <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-70"
               >
                  <SendHorizontal size={16} />
                  {isLoading ? 'Thinking...' : 'Ask Bot'}
               </button>
            </form>
         </section>
      </div>
   );
};

export default GoalPlannerPage;
