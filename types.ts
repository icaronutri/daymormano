
export enum UserRole {
  COACH = 'COACH',
  ALUNO = 'ALUNO'
}

export enum FeedbackStatus {
  OK = 'OK',
  AJUSTAR = 'AJUSTAR',
  PENDENTE = 'PENDENTE'
}

export type MessageType = 'text' | 'meal' | 'body' | 'training' | 'feedback';

export interface ChatMessage {
  id: string;
  student_id: string;
  sender_id: string;
  sender_role: UserRole;
  type: MessageType;
  text?: string;
  attachments?: string[]; // URLs das imagens
  created_at: string; // Alinhado com o banco de dados
  date: string; // YYYY-MM-DD para agrupamento
  status?: FeedbackStatus;
}

export interface Profile {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  avatar_url?: string;
  is_master?: boolean;
}

export interface HealthMetrics {
  weight: number;
  height: number;
  waterGoal: number;
  waterCurrent: number;
  targetWeight: number;
}

export interface Document {
  id: string;
  student_id: string;
  type: 'workout' | 'meal_plan';
  name: string;
  url: string;
  uploadedAt: string;
  confirmedAt?: string;
}

export interface ActivityLog {
  id: string;
  student_id: string;
  type: 'training' | 'meal' | 'body';
  timestamp: string;
  imageUrl?: string;
  notes?: string;
  label?: string;
  status?: FeedbackStatus;
}

export interface StudentWithStats extends Profile {
  last_trained?: string;
  meals_today: number;
  has_new_feedback?: boolean;
  unreviewed_meals?: number;
  metrics?: HealthMetrics;
}

export interface UploadResult {
  publicUrl: string;
  path: string;
  sizeInBytes: number;
}

export interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
}

export interface SupabaseInsertResult<T = any> {
  data: T | null;
  error: any;
}
