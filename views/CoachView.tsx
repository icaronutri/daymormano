
import React, { useState, useEffect } from 'react';
import { 
  Search, Dumbbell, Utensils, Send, Check, ChevronLeft, 
  Clock, AlertCircle, UserPlus, Trash2, User, FileText, Upload, CheckCircle2, X, Eye, Image as ImageIcon
} from 'lucide-react';
import { UserRole, Profile, Document, FeedbackStatus, ChatMessage } from '../types';
import ChatThread from '../components/ChatThread';

interface CoachViewProps {
  activeTab: string;
  user: Profile;
}

const CoachView: React.FC<CoachViewProps> = ({ activeTab, user }) => {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [managedUsers, setManagedUsers] = useState<any[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: UserRole.ALUNO });

  useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem('focuscoach_users') || '[]');
    const storedDocs = JSON.parse(localStorage.getItem('focuscoach_docs') || '[]');
    const storedMessages = JSON.parse(localStorage.getItem('focuscoach_messages') || '[]');
    setManagedUsers(storedUsers);
    setDocuments(storedDocs);
    setMessages(storedMessages);
  }, []);

  const handleUpdateStatus = (messageId: string, status: FeedbackStatus) => {
    const updated = messages.map(m => m.id === messageId ? { ...m, status } : m);
    setMessages(updated);
    localStorage.setItem('focuscoach_messages', JSON.stringify(updated));
  };

  const handleDeleteMessage = (id: string) => {
    const updated = messages.filter(m => m.id !== id);
    setMessages(updated);
    localStorage.setItem('focuscoach_messages', JSON.stringify(updated));
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!feedbackText.trim() || !selectedStudent) return;

    const newMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      student_id: selectedStudent,
      sender_id: user.id,
      sender_role: UserRole.COACH,
      type: 'feedback',
      text: feedbackText,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0]
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    localStorage.setItem('focuscoach_messages', JSON.stringify(updated));
    setFeedbackText('');
  };

  const handleFileUpload = (studentId: string, type: 'workout' | 'meal_plan', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newDoc: Document = {
      id: Math.random().toString(36).substr(2, 9),
      student_id: studentId,
      type,
      name: file.name,
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
    };

    const updatedDocs = [...documents, newDoc];
    setDocuments(updatedDocs);
    localStorage.setItem('focuscoach_docs', JSON.stringify(updatedDocs));
    alert(`${type === 'workout' ? 'Treino' : 'Plano'} enviado com sucesso!`);
  };

  const students = [
    { id: 'fixed-ivanete', name: 'Ivanete Rocha', email: 'ivanete@gmail.com' },
    ...managedUsers.filter(u => u.role === UserRole.ALUNO)
  ].map(s => {
    const studentMessages = messages.filter(m => m.student_id === s.id);
    const today = new Date().toISOString().split('T')[0];
    return {
      ...s,
      trainingToday: studentMessages.some(m => m.type === 'training' && m.date === today),
      mealsToday: studentMessages.filter(m => m.type === 'meal' && m.date === today).length,
      unreviewed: studentMessages.filter(m => m.type === 'meal' && m.status === FeedbackStatus.PENDENTE).length,
      lastActive: studentMessages.length > 0 ? new Date(studentMessages[studentMessages.length-1].timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'N/A'
    };
  });

  if (selectedStudent) {
    const student = students.find(s => s.id === selectedStudent);
    const studentDocs = documents.filter(d => d.student_id === selectedStudent);
    const studentMessages = messages.filter(m => m.student_id === selectedStudent);

    return (
      <div className="animate-in slide-in-from-right-4 duration-300 h-full flex flex-col pb-32">
        {/* Header Detalhes Aluno */}
        <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedStudent(null)} className="p-2 bg-slate-50 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{student?.name}</h2>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">{student?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
             <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl flex flex-col items-center min-w-[50px]">
                <span className="text-[8px] font-bold uppercase">Treino</span>
                <span className="text-xs font-bold">{student?.trainingToday ? 'SIM' : 'NÃO'}</span>
             </div>
             <div className="p-2 bg-orange-50 text-orange-600 rounded-xl flex flex-col items-center min-w-[50px]">
                <span className="text-[8px] font-bold uppercase">Ref.</span>
                <span className="text-xs font-bold">{student?.mealsToday}</span>
             </div>
          </div>
        </div>

        {/* Abas Rápidas (Arquivos) */}
        <div className="grid grid-cols-2 gap-3 mb-6">
           {['meal_plan', 'workout'].map(type => {
              const doc = studentDocs.find(d => d.type === type);
              return (
                <div key={type} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${type === 'meal_plan' ? 'bg-orange-50 text-orange-600' : 'bg-purple-50 text-purple-600'}`}>
                         {type === 'meal_plan' ? <Utensils size={14} /> : <Dumbbell size={14} />}
                      </div>
                      <span className="text-[10px] font-bold text-slate-700">{type === 'meal_plan' ? 'Dieta' : 'Treino'}</span>
                   </div>
                   {doc ? (
                      <button onClick={() => window.open(doc.url, '_blank')} className="p-1.5 bg-slate-50 text-orange-600 rounded-lg"><Eye size={14}/></button>
                   ) : (
                      <label className="p-1.5 bg-orange-50 text-orange-600 rounded-lg cursor-pointer">
                         <Upload size={14} />
                         <input type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileUpload(selectedStudent, type as any, e)} />
                      </label>
                   )}
                </div>
              );
           })}
        </div>

        {/* Feed WhatsApp Style */}
        <div className="flex-1 bg-white rounded-t-[2.5rem] border-t border-slate-100 shadow-xl flex flex-col overflow-hidden -mx-4 md:mx-0">
           <div className="p-4 border-b border-slate-50 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <h3 className="text-sm font-bold text-slate-800">Interações em Tempo Real</h3>
           </div>

           <ChatThread 
             messages={studentMessages} 
             currentUserRole={UserRole.COACH} 
             onDeleteMessage={handleDeleteMessage}
             onUpdateStatus={handleUpdateStatus}
           />

           {/* Input de Feedback (Coach) */}
           <div className="p-4 bg-white border-t border-slate-100 safe-area-bottom">
              <form onSubmit={handleSendMessage} className="flex items-end gap-2 max-w-3xl mx-auto">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-2 flex flex-col">
                  <textarea 
                    placeholder="Enviar orientação ou feedback..." 
                    className="bg-transparent border-none focus:ring-0 text-sm w-full p-2 resize-none h-12 max-h-32" 
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
                  className="p-4 bg-orange-600 text-white rounded-2xl shadow-lg shadow-orange-200 active:scale-95 transition-all disabled:opacity-50"
                  disabled={!feedbackText.trim()}
                >
                  <Send size={20} />
                </button>
              </form>
           </div>
        </div>
      </div>
    );
  }

  // Seção de Gestão (inalterada na lógica, apenas visual orange)
  if (activeTab === 'management' && user.is_master) {
     return (
      <div className="space-y-6 animate-in fade-in duration-300 h-full">
        <h2 className="text-xl font-bold text-slate-800">Gestão de Alunos</h2>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4 text-orange-600"><UserPlus size={20} /><h3 className="font-bold text-sm">Novo Cadastro</h3></div>
          <form onSubmit={(e) => {
            e.preventDefault();
            const id = Math.random().toString(36).substr(2, 9);
            const updated = [...managedUsers, { ...newUser, id }];
            setManagedUsers(updated);
            localStorage.setItem('focuscoach_users', JSON.stringify(updated));
            setNewUser({ name: '', email: '', password: '', role: UserRole.ALUNO });
          }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" required placeholder="Nome completo" className="px-4 py-2 border border-slate-200 rounded-xl text-sm" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} />
            <input type="email" required placeholder="Email" className="px-4 py-2 border border-slate-200 rounded-xl text-sm" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} />
            <input type="password" required placeholder="Senha" className="px-4 py-2 border border-slate-200 rounded-xl text-sm" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} />
            <select className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-sm" value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})}><option value={UserRole.ALUNO}>Aluno</option><option value={UserRole.COACH}>Coach</option></select>
            <button className="md:col-span-2 bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-100">Criar Usuário</button>
          </form>
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
           <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100"><tr><th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome</th><th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th></tr></thead>
              <tbody className="divide-y divide-slate-50">{managedUsers.map((u) => (<tr key={u.id} className="hover:bg-slate-50 transition-colors"><td className="px-6 py-4 flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">{u.name.charAt(0)}</div><span className="font-bold text-slate-700 text-sm">{u.name}</span></td><td className="px-6 py-4 text-right"><button onClick={() => {if (confirm('Excluir usuário permanentemente?')) { const up = managedUsers.filter(usr => usr.id !== u.id); setManagedUsers(up); localStorage.setItem('focuscoach_users', JSON.stringify(up)); }}} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button></td></tr>))}</tbody>
           </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-800">Alunos Ativos</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input type="text" placeholder="Buscar aluno..." className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs w-full md:w-64 shadow-sm" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-24">
        {students.map((student) => (
          <button
            key={student.id}
            onClick={() => setSelectedStudent(student.id)}
            className="w-full text-left bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center text-orange-600 font-bold text-xl">
                {student.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">{student.name}</h3>
                <div className="flex items-center gap-2 mt-1 text-[10px] font-medium text-slate-400">
                  <Clock size={12} /> Ativo às {student.lastActive}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center ${student.trainingToday ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-300'}`}>
                <Dumbbell size={18} />
              </div>
              <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center ${student.mealsToday > 0 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-300'}`}>
                <Utensils size={18} />
                {student.unreviewed > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 text-white text-[8px] font-bold rounded-full border border-white flex items-center justify-center animate-bounce">
                    {student.unreviewed}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
        {students.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 opacity-60">
             <User size={48} className="mb-2" />
             <p className="text-sm italic">Nenhum aluno encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachView;
