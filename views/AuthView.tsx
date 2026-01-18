import React, { useState, useEffect } from 'react';
import { UserRole, Profile } from '../types';

interface AuthViewProps {
  onLogin: (profile: Profile) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Treinador check (Hardcoded credentials)
    if (email === 'icarogarciacel@gmail.com' && password === '2404') {
      onLogin({
        id: 'master-1',
        name: 'Ícaro Garcia (Treinador)',
        email: email,
        role: UserRole.COACH,
        is_master: true
      });
      return;
    }

    // Fixed Student check (Ivanete Rocha)
    if (email === 'ivanete@gmail.com' && password === '2404') {
      onLogin({
        id: 'fixed-ivanete',
        name: 'Ivanete Rocha',
        email: email,
        role: UserRole.ALUNO,
        is_master: false
      });
      return;
    }

    // Check localStorage for other users registered by Master
    const storedUsers = JSON.parse(localStorage.getItem('focuscoach_users') || '[]');
    const user = storedUsers.find((u: any) => u.email === email && u.password === password);

    if (user) {
      onLogin({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_master: false
      });
    } else {
      setError('Credenciais inválidas. Verifique seu email e senha.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-orange-100">
            <span className="text-white text-3xl font-bold">D</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 leading-tight">Day Mormano</h1>
          <p className="text-orange-500 font-bold uppercase tracking-widest text-[10px]">Consultoria Esportiva</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 animate-in fade-in zoom-in duration-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email</label>
            <input
              type="email"
              required
              placeholder="seu@email.com"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all bg-slate-50/50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Senha</label>
            <input
              type="password"
              required
              placeholder="••••"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all bg-slate-50/50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-600 text-white font-bold py-4 rounded-2xl hover:bg-orange-700 active:scale-[0.98] transition-all shadow-lg shadow-orange-200 mt-2"
          >
            Acessar Consultoria
          </button>
        </form>

        <div className="mt-8 text-center space-y-2">
          <p className="text-[10px] text-slate-400 font-medium tracking-tight">
            SISTEMA DE ACESSO RESTRITO - DAY MORMANO CONSULTORIA
          </p>
          <p className="text-[8px] text-slate-300 font-bold uppercase tracking-[0.15em]">
            desenvolvido por ÍCARO GARCIA BY UM LEÃO POR DIA
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthView;