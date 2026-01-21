
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
      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: profile.id,
        name: profile.name,
        email: profile.email.toLowerCase().trim(),
        role: profile.role,
        is_master: profile.is_master || false
      }, { onConflict: 'id' });

      if (upsertError) {
        console.error("Erro ao sincronizar perfil:", upsertError.message);
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const emailClean = email.toLowerCase().trim();
    
    try {
      // 1. Verificar Perfis de Teste Hardcoded (Master Admin)
      let testProfile: Profile | null = null;
      if (emailClean === 'icarogarciacel@gmail.com' && password === '2404') {
        testProfile = { id: '11111111-1111-1111-1111-111111111111', name: 'Icaro Coach', email: emailClean, role: UserRole.COACH, is_master: true };
      } else if (emailClean === 'iva@test.com' && password === '2404') {
        testProfile = { id: '22222222-2222-2222-2222-222222222222', name: 'Iva Treinadora', email: emailClean, role: UserRole.COACH, is_master: true };
      }

      if (testProfile) {
        await syncProfile(testProfile);
        onLogin(testProfile);
        return;
      }

      // 2. Tentar Login via Tabela de Perfis (Alunos cadastrados no App)
      const { data: profileFromDb, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', emailClean)
        .maybeSingle();

      if (profileFromDb) {
        // Se o perfil existe e a senha temporária bate
        if (profileFromDb.temp_password === password) {
          onLogin(profileFromDb as Profile);
          return;
        }
      }

      // 3. Tentar Login Oficial do Supabase Auth (Fallback)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
        email: emailClean, 
        password 
      });

      if (!authError && authData.user) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', authData.user.id).maybeSingle();
        if (p) {
          onLogin(p as Profile);
        } else {
          const newP: Profile = { id: authData.user.id, name: 'Usuário', email: emailClean, role: UserRole.ALUNO };
          await syncProfile(newP);
          onLogin(newP);
        }
        return;
      }

      // Se nada funcionar
      setError('Email ou senha incorretos.');
    } catch (err) {
      setError('Erro de conexão com o servidor.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-100">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-[#f97316] rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl rotate-3">
            <span className="text-white text-4xl font-black">DM</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800">Day Mormano</h1>
          <p className="text-[#f97316] font-bold uppercase tracking-[0.2em] text-[9px] mt-2">Acesso Restrito</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-[11px] font-bold rounded-2xl border border-red-100 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-4 tracking-widest">Seu Email</label>
            <input
              type="email"
              required
              placeholder="exemplo@email.com"
              className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:border-orange-500 bg-slate-50 text-sm font-bold"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-4 tracking-widest">Sua Senha</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:border-orange-500 bg-slate-50 text-sm font-bold"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#f97316] text-white font-black py-5 rounded-2xl shadow-lg active:scale-95 disabled:opacity-50 transition-all uppercase text-xs tracking-widest mt-4"
          >
            {loading ? 'Validando...' : 'Entrar na Consultoria'}
          </button>
        </form>
        
        <p className="text-center text-[10px] text-slate-400 mt-8 font-medium">
          Esqueceu sua senha? Entre em contato com seu treinador.
        </p>
      </div>
    </div>
  );
};

export default AuthView;
