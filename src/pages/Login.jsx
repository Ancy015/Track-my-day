import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockKeyhole, Mail, UserRound, Sparkles, Lightbulb } from 'lucide-react';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
  });
  const [errors, setErrors] = useState({
    username: '',
    email: '',
  });

  const validate = () => {
    const nextErrors = { username: '', email: '' };

    if (!formData.username.trim()) {
      nextErrors.username = 'Please enter your username.';
    }

    const emailValue = formData.email.trim();
    const gmailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailValue) {
      nextErrors.email = 'Please enter your Gmail address.';
    } else if (!gmailPattern.test(emailValue)) {
      nextErrors.email = 'Use a valid Gmail address (example@gmail.com).';
    }

    setErrors(nextErrors);
    return !nextErrors.username && !nextErrors.email;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;

    const accountData = {
      username: formData.username.trim(),
      email: formData.email.trim().toLowerCase(),
      avatar: 'https://i.pravatar.cc/100?img=12',
      joinedAt: new Date().toISOString(),
    };

    onLogin(accountData);
    navigate('/');
  };

  return (
    <div className="min-h-screen login-bg px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="grid min-h-[82vh] overflow-hidden rounded-[3rem] border border-white/20 bg-white/90 shadow-2xl backdrop-blur-xl md:grid-cols-2">
          <section className="relative hidden p-10 md:flex md:flex-col md:justify-between">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-sky-200 backdrop-blur-sm">
              <Sparkles size={14} className="text-sky-300" />
              Student Productivity App
            </p>
            <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl">
              Track<span className="text-sky-400">.</span>my
              <span className="block text-sky-400">day</span>
            </h1>  <p className="mt-4 max-w-sm text-sm text-slate-600">
                Plan your learning goals, exam helper, calendar, and smart daily alerts in one place.
              </p>
            </div>

            <div className="mt-10 flex items-start gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/30">
                <Lightbulb size={24} />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-sky-300">Today tip</p>
                <p className="mt-1 text-sm font-medium leading-relaxed text-blue-50/80">
                  Consistency beat intensity. Start with small tasks today!
                </p>
              </div>
            </div>
          </section>

          <section className="flex items-center px-5 py-8 sm:px-10">
            <div className="w-full">
              <h2 className="text-2xl font-semibold text-slate-900">Login</h2>
              <p className="mt-2 text-sm text-slate-600">
                Enter your name and Gmail to continue.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="username" className="mb-2 block text-sm font-medium text-slate-700">
                    Username
                  </label>
                  <div className="relative">
                    <UserRound size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Enter your username"
                      className="input-base pl-10"
                    />
                  </div>
                  {errors.username && <p className="mt-1 text-xs text-sky-600">{errors.username}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                    Gmail
                  </label>
                  <div className="relative">
                    <Mail size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="example@gmail.com"
                      className="input-base pl-10"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-sky-600">{errors.email}</p>}
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full shadow-lg shadow-sky-500/30"
                >
                  Continue to Dashboard
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Login;
