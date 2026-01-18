
import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff } from 'lucide-react';
import { supabase } from '../supabase';

const SupabaseStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<'online' | 'offline'>('offline');

  useEffect(() => {
    const check = async () => {
      try {
        // Tenta uma operação simples para confirmar que o servidor responde
        const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        // Se não houver erro de rede, consideramos online (mesmo que a tabela esteja vazia)
        if (error && (error.message.includes('fetch') || error.message.includes('Network'))) {
          setStatus('offline');
        } else {
          setStatus('online');
        }
      } catch {
        setStatus('offline');
      }
    };
    check();
    const timer = setInterval(check, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-100 shadow-sm transition-all duration-500">
      <div className="relative">
        <Cloud 
          size={14} 
          className={status === 'online' ? 'text-orange-500' : 'text-slate-300'} 
          fill="currentColor" 
          fillOpacity={0.2} 
        />
        {status === 'online' && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full border-2 border-white animate-pulse"></span>
        )}
      </div>
      <span className={`text-[9px] font-black uppercase tracking-widest ${status === 'online' ? 'text-orange-600' : 'text-slate-400'}`}>
        {status === 'online' ? 'Cloud Sync' : 'Offline'}
      </span>
    </div>
  );
};

export default SupabaseStatusIndicator;
