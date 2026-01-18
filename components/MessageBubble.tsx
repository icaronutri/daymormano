
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
  const isCoach = message.sender_role === UserRole.COACH;
  
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
      <div className={`max-w-[85%] md:max-w-[70%] rounded-xl p-2.5 shadow-sm relative group transition-all ${
        isMine 
          ? 'bg-[#dcf8c6] text-slate-800 rounded-tr-none' 
          : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
      }`}>
        
        {/* Marcador de Tipo de Conteúdo */}
        {(message.type === 'meal' || message.type === 'body' || message.type === 'training') && (
          <div className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 px-2 py-0.5 rounded-md bg-black/5 flex items-center gap-1 w-fit`}>
             {message.type === 'meal' ? '🍽️ Refeição' : message.type === 'body' ? '💪 Evolução' : '🏋️ Treino'}
          </div>
        )}

        {/* Texto da Mensagem */}
        {message.text && (
          <p className="text-[14px] leading-tight px-1 whitespace-pre-wrap font-medium">
            {message.text}
          </p>
        )}

        {/* Anexos */}
        {message.attachments && <AttachmentGrid attachments={message.attachments} />}

        {/* Metadados (Hora e Check) */}
        <div className={`flex items-center justify-end gap-1 mt-1 opacity-60`}>
          <span className="text-[10px] font-medium">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          
          {isMine && (
            <CheckCheck size={14} className={message.id.startsWith('temp-') ? 'text-slate-400' : 'text-blue-500'} />
          )}

          <button 
            onClick={() => {
              if (confirm('Deseja apagar esta mensagem?')) onDelete(message.id);
            }}
            className="p-1 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={12} />
          </button>
        </div>

        {/* Status de Feedback para o Aluno */}
        {message.status && !isMine && (
           <div className={`absolute -bottom-6 ${isMine ? 'right-0' : 'left-0'} flex gap-1`}>
              <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-sm border border-slate-100 ${getBadgeColor(message.status)}`}>
                 {message.status}
              </span>
           </div>
        )}
      </div>

      {/* Ações do Coach */}
      {showActions && !isMine && onUpdateStatus && (
        <div className="flex gap-2 mt-2 ml-1 animate-in fade-in slide-in-from-left-2 duration-300">
          <button 
            onClick={() => onUpdateStatus(message.id, FeedbackStatus.OK)}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black border transition-all shadow-sm ${
              message.status === FeedbackStatus.OK ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            VALIDAR ✅
          </button>
          <button 
            onClick={() => onUpdateStatus(message.id, FeedbackStatus.AJUSTAR)}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black border transition-all shadow-sm ${
              message.status === FeedbackStatus.AJUSTAR ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-orange-200 text-orange-600 hover:bg-orange-50'
            }`}
          >
            AJUSTAR ⚠️
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
