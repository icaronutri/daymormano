
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

    // Master Coach check
    if (email === 'icarogarciacel@gmail.com' && password === '2404') {
      onLogin({
        id: 'master-1',
        name: 'Ícaro Garcia (Master)',
        email: email,
        role: UserRole.COACH,
        is_master: true
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
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-3xl font-bold">F</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">FocusCoach</h1>
          <p className="text-slate-500 mt-1">Sua assessoria de elite</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              placeholder="Digite seu email"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <input
              type="password"
              required
              placeholder="Sua senha"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-200"
          >
            Entrar
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-slate-400">
            Apenas usuários cadastrados pela administração podem acessar.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
