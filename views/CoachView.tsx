
import React, { useState, useEffect } from 'react';
import { 
  Search, Dumbbell, Utensils, Send, Check, ChevronLeft, 
  Clock, AlertCircle, UserPlus, Trash2, User, FileText, Upload, CheckCircle2, X, Eye 
} from 'lucide-react';
import { UserRole, Profile, Document, ActivityLog, FeedbackStatus } from '../types';

interface CoachViewProps {
  activeTab: string;
  user: Profile;
}

const CoachView: React.FC<CoachViewProps> = ({ activeTab, user }) => {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [managedUsers, setManagedUsers] = useState<any[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: UserRole.ALUNO });

  useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem('focuscoach_users') || '[]');
    const storedDocs = JSON.parse(localStorage.getItem('focuscoach_docs') || '[]');
    const storedActivities = JSON.parse(localStorage.getItem('focuscoach_activities') || '[]');
    setManagedUsers(storedUsers);
    setDocuments(storedDocs);
    setActivities(storedActivities);
  }, []);

  const handleUpdateStatus = (activityId: string, status: FeedbackStatus) => {
    const updated = activities.map(a => a.id === activityId ? { ...a, status } : a);
    setActivities(updated);
    localStorage.setItem('focuscoach_activities', JSON.stringify(updated));
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
    { id: 'master-aluno', name: 'Aluno Teste', lastUpdate: 'Agora', email: 'aluno@teste.com' },
    ...managedUsers.filter(u => u.role === UserRole.ALUNO)
  ].map(s => {
    const studentActivities = activities.filter(a => a.student_id === s.id);
    const today = new Date().toISOString().split('T')[0];
    return {
      ...s,
      trainingToday: studentActivities.some(a => a.type === 'training' && a.timestamp.startsWith(today)),
      mealsToday: studentActivities.filter(a => a.type === 'meal' && a.timestamp.startsWith(today)).length,
      unreviewed: studentActivities.filter(a => a.type === 'meal' && a.status === FeedbackStatus.PENDENTE).length
    };
  });

  if (selectedStudent) {
    const student = students.find(s => s.id === selectedStudent);
    const studentDocs = documents.filter(d => d.student_id === selectedStudent);
    const studentActivities = activities.filter(a => a.student_id === selectedStudent);

    // Group activities by date
    const groupedActivities = studentActivities.reduce((acc: any, curr) => {
      const date = new Date(curr.timestamp).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
      if (!acc[date]) acc[date] = [];
      acc[date].push(curr);
      return acc;
    }, {});

    return (
      <div className="animate-in slide-in-from-right-4 duration-300 h-full flex flex-col pb-32">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setSelectedStudent(null)} className="p-2 bg-white rounded-xl border border-slate-100 shadow-sm text-slate-500">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{student?.name}</h2>
            <p className="text-xs text-slate-400">{student?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Docs Section */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText className="text-orange-500" size={18} /> Planos Ativos</h3>
            <div className="space-y-3">
              {['meal_plan', 'workout'].map(type => {
                const doc = studentDocs.find(d => d.type === type);
                return (
                  <div key={type} className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-bold text-slate-400 uppercase">{type === 'meal_plan' ? 'Dieta' : 'Treino'}</span>
                       {doc?.confirmedAt && <span className="text-[10px] font-bold text-emerald-500">Confirmado pelo aluno</span>}
                    </div>
                    {doc ? (
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm font-bold text-slate-700 truncate flex-1">{doc.name}</p>
                        <a href={doc.url} target="_blank" className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg"><Eye size={16} /></a>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 py-2 mt-1 border border-dashed border-slate-300 rounded-xl text-slate-400 cursor-pointer hover:border-orange-400 hover:text-orange-500 transition-all">
                        <Upload size={14} /><span className="text-[10px] font-bold">Upload PDF</span>
                        <input type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileUpload(selectedStudent, type as any, e)} />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">Adesão Recente</h3>
            <div className="grid grid-cols-2 gap-3">
               <div className="p-4 bg-emerald-50 rounded-2xl">
                  <p className="text-[10px] text-emerald-600 font-bold uppercase">Treino/Hoje</p>
                  <p className="text-xl font-bold text-emerald-800">{student?.trainingToday ? 'SIM' : 'NÃO'}</p>
               </div>
               <div className="p-4 bg-orange-50 rounded-2xl">
                  <p className="text-[10px] text-orange-600 font-bold uppercase">Refeições/Hoje</p>
                  <p className="text-xl font-bold text-orange-800">{student?.mealsToday}</p>
               </div>
            </div>
          </div>
        </div>

        {/* FEED REAL DO ALUNO */}
        <h3 className="text-lg font-bold text-slate-800 mb-4 px-2">Feed de Atividades</h3>
        <div className="space-y-8">
          {Object.keys(groupedActivities).length === 0 && <p className="text-center text-slate-400 italic py-8">Aguardando as primeiras fotos e treinos do aluno...</p>}
          {Object.entries(groupedActivities).map(([date, items]: [string, any]) => (
            <div key={date} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-[1px] flex-1 bg-slate-100"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{date}</span>
                <div className="h-[1px] flex-1 bg-slate-100"></div>
              </div>

              {items.map((item: ActivityLog) => (
                <div key={item.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
                  {item.type === 'training' ? (
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl"><Dumbbell size={24} /></div>
                        <div>
                          <p className="font-bold text-slate-800">{item.label}</p>
                          <p className="text-[10px] text-slate-400">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                      </div>
                      <CheckCircle2 className="text-emerald-500" />
                    </div>
                  ) : (
                    <div className="flex h-40">
                      <div className="w-1/3 h-full overflow-hidden bg-slate-100">
                        {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><Utensils size={32} /></div>}
                      </div>
                      <div className="flex-1 p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-slate-800">{item.label}</h4>
                            <span className="text-[10px] text-slate-400">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-2 italic">Sem observações.</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleUpdateStatus(item.id, FeedbackStatus.OK)}
                            className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${item.status === FeedbackStatus.OK ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                          >
                            OK
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(item.id, FeedbackStatus.AJUSTAR)}
                            className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${item.status === FeedbackStatus.AJUSTAR ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}
                          >
                            AJUSTAR
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 safe-area-bottom z-40">
          <div className="max-w-3xl mx-auto flex items-end gap-3">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-2 flex flex-col">
              <textarea placeholder="Enviar feedback para o aluno..." className="bg-transparent border-none focus:ring-0 text-sm w-full p-2 resize-none h-12" value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} />
            </div>
            <button className="p-4 bg-orange-600 text-white rounded-2xl shadow-lg active:scale-95 transition-all"><Send size={20} /></button>
          </div>
        </div>
      </div>
    );
  }

  // Seção de Gestão
  if (activeTab === 'management' && user.is_master) {
     return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <h2 className="text-2xl font-bold text-slate-800">Gestão de Usuários</h2>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4 text-orange-600"><UserPlus size={20} /><h3 className="font-bold">Cadastrar Novo Usuário</h3></div>
          <form onSubmit={(e) => {
            e.preventDefault();
            const id = Math.random().toString(36).substr(2, 9);
            const updated = [...managedUsers, { ...newUser, id }];
            setManagedUsers(updated);
            localStorage.setItem('focuscoach_users', JSON.stringify(updated));
            setNewUser({ name: '', email: '', password: '', role: UserRole.ALUNO });
          }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" required placeholder="Nome completo" className="px-4 py-2 border rounded-xl" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} />
            <input type="email" required placeholder="Email" className="px-4 py-2 border rounded-xl" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} />
            <input type="password" required placeholder="Senha" className="px-4 py-2 border rounded-xl" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} />
            <select className="px-4 py-2 border rounded-xl bg-white" value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})}><option value={UserRole.ALUNO}>Aluno</option><option value={UserRole.COACH}>Coach</option></select>
            <button className="md:col-span-2 bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition-colors">Salvar Usuário</button>
          </form>
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
           <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100"><tr><th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Nome</th><th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th></tr></thead>
              <tbody className="divide-y divide-slate-50">{managedUsers.map((u) => (<tr key={u.id} className="hover:bg-slate-50 transition-colors"><td className="px-6 py-4 flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400"><User size={16} /></div><span className="font-bold text-slate-700">{u.name}</span></td><td className="px-6 py-4 text-right"><button onClick={() => {if (confirm('Excluir?')) { const up = managedUsers.filter(usr => usr.id !== u.id); setManagedUsers(up); localStorage.setItem('focuscoach_users', JSON.stringify(up)); }}} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button></td></tr>))}</tbody>
           </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Seus Alunos</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Buscar aluno..." className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm w-full md:w-64" />
        </div>
      </div>

      <div className="space-y-3">
        {students.map((student) => (
          <button
            key={student.id}
            onClick={() => setSelectedStudent(student.id)}
            className="w-full text-left bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-bold overflow-hidden">
                <img src={`https://picsum.photos/100/100?u=${student.id}`} className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{student.name}</h3>
                <div className="flex items-center gap-3 mt-1 text-[10px] font-medium text-slate-400">
                  <Clock size={12} /> {student.lastUpdate}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center ${student.trainingToday ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-300'}`}>
                <Dumbbell size={20} />
              </div>
              <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center ${student.mealsToday > 0 ? 'bg-orange-50 text-orange-500' : 'bg-slate-50 text-slate-300'}`}>
                <Utensils size={20} />
                {student.unreviewed > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 text-white text-[8px] font-bold rounded-full border border-white flex items-center justify-center">
                    {student.unreviewed}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
        {students.length === 0 && <p className="text-center text-slate-400 italic py-10">Você ainda não tem alunos cadastrados.</p>}
      </div>
    </div>
  );
};

export default CoachView;
