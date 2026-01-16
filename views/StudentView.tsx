
import React, { useState, useEffect } from 'react';
import { 
  Camera, CheckCircle2, Clock, FileText, Droplets, Target, 
  Weight, ChevronRight, Download, Eye, Check, Utensils, Dumbbell 
} from 'lucide-react';
import { compressImage } from '../supabase';
import { Document, Profile, ActivityLog, FeedbackStatus } from '../types';

interface StudentViewProps {
  activeTab: string;
  user: Profile;
}

const StudentView: React.FC<StudentViewProps> = ({ activeTab, user }) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [uploading, setUploading] = useState(false);
  const [water, setWater] = useState(1200);
  const [documents, setDocuments] = useState<Document[]>([]);

  const waterGoal = 3000;

  useEffect(() => {
    const storedDocs = JSON.parse(localStorage.getItem('focuscoach_docs') || '[]');
    const storedActivities = JSON.parse(localStorage.getItem('focuscoach_activities') || '[]');
    setDocuments(storedDocs);
    setActivities(storedActivities.filter((a: ActivityLog) => a.student_id === user.id));
  }, [user.id]);

  const saveActivity = (newActivity: ActivityLog) => {
    const allActivities = JSON.parse(localStorage.getItem('focuscoach_activities') || '[]');
    const updated = [newActivity, ...allActivities];
    localStorage.setItem('focuscoach_activities', JSON.stringify(updated));
    setActivities(updated.filter(a => a.student_id === user.id));
  };

  const handleToggleTraining = () => {
    const today = new Date().toISOString().split('T')[0];
    const hasTrainedToday = activities.some(a => a.type === 'training' && a.timestamp.startsWith(today));
    
    if (hasTrainedToday) return; // Só um check-in por dia

    const newActivity: ActivityLog = {
      id: Math.random().toString(36).substr(2, 9),
      student_id: user.id,
      type: 'training',
      timestamp: new Date().toISOString(),
      label: 'Treino Concluído'
    };
    saveActivity(newActivity);
  };

  const handleMealUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await compressImage(file);
      const newActivity: ActivityLog = {
        id: Math.random().toString(36).substr(2, 9),
        student_id: user.id,
        type: 'meal',
        timestamp: new Date().toISOString(),
        imageUrl: url,
        label: `Refeição ${activities.filter(a => a.type === 'meal').length + 1}`,
        status: FeedbackStatus.PENDENTE
      };
      saveActivity(newActivity);
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmDoc = (docId: string) => {
    const allDocs = JSON.parse(localStorage.getItem('focuscoach_docs') || '[]');
    const updated = allDocs.map((d: Document) => 
      d.id === docId ? { ...d, confirmedAt: new Date().toISOString() } : d
    );
    localStorage.setItem('focuscoach_docs', JSON.stringify(updated));
    setDocuments(updated);
  };

  const today = new Date().toISOString().split('T')[0];
  const trainedToday = activities.some(a => a.type === 'training' && a.timestamp.startsWith(today));
  const mealsToday = activities.filter(a => a.type === 'meal' && a.timestamp.startsWith(today));

  const renderToday = () => (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 rounded-3xl bg-orange-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-orange-200">
            {user.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Olá, {user.name.split(' ')[0]}!</h2>
            <p className="text-sm text-slate-400 font-medium">Sua evolução começa hoje</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
             <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Weight size={14} /> <span className="text-[10px] font-bold uppercase">Peso</span>
             </div>
             <p className="text-lg font-bold text-slate-800">84.5kg</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-3xl border border-orange-100 col-span-3">
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
                <span className="text-xs font-bold text-orange-800">{water} / {waterGoal}ml</span>
                <button onClick={() => setWater(w => Math.min(waterGoal, w + 250))} className="bg-white text-orange-600 px-3 py-1 rounded-full text-[10px] font-bold shadow-sm active:scale-95 transition-all"> + 250ml </button>
             </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
         <h3 className="text-lg font-bold text-slate-800 px-2">Meus Planos</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['meal_plan', 'workout'].map(type => {
               const doc = documents.filter(d => d.student_id === user.id).find(d => d.type === type);
               return (
                  <div key={type} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-44 group hover:border-orange-200 transition-all">
                     <div className="flex justify-between items-start">
                        <div className={`p-3 rounded-2xl ${type === 'meal_plan' ? 'bg-orange-50 text-orange-500' : 'bg-purple-50 text-purple-500'}`}>
                           {type === 'meal_plan' ? <Utensils size={24} /> : <Dumbbell size={24} />}
                        </div>
                        {doc && !doc.confirmedAt && <span className="bg-red-500 w-2 h-2 rounded-full animate-pulse"></span>}
                     </div>
                     <div>
                        <h4 className="font-bold text-slate-800">{type === 'meal_plan' ? 'Plano Alimentar' : 'Protocolo de Treino'}</h4>
                        {doc ? (
                           <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] text-slate-400">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                              <div className="flex gap-2">
                                 <a href={doc.url} target="_blank" className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-orange-600 transition-colors"><Eye size={18} /></a>
                                 {!doc.confirmedAt && (
                                    <button onClick={() => handleConfirmDoc(doc.id)} className="px-3 py-1.5 bg-orange-600 text-white text-[10px] font-bold rounded-xl shadow-lg shadow-orange-100">Confirmar</button>
                                 )}
                                 {doc.confirmedAt && <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl"><Check size={18} strokeWidth={3} /></div>}
                              </div>
                           </div>
                        ) : (
                           <p className="text-[10px] text-slate-300 italic mt-1">Aguardando envio da consultoria...</p>
                        )}
                     </div>
                  </div>
               );
            })}
         </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={handleToggleTraining}
          className={`flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all ${
            trainedToday ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-white border-slate-100 text-slate-700 hover:border-orange-200'
          }`}
        >
          <div className="flex items-center gap-4">
             <div className={`p-3 rounded-2xl ${trainedToday ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                <Dumbbell size={24} />
             </div>
             <div className="text-left">
                <span className="block text-lg font-bold leading-tight">Treino de Hoje</span>
                <span className="text-xs opacity-70">{trainedToday ? 'Check-in concluído!' : 'Marcar como feito'}</span>
             </div>
          </div>
          {trainedToday && <CheckCircle2 className="text-emerald-500" size={28} />}
        </button>

        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
           <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><Utensils size={18} className="text-orange-500" /> Diário de Refeições</h3>
              <label className="bg-orange-600 text-white px-4 py-2 rounded-2xl text-[10px] font-bold flex items-center gap-2 cursor-pointer active:scale-95 transition-all shadow-lg shadow-orange-100">
                 <input type="file" accept="image/*" className="hidden" onChange={handleMealUpload} disabled={uploading} />
                 {uploading ? 'Processando...' : <><Camera size={14}/> Registrar</>}
              </label>
           </div>
           
           <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {mealsToday.map((meal, idx) => (
                 <div key={meal.id} className="min-w-[120px] aspect-[4/5] rounded-2xl overflow-hidden relative border border-slate-100 shadow-sm group">
                    <img src={meal.imageUrl} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 p-2">
                       <p className="text-[8px] text-white font-bold uppercase">{meal.label}</p>
                       <p className="text-[8px] text-white/70">{new Date(meal.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                 </div>
              ))}
              {mealsToday.length === 0 && (
                 <div className="w-full h-24 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 text-[10px] font-medium italic">
                    Nenhuma refeição enviada hoje
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {activeTab === 'today' && renderToday()}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800">Seu Histórico</h2>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            {activities.map(a => (
              <div key={a.id} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-none">
                 <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${a.type === 'training' ? 'bg-emerald-50 text-emerald-500' : 'bg-orange-50 text-orange-500'}`}>
                       {a.type === 'training' ? <Dumbbell size={16} /> : <Utensils size={16} />}
                    </div>
                    <div>
                       <p className="text-sm font-bold text-slate-700">{a.label}</p>
                       <p className="text-[10px] text-slate-400">{new Date(a.timestamp).toLocaleString()}</p>
                    </div>
                 </div>
                 {a.status && (
                   <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${a.status === FeedbackStatus.OK ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                     {a.status}
                   </span>
                 )}
              </div>
            ))}
            {activities.length === 0 && <p className="text-center text-slate-400 text-sm italic">Nenhuma atividade registrada.</p>}
          </div>
        </div>
      )}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Feedbacks Recentes</h2>
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
             <p className="text-sm text-slate-500">Acesse seus feedbacks e interações com a Day Mormano aqui.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentView;
