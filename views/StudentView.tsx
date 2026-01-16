
import React, { useState, useEffect } from 'react';
import { 
  Camera, CheckCircle2, Clock, FileText, Droplets, Target, 
  Weight, ChevronRight, Download, Eye, Check, Utensils, Dumbbell, Send, X, PlusCircle, Image as ImageIcon
} from 'lucide-react';
import { compressImage } from '../supabase';
import { Document, Profile, ActivityLog, FeedbackStatus, ChatMessage, UserRole } from '../types';
import ChatThread from '../components/ChatThread';

interface StudentViewProps {
  activeTab: string;
  user: Profile;
}

const StudentView: React.FC<StudentViewProps> = ({ activeTab, user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [uploadType, setUploadType] = useState<'text' | 'meal' | 'body'>('text');
  const [uploading, setUploading] = useState(false);
  const [water, setWater] = useState(1200);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const waterGoal = 3000;

  useEffect(() => {
    const storedDocs = JSON.parse(localStorage.getItem('focuscoach_docs') || '[]');
    const storedMessages = JSON.parse(localStorage.getItem('focuscoach_messages') || '[]');
    setDocuments(storedDocs);
    setMessages(storedMessages.filter((m: ChatMessage) => m.student_id === user.id));
  }, [user.id]);

  const saveMessage = (newMsg: ChatMessage) => {
    const allMessages = JSON.parse(localStorage.getItem('focuscoach_messages') || '[]');
    const updated = [...allMessages, newMsg];
    localStorage.setItem('focuscoach_messages', JSON.stringify(updated));
    setMessages(updated.filter(m => m.student_id === user.id));
  };

  const handleDeleteMessage = (id: string) => {
    const allMessages = JSON.parse(localStorage.getItem('focuscoach_messages') || '[]');
    const updated = allMessages.filter((m: ChatMessage) => m.id !== id);
    localStorage.setItem('focuscoach_messages', JSON.stringify(updated));
    setMessages(updated.filter((m: ChatMessage) => m.student_id === user.id));
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      student_id: user.id,
      sender_id: user.id,
      sender_role: UserRole.ALUNO,
      type: 'text',
      text: inputText,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0]
    };

    saveMessage(newMsg);
    setInputText('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'meal' | 'body') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { url } = await compressImage(file);
      const newMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        student_id: user.id,
        sender_id: user.id,
        sender_role: UserRole.ALUNO,
        type: type,
        text: inputText || (type === 'meal' ? 'Novo registro de refeição' : 'Progresso físico'),
        attachments: [url],
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        status: FeedbackStatus.PENDENTE
      };
      saveMessage(newMsg);
      setInputText('');
      setShowUploadModal(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao processar imagem.');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleTraining = () => {
    const today = new Date().toISOString().split('T')[0];
    const hasTrainedToday = messages.some(m => m.type === 'training' && m.date === today);
    if (hasTrainedToday) return;

    const newMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      student_id: user.id,
      sender_id: user.id,
      sender_role: UserRole.ALUNO,
      type: 'training',
      text: 'Check-in de treino realizado! 💪',
      timestamp: new Date().toISOString(),
      date: today
    };
    saveMessage(newMsg);
  };

  const handleConfirmDoc = (docId: string) => {
    const allDocs = JSON.parse(localStorage.getItem('focuscoach_docs') || '[]');
    const updated = allDocs.map((d: Document) => 
      d.id === docId ? { ...d, confirmedAt: new Date().toISOString() } : d
    );
    localStorage.setItem('focuscoach_docs', JSON.stringify(updated));
    setDocuments(updated);
  };

  const renderToday = () => {
    const today = new Date().toISOString().split('T')[0];
    const trainedToday = messages.some(m => m.type === 'training' && m.date === today);

    return (
      <div className="flex flex-col h-full space-y-6 pb-20 md:pb-0 animate-in fade-in duration-500">
        {/* Header Stats */}
        <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-orange-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-orange-200">
              {user.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Olá, {user.name.split(' ')[0]}!</h2>
              <p className="text-xs text-slate-400 font-medium italic">Foco no processo, o resultado vem.</p>
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded-3xl border border-orange-100">
             <div className="flex items-center justify-between text-orange-500 mb-2">
                <div className="flex items-center gap-2">
                   <Droplets size={14} /> <span className="text-[10px] font-bold uppercase tracking-wider">Hidratação</span>
                </div>
                <span className="text-[10px] font-bold">{Math.round((water/waterGoal)*100)}%</span>
             </div>
             <div className="w-full bg-orange-100 h-2 rounded-full overflow-hidden mb-2">
                <div className="bg-orange-500 h-full transition-all duration-700" style={{ width: `${(water/waterGoal)*100}%` }}></div>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-orange-800">{water}ml</span>
                <button onClick={() => setWater(w => Math.min(waterGoal, w + 250))} className="bg-white text-orange-600 px-3 py-1 rounded-full text-[10px] font-bold shadow-sm active:scale-95 transition-all"> + 250ml </button>
             </div>
          </div>
        </div>

        {/* Planos Ativos (Cards Horizontais) */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide px-1">
          {['meal_plan', 'workout'].map(type => {
            const doc = documents.filter(d => d.student_id === user.id).find(d => d.type === type);
            return (
              <div key={type} className="min-w-[200px] bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-36">
                 <div className="flex justify-between items-start">
                    <div className={`p-2 rounded-xl ${type === 'meal_plan' ? 'bg-orange-50 text-orange-500' : 'bg-purple-50 text-purple-500'}`}>
                       {type === 'meal_plan' ? <Utensils size={18} /> : <Dumbbell size={18} />}
                    </div>
                    {doc && !doc.confirmedAt && <span className="bg-red-500 w-2 h-2 rounded-full animate-pulse"></span>}
                 </div>
                 <div>
                    <h4 className="font-bold text-slate-800 text-sm">{type === 'meal_plan' ? 'Plano Alimentar' : 'Protocolo Treino'}</h4>
                    {doc ? (
                      <div className="flex items-center justify-between mt-2">
                        <button onClick={() => window.open(doc.url, '_blank')} className="text-[10px] font-bold text-orange-600 flex items-center gap-1"><Eye size={12}/> Ver</button>
                        {!doc.confirmedAt && (
                          <button onClick={() => handleConfirmDoc(doc.id)} className="px-2 py-1 bg-orange-600 text-white text-[9px] font-bold rounded-lg shadow-sm">Confirmar</button>
                        )}
                        {doc.confirmedAt && <Check className="text-emerald-500" size={14} strokeWidth={3} />}
                      </div>
                    ) : <span className="text-[9px] text-slate-300 italic">Em breve...</span>}
                 </div>
              </div>
            );
          })}
        </div>

        {/* Chat / Feed Section */}
        <div className="flex-1 bg-white rounded-t-[2.5rem] border-t border-slate-100 shadow-2xl flex flex-col overflow-hidden -mx-4 md:mx-0">
          <div className="p-4 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Send size={16} className="text-orange-500 rotate-[-15deg]" /> Feed de Evolução</h3>
            <button 
              onClick={handleToggleTraining}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all ${
                trainedToday ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-200'
              }`}
            >
              <Dumbbell size={12}/> {trainedToday ? 'Treino OK' : 'Check-in Treino'}
            </button>
          </div>

          <ChatThread 
            messages={messages} 
            currentUserRole={UserRole.ALUNO} 
            onDeleteMessage={handleDeleteMessage} 
          />

          {/* Input Area Style WhatsApp */}
          <div className="p-4 bg-white border-t border-slate-100 safe-area-bottom">
            <form onSubmit={handleSendMessage} className="flex items-end gap-2 max-w-2xl mx-auto">
              <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 p-2 flex flex-col">
                <textarea 
                  placeholder="Escreva algo..." 
                  className="bg-transparent border-none focus:ring-0 text-sm w-full p-2 resize-none h-12 max-h-32"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <div className="flex gap-2 p-1">
                   <label className="p-2 hover:bg-orange-100 text-orange-600 rounded-xl transition-colors cursor-pointer" title="Anexar Refeição">
                      <Utensils size={18} />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'meal')} />
                   </label>
                   <label className="p-2 hover:bg-purple-100 text-purple-600 rounded-xl transition-colors cursor-pointer" title="Anexar Evolução (Corpo)">
                      <ImageIcon size={18} />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'body')} />
                   </label>
                </div>
              </div>
              <button 
                type="submit"
                className="mb-1 p-4 bg-orange-600 text-white rounded-2xl shadow-lg shadow-orange-200 active:scale-95 transition-all disabled:opacity-50"
                disabled={!inputText.trim()}
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>

        {uploading && (
           <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-3xl shadow-xl flex flex-col items-center gap-4 animate-in zoom-in duration-200">
                 <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                 <p className="font-bold text-slate-700">Otimizando foto...</p>
              </div>
           </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto h-full">
      {activeTab === 'today' && renderToday()}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <h2 className="text-xl font-bold text-slate-800">Seu Histórico</h2>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            {messages.filter(m => m.type !== 'text').map(m => (
              <div key={m.id} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-none">
                 <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${m.type === 'training' ? 'bg-emerald-50 text-emerald-500' : 'bg-orange-50 text-orange-500'}`}>
                       {m.type === 'training' ? <Dumbbell size={16} /> : <Utensils size={16} />}
                    </div>
                    <div>
                       <p className="text-sm font-bold text-slate-700">{m.type === 'training' ? 'Treino' : 'Alimentação'}</p>
                       <p className="text-[10px] text-slate-400">{new Date(m.timestamp).toLocaleString()}</p>
                    </div>
                 </div>
                 {m.status && (
                   <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${m.status === FeedbackStatus.OK ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                     {m.status}
                   </span>
                 )}
              </div>
            ))}
            {messages.length === 0 && <p className="text-center text-slate-400 text-sm italic">Nenhuma atividade registrada.</p>}
          </div>
        </div>
      )}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 mb-4 text-center">Interações com Coach</h2>
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-center">
             <p className="text-sm text-slate-500">Toda a sua comunicação e feedbacks estão no feed principal da aba "Hoje".</p>
             <button onClick={() => window.location.reload()} className="mt-4 text-orange-600 font-bold text-xs underline">Voltar para Hoje</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentView;
