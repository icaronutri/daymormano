import React from 'react';
import { Home, Calendar, MessageSquare, Users, BarChart3, LogOut, Settings } from 'lucide-react';
import { UserRole, Profile } from '../types';
import SupabaseStatusIndicator from './SupabaseStatusIndicator';

interface LayoutProps {
  user: Profile;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, activeTab, setActiveTab, onLogout, children }) => {
  const coachTabs = [
    { id: 'inbox', label: 'Inbox', icon: MessageSquare },
    { id: 'students', label: 'Alunos', icon: Users },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  ];

  if (user.is_master) {
    coachTabs.push({ id: 'management', label: 'Gestão', icon: Settings });
  }

  const studentTabs = [
    { id: 'today', label: 'Hoje', icon: Home },
    { id: 'history', label: 'Histórico', icon: Calendar },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  ];

  const tabs = user.role === UserRole.COACH ? coachTabs : studentTabs;

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-0 md:pl-64">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 z-30">
        <div className="p-6 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-orange-600 leading-tight">Day Mormano</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Consultoria</p>
            {user.is_master && <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest block mt-1">Treinador</span>}
          </div>
          <SupabaseStatusIndicator />
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === tab.id ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <div className="px-4 py-3 mb-2 flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                {user.name.charAt(0)}
             </div>
             <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold text-slate-700 truncate">{user.name}</span>
                <span className="text-[10px] text-slate-400 truncate">{user.email}</span>
             </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>

      {/* Header Mobile */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
              <h1 className="text-xl font-bold text-orange-600 leading-none">Day Mormano</h1>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Consultoria</span>
                {user.is_master && <span className="text-[8px] font-bold text-orange-400 uppercase tracking-widest mt-1">Treinador</span>}
              </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <SupabaseStatusIndicator />
          <button onClick={onLogout} className="text-slate-400">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center px-4 py-2 safe-area-bottom z-30 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 p-2 min-w-[64px] transition-all ${
              activeTab === tab.id ? 'text-orange-600' : 'text-slate-400'
            }`}
          >
            <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;