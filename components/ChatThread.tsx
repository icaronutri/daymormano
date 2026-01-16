
import React, { useRef, useEffect } from 'react';
import { ChatMessage, UserRole, FeedbackStatus } from '../types';
import MessageBubble from './MessageBubble';

interface ChatThreadProps {
  messages: ChatMessage[];
  currentUserRole: UserRole;
  onDeleteMessage: (id: string) => void;
  onUpdateStatus?: (id: string, status: FeedbackStatus) => void;
}

const ChatThread: React.FC<ChatThreadProps> = ({ 
  messages, 
  currentUserRole, 
  onDeleteMessage,
  onUpdateStatus 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll para o final
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Agrupar por data
  const grouped = messages.reduce((acc: any, msg) => {
    if (!acc[msg.date]) acc[msg.date] = [];
    acc[msg.date].push(msg);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth bg-slate-50/50"
      style={{ maxHeight: 'calc(100vh - 250px)' }}
    >
      {sortedDates.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 opacity-60">
           <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border border-slate-100">
              💬
           </div>
           <p className="text-sm font-medium italic">Nenhuma interação ainda. Inicie a conversa!</p>
        </div>
      )}

      {sortedDates.map(date => {
        const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { 
          weekday: 'long', 
          day: '2-digit', 
          month: 'long' 
        });

        return (
          <div key={date} className="space-y-4">
            <div className="flex items-center justify-center sticky top-0 z-10 py-2">
              <span className="bg-white/90 backdrop-blur-sm px-4 py-1 rounded-full text-[10px] font-bold text-slate-400 border border-slate-100 shadow-sm uppercase tracking-widest">
                {date === new Date().toISOString().split('T')[0] ? 'Hoje' : displayDate}
              </span>
            </div>

            {grouped[date].map((msg: ChatMessage) => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                currentUserRole={currentUserRole} 
                onDelete={onDeleteMessage}
                onUpdateStatus={onUpdateStatus}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default ChatThread;
