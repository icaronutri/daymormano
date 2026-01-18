
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
      await supabase.from('profiles').upsert({
        id: profile.id,
        name: profile.name,
        email: profile.email.toLowerCase(),
        role: profile.role,
        is_master: profile.is_master,
        temp_password: null // Limpa a senha temporária após ativação
      }, { onConflict: 'id' });
    } catch (e) {
      console.warn("Aviso na sincronização de perfil:", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const emailClean = email.toLowerCase().trim();

    try {
      // 1. Credenciais Master Fixas (Opcional)
      if (emailClean === 'icarogarciacel@gmail.com' && password === '2404') {
        const profile: Profile = {
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Ícaro Garcia (Treinador)',
          email: emailClean,
          role: UserRole.COACH,
          is_master: true
        };
        await syncProfile(profile);
        onLogin(profile);
        return;
      }

      // 2. Tenta Login Direto (Usuários já ativos no Supabase Auth)
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: emailClean, password });
      
      if (authError) {
        // 3. Se falhou, verifica se o Treinador pré-cadastrou este email na tabela 'profiles'
        const { data: preAuth, error: preAuthErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', emailClean)
          .single();

        // Se existe pré-cadastro e a senha bate com a que o professor definiu
        if (preAuth && preAuth.temp_password === password) {
          // ATIVAÇÃO DE CONTA: Cria o usuário no Supabase Auth agora
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ 
            email: emailClean, 
            password,
            options: { data: { name: preAuth.name } }
          });

          if (!signUpError && signUpData.user) {
            const newProfile: Profile = {
              id: signUpData.user.id,
              name: preAuth.name,
              email: emailClean,
              role: preAuth.role as UserRole,
              is_master: preAuth.is_master
            };
            
            // Remove o ID temporário antigo e cria o real vinculado ao Auth
            await supabase.from('profiles').delete().eq('id', preAuth.id);
            await syncProfile(newProfile);
            onLogin(newProfile);
            return;
          }
        }
        setError('Acesso negado. Email ou senha incorretos.');
      } else if (data.user) {
        // Logou com sucesso em conta já existente
        const { data: p } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        if (p) {
          onLogin(p as Profile);
        } else {
          // Fallback se o perfil sumiu por algum motivo
          const newProfile: Profile = {
            id: data.user.id,
            name: emailClean.split('@')[0],
            email: emailClean,
            role: UserRole.ALUNO,
            is_master: false
          };
          await syncProfile(newProfile);
          onLogin(newProfile);
        }
        return;
      }
    } catch (err: any) {
      setError('Erro de conexão. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-100">
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-orange-600 rounded-[2.2rem] mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-orange-100 transform rotate-6 hover:rotate-0 transition-transform duration-500">
            <span className="text-white text-5xl font-black">DM</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 leading-tight">Day Mormano</h1>
          <p className="text-orange-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">Acesso Exclusivo</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-[10px] font-black rounded-2xl border border-red-100 text-center uppercase tracking-widest animate-in fade-in zoom-in-95">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Email</label>
            <input
              type="email"
              required
              placeholder="seu@email.com"
              className="w-full px-6 py-5 rounded-2xl border border-slate-200 focus:outline-none focus:border-orange-500 bg-slate-50/50 text-sm font-bold transition-all shadow-inner"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Senha</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full px-6 py-5 rounded-2xl border border-slate-200 focus:outline-none focus:border-orange-500 bg-slate-50/50 text-sm font-bold transition-all shadow-inner"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-orange-600 active:scale-[0.98] transition-all shadow-2xl shadow-slate-200 mt-6 disabled:opacity-50 flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Entrar na Plataforma'
            )}
          </button>
        </form>
        
        <div className="mt-12 pt-8 border-t border-slate-50 text-center">
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest leading-relaxed">
            Se você é um novo aluno e ainda não tem acesso,<br/>solicite o cadastro ao seu treinador.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
