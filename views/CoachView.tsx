
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Send, MessageCircle, X, Plus, Trash2, Loader2, AlertTriangle, 
  Activity, Utensils, CheckCircle2, History
} from 'lucide-react';
import { UserRole, Profile, FeedbackStatus, ChatMessage } from '../types';
import { supabase } from '../supabase';
import ChatThread from '../components/ChatThread';
import { useChatMessages } from '../hooks/useChatMessages';

interface CoachViewProps {
  activeTab: string;
  user: Profile;
}

const CoachView: React.FC<CoachViewProps> = ({ activeTab, user }) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  
  const { messages, sendMessage, deleteMessage, updateStatus, isLoading } = useChatMessages(selectedStudentId, user);
  
  const [feedbackText, setFeedbackText] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<any | null>(null);
  const [summaryStudent, setSummaryStudent] = useState<any | null>(null);
  const [summaryData, setSummaryData] = useState<{ lastTraining?: ChatMessage, lastMeals: ChatMessage[], lastFeedback?: ChatMessage } | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({ name: '', email: '', password: '', role: UserRole.ALUNO });
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoadingStudents(true);
    const { data } = await supabase.from('profiles').select('*').eq('role', UserRole.ALUNO).order('name');
    if (data) setStudents(data);
    setLoadingStudents(false);
  };

  const fetchSummary = async (student: any) => {
    setLoadingSummary(true);
    setSummaryStudent(student);
    
    try {
      const { data: training } = await supabase
        .from('messages')
        .select('*')
        .eq('student_id', student.id)
        .eq('type', 'training')
        .order('created_at', { ascending: false })
        .limit(1);

      const { data: meals } = await supabase
        .from('messages')
        .select('*')
        .eq('student_id', student.id)
        .eq('type', 'meal')
        .order('created_at', { ascending: false })
        .limit(3);

      const { data: feedback } = await supabase
        .from('messages')
        .select('*')
        .eq('student_id', student.id)
        .eq('type', 'feedback')
        .order('created_at', { ascending: false })
        .limit(1);

      setSummaryData({
        lastTraining: training?.[0] as ChatMessage,
        lastMeals: (meals || []) as ChatMessage[],
        lastFeedback: feedback?.[0] as ChatMessage
      });
    } catch (err) {
      console.error("Erro ao carregar sumário:", err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    const studentId = studentToDelete.id;
    setIsDeletingId(studentId);
    try {
      await supabase.from('messages').delete().eq('student_id', studentId);
      const { error } = await supabase.from('profiles').delete().eq('id', studentId);
      if (error) throw error;
      if (selectedStudentId === studentId) setSelectedStudentId(null);
      setStudents(prev => prev.filter(s => s.id !== studentId));
      setStudentToDelete(null);
    } catch (err: any) {
      alert(`Erro ao excluir: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || feedbackText;
    if (!textToSend.trim() || !selectedStudentId) return;
    setFeedbackText('');
    await sendMessage({
      content: textToSend,
      type: 'feedback',
      status: FeedbackStatus.PENDENTE
    });
  };

  const quickReplies = ["Ótima escolha! ✅", "Faltou proteína aqui. 💪", "Excelente treino! 🔥", "Beba mais água! 💧"];

  if (selectedStudentId) {
    const student = students.find(s => s.id === selectedStudentId);
    return (
      <div className="fixed inset-0 bg-[#f0f2f5] z-[100] flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center gap-3 bg-[#075e54] text-white p-4 shadow-md safe-area-top">
          <button onClick={() => setSelectedStudentId(null)} className="p-1 -ml-1 active:scale-95 transition-transform">
            <ChevronLeft size={24} />
          </button>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-sm border border-white/10">
            {student?.name?.charAt(0)}
          </div>
          <div className="flex-1 overflow-hidden">
            <h2 className="text-sm font-bold truncate leading-tight">{student?.name}</h2>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              <span className="text-[7px] text-emerald-100 font-mono uppercase tracking-[0.15em]">Chat Ativo</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {isLoading && messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 gap-2">
              <Loader2 className="animate-spin text-emerald-600" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sincronizando histórico...</span>
            </div>
          ) : (
            <ChatThread 
              messages={messages} 
              currentUserRole={UserRole.COACH} 
              onDeleteMessage={deleteMessage}
              onUpdateStatus={updateStatus}
            />
          )}

          <div className="p-2 bg-[#f0f2f5] safe-area-bottom">
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mb-1 px-1">
              {quickReplies.map((reply, i) => (
                <button 
                  key={i} 
                  onClick={() => handleSendMessage(reply)}
                  className="whitespace-nowrap px-4 py-2 bg-white rounded-full text-[10px] font-bold text-slate-600 shadow-sm border border-slate-100 active:scale-95 hover:bg-slate-50 transition-all"
                >
                  {reply}
                </button>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-end gap-2 px-1">
              <div className="flex-1 bg-white rounded-[1.5rem] flex items-end px-4 py-2 shadow-sm border border-slate-200 focus-within:border-emerald-300 transition-colors">
                <textarea 
                  rows={1}
                  placeholder="Escreva seu feedback..." 
                  className="flex-1 bg-transparent border-none py-2 text-sm focus:outline-none resize-none max-h-32"
                  value={feedbackText} 
                  onChange={(e) => setFeedbackText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
              </div>
              <button 
                type="submit" 
                className="w-12 h-12 bg-[#128c7e] text-white rounded-full shadow-md active:scale-90 flex items-center justify-center flex-shrink-0 hover:bg-[#159b8b] transition-all"
              >
                <Send size={20} className="ml-0.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">
            {activeTab === 'dashboard' ? 'Dashboard de Alunos' : 'Meus Alunos'}
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            {activeTab === 'dashboard' ? 'Resumo de Performance' : 'Gestão de Chat'}
          </p>
        </div>
        {activeTab !== 'dashboard' && (
          <button onClick={() => setIsAddModalOpen(true)} className="bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg active:scale-95 transition-all flex items-center gap-2 hover:bg-orange-700">
            <Plus size={16} /> Novo Aluno
          </button>
        )}
      </div>

      <div className="grid gap-3 pb-24">
        {loadingStudents && (
          <div className="flex flex-col items-center py-20 text-slate-400 gap-3">
             <Loader2 className="animate-spin text-orange-500" />
             <span className="text-xs font-bold uppercase tracking-widest">Carregando dados...</span>
          </div>
        )}
        {students.length === 0 && !loadingStudents && <div className="text-center py-20 text-slate-400">Nenhum aluno cadastrado.</div>}
        
        {activeTab === 'dashboard' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {students.map((student) => (
              <div
                key={student.id}
                onClick={() => fetchSummary(student)}
                className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-orange-200 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center font-bold text-lg group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
                    {student.name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{student.name}</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Ver detalhes do aluno</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                   <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
                      <Activity size={14} className="mx-auto mb-1 text-slate-400" />
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-tighter">Treinos</span>
                      <span className="text-[10px] font-bold text-slate-700">Ver...</span>
                   </div>
                   <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
                      <Utensils size={14} className="mx-auto mb-1 text-slate-400" />
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-tighter">Refeições</span>
                      <span className="text-[10px] font-bold text-slate-700">Ver...</span>
                   </div>
                   <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
                      <CheckCircle2 size={14} className="mx-auto mb-1 text-slate-400" />
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-tighter">Feedback</span>
                      <span className="text-[10px] font-bold text-slate-700">Ver...</span>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {students.map((student) => {
              const isThisDeleting = isDeletingId === student.id;
              return (
                <div
                  key={student.id}
                  onClick={() => !isThisDeleting && setSelectedStudentId(student.id)}
                  className={`group w-full bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm transition-all flex items-center justify-between cursor-pointer ${isThisDeleting ? 'opacity-50 cursor-wait' : 'hover:border-orange-200'}`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-md group-hover:scale-105 transition-transform">
                      {student.name?.charAt(0)}
                    </div>
                    <div className="text-left overflow-hidden">
                      <h3 className="font-bold text-slate-800 text-base truncate">{student.name}</h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      disabled={isThisDeleting}
                      onClick={(e) => {
                        e.stopPropagation();
                        setStudentToDelete(student);
                      }}
                      className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-30"
                      title="Excluir Aluno"
                    >
                      {isThisDeleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                    </button>
                    <MessageCircle size={22} className="text-slate-200 group-hover:text-orange-500 transition-colors mr-2" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {summaryStudent && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#f8fafc] w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="bg-white p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center font-bold text-lg">
                    {summaryStudent.name?.charAt(0)}
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-slate-800 leading-tight">Sumário: {summaryStudent.name}</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">Visão Geral de Atividades</p>
                 </div>
              </div>
              <button onClick={() => setSummaryStudent(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingSummary ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="animate-spin text-orange-500" size={32} />
                  <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Coletando estatísticas...</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                      <Activity size={14} /> Último Treino
                    </div>
                    {summaryData?.lastTraining ? (
                      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                        <p className="text-sm font-bold text-slate-700 leading-relaxed mb-2">{summaryData.lastTraining.content}</p>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                          <History size={10} /> {new Date(summaryData.lastTraining.created_at || '').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic bg-white p-4 rounded-3xl border border-slate-100 border-dashed text-center">Nenhum treino registrado ainda.</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                      <Utensils size={14} /> Últimas Refeições
                    </div>
                    {summaryData?.lastMeals && summaryData.lastMeals.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {summaryData.lastMeals.map((meal) => (
                          <div key={meal.id} className="relative aspect-square rounded-2xl overflow-hidden group shadow-sm">
                             {meal.attachments?.[0] ? (
                               <img src={meal.attachments[0]} alt="Refeição" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                             ) : (
                               <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300"><Utensils size={20} /></div>
                             )}
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
                                <span className="text-[8px] text-white font-bold leading-tight truncate w-full">{new Date(meal.created_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                             </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic bg-white p-4 rounded-3xl border border-slate-100 border-dashed text-center">Nenhuma refeição enviada hoje.</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                      <CheckCircle2 size={14} /> Último Feedback Enviado
                    </div>
                    {summaryData?.lastFeedback ? (
                      <div className="bg-orange-50/50 p-4 rounded-3xl border border-orange-100 shadow-sm border-dashed">
                        <p className="text-sm font-bold text-slate-700 leading-relaxed mb-2">{summaryData.lastFeedback.content}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">{summaryData.lastFeedback.status || 'PENDENTE'}</span>
                          <span className="text-[10px] text-slate-400 font-medium">
                             {new Date(summaryData.lastFeedback.created_at || '').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic bg-white p-4 rounded-3xl border border-slate-100 border-dashed text-center">Nenhum feedback dado.</p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="p-6 bg-white border-t border-slate-100">
               <button 
                 onClick={() => {
                   setSelectedStudentId(summaryStudent.id);
                   setSummaryStudent(null);
                 }}
                 className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-slate-800"
               >
                 <MessageCircle size={16} /> Abrir Chat Completo
               </button>
            </div>
          </div>
        </div>
      )}

      {studentToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Confirmar Exclusão</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-8">
                Tem certeza que deseja excluir o aluno <span className="font-bold text-slate-800">{studentToDelete.name}</span>? 
                Todas as suas mensagens e arquivos serão permanentemente removidos. Esta ação não pode ser desfeita.
              </p>
              
              <div className="flex flex-col w-full gap-3">
                <button
                  disabled={!!isDeletingId}
                  onClick={confirmDeleteStudent}
                  className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-red-100 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 hover:bg-red-700"
                >
                  {isDeletingId ? <Loader2 size={18} className="animate-spin" /> : 'Excluir'}
                </button>
                <button
                  disabled={!!isDeletingId}
                  onClick={() => setStudentToDelete(null)}
                  className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all hover:bg-slate-200"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">Cadastrar Aluno</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (newUserData.password.length < 6) {
                alert("A senha temporária deve ter pelo menos 6 caracteres.");
                return;
              }
              setCreatingUser(true);
              const { error } = await supabase.from('profiles').insert({
                id: crypto.randomUUID(),
                name: newUserData.name,
                email: newUserData.email.toLowerCase().trim(),
                role: newUserData.role,
                temp_password: newUserData.password 
              });
              if (!error) {
                alert(`Aluno cadastrado! Oriente-o a usar a senha: ${newUserData.password}`);
                setIsAddModalOpen(false);
                fetchStudents();
              } else {
                alert(`Erro ao cadastrar: ${error.message}`);
              }
              setCreatingUser(false);
            }} className="space-y-4">
              <input required placeholder="Nome Completo" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm" value={newUserData.name} onChange={e => setNewUserData({...newUserData, name: e.target.value})} />
              <input required type="email" placeholder="Email de acesso" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm" value={newUserData.email} onChange={e => setNewUserData({...newUserData, email: e.target.value})} />
              <div className="space-y-1">
                <input required type="text" placeholder="Senha provisória (mín. 6 chars)" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm" value={newUserData.password} onChange={e => setNewUserData({...newUserData, password: e.target.value})} />
                <p className="text-[9px] text-slate-400 font-bold ml-2 uppercase tracking-widest">Mínimo 6 caracteres para ativação.</p>
              </div>
              <button type="submit" disabled={creatingUser} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black shadow-xl active:scale-95 disabled:opacity-50 hover:bg-slate-800 transition-colors">
                {creatingUser ? "Salvando..." : "Finalizar Cadastro"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachView;
