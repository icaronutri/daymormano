
export enum UserRole {
  COACH = 'COACH',
  ALUNO = 'ALUNO'
}

export enum FeedbackStatus {
  OK = 'OK',
  AJUSTAR = 'AJUSTAR',
  PENDENTE = 'PENDENTE'
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
  type: 'training' | 'meal';
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
