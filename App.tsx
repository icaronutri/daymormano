
import React, { useState, useEffect } from 'react';
import { UserRole, Profile } from './types';
import AuthView from './views/AuthView';
import Layout from './components/Layout';
import CoachView from './views/CoachView';
import StudentView from './views/StudentView';
import { supabase } from './supabase';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState('');
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    async function checkSession() {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profile) {
            handleLogin(profile as Profile);
          }
        }
      }
      setInitializing(false);
    }
    checkSession();
  }, []);

  const handleLogin = (profile: Profile) => {
    setUser(profile);
    setIsAuthenticated(true);
    setActiveTab(profile.role === UserRole.COACH ? 'inbox' : 'today');
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setIsAuthenticated(false);
    setUser(null);
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <AuthView onLogin={handleLogin} />;
  }

  return (
    <Layout
      user={user}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={handleLogout}
    >
      {user.role === UserRole.COACH ? (
        <CoachView activeTab={activeTab} user={user} />
      ) : (
        <StudentView 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          user={user} 
        />
      )}
    </Layout>
  );
};

export default App;
