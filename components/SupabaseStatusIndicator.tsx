import React, { useState, useEffect } from 'react';
import { Cloud } from 'lucide-react';
import { supabase } from '../supabase';

/**
 * Indicador visual do status da conexão com o Supabase.
 * Última atualização: Ajuste de texto para forçar rebuild.
 * Commit Ref: 7f8c2a1
 */
const SupabaseStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const checkStatus = async () => {
    if (!supabase) {
      setStatus('offline');
      return;
    }

    try {
      // Timeout de 3 segundos para a verificação
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      // Consulta ultra-leve para testar conectividade
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      // Se o servidor responde (mesmo com erro de permissão), está online
      if (error && (error.message.includes('fetch') || error.message.includes('AbortError'))) {
        setStatus('offline');
      } else {
        setStatus('online');
      }
    } catch (err) {
      setStatus('offline');
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Checa a cada 60 segundos
    return () => clearInterval(interval);
  }, []);

  const isOnline = status === 'online';
  const isChecking = status === 'checking';

  return (
    <div 
      className="flex items-center justify-center p-1.5 rounded-lg transition-all duration-500"
      title={isOnline ? "Servidor Conectado e Operacional" : isChecking ? "Verificando..." : "Sem conexão com o servidor no momento"}
      aria-label={isOnline ? "Supabase Online" : "Supabase Offline"}
    >
      <div className="relative">
        <Cloud 
          size={18} 
          className={`transition-colors duration-500 ${
            isOnline ? 'text-orange-500' : isChecking ? 'text-slate-200' : 'text-slate-400'
          }`}
          fill="currentColor"
          fillOpacity={0.1}
        />
        {isOnline && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white animate-pulse"></span>
        )}
        {!isOnline && !isChecking && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-slate-400 rounded-full border-2 border-white"></span>
        )}
      </div>
    </div>
  );
};

export default SupabaseStatusIndicator;