
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

  // Função para garantir que o perfil existe no banco (importante para contas de teste)
  const ensureProfileExists = async (profile: Profile) => {
    try {
      const { data, error } = await supabase.from('profiles').select('id').eq('id', profile.id).maybeSingle();
      
      if (!data || error) {
        console.log("🛠️ Perfil não encontrado no banco. Tentando criar...");
        const { error: insertError } = await supabase.from('profiles').upsert({
          id: profile.id,
          name: profile.name,
          email: profile.email.toLowerCase().trim(),
          role: profile.role,
          is_master: profile.is_master || false
        });
        
        if (insertError) {
          console.error("❌ Falha crítica ao criar perfil. Verifique as permissões (RLS) no Supabase.", insertError.message);
          return false;
        }
        console.log("✅ Perfil sincronizado com sucesso.");
      }
      return true;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    async function checkSession() {
      if (supabase) {
        // Primeiro tenta recuperar da sessão do Supabase Auth
        const { data: { session } } = await supabase.auth.getSession();
        
        // Se não houver sessão, tenta ver se tem um "user" no localStorage (para persistir login de teste)
        const savedUser = localStorage.getItem('dm_user');
        
        if (session?.user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          if (profile) handleLogin(profile as Profile);
        } else if (savedUser) {
          const profile = JSON.parse(savedUser) as Profile;
          const ok = await ensureProfileExists(profile);
          if (ok) handleLogin(profile);
          else {
             // Se falhar em garantir o perfil, limpa para forçar novo login
             localStorage.removeItem('dm_user');
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
    localStorage.setItem('dm_user', JSON.stringify(profile));
    setActiveTab(profile.role === UserRole.COACH ? 'inbox' : 'today');
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('dm_user');
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
