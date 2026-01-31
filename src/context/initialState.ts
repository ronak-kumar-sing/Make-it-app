// ============================================
// Initial State for StudyBuddy App
// Default values for all state properties
// ============================================

import { format } from 'date-fns';
import { AppState, Settings, Stats, Streak } from '../types';

export const defaultSettings: Settings = {
  // Timer settings
  pomodoroLength: 25,
  shortBreakLength: 5,
  longBreakLength: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  
  // Study goals
  dailyGoalMinutes: 120, // 2 hours
  weeklyTaskGoal: 15,
  
  // Notifications
  notifications: true,
  taskReminderMinutes: 15,
  dailyReminderTime: '08:00',
  classReminders: true,
  examReminders: true,
  
  // Display
  theme: 'system',
  language: 'en',
  startOfWeek: 'monday',
  timeFormat: '12h',
  currency: 'USD',
  
  // Privacy
  focusMode: false,
  privacyLock: false,
  
  // Data management
  autoArchive: true,
  archiveDays: 30,
  
  // Feature toggles
  enableExpenseTracker: true,
  enableSchedule: true,
  enableGrades: true,
  
  // Filter preferences
  enabledFilters: {
    today: true,
    upcoming: true,
    overdue: true,
    ongoing: true,
    thisWeek: true,
    priority: true,
    completed: true,
    archived: false,
  },
};

export const defaultStreaks: Streak = {
  current: 0,
  longest: 0,
  lastStudyDate: null,
  studyDays: {},
  weeklyGoalMet: 0,
};

export const defaultStats: Stats = {
  totalStudyTime: 0,
  todayStudyTime: 0,
  weeklyStudyTime: 0,
  monthlyStudyTime: 0,
  tasksCompleted: 0,
  tasksCreated: 0,
  pomodoroCompleted: 0,
  sessionsCompleted: 0,
  averageSessionLength: 0,
  productivityByHour: {},
  productivityByDay: {
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
    sunday: 0,
  },
  subjectDistribution: {},
  weekStartDate: format(new Date(), 'yyyy-MM-dd'),
  weeklyTasksCompleted: 0,
  dailySessionCount: {},
  recentSessions: [],
};

export const defaultAchievements = [
  {
    id: 'first-session',
    title: 'First Steps',
    description: 'Complete your first study session',
    icon: 'rocket-outline',
    progress: 0,
    target: 1,
    current: 0,
    category: 'study' as const,
  },
  {
    id: 'task-starter',
    title: 'Task Master',
    description: 'Complete 10 tasks',
    icon: 'checkbox-outline',
    progress: 0,
    target: 10,
    current: 0,
    category: 'tasks' as const,
  },
  {
    id: 'week-warrior',
    title: 'Week Warrior',
    description: 'Maintain a 7-day study streak',
    icon: 'flame-outline',
    progress: 0,
    target: 7,
    current: 0,
    category: 'streaks' as const,
  },
  {
    id: 'focus-champion',
    title: 'Focus Champion',
    description: 'Complete 50 pomodoro sessions',
    icon: 'timer-outline',
    progress: 0,
    target: 50,
    current: 0,
    category: 'study' as const,
  },
  {
    id: 'study-marathon',
    title: 'Study Marathon',
    description: 'Study for 10 hours total',
    icon: 'hourglass-outline',
    progress: 0,
    target: 600, // 10 hours in minutes
    current: 0,
    category: 'study' as const,
  },
  {
    id: 'task-ninja',
    title: 'Task Ninja',
    description: 'Complete 50 tasks',
    icon: 'trophy-outline',
    progress: 0,
    target: 50,
    current: 0,
    category: 'tasks' as const,
  },
  {
    id: 'month-master',
    title: 'Monthly Master',
    description: 'Maintain a 30-day study streak',
    icon: 'medal-outline',
    progress: 0,
    target: 30,
    current: 0,
    category: 'streaks' as const,
  },
  {
    id: 'subject-expert',
    title: 'Subject Expert',
    description: 'Study 5 different subjects',
    icon: 'library-outline',
    progress: 0,
    target: 5,
    current: 0,
    category: 'study' as const,
  },
];

export const initialState: AppState = {
  // Core data
  tasks: [],
  subjects: [],
  schedule: [],
  exams: [],
  resources: [],
  
  // Student finances
  expenses: [],
  budgets: [],
  
  // Progress tracking
  streaks: defaultStreaks,
  stats: defaultStats,
  achievements: defaultAchievements,
  goals: [],
  studySessions: [],
  
  // Settings
  settings: defaultSettings,
  
  // Meta
  lastBackup: null,
  appVersion: '2.0.0',
  onboardingComplete: false,
};
