// ============================================
// Type definitions for StudyBuddy App
// Student-focused productivity application
// ============================================

// ==================== Task Types ====================
export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  dueTime?: string;
  createdAt: string;
  completed: boolean;
  completedAt?: string;
  archived: boolean;
  subjectId?: string;
  priority: Priority;
  progress: number; // 0-100
  lastModified?: string;
  reminder?: boolean;
  reminderTime?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  tags?: string[];
}

// ==================== Subject/Course Types ====================
export interface Subject {
  id: string;
  name: string;
  code?: string; // e.g., "CS101"
  color: string;
  instructor?: string;
  credits?: number;
  targetGrade?: string;
  currentGrade?: number;
  icon?: string;
}

// ==================== Class Schedule Types ====================
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface ClassSession {
  id: string;
  subjectId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // "09:00"
  endTime: string;   // "10:30"
  location?: string;
  type: 'lecture' | 'lab' | 'tutorial' | 'seminar';
  instructor?: string;
  notes?: string;
  isRecurring: boolean;
}

// ==================== Exam Types ====================
export interface Exam {
  id: string;
  title: string;
  description?: string;
  subjectId?: string;
  date: string;
  time?: string;
  duration?: number; // in minutes
  location?: string;
  type: 'midterm' | 'final' | 'quiz' | 'test' | 'assignment' | 'project' | 'presentation';
  completed: boolean;
  score?: number;
  maxScore?: number;
  weight?: number; // Percentage weight of final grade
  createdAt: string;
  notes?: string;
}

// ==================== Study Session Types ====================
export interface StudySession {
  id: string;
  timestamp: string;
  duration: number; // in minutes
  subjectId?: string;
  taskId?: string;
  type: 'pomodoro' | 'regular' | 'deep-work';
  isComplete: boolean;
  breaks: number;
  notes?: string;
}

// ==================== Expense Types ====================
export type ExpenseCategory = 
  | 'food' 
  | 'transport' 
  | 'books' 
  | 'supplies' 
  | 'entertainment' 
  | 'rent' 
  | 'utilities' 
  | 'subscriptions'
  | 'health'
  | 'clothing'
  | 'other';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  isRecurring: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'monthly';
  notes?: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  category: ExpenseCategory;
  monthlyLimit: number;
  month: string; // "2024-01"
}

// ==================== Resource Types ====================
export interface Resource {
  id: string;
  title: string;
  description?: string;
  url?: string;
  subjectId?: string;
  type: 'link' | 'note' | 'document' | 'video' | 'ai-generated';
  content?: string; // For notes
  createdAt: string;
  isFavorite: boolean;
  tags?: string[];
}

// ==================== Streak & Achievement Types ====================
export interface Streak {
  current: number;
  longest: number;
  lastStudyDate: string | null;
  studyDays: Record<string, number>; // date -> minutes studied
  weeklyGoalMet: number; // count of weeks goal was met
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress: number; // 0-100
  target: number;
  current: number;
  category: 'study' | 'tasks' | 'streaks' | 'grades' | 'social';
}

// ==================== Stats Types ====================
export interface Stats {
  totalStudyTime: number; // in minutes
  todayStudyTime: number;
  weeklyStudyTime: number;
  monthlyStudyTime: number;
  tasksCompleted: number;
  tasksCreated: number;
  pomodoroCompleted: number;
  sessionsCompleted: number;
  averageSessionLength: number;
  productivityByHour: Record<string, number>;
  productivityByDay: Record<DayOfWeek, number>;
  subjectDistribution: Record<string, number>; // subjectId -> minutes
  weekStartDate: string;
  weeklyTasksCompleted: number;
  currentGPA?: number;
  dailySessionCount: Record<string, number>;
  recentSessions: StudySession[];
}

// ==================== Goal Types ====================
export interface Goal {
  id: string;
  title: string;
  description?: string;
  type: 'daily' | 'weekly' | 'semester' | 'custom';
  targetValue: number;
  currentValue: number;
  unit: 'minutes' | 'tasks' | 'sessions' | 'percent';
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

// ==================== Settings Types ====================
export interface Settings {
  // Timer settings
  pomodoroLength: number;
  shortBreakLength: number;
  longBreakLength: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  
  // Study goals
  dailyGoalMinutes: number;
  weeklyTaskGoal: number;
  
  // Notifications
  notifications: boolean;
  taskReminderMinutes: number;
  dailyReminderTime?: string;
  classReminders: boolean;
  examReminders: boolean;
  
  // Display
  theme: 'light' | 'dark' | 'system';
  language: string;
  startOfWeek: 'sunday' | 'monday';
  timeFormat: '12h' | '24h';
  currency: string;
  
  // Privacy
  focusMode: boolean;
  privacyLock: boolean;
  
  // Data management
  autoArchive: boolean;
  archiveDays: number;
  
  // Feature toggles
  enableExpenseTracker: boolean;
  enableSchedule: boolean;
  enableGrades: boolean;
  
  // Filter preferences
  enabledFilters: {
    today: boolean;
    upcoming: boolean;
    overdue: boolean;
    ongoing: boolean;
    thisWeek: boolean;
    priority: boolean;
    completed: boolean;
    archived: boolean;
  };
}

// ==================== App State Type ====================
export interface AppState {
  // Core data
  tasks: Task[];
  subjects: Subject[];
  schedule: ClassSession[];
  exams: Exam[];
  resources: Resource[];
  
  // Student finances
  expenses: Expense[];
  budgets: Budget[];
  
  // Progress tracking
  streaks: Streak;
  stats: Stats;
  achievements: Achievement[];
  goals: Goal[];
  studySessions: StudySession[];
  
  // Settings
  settings: Settings;
  
  // Meta
  lastBackup: string | null;
  appVersion: string;
  onboardingComplete: boolean;
  userId?: string;
}

// ==================== Action Types ====================
export type AppAction =
  // Data setters
  | { type: 'SET_STATE'; payload: Partial<AppState> }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'SET_SUBJECTS'; payload: Subject[] }
  | { type: 'SET_SCHEDULE'; payload: ClassSession[] }
  | { type: 'SET_EXAMS'; payload: Exam[] }
  | { type: 'SET_RESOURCES'; payload: Resource[] }
  | { type: 'SET_EXPENSES'; payload: Expense[] }
  | { type: 'SET_BUDGETS'; payload: Budget[] }
  | { type: 'SET_STREAKS'; payload: Streak }
  | { type: 'SET_STATS'; payload: Stats }
  | { type: 'SET_ACHIEVEMENTS'; payload: Achievement[] }
  | { type: 'SET_GOALS'; payload: Goal[] }
  | { type: 'SET_SETTINGS'; payload: Settings }
  | { type: 'SET_STUDY_SESSIONS'; payload: StudySession[] }
  
  // Task actions
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'TOGGLE_TASK_COMPLETION'; payload: string }
  | { type: 'ARCHIVE_TASK'; payload: string }
  
  // Subject actions
  | { type: 'ADD_SUBJECT'; payload: Subject }
  | { type: 'UPDATE_SUBJECT'; payload: { id: string; updates: Partial<Subject> } }
  | { type: 'DELETE_SUBJECT'; payload: string }
  
  // Schedule actions
  | { type: 'ADD_CLASS_SESSION'; payload: ClassSession }
  | { type: 'UPDATE_CLASS_SESSION'; payload: { id: string; updates: Partial<ClassSession> } }
  | { type: 'DELETE_CLASS_SESSION'; payload: string }
  
  // Exam actions
  | { type: 'ADD_EXAM'; payload: Exam }
  | { type: 'UPDATE_EXAM'; payload: { id: string; updates: Partial<Exam> } }
  | { type: 'DELETE_EXAM'; payload: string }
  
  // Expense actions
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'UPDATE_EXPENSE'; payload: { id: string; updates: Partial<Expense> } }
  | { type: 'DELETE_EXPENSE'; payload: string }
  | { type: 'SET_BUDGET'; payload: Budget }
  
  // Study session actions
  | { type: 'RECORD_STUDY_SESSION'; payload: StudySession }
  | { type: 'UPDATE_STUDY_SESSION'; payload: { id: string; updates: Partial<StudySession> } }
  
  // Goal actions
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'UPDATE_GOAL'; payload: { id: string; updates: Partial<Goal> } }
  | { type: 'DELETE_GOAL'; payload: string }
  
  // Resource actions
  | { type: 'ADD_RESOURCE'; payload: Resource }
  | { type: 'UPDATE_RESOURCE'; payload: { id: string; updates: Partial<Resource> } }
  | { type: 'DELETE_RESOURCE'; payload: string }
  
  // Settings
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  
  // Meta
  | { type: 'SET_ONBOARDING_COMPLETE'; payload: boolean }
  | { type: 'SET_LAST_BACKUP'; payload: string | null }
  | { type: 'ARCHIVE_OLD_TASKS'; payload: number }
  | { type: 'RESET_STATE' };
