
import React, { useState, useEffect } from 'react';
import { 
  Search, Dumbbell, Utensils, Send, ChevronLeft, 
  User, MessageCircle, Zap, CheckCircle2, BarChart3, Users, Bell, 
  Settings, UserPlus, Inbox, RefreshCw, X, Plus, ShieldCheck, Mail, Lock
} from 'lucide-react';
import { UserRole, Profile, FeedbackStatus, ChatMessage } from '../types';
import { supabase } from '../supabase';
import ChatThread from '../components/ChatThread';

interface CoachViewProps {
  activeTab: string;
  user: Profile;
}

const CoachView: React.FC<CoachViewProps> = ({ activeTab, user }) => {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRole.ALUNO
  });
  const [creatingUser, setCreatingUser] = useState(false);

  const quickReplies = [
    "Ótima escolha! ✅",
    "Faltou um pouco de proteína aqui. 💪",
    "Cuidado com as proporções! ⚖️",
    "Excelente treino hoje! 🔥",
    "Beba mais água! 💧"
  ];

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', UserRole.ALUNO)
        .order('name');
      
      if (!error && data) {
        setStudents(data);
      }
    } catch (err) {
      console.error("Erro ao buscar alunos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (!selectedStudent) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('student_id', selectedStudent)
        .order('created_at', { ascending: true });
      if (data) setMessages(data as ChatMessage[]);
    };
    fetchMessages();

    const channel = supabase.channel(`chat-${selectedStudent}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `student_id=eq.${selectedStudent}` }, fetchMessages)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedStudent]);

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || feedbackText;
    if (!textToSend.trim() || !selectedStudent) return;

    const newMsg = {
      student_id: selectedStudent,
      sender_id: user.id,
      sender_role: UserRole.COACH,
      type: 'feedback',
      text: textToSend,
      date: new Date().toISOString().split('T')[0]
    };

    await supabase.from('messages').insert(newMsg);
    setFeedbackText('');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creatingUser) return;
    
    setCreatingUser(true);
    try {
      const emailLower = newUserData.email.toLowerCase().trim();
      const tempId = crypto.randomUUID();
      
      const { error } = await supabase.from('profiles').insert({
        id: tempId,
        name: newUserData.name,
        email: emailLower,
        role: newUserData.role,
        is_master: newUserData.role === UserRole.COACH,
        // Salvamos a senha temporária para ser usada no primeiro login (ativação)
        temp_password: newUserData.password 
      });

      if (error) throw error;

      alert(`✅ CADASTRADO COM SUCESSO!\n\nO ${newUserData.role === UserRole.ALUNO ? 'Aluno' : 'Treinador'} "${newUserData.name}" já pode acessar o app.\n\nEmail: ${emailLower}\nSenha: ${newUserData.password}`);
      
      setIsAddModalOpen(false);
      setNewUserData({ name: '', email: '', password: '', role: UserRole.ALUNO });
      fetchStudents();
    } catch (err: any) {
      console.error("Erro no cadastro:", err);
      alert('Erro ao cadastrar: ' + (err.message || 'Verifique sua conexão.'));
    } finally {
      setCreatingUser(false);
    }
  };

  if (selectedStudent) {
    const student = students.find(s => s.id === selectedStudent);
    return (
      <div className="h-full flex flex-col pb-20 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center gap-4 mb-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <button onClick={() => setSelectedStudent(null)} className="p-2 bg-slate-50 rounded-xl text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800">{student?.name || 'Aluno'}</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Feedback e Acompanhamento</p>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col overflow-hidden">
          <ChatThread 
            messages={messages} 
            currentUserRole={UserRole.COACH} 
            onDeleteMessage={async (id) => { await supabase.from('messages').delete().eq('id', id); }}
            onUpdateStatus={async (id, status) => { await supabase.from('messages').update({ status }).eq('id', id); }}
          />

          <div className="p-4 bg-slate-50/50 border-t border-slate-100">
            <div className="flex gap-2 overflow-x-auto pb-3 mb-2 no-scrollbar">
              {quickReplies.map((reply, i) => (
                <button 
                  key={i} 
                  onClick={() => handleSendMessage(reply)}
                  className="whitespace-nowrap px-4 py-2 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 hover:border-orange-500 hover:text-orange-600 transition-all shadow-sm active:scale-95"
                >
                  {reply}
                </button>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
              <input 
                placeholder="Digite seu feedback..." 
                className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 shadow-inner"
                value={feedbackText} 
                onChange={(e) => setFeedbackText(e.target.value)}
              />
              <button type="submit" className="p-4 bg-orange-600 text-white rounded-2xl shadow-lg shadow-orange-100 active:scale-95 transition-all">
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-slate-800">Seu Dashboard</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
               <div className="bg-orange-100 w-10 h-10 rounded-xl flex items-center justify-center text-orange-600 mb-4"><Users size={20} /></div>
               <p className="text-3xl font-black text-slate-800">{students.length}</p>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Alunos Ativos</p>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
               <div className="bg-emerald-100 w-10 h-10 rounded-xl flex items-center justify-center text-emerald-600 mb-4"><CheckCircle2 size={20} /></div>
               <p className="text-3xl font-black text-slate-800">12</p>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Check-ins Hoje</p>
            </div>
          </div>
          <div className="bg-orange-600 text-white p-8 rounded-[2.5rem] shadow-xl shadow-orange-100 flex items-center justify-between">
             <div>
                <h3 className="font-bold text-xl mb-1">Dica do Dia</h3>
                <p className="text-orange-100 text-sm opacity-90">Mantenha o feedback constante para aumentar a retenção!</p>
             </div>
             <Zap size={40} className="text-orange-300 opacity-50" />
          </div>
        </div>
      )}

      {activeTab === 'inbox' && (
        <div className="space-y-6">
           <div className="flex justify-between items-center">
             <h2 className="text-2xl font-black text-slate-800">Atividades Recentes</h2>
             <div className="bg-red-100 px-3 py-1 rounded-full text-red-600 text-[10px] font-bold">LIVE FEED</div>
           </div>
           <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-slate-200 text-center flex flex-col items-center">
              <Inbox size={48} className="text-slate-200 mb-4" />
              <p className="text-slate-500 font-bold text-sm">Nenhuma notificação por enquanto.</p>
           </div>
        </div>
      )}

      {activeTab === 'students' && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-800">Meus Alunos</h2>
            <div className="flex gap-2">
              <button 
                onClick={fetchStudents}
                className="p-2 bg-white rounded-xl text-slate-400 hover:text-orange-600 border border-slate-100 transition-colors shadow-sm"
                title="Atualizar lista"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg shadow-orange-100 active:scale-95 transition-all"
              >
                <Plus size={16} /> Novo Aluno
              </button>
            </div>
          </div>

          <div className="grid gap-3 pb-24">
            {loading && students.length === 0 ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : students.length === 0 ? (
              <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-slate-200 text-center flex flex-col items-center">
                <UserPlus size={48} className="text-slate-200 mb-4" />
                <p className="text-slate-500 font-bold text-sm">Nenhum aluno cadastrado.</p>
                <button onClick={() => setIsAddModalOpen(true)} className="text-orange-600 text-[10px] font-bold uppercase mt-4 underline">Clique aqui para adicionar o primeiro</button>
              </div>
            ) : (
              students.map((student) => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student.id)}
                  className="group w-full bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg shadow-orange-100 group-hover:scale-105 transition-transform">
                      {student.name?.charAt(0) || 'A'}
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-slate-800 text-base group-hover:text-orange-600 transition-colors">{student.name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{student.email}</p>
                    </div>
                  </div>
                  <MessageCircle size={20} className="text-slate-300 group-hover:text-orange-500 transition-colors" />
                </button>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'management' && (
        <div className="space-y-6">
           <h2 className="text-2xl font-black text-slate-800">Gestão da Consultoria</h2>
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500"><Settings /></div>
                 <div>
                    <h3 className="font-bold text-slate-800">Controle Master</h3>
                    <p className="text-xs text-slate-400">Configurações globais do sistema.</p>
                 </div>
              </div>
              <div className="grid gap-4">
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4 hover:bg-orange-50 hover:border-orange-200 transition-all group"
                >
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-600 shadow-sm group-hover:bg-orange-600 group-hover:text-white transition-all"><UserPlus size={20} /></div>
                  <div className="text-left">
                    <p className="font-bold text-slate-700 text-sm">Adicionar Novo Membro</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Alunos ou Treinadores</p>
                  </div>
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Modal de Cadastro */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800">Novo Cadastro</h3>
                <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">Defina os dados de acesso</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateUser} className="p-8 pt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    required
                    placeholder="Ex: João Silva" 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-orange-500"
                    value={newUserData.name}
                    onChange={e => setNewUserData({...newUserData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Email de Acesso</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    required
                    type="email"
                    placeholder="email@aluno.com" 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-orange-500"
                    value={newUserData.email}
                    onChange={e => setNewUserData({...newUserData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Senha de Acesso</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    required
                    type="password"
                    placeholder="Crie uma senha para ele" 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-orange-500"
                    value={newUserData.password}
                    onChange={e => setNewUserData({...newUserData, password: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Nível de Acesso</label>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setNewUserData({...newUserData, role: UserRole.ALUNO})}
                    className={`flex-1 py-3 rounded-xl border text-[10px] font-bold transition-all ${newUserData.role === UserRole.ALUNO ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-100' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                  >
                    ALUNO
                  </button>
                  <button 
                    type="button"
                    onClick={() => setNewUserData({...newUserData, role: UserRole.COACH})}
                    className={`flex-1 py-3 rounded-xl border text-[10px] font-bold transition-all ${newUserData.role === UserRole.COACH ? 'bg-slate-800 border-slate-800 text-white shadow-lg shadow-slate-100' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                  >
                    COACH
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={creatingUser}
                className="w-full bg-orange-600 text-white py-5 rounded-[1.5rem] font-black text-sm shadow-xl shadow-orange-100 active:scale-95 transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-50"
              >
                {creatingUser ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><ShieldCheck size={20} /> Cadastrar e Ativar</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachView;
