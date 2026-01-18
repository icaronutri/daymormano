import React, { useState } from 'react';
import { 
  Send, Image as ImageIcon, Utensils, CheckCircle2, MessageSquare
} from 'lucide-react';
import { supabase, uploadCompressedImage } from '../supabase';
import { Profile, FeedbackStatus, UserRole } from '../types';
import ChatThread from '../components/ChatThread';
import { useChatMessages } from '../hooks/useChatMessages';

interface StudentViewProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: Profile;
}

const StudentView: React.FC<StudentViewProps> = ({ activeTab, setActiveTab, user }) => {
  const { messages, sendMessage, deleteMessage } = useChatMessages(user.id, user);
  const [inputText, setInputText] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    
    const textSaved = inputText;
    setInputText('');
    await sendMessage({ text: textSaved, type: 'text' });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'meal' | 'body') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    
    try {
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { publicUrl } = await uploadCompressedImage(file, 'chat_attachments', fileName);
      
      await sendMessage({
        type,
        text: type === 'meal' ? '🍽️ Registro de refeição' : '💪 Foto de evolução',
        attachments: [publicUrl],
        status: FeedbackStatus.PENDENTE
      });
    } catch (err) {
      alert("Erro ao enviar foto.");
    } finally {
      setUploading(false);
    }
  };

  if (activeTab === 'feedback') {
    return (
      <div className="fixed inset-0 bg-[#f0f2f5] z-[100] flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="bg-[#075e54] text-white p-4 flex items-center justify-between safe-area-top shadow-md">
           <div className="flex items-center gap-3">
             <MessageSquare size={22} className="text-emerald-300" />
             <h2 className="font-bold text-sm">Conversa com Treinador</h2>
           </div>
           <button onClick={() => setActiveTab('today')} className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest bg-white/10 px-3 py-1.5 rounded-lg active:bg-white/20">Sair</button>
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <ChatThread 
            messages={messages} 
            currentUserRole={UserRole.ALUNO} 
            onDeleteMessage={deleteMessage} 
          />
          
          <div className="p-2 bg-[#f0f2f5] safe-area-bottom">
            <form onSubmit={handleSendMessage} className="flex items-end gap-2 px-1">
              <div className="flex-1 bg-white rounded-[1.5rem] flex items-end px-4 py-2 shadow-sm border border-slate-200">
                <textarea 
                  rows={1}
                  placeholder="Mensagem..." 
                  className="flex-1 bg-transparent border-none py-2 text-sm focus:outline-none resize-none max-h-32"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
              </div>
              <button type="submit" className="w-12 h-12 bg-[#128c7e] text-white rounded-full shadow-md active:scale-90 flex items-center justify-center">
                <Send size={20} className="ml-0.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 animate-in fade-in duration-700">
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
            {user.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">Fala, {user.name.split(' ')[0]}!</h2>
            <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">Plano Ativo • Hoje</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl flex flex-col h-[550px] overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-white flex justify-between items-center">
          <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
            <CheckCircle2 size={16} className="text-orange-500" /> Atividade Diária
          </h3>
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Tempo Real</span>
        </div>

        <ChatThread 
          messages={messages.filter(m => m.date === todayStr)} 
          currentUserRole={UserRole.ALUNO} 
          onDeleteMessage={deleteMessage} 
        />

        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <div className="flex gap-3">
             <label className="flex-1 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl py-4 active:scale-95 transition-all cursor-pointer shadow-sm">
                <Utensils size={24} className="mb-1 text-orange-600" />
                <span className="text-[9px] font-black uppercase tracking-tighter">Refeição</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'meal')} />
             </label>
             <label className="flex-1 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl py-4 active:scale-95 transition-all cursor-pointer shadow-sm">
                <ImageIcon size={24} className="mb-1 text-purple-600" />
                <span className="text-[9px] font-black uppercase tracking-tighter">Evolução</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'body')} />
             </label>
             <button onClick={() => setActiveTab('feedback')} className="px-6 bg-[#075e54] text-white rounded-2xl font-black text-[10px] uppercase shadow-lg active:scale-95">Abrir Chat</button>
          </div>
        </div>
      </div>

      {uploading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-[2.5rem] flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-black text-slate-800 text-sm text-center">Processando foto...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentView;