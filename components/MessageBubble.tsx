
import React from 'react';
import { Trash2, CheckCheck } from 'lucide-react';
import { ChatMessage, UserRole, FeedbackStatus } from '../types';
import AttachmentGrid from './AttachmentGrid';

interface MessageBubbleProps {
  message: ChatMessage;
  currentUserRole: UserRole;
  onDelete: (id: string) => void;
  onUpdateStatus?: (id: string, status: FeedbackStatus) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  currentUserRole, 
  onDelete,
  onUpdateStatus 
}) => {
  const isMine = message.sender_role === currentUserRole;
  
  const getBadgeColor = (status?: FeedbackStatus) => {
    switch (status) {
      case FeedbackStatus.OK: return 'bg-emerald-100 text-emerald-700';
      case FeedbackStatus.AJUSTAR: return 'bg-orange-100 text-orange-700';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const showActions = currentUserRole === UserRole.COACH && (message.type === 'meal' || message.type === 'body');

  return (
    <div className={`flex flex-col mb-4 ${isMine ? 'items-end' : 'items-start'}`}>
      <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-3 shadow-sm relative group transition-all ${
        isMine 
          ? 'bg-orange-600 text-white rounded-tr-none' 
          : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
      }`}>
        
        {(message.type === 'meal' || message.type === 'body' || message.type === 'training') && (
          <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 opacity-80 flex items-center gap-1`}>
             {message.type === 'meal' ? '🍽️ Refeição' : message.type === 'body' ? '💪 Evolução' : '🏋️ Treino'}
          </div>
        )}

        {message.text && <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>}

        {message.attachments && <AttachmentGrid attachments={message.attachments} />}

        <div className={`flex items-center justify-end gap-1.5 mt-1.5 opacity-60`}>
          <span className="text-[9px] font-medium">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          
          {isMine && <CheckCheck size={12} />}

          <button 
            onClick={() => {
              if (confirm('Deseja realmente apagar esta mensagem?')) onDelete(message.id);
            }}
            className="p-1 hover:text-red-300 transition-colors opacity-0 group-hover:opacity-100"
            title="Apagar mensagem"
          >
            <Trash2 size={12} />
          </button>
        </div>

        {message.status && !isMine && (
           <div className={`absolute -bottom-6 ${isMine ? 'right-0' : 'left-0'} flex gap-1`}>
              <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full shadow-sm ${getBadgeColor(message.status)}`}>
                 {message.status}
              </span>
           </div>
        )}
      </div>

      {showActions && !isMine && onUpdateStatus && (
        <div className="flex gap-2 mt-2 ml-1 animate-in fade-in slide-in-from-left-2 duration-300">
          <button 
            onClick={() => onUpdateStatus(message.id, FeedbackStatus.OK)}
            className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
              message.status === FeedbackStatus.OK ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            Validar
          </button>
          <button 
            onClick={() => onUpdateStatus(message.id, FeedbackStatus.AJUSTAR)}
            className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
              message.status === FeedbackStatus.AJUSTAR ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-orange-200 text-orange-600 hover:bg-orange-50'
            }`}
          >
            Ajustar
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
