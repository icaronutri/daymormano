
import React, { useState } from 'react';
import { UserRole, Profile } from '../types';
import { supabase } from '../supabase';

interface AuthViewProps {
  onLogin: (profile: Profile) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const syncProfile = async (profile: Profile) => {
    try {
      // Usando upsert para garantir que o perfil existe na tabela 'profiles'
      await supabase.from('profiles').upsert({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        is_master: profile.is_master
      }, { onConflict: 'id' });
    } catch (e) {
      console.warn("Aviso na sincronização de perfil (não crítico):", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Credenciais Master de Teste
      if (email === 'icarogarciacel@gmail.com' && password === '2404') {
        const profile: Profile = {
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Ícaro Garcia (Treinador)',
          email: email,
          role: UserRole.COACH,
          is_master: true
        };
        await syncProfile(profile);
        onLogin(profile);
        return;
      }

      // 2. Credenciais Aluno de Teste
      if (email === 'ivanete@gmail.com' && password === '2404') {
        const profile: Profile = {
          id: '00000000-0000-0000-0000-000000000002',
          name: 'Ivanete Rocha',
          email: email,
          role: UserRole.ALUNO,
          is_master: false
        };
        await syncProfile(profile);
        onLogin(profile);
        return;
      }

      // 3. Login Real via Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      
      if (authError) {
        // Se falhar login, tenta registrar como novo aluno para facilitar testes
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (!signUpError && signUpData.user) {
          const newProfile: Profile = {
            id: signUpData.user.id,
            name: email.split('@')[0],
            email: email,
            role: UserRole.ALUNO,
            is_master: false
          };
          await syncProfile(newProfile);
          onLogin(newProfile);
          return;
        }
        setError('Email ou senha inválidos.');
      } else if (data.user) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        if (p) {
          onLogin(p as Profile);
        } else {
          // Se autenticou mas não tem perfil, cria um
          const newProfile: Profile = {
            id: data.user.id,
            name: email.split('@')[0],
            email: email,
            role: UserRole.ALUNO,
            is_master: false
          };
          await syncProfile(newProfile);
          onLogin(newProfile);
        }
        return;
      }
    } catch (err: any) {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-orange-600 rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-xl shadow-orange-100 transform rotate-3">
            <span className="text-white text-4xl font-black -rotate-3">DM</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800">Day Mormano</h1>
          <p className="text-orange-500 font-bold uppercase tracking-[0.2em] text-[10px]">Consultoria Esportiva</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-[10px] font-bold rounded-xl border border-red-100 text-center animate-pulse uppercase">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
            <input
              type="email"
              required
              placeholder="seu@email.com"
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:border-orange-500 bg-slate-50/50 text-sm font-medium"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Senha</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:border-orange-500 bg-slate-50/50 text-sm font-medium"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl hover:bg-orange-700 active:scale-[0.98] transition-all shadow-xl shadow-orange-200 mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Acessar Consultoria'
            )}
          </button>
        </form>
        
        <p className="mt-8 text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest">
          Acesso exclusivo para alunos e treinadores
        </p>
      </div>
    </div>
  );
};

export default AuthView;
