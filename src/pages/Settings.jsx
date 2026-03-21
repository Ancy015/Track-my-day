import { Settings, Shield, User, Bell, Palette, RefreshCw, LogOut, ChevronRight } from 'lucide-react';

const SettingsPage = () => {
  const settingsOptions = [
    { 
      id: 1, 
      label: 'Profile Settings', 
      desc: 'Update your name and year', 
      icon: <User size={20} />, 
      color: 'bg-sky-50 text-sky-500' 
    },
    { 
      id: 2, 
      label: 'System Palette', 
         desc: 'Blue and white default palette', 
      icon: <Palette size={20} />, 
         color: 'bg-sky-50 text-sky-500' 
    },
    { 
      id: 3, 
      label: 'Security', 
      desc: 'Change password & PIN', 
      icon: <Shield size={20} />, 
      color: 'bg-sky-50 text-sky-500' 
    },
    { 
      id: 4, 
      label: 'Notification Center', 
      desc: 'Mute sounds & alerts', 
      icon: <Bell size={20} />, 
      color: 'bg-sky-50 text-sky-500' 
    }
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-700">
      
      {/* Account Profile Header */}
      <section className="bg-white p-8 rounded-[48px] shadow-soft flex flex-col items-center gap-6 relative overflow-hidden group">
         <div className="w-24 h-24 rounded-[32px] bg-slate-100 flex items-center justify-center text-slate-400 font-black text-3xl border-4 border-slate-50 shadow-soft transition-transform group-hover:scale-105 duration-700">
            TR
         </div>
         <div className="text-center space-y-1">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Track-My-Day User</h3>
            <p className="text-sm font-bold text-slate-400 opacity-60 uppercase tracking-widest italic">College Year 3 • CS Branch</p>
         </div>
         <button className="px-10 py-3 bg-slate-800 text-white rounded-2xl text-[10px] uppercase font-black tracking-widest hover:bg-primary-dark transition-all shadow-lg border border-slate-700">Edit Profile</button>
      </section>

      {/* Settings Grid */}
      <section className="space-y-4">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 px-4 mb-2">
           <Settings size={22} className="text-slate-400" />
           Preferences
        </h2>

        {settingsOptions.map((option) => (
          <div key={option.id} className="soft-card flex items-center gap-5 hover:translate-x-2 transition-transform cursor-pointer group">
             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-soft ${option.color}`}>
                {option.icon}
             </div>
             <div className="flex-1 space-y-0.5">
                <h4 className="text-md font-black text-slate-800">{option.label}</h4>
                <p className="text-xs font-bold text-slate-400 opacity-80">{option.desc}</p>
             </div>
             <ChevronRight size={18} className="text-slate-200 group-hover:text-primary-light transition-colors" />
          </div>
        ))}
      </section>

      {/* Critical Actions Block */}
      <section className="space-y-4 pt-4">
         <button className="w-full h-20 bg-white rounded-3xl flex items-center justify-between px-8 text-sky-500 hover:bg-sky-50 transition-all border border-sky-100 group shadow-soft">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                  <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
               </div>
               <span className="font-extrabold text-sm uppercase tracking-widest italic">Reset Exam Helper</span>
            </div>
            <ChevronRight size={16} className="opacity-40" />
         </button>

         <button className="w-full h-20 bg-slate-100/50 rounded-3xl flex items-center justify-between px-8 text-slate-400 hover:bg-slate-200/50 transition-all border border-slate-200 group shadow-soft">
            <div className="flex items-center gap-4 text-slate-400">
               <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center">
                  <LogOut size={18} />
               </div>
               <span className="font-extrabold text-sm uppercase tracking-widest italic">Logout Account</span>
            </div>
            <ChevronRight size={16} className="opacity-40" />
         </button>
      </section>

      <div className="text-center py-8">
         <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Track My Day v1.0.4 Premium</p>
         <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest">Designed with ❤️ for students</p>
      </div>

    </div>
  );
};

export default SettingsPage;
