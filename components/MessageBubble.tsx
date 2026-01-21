
import React from 'react';
import { Trash2, CheckCheck, AlertCircle, Clock } from 'lucide-react';
import { ChatMessage, UserRole, FeedbackStatus } from '../types';

interface MessageBubbleProps {
  message: ChatMessage;
  currentUserRole: UserRole;
  onDelete: (id: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  currentUserRole, 
  onDelete
}) => {
  const isMine = message.sender_role.toLowerCase() === (currentUserRole === UserRole.COACH ? 'coach' : 'student');
  const isFailed = message.delivery_status === 'failed';
  const isSending = message.delivery_status === 'sending';

  // Helper para verificar se o conteúdo é uma URL de imagem do Supabase
  const isImageUrl = (url?: string) => {
    if (!url) return false;
    return url.startsWith('http') && (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('chat_attachments'));
  };

  const formatTime = () => {
    const date = message.created_at ? new Date(message.created_at) : (message.local_created_at ? new Date(message.local_created_at) : new Date());
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex flex-col mb-4 ${isMine ? 'items-end' : 'items-start'}`}>
      <div className={`max-w-[85%] md:max-w-[70%] rounded-xl p-2.5 shadow-sm relative group transition-all ${
        isMine 
          ? (isFailed ? 'bg-red-50 border border-red-200 text-red-900' : 'bg-[#dcf8c6] text-slate-800')
          : 'bg-white text-slate-800 border border-slate-200'
      } ${isMine ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
        
        {(message.type === 'meal' || message.type === 'body' || message.type === 'training') && (
          <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5 px-2 py-0.5 rounded-md bg-black/5 flex items-center gap-1 w-fit">
             {message.type === 'meal' ? '🍽️ Refeição' : message.type === 'body' ? '💪 Evolução' : '🏋️ Treino'}
          </div>
        )}

        {isImageUrl(message.content) ? (
          <div className="rounded-lg overflow-hidden border border-black/5 bg-slate-100 aspect-square max-w-[200px] mb-1">
            <img 
              src={message.content} 
              alt="Anexo" 
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => window.open(message.content, '_blank')}
            />
          </div>
        ) : (
          message.content && (
            <p className="text-[14px] leading-tight px-1 whitespace-pre-wrap font-medium">
              {message.content}
            </p>
          )
        )}

        <div className="flex items-center justify-end gap-1 mt-1 opacity-60">
          <span className="text-[10px] font-medium">{formatTime()}</span>
          
          {isMine && (
            <div className="flex items-center ml-1">
              {isSending && <Clock size={12} className="text-slate-400 animate-pulse" />}
              {isFailed && <AlertCircle size={14} className="text-red-500" />}
              {!isSending && !isFailed && (
                <CheckCheck size={14} className={message.pending ? 'text-slate-400' : 'text-blue-500'} />
              )}
            </div>
          )}

          <button 
            onClick={() => { if (confirm('Apagar esta mensagem?')) onDelete(message.id); }}
            className="p-1 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 ml-1"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
