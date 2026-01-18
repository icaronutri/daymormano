import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { ChatMessage, UserRole, FeedbackStatus } from '../types';

export function useChatMessages(studentId: string | null, currentUser: { id: string, role: UserRole }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const mergeMessages = useCallback((prev: ChatMessage[], incoming: ChatMessage[], mode: 'sync' | 'delta' | 'sendSuccess') => {
    const map = new Map<string, ChatMessage>();

    // A) Começar do prev
    prev.forEach(m => {
      const key = m.client_id || m.id;
      map.set(key, m);
    });

    // B) Inserir incoming por cima (vence o anterior)
    incoming.forEach(m => {
      // Se m tem ID real, ele deve tentar sobrescrever a pendente que tem o mesmo client_id
      if (m.client_id && !m.pending) {
        map.set(m.client_id, m);
      }
      map.set(m.id, m);
    });

    // C) Deduplicação Final
    const result = Array.from(map.values());
    const finalMap = new Map<string, ChatMessage>();

    result.forEach(msg => {
      const key = msg.client_id || msg.id;
      const existing = finalMap.get(key);
      
      // Se tiver uma pendente e uma real com mesmo client_id, manter a real
      if (!existing || (!msg.pending && existing.pending)) {
        finalMap.set(key, msg);
      }
    });

    // D) Ordenar por created_at (fallback local_created_at)
    const final = Array.from(finalMap.values()).sort((a, b) => {
      const timeA = new Date(a.created_at).getTime() || a.local_created_at || 0;
      const timeB = new Date(b.created_at).getTime() || b.local_created_at || 0;
      return timeA - timeB;
    });

    // Logs DEV
    if ((import.meta as any).env?.DEV) {
      console.log(`[ChatLog] Origem: ${mode}`, {
        total: final.length,
        pending: final.filter(m => m.pending).length,
        incomingCount: incoming.length
      });
    }

    return final;
  }, []);

  const fetchInitial = useCallback(async () => {
    if (!studentId) return;
    setIsLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: true })
      .limit(200);

    if (data) {
      setMessages(prev => mergeMessages(prev, data as ChatMessage[], 'sync'));
    }
    setIsLoading(false);
  }, [studentId, mergeMessages]);

  useEffect(() => {
    if (!studentId) {
      setMessages([]);
      return;
    }

    fetchInitial();

    const channel = supabase.channel(`chat-${studentId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `student_id=eq.${studentId}`
      }, (payload) => {
        setMessages(prev => mergeMessages(prev, [payload.new as ChatMessage], 'delta'));
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `student_id=eq.${studentId}`
      }, (payload) => {
        setMessages(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new, pending: false } : m));
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
        filter: `student_id=eq.${studentId}`
      }, (payload) => {
        setMessages(prev => prev.filter(m => m.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId, fetchInitial, mergeMessages]);

  const sendMessage = async (params: { text?: string, type?: string, attachments?: string[], status?: FeedbackStatus }) => {
    if (!studentId) return;

    const client_id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const optimistic: ChatMessage = {
      id: `temp-${client_id}`,
      client_id,
      pending: true,
      delivery_status: 'sending',
      local_created_at: Date.now(),
      student_id: studentId,
      sender_id: currentUser.id,
      sender_role: currentUser.role,
      type: (params.type || 'text') as any,
      text: params.text,
      attachments: params.attachments,
      date: now.split('T')[0],
      created_at: now,
      status: params.status || FeedbackStatus.PENDENTE
    };

    setMessages(prev => mergeMessages(prev, [optimistic], 'delta'));

    const { data, error } = await supabase.from('messages').insert({
      student_id: studentId,
      sender_id: currentUser.id,
      sender_role: currentUser.role,
      type: optimistic.type,
      text: optimistic.text,
      attachments: optimistic.attachments,
      date: optimistic.date,
      client_id,
      status: optimistic.status
    }).select().single();

    if (error) {
      setMessages(prev => prev.map(m => m.client_id === client_id ? { ...m, delivery_status: 'failed' } : m));
    } else if (data) {
      setMessages(prev => mergeMessages(prev, [data as ChatMessage], 'sendSuccess'));
    }
  };

  const deleteMessage = async (id: string) => {
    const { error } = await supabase.from('messages').delete().eq('id', id);
    if (!error) {
      setMessages(prev => prev.filter(m => m.id !== id));
    }
  };

  const updateStatus = async (id: string, status: FeedbackStatus) => {
    const { error } = await supabase.from('messages').update({ status }).eq('id', id);
    if (!error) {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    }
  };

  return { messages, sendMessage, deleteMessage, updateStatus, isLoading };
}