
import React, { useState, useEffect } from 'react';
import { 
  Droplets, Dumbbell, Send, Image as ImageIcon, Utensils, CheckCircle2, TrendingUp, Calendar, MessageSquare, Clock
} from 'lucide-react';
import { supabase, uploadCompressedImage } from '../supabase';
import { Profile, FeedbackStatus, ChatMessage, UserRole } from '../types';
import ChatThread from '../components/ChatThread';

interface StudentViewProps {
  activeTab: string;
  // Adicionando setActiveTab para permitir navegação interna entre abas
  setActiveTab: (tab: string) => void;
  user: Profile;
}

const StudentView: React.FC<StudentViewProps> = ({ activeTab, setActiveTab, user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [water, setWater] = useState(1200);

  const waterGoal = 3500;
  const waterProgress = Math.min((water / waterGoal) * 100, 100);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase.from('messages').select('*').eq('student_id', user.id).order('created_at', { ascending: true });
      if (data) setMessages(data as ChatMessage[]);
    };
    fetchMessages();
    const channel = supabase.channel(`chat-${user.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `student_id=eq.${user.id}` }, fetchMessages).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user.id]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    await supabase.from('messages').insert({ student_id: user.id, sender_id: user.id, sender_role: UserRole.ALUNO, type: 'text', text: inputText, date: new Date().toISOString().split('T')[0] });
    setInputText('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'meal' | 'body') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { publicUrl } = await uploadCompressedImage(file, 'chat_attachments', fileName);
      await supabase.from('messages').insert({ student_id: user.id, sender_id: user.id, sender_role: UserRole.ALUNO, type, text: type === 'meal' ? 'Registro de refeição' : 'Foto de evolução', attachments: [publicUrl], status: FeedbackStatus.PENDENTE, date: new Date().toISOString().split('T')[0] });
    } finally {
      setUploading(false);
    }
  };

  if (activeTab === 'history') {
    const timelineItems = messages.filter(m => m.type !== 'text' && m.type !== 'feedback').reverse();
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-24 animate-in slide-in-from-bottom-4 duration-500">
         <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
           <Calendar className="text-orange-500" /> Seu Histórico
         </h2>
         <div className="space-y-4">
            {timelineItems.length === 0 ? (
               <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-slate-200 text-center">
                  <Clock size={40} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 font-bold">Nenhum registro encontrado ainda.</p>
               </div>
            ) : timelineItems.map(item => (
              <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex gap-4">
                 <div className="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0">
                    {item.attachments ? (
                      <img src={item.attachments[0]} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        {item.type === 'training' ? <Dumbbell /> : <Utensils />}
                      </div>
                    )}
                 </div>
                 <div className="flex-1 flex flex-col justify-center">
                    <p className="text-sm font-bold text-slate-800">{item.text}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                      {new Date(item.created_at).toLocaleDateString('pt-BR')} - {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                    {item.status && (
                       <span className={`text-[8px] font-black px-2 py-0.5 rounded-full mt-2 self-start ${
                         item.status === FeedbackStatus.OK ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
                       }`}>
                         STATUS: {item.status}
                       </span>
                    )}
                 </div>
              </div>
            ))}
         </div>
      </div>
    );
  }

  if (activeTab === 'feedback') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-24 animate-in fade-in duration-500">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
           <MessageSquare className="text-orange-500" /> Conversa com Coach
        </h2>
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl flex flex-col h-[650px] overflow-hidden">
           <ChatThread 
             messages={messages} 
             currentUserRole={UserRole.ALUNO} 
             onDeleteMessage={async (id) => { await supabase.from('messages').delete().eq('id', id); }} 
           />
           <div className="p-4 bg-slate-50 border-t border-slate-100">
             <form onSubmit={handleSendMessage} className="flex gap-2">
               <input 
                 placeholder="Mande sua dúvida aqui..." 
                 className="flex-1 bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-orange-500 shadow-inner"
                 value={inputText}
                 onChange={(e) => setInputText(e.target.value)}
               />
               <button type="submit" className="p-4 bg-orange-600 text-white rounded-2xl shadow-lg active:scale-95 transition-all"><Send size={20} /></button>
             </form>
           </div>
        </div>
      </div>
    );
  }

  // Aba 'Hoje' (Padrão)
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 animate-in fade-in duration-700">
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -mr-10 -mt-10 opacity-50"></div>
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-[1.5rem] flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-orange-100">
              {user.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">Foco total, {user.name.split(' ')[0]}!</h2>
              <p className="text-[10px] text-orange-500 font-bold uppercase tracking-[0.2em]">Sua evolução começa agora</p>
            </div>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl"><TrendingUp size={24} /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 relative overflow-hidden group">
             <div className="flex justify-between items-center mb-4 relative z-10">
                <div className="flex items-center gap-2 text-slate-600">
                   <Droplets size={18} className="text-blue-500 animate-bounce" /> <span className="text-[11px] font-black uppercase tracking-widest">Hidratação</span>
                </div>
                <span className="text-sm font-black text-slate-800">{water}ml</span>
             </div>
             <div className="h-2 bg-slate-200 rounded-full mb-4 relative z-10">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${waterProgress}%` }}></div>
             </div>
             <button onClick={() => setWater(w => w + 250)} className="w-full bg-white text-blue-600 py-3 rounded-2xl text-xs font-black shadow-sm hover:shadow-md hover:bg-blue-50 active:scale-95 transition-all relative z-10">+ 250ml</button>
          </div>

          <button 
            onClick={async () => {
              const today = new Date().toISOString().split('T')[0];
              await supabase.from('messages').insert({ student_id: user.id, sender_id: user.id, sender_role: UserRole.ALUNO, type: 'training', text: 'Treino concluído com sucesso! 🔥', date: today });
            }}
            className="bg-emerald-600 text-white p-6 rounded-[2rem] shadow-lg shadow-emerald-100 flex flex-col items-center justify-center gap-2 group active:scale-95 transition-all"
          >
             <Dumbbell size={32} className="group-hover:rotate-12 transition-transform" />
             <span className="text-xs font-black uppercase tracking-widest">Check-in Treino</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl flex flex-col h-[550px] overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white">
          <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
            <CheckCircle2 size={16} className="text-orange-500" /> Atividade de Hoje
          </h3>
        </div>

        <ChatThread 
          messages={messages.filter(m => m.date === new Date().toISOString().split('T')[0])} 
          currentUserRole={UserRole.ALUNO} 
          onDeleteMessage={async (id) => { await supabase.from('messages').delete().eq('id', id); }} 
        />

        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <div className="flex gap-4">
             <div className="flex-1 flex gap-2">
                <label className="flex-1 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl py-3 cursor-pointer hover:border-orange-500 hover:text-orange-600 transition-all active:scale-95">
                   <Utensils size={24} className="mb-1 text-orange-600" />
                   <span className="text-[10px] font-black uppercase tracking-tighter">Refeição</span>
                   <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'meal')} />
                </label>
                <label className="flex-1 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl py-3 cursor-pointer hover:border-purple-500 hover:text-purple-600 transition-all active:scale-95">
                   <ImageIcon size={24} className="mb-1 text-purple-600" />
                   <span className="text-[10px] font-black uppercase tracking-tighter">Evolução</span>
                   <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'body')} />
                </label>
             </div>
             <button 
                // Navega para a aba de feedback (chat com o coach)
                onClick={() => setActiveTab('feedback')}
                className="px-6 bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-200 active:scale-95"
             >
                Chat
             </button>
          </div>
        </div>
      </div>

      {uploading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-[2.5rem] flex flex-col items-center gap-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-black text-slate-800 text-sm text-center">Enviando seu progresso<br/><span className="text-orange-500">para o treinador...</span></p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentView;
