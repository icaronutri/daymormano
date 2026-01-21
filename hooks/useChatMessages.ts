
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { ChatMessage, UserRole, FeedbackStatus, Profile } from '../types';

export function useChatMessages(studentId: string | null, currentUser: Profile) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialFetch, setHasInitialFetch] = useState(false);

  useEffect(() => {
    const initChat = async () => {
      if (!studentId || !currentUser.id) return;
      const targetStudentId = currentUser.role === UserRole.ALUNO ? currentUser.id : studentId;
      
      try {
        // Tenta buscar na tabela chats
        const { data: chat, error } = await supabase
          .from('chats')
          .select('id')
          .eq('student_id', targetStudentId)
          .maybeSingle();

        // Se a tabela não existir (erro 42P01) ou não houver chat, usa o ID do aluno
        if (error || !chat) {
          setChatId(targetStudentId);
        } else {
          setChatId(chat.id);
        }
      } catch (e) {
        // Fallback total para o ID do aluno em caso de qualquer erro de banco
        setChatId(targetStudentId);
      }
    };
    initChat();
  }, [studentId, currentUser.id, currentUser.role]);

  const sortMessages = (msgs: ChatMessage[]) => {
    return [...msgs].sort((a, b) => {
      const timeA = new Date(a.created_at || a.local_created_at || 0).getTime();
      const timeB = new Date(b.created_at || b.local_created_at || 0).getTime();
      return timeA - timeB;
    });
  };

  const fetchMessages = useCallback(async (targetChatId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', targetChatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) {
        setMessages(prev => {
          const localOnly = prev.filter(m => m.delivery_status === 'sending' || m.delivery_status === 'failed');
          const incomingIds = new Set(data.map(m => m.id));
          const incomingClientIds = new Set(data.map(m => m.client_id).filter(Boolean));
          const filteredLocal = localOnly.filter(m => !incomingIds.has(m.id) && !incomingClientIds.has(m.client_id));
          return sortMessages([...(data as ChatMessage[]), ...filteredLocal]);
        });
        setHasInitialFetch(true);
      }
    } catch (e) {
      console.error("[Chat:FetchError]", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!chatId) return;
    fetchMessages(chatId);
    
    // Inicia o Realtime
    const channel = supabase.channel(`chat_${chatId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages', 
        filter: `chat_id=eq.${chatId}` 
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => {
            const exists = prev.find(m => m.id === newMessage.id || (newMessage.client_id && m.client_id === newMessage.client_id));
            if (exists) {
              return prev.map(m => (m.id === exists.id || (newMessage.client_id && m.client_id === newMessage.client_id)) ? { ...m, ...newMessage, pending: false, delivery_status: 'sent' } : m);
            }
            return sortMessages([...prev, { ...newMessage, delivery_status: 'sent' }]);
          });
        }
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [chatId, fetchMessages]);

  const repairProfile = async () => {
    const { error } = await supabase.from('profiles').upsert({
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role
    });
    return !error;
  };

  const sendMessage = async (params: { content?: string, type?: string, attachments?: string[], status?: FeedbackStatus }) => {
    if (!chatId || !studentId) return;
    const clientId = crypto.randomUUID();
    const dbRole = currentUser.role === UserRole.COACH ? 'coach' : 'student';
    let finalContent = params.content || "";
    if (params.attachments && params.attachments.length > 0) finalContent = params.attachments[0];

    const optimistic: ChatMessage = {
      id: `temp-${clientId}`,
      client_id: clientId,
      pending: true,
      delivery_status: 'sending',
      local_created_at: Date.now(),
      student_id: studentId,
      chat_id: chatId,
      sender_id: currentUser.id,
      sender_role: dbRole,
      type: (params.type || 'text') as any,
      content: finalContent,
      date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      status: params.status
    };

    setMessages(prev => sortMessages([...prev, optimistic]));

    const performInsert = async () => {
      return await supabase.from('messages').insert({
        chat_id: chatId,
        student_id: studentId,
        sender_id: currentUser.id,
        sender_role: dbRole,
        client_id: clientId,
        type: optimistic.type,
        content: optimistic.content,
        status: optimistic.status
      }).select().single();
    };

    try {
      let { data, error } = await performInsert();

      if (error && (error.message.includes('foreign key') || error.code === '23503')) {
        await repairProfile();
        const retry = await performInsert();
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;
      if (data) {
        setMessages(prev => prev.map(m => m.client_id === clientId ? { ...(data as ChatMessage), pending: false, delivery_status: 'sent' } : m));
      }
    } catch (err: any) {
      console.group("❌ Erro de Banco de Dados");
      console.error("Mensagem:", err.message);
      console.groupEnd();
      setMessages(prev => prev.map(m => m.client_id === clientId ? { ...m, delivery_status: 'failed', pending: false } : m));
    }
  };

  const updateStatus = async (id: string, status: FeedbackStatus) => {
    await supabase.from('messages').update({ status }).eq('id', id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m));
  };

  const deleteMessage = async (id: string) => {
    if (!id.startsWith('temp-')) await supabase.from('messages').delete().eq('id', id);
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  return { messages, sendMessage, deleteMessage, updateStatus, isLoading, hasInitialFetch, chatId };
}
